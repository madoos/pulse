FROM node:26-alpine AS build
RUN npm install -g --ignore-scripts pnpm@12.6.0
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/design-system/package.json packages/design-system/
RUN pnpm install --frozen-lockfile --filter @pulse/design-system
COPY tsconfig.base.json ./
COPY packages/design-system packages/design-system
RUN pnpm --filter @pulse/design-system build-storybook

FROM nginxinc/nginx-unprivileged:1.31-alpine
# Apply the OS security patches released after the base image.
USER root
RUN apk upgrade --no-cache
USER 101
COPY --from=build /repo/packages/design-system/storybook-static /usr/share/nginx/html
EXPOSE 8080
