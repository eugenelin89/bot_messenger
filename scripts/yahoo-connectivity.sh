#!/bin/sh
set -eu
# Only this dedicated owner entrypoint; no app/worker integration.
ulimit -c 0
exec node "$(dirname "$0")/../dist/scripts/yahoo-connectivity.js" "$@"
