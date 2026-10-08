# Specialist review — Stabilization 04

Both read-only specialists inspected the implementation branch based on `18ecded`.
Parent remained sole writer/integrator/deployer.

## security_reviewer

No remaining blocking or important issue. Fixed exact routes, MIME and escaping sound.
The first prefix-only traversal guard missed backslashes and an encoded image prefix
that URL parsing normalized into a local API route. Parent changed the local browser
boundary to reject original/parsed pathname mismatches and added both raw HTTP probes.
API v1 dispatch remains before this guard, and ordinary encoded worker IDs have a
positive regression. All static probes pass. No credential, grant or authority changes.

## test_reviewer

No remaining implementation blocker. Independently checked all seven SHA-256, Git
blobs and byte counts (131,666 total), complete 47/47 affected browser log, diff whitespace,
and desktop Groups/narrow Tasks screenshots. Found lost System fallback tone; parent
restored it and added a browser assertion. Research's old blanket no-images assertion
was narrowed around intentional portraits while retaining escaping/injection assertions.
Production acceptance is a separate mandatory gate and was not claimed from fixtures.

## Failed attempts and dispositions

- Initial sandbox-only static invocation could not listen on loopback (EPERM); reran
  with approved local fixture execution. No application defect or weakened assertion.
- New browser fixture first attempted engineering-role hires from a research Task.
  Corrected fixture to use product/delivery task kinds; no product authority change.
- Initial narrow browser wait required a mobile-hidden status label to be visible;
  now checks actual readiness state. Message checks await asynchronous content attachment.
- Existing mandate/research injection tests asserted no image anywhere in their view.
  Intentional worker portraits invalidated that assumption; checks now exclude only
  `.worker-portrait`, retain the injection sentinel, and pass in the complete batch.
- Parent screenshot inspection found vertically stretched Task status badges; aligned
  header items at the top. Task ownership remains clear and compact.

Final local checks: TypeScript build, static 5/5, HTTP/Attention 58/58, affected browser
47/47, focused portraits 4/4 after System fix. Logs are beside this record.

## Final acceptance review

After exact merged deployment, test_reviewer read the 63/63 Ubuntu static/HTTP log,
38/38 Ubuntu browser log, deployment/production UI/hash evidence, both production
organization screenshots and post-UI idle/preservation receipt. No remaining material
acceptance gap for PR #28 revision `21e8def`. Production peer/group history is absent
and clearly distinguished from passing isolated coverage. Documentation-only delivery
requires final source/build/health identity receipt; no broader regression rerun requested.
