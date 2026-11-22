# Debian, not Alpine: ONNX Runtime, which embeds the questions of the assistant, needs glibc (ADR-0023).
# The image that runs is distroless, below.
FROM node:26-slim AS build
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
# The production dependencies, for what the bundle leaves out: the embedding library and its binaries.
RUN pnpm --filter @pulse/api deploy --prod --legacy /deploy
# ONNX Runtime ships binaries for every platform and for GPUs: only the CPU one for Linux x64 runs here.
RUN cd /deploy/node_modules/.pnpm \
  && find . -path '*onnxruntime-node/bin/napi-v*/*' -mindepth 1 -maxdepth 7 -type d \
    \( -name darwin -o -name win32 -o -name arm64 \) -prune -exec rm -rf {} + \
  && find . -name 'libonnxruntime_providers_cuda.so' -o -name 'libonnxruntime_providers_tensorrt.so' \
    | xargs rm -f \
  && find . -path '*onnxruntime-web*/dist/*' -name '*.wasm' -delete
# The embedding model ships inside the image, so the API never downloads it.
WORKDIR /deploy
RUN node --input-type=module -e "\
  const { env, pipeline } = await import('@huggingface/transformers'); \
  env.cacheDir = '/models'; \
  await pipeline('feature-extraction', 'Xenova/multilingual-e5-small', { dtype: 'q8' });"

# Distroless: glibc and libstdc++, which Node and ONNX Runtime need, without a shell, a package
# manager or the system tools of Debian, which bring vulnerabilities the API never uses.
FROM gcr.io/distroless/cc-debian13
COPY --from=build /usr/local/bin/node /usr/local/bin/node
# Node also needs libatomic, which distroless does not have. The image is built for x86-64 only.
COPY --from=build /usr/lib/x86_64-linux-gnu/libatomic.so.1* /usr/lib/x86_64-linux-gnu/
WORKDIR /app
COPY --from=build /deploy/node_modules ./node_modules
COPY --from=build /models /models
COPY --from=build /repo/apps/api/dist ./
COPY apps/api/src/shared/infrastructure/database/migrations ./migrations
COPY apps/api/src/shared/infrastructure/database/business-data/*.csv ./business-data/
# The same unprivileged user as the cluster runs it with.
USER 1000:1000
# The released version, passed by the release pipeline, tags every error reported to Sentry.
ARG VERSION=dev
ENV NODE_ENV=production PORT=3000 SENTRY_RELEASE=api@${VERSION} EMBEDDING_MODELS_DIR=/models
EXPOSE 3000
CMD ["node", "main.js"]
