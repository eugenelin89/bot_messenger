#!/usr/bin/env bash
# Isolated authored validation. Does not start HQ or call a genuine provider.
set -euo pipefail
umask 022
export PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin
export NODE_OPTIONS=--max-old-space-size=512
candidate=0fabbbac0a1bb8e180556bcbe837076ca341f9c3
stage=/var/tmp/botsquad-investment-audit-20261014
test ! -e "$stage"
test "$(git -C /opt/botsquad rev-parse HEAD)" = 846d2220791a6f1d89732a458e3521341b61f9a1
test -z "$(git -C /opt/botsquad status --porcelain)"
git -C /opt/botsquad fetch origin main
git -C /opt/botsquad merge-base --is-ancestor "$candidate" origin/main
test "$(git -C /opt/botsquad show "$candidate":package-lock.json | sha256sum | cut -d' ' -f1)" = "$(sha256sum /opt/botsquad/package-lock.json | cut -d' ' -f1)"
mkdir "$stage"
git -C /opt/botsquad archive "$candidate" | tar -x -C "$stage"
ln -s /opt/botsquad/node_modules "$stage/node_modules"
ln -s /opt/botsquad-runtime/yahoo-inv-real-01-venv "$stage/adapters/yahoo/.venv"
cd "$stage"
printf 'Candidate %s; started ' "$candidate"
date -u --iso-8601=seconds
nice -n 10 npm run build
npm run contracts:check
nice -n 10 timeout 240 node --test --test-concurrency=1 dist/test/finite-rolling-start.test.js
nice -n 10 timeout 600 node --test --test-concurrency=1 --test-name-pattern='retained recovery closes and publishes a fill with retained gap and eleven-attempt finalization' dist/test/observed-late-close.test.js
printf 'Completed '
date -u --iso-8601=seconds
