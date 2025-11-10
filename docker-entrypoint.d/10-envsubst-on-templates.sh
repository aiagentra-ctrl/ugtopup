#!/bin/sh
set -e

# Render nginx config templates using envsubst before nginx starts.
# This script runs as part of the official nginx image's entrypoint which
# executes scripts from /docker-entrypoint.d/.

TEMPLATE_DIR=/etc/nginx/conf.d

if [ -f "$TEMPLATE_DIR/default.conf.template" ]; then
  echo "Rendering $TEMPLATE_DIR/default.conf from template using PORT=${PORT:-80}"
  envsubst '${PORT}' < "$TEMPLATE_DIR/default.conf.template" > "$TEMPLATE_DIR/default.conf"
fi
