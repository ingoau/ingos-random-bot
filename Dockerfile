# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
# Pinned to >= 1.4.4 for CVE-2026-111497 (Node2Shell, Brotli decoder RCE)
FROM oven/bun:1.4.5 AS base
WORKDIR /usr/src/app

COPY . .

ENV NODE_ENV=production

RUN bun install

# run the app
USER bun
EXPOSE 3000
ENTRYPOINT [ "bun", "run", "index.ts" ]
