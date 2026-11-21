FROM node:26-alpine AS build
RUN npm install -g pnpm@12.6.0
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile --filter @pulse/api...
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm --filter @pulse/api build

FROM node:26-alpine
WORKDIR /app
COPY --from=build /repo/apps/api/dist ./
COPY apps/api/src/shared/infrastructure/database/migrations ./migrations
USER node
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "main.js"]
