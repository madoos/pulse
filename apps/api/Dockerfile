FROM node:26-alpine AS build
RUN npm install -g --ignore-scripts pnpm@12.6.0
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
# Apply the OS security patches released after the base image, and drop npm,
# which is not needed to run the API and brings its own vulnerable dependencies.
RUN apk upgrade --no-cache \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
WORKDIR /app
COPY --from=build /repo/apps/api/dist ./
COPY apps/api/src/shared/infrastructure/database/migrations ./migrations
COPY apps/api/src/shared/infrastructure/database/business-data/*.csv ./business-data/
USER node
# The released version, passed by the release pipeline, tags every error reported to Sentry.
ARG VERSION=dev
ENV NODE_ENV=production PORT=3000 SENTRY_RELEASE=api@${VERSION}
EXPOSE 3000
CMD ["node", "main.js"]
