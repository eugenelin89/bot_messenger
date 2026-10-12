#!/bin/sh
set -eu
ulimit -c 0
cd "$(dirname "$0")/.."
exec node dist/scripts/yahoo-qualification.js "$@"
