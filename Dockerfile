ARG NODE_REPO=oven/bun:alpine
ARG NODE_LOCK=bun.lock
ARG NPM=bun
ARG NODE=bun

#ARG NODE_REPO=node:alpine
#ARG NODE_LOCK=package-lock.json
#ARG NPM=npm
#ARG NODE=node

FROM ${NODE_REPO} AS base
# RUN apk add --no-cache libstdc++
# RUN npm i -g pnpm@latest

FROM base AS deps
ARG NODE_LOCK
ARG NPM
WORKDIR /app
COPY package.json ${NODE_LOCK} ./
RUN ${NPM} install  --frozen-lockfile

FROM deps AS builder
ARG NPM
WORKDIR /app
ENV NODE_ENV=production
#COPY src src
COPY client client
COPY server server
COPY shared shared
COPY *.js *.yaml *.ts *.json ./
RUN ls
RUN ${NPM} run build

# Production image, copy all the files and run next
# oven/bun:alpine, node:20-alpine, bcgovimages/alpine-node-libreoffice:20, etc
FROM builder AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S node && adduser -S node -u 1001
USER node
EXPOSE 5000


CMD bun run deploy && bun start
