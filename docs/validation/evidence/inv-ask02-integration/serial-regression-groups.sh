#!/bin/bash
set -u
cd /var/tmp/botsquad-ask-integration-idEyvv || exit 2
run_group() {
  local label="$1" limit="$2"
  shift 2
  runuser -u botsquad -- env PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin NODE_OPTIONS=--max-old-space-size=512 BOT_BUSINESS_CREDENTIAL_TEST_ROOT=/var/lib/botsquad-ask-validation-idEyvv INV07_RECEIVER_ROOT=/var/tmp/botsquad-ask-integration-idEyvv/receiver-6ecd498 nice -n 10 timeout "$limit" node --test --test-concurrency=1 "$@" > "$label.log" 2>&1
  local result=$?
  echo "$result" > "$label.exit"
  tail -n 12 "$label.log"
  return "$result"
}
run_group lexical-snapshot-boundaries-01 900 dist/test/finite-hq.test.js dist/test/private-research-recovery.test.js dist/test/investment-team-risk.test.js dist/test/investment-activity.test.js dist/test/credit-pilot.test.js dist/test/research.test.js dist/test/mandates.test.js dist/test/ask-service.test.js || exit $?
run_group final-investment-receiver-01 600 --test-name-pattern='^actual (isolated receiver: committed team |standalone receiver accepts simulator journal,)' dist/test/investment-team-publication.test.js dist/test/publication-receiver.test.js || exit $?
run_group final-adapter-regressions-02 3000 --test-skip-pattern='^authored observed workflow: (plain|actions_and_revision) through normal HQ,' dist/test/observed-investment.test.js dist/test/private-research-python.test.js dist/test/yahoo-bootstrap.test.js dist/test/yahoo-direct-custody.test.js dist/test/yahoo-direct.test.js dist/test/yahoo-history.test.js dist/test/yahoo-probe.test.js dist/test/yahoo-protocol.test.js dist/test/yahoo-python.test.js dist/test/yahoo-transport-local.test.js dist/test/yahoo-transport.test.js || exit $?
