#!/bin/sh
set -eu

: "${API_URL:?API_URL is required}"

printf 'window.__CONFIG__ = { apiUrl: "%s" };\n' "$API_URL" > /usr/share/nginx/html/config.js
