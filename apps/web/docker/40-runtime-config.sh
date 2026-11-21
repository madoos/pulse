#!/bin/sh
set -eu

: "${API_URL:?API_URL is required}"

# Written outside the web root, which belongs to root and stays read-only for nginx.
printf 'window.__CONFIG__ = { apiUrl: "%s" };\n' "$API_URL" > /tmp/config.js
