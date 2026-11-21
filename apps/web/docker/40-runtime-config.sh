#!/bin/sh
set -eu

: "${API_URL:?API_URL is required}"

# APP_ENVIRONMENT and SENTRY_DSN are set only in the deployment: without them, the web runs as
# development and sends no errors to Sentry.
# Written outside the web root, which belongs to root and stays read-only for nginx.
printf 'window.__CONFIG__ = { apiUrl: "%s", environment: "%s", sentryDsn: "%s" };\n' \
  "$API_URL" "${APP_ENVIRONMENT:-development}" "${SENTRY_DSN:-}" > /tmp/config.js
