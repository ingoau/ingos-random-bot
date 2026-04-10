import {
  App,
  subtype,
  type BlockAction,
  type BlockElementAction,
  type InteractiveAction,
} from "@slack/bolt";
import type { RichTextBlockElement, RichTextElement } from "@slack/types";
import { CHANNEL_ID, GROUP_ID } from "./constants";

type UserTypingEvent = {
  type: "user_typing";
  channel: string;
  user: string;
};

const TYPING_EPHEMERAL_COOLDOWN_MS = 10_000;
const lastTypingNoticeAt = new Map<string, number>();

// Initializes your app with your Slack app and bot token
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: process.env.SLACK_SOCKET_MODE === "true",
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

app.event("user_typing", async ({ event }) => {
  const typingEvent = event as UserTypingEvent;

  if (typingEvent.channel !== CHANNEL_ID) return;

  const throttleKey = `${typingEvent.channel}:${typingEvent.user}`;
  const now = Date.now();
  const lastNoticeAt = lastTypingNoticeAt.get(throttleKey) ?? 0;

  if (now - lastNoticeAt < TYPING_EPHEMERAL_COOLDOWN_MS) return;

  lastTypingNoticeAt.set(throttleKey, now);

  await app.client.chat.postEphemeral({
    channel: typingEvent.channel,
    user: typingEvent.user,
    text: "you are typing",
  });
});

app.event("member_joined_channel", async ({ event, say }) => {
  if (event.channel != CHANNEL_ID) return;

  await app.client.chat.postMessage({
    channel: event.channel,
    text: `everyone welcome <@${event.user}> to #ingo-commits-academic-fraud! :ultrafastcatppuccinparrot:`,
    blocks: [
      {
        type: "rich_text",
        elements: [
          {
            type: "rich_text_section",
            elements: [
              {
                type: "text",
                text: "everyone welcome ",
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
  async ({ body, context, ack, respond, payload }) => {
    await ack();

    const message = (body as BlockAction).message;

    await respond({
      replace_original: false,
      delete_original: false,
      response_type: "in_channel",
      thread_ts: message?.ts,
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

(async () => {
  // Start your app
  await app.start();

  app.logger.info("⚡️ Bolt app is running!");
})();
