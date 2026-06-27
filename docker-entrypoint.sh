#!/bin/sh
set -e

if [ -n "$CONVEX_SELF_HOSTED_ADMIN_KEY" ] && [ -n "$CONVEX_SELF_HOSTED_URL" ]; then
    echo ">> deploying convex code to $CONVEX_SELF_HOSTED_URL"
    bunx convex deploy -y || {
        echo ">> convex deploy failed; starting web anyway" >&2
    }
else
    echo ">> CONVEX_SELF_HOSTED_* not set, skipping convex deploy"
fi

exec "$@"
