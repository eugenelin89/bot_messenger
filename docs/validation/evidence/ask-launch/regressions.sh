#!/bin/sh
set -eu
cd /var/tmp/botsquad-ask-launch-20261014-hq
export PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin
export NODE_OPTIONS=--max-old-space-size=512
node --test --test-concurrency=1 dist/test/ask-contract.test.js dist/test/ask-control-journal.test.js dist/test/ask-private-content.test.js dist/test/ask-public-context.test.js dist/test/ask-runtime.test.js dist/test/ask-transport.test.js dist/test/ai-usage.test.js dist/test/usage-migration.test.js dist/test/http.test.js dist/test/ai-profile.test.js dist/test/finite-hq-dispatcher.test.js dist/test/investment-team-dispatcher.test.js dist/test/private-research-dispatcher.test.js dist/test/publication-http.test.js dist/test/publication-migration.test.js dist/test/publication-transport.test.js dist/test/publication-kill.test.js dist/test/publication-projection.test.js
