import { App, subtype } from "@slack/bolt";
import type { RichTextBlockElement, RichTextElement } from "@slack/types";
import { CHANNEL_ID, GROUP_ID } from "./constants";
import { fetchClearURLsRules, checkURLAgainstRules } from "./clearurls";

// Initializes your app with your Slack app and bot token
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: process.env.SLACK_SOCKET_MODE === "true",
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

app.event("member_joined_channel", async ({ event, say }) => {
  if (event.channel != CHANNEL_ID) return;

  await app.client.chat.postMessage({
    channel: event.channel,
    text: `Everyone welcome <@${event.user}> to #ingo-commits-academic-fraud! :ultrafastcatppuccinparrot:`,
    blocks: [
      {
        type: "rich_text",
        elements: [
          {
            type: "rich_text_section",
            elements: [
              {
                type: "text",
                text: "Everyone welcome ",
              },
              {
                type: "user",
                user_id: event.user,
              },
              {
                type: "text",
                text: " to ",
              },
              {
                type: "channel",
                channel_id: "C0A0QNJNDGQ",
              },
              {
                type: "text",
                text: "! ",
              },
              {
                type: "emoji",
                name: "ultrafastcatppuccinparrot",
              },
            ],
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: ":ultrafastcatppuccinparrot:",
              emoji: true,
            },
            value: "ultrafastcatppuccinparrot",
            action_id: "ultrafastcatppuccinparrot",
          },
        ],
      },
    ],
  });

  const existingMembers = await app.client.usergroups.users.list({
    usergroup: GROUP_ID,
  });

  await app.client.usergroups.users.update({
    usergroup: GROUP_ID,
    users: [...(existingMembers.users || []), event.user].join(","),
  });

  await app.client.chat.postEphemeral({
    channel: event.channel,
    user: event.user,
    text: `hello! welcome to #ingo-commits-academic-fraud! :ultrafastcatppuccinparrot:
    this is where i yap about random stuff, and only rarely commit academic fraud.
    please read the rules!
    btw i added you to @ingo-pingo so you can pinged pung when i post interesting stuff.`,
    blocks: [
      {
        type: "rich_text",
        elements: [
          {
            type: "rich_text_section",
            elements: [
              {
                type: "text",
                text: "hello! welcome to ",
              },
              {
                type: "channel",
                channel_id: "C0A0QNJNDGQ",
              },
              {
                type: "text",
                text: "! ",
              },
              {
                type: "emoji",
                name: "ultrafastcatppuccinparrot",
              },
              {
                type: "text",
                text: "\nthis is where i yap about random stuff, and only rarely commit academic fraud.\nplease read ",
              },
              {
                type: "link",
                url: "https://hackclub.enterprise.slack.com/docs/T0266FRGM/F0A7L9BQ45R",
                text: "the rules",
              },
              {
                type: "text",
                text: "!\nbtw i added you to ",
              },
              {
                type: "usergroup",
                usergroup_id: "S0A4705UBB3",
              },
              {
                type: "text",
                text: " so you can ",
              },
              {
                type: "text",
                text: "pinged",
                style: {
                  strike: true,
                },
              },
              {
                type: "text",
                text: " pung when i post interesting stuff.",
              },
            ],
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "opt out of pings",
            },
            value: "remove_from_ping_group",
            action_id: "remove_from_ping_group",
          },
        ],
      },
    ],
  });
});

app.action(
  "remove_from_ping_group",
  async ({ body, context, ack, respond }) => {
    await ack();

    const existingMembers = await app.client.usergroups.users.list({
      usergroup: GROUP_ID,
    });

    await app.client.usergroups.users.update({
      usergroup: GROUP_ID,
      users: (existingMembers.users || [])
        .filter((id) => id !== body.user.id)
        .join(","),
    });

    await respond({
      text: "Ok, you've been removed from the ping group.",
    });
  },
);

app.action(
  "ultrafastcatppuccinparrot",
  async ({ body, context, ack, respond }) => {
    await ack();

    await respond({
      replace_original: false,
      delete_original: false,
      response_type: "in_channel",
      text:
        ":ultrafastcatppuccinparrot:".repeat(20) +
        `\nSent by <@${context.userId}>`,
      blocks: [
        {
          type: "rich_text",
          elements: [
            {
              type: "rich_text_section",
              elements: Array(20).fill({
                type: "emoji",
                name: "ultrafastcatppuccinparrot",
              }),
            },
            {
              type: "rich_text_section",
              elements: [
                { type: "text", text: "Sent by " },
                { type: "user", user_id: context.userId },
              ],
            },
          ],
        },
      ],
    });
  },
);

app.event("message", async ({ event, say }) => {
  if (
    event.subtype === undefined &&
    event.channel_type == "channel" &&
    event.text
  ) {
    const links: Array<{ type: "link"; url: string; text?: string }> = [];

    const textBlocks = event.blocks?.filter(
      (block) => block.type === "rich_text",
    );

    textBlocks?.forEach((block) => {
      if ("elements" in block && Array.isArray(block.elements)) {
        block.elements.forEach((element) => {
          if (
            "elements" in element &&
            Array.isArray(element.elements) &&
            typeof element === "object"
          ) {
            element.elements.forEach((innerElement) => {
              if (
                typeof innerElement === "object" &&
                innerElement !== null &&
                "type" in innerElement &&
                innerElement.type === "link" &&
                "url" in innerElement
              ) {
                links.push({
                  type: "link",
                  url: String(innerElement.url),
                  text:
                    "text" in innerElement
                      ? String(innerElement.text)
                      : undefined,
                });
              }
            });
          }
        });
      }
    });

    const complaintListItems: { title: string; items: string[] }[] = [];

    // Fetch ClearURLs rules
    const rules = await fetchClearURLsRules();

    links.forEach((link) => {
      const complaints = checkURLAgainstRules(link.url, rules);

      // Check for amzn.asia short links
      try {
        const linkObj = new URL(link.url);
        if (linkObj.hostname === "amzn.asia") {
          complaints.push(
            "This is a short Amazon link that can be used to track who sent the link, and associate you with anyone who clicks it",
          );
        }
      } catch {
        // Invalid URL, skip
      }

      if (complaints.length != 0) {
        complaintListItems.push({
          title: link.url,
          items: complaints,
        });
      }
    });

    if (complaintListItems.length != 0) {
      const richTextElements: RichTextBlockElement[] = [
        {
          type: "rich_text_section",
          elements: [
            {
              type: "text",
              text: "There are some issues with links in your message:\n\n",
            },
          ],
        },
      ];

      complaintListItems.forEach((complaintItem) => {
        // Add the link title
        richTextElements.push({
          type: "rich_text_section",
          elements: [
            {
              type: "text",
              text: complaintItem.title,
              style: {
                code: true,
              },
            },
          ],
        });

        // Add the list of complaints
        if (complaintItem.items.length > 0) {
          richTextElements.push({
            type: "rich_text_list",
            style: "bullet",
            elements: complaintItem.items.map((item) => ({
              type: "rich_text_section",
              elements: [
                {
                  type: "text",
                  text: item,
                },
              ],
            })),
          });
        }
      });

      await say({
        blocks: [
          {
            type: "rich_text",
            elements: richTextElements,
          },
        ],
        text: "There are some issues with links in your message:",
      });
    }
  }
});

(async () => {
  // Start your app
  await app.start();

  app.logger.info("⚡️ Bolt app is running!");
})();
