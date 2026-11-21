FROM node:26-alpine AS build
RUN npm install -g --ignore-scripts pnpm@12.6.0
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/design-system/package.json packages/design-system/
RUN pnpm install --frozen-lockfile --filter @pulse/web...
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY packages/design-system packages/design-system
COPY apps/web apps/web
RUN pnpm --filter @pulse/web build

FROM nginxinc/nginx-unprivileged:1.31-alpine
COPY apps/web/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 apps/web/docker/40-runtime-config.sh /docker-entrypoint.d/
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
