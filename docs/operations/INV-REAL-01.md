# Persistent observed paper investment — operation and morning handoff

**Current status, 2026-10-13 12:00UTC:** Source acceptance and private HQ deployment are complete.
[PR75](https://github.com/eugenelin89/bot_messenger/pull/75) merged to
`d262a8dff59ab82587bd6444b083e5e9b7603cf0`, which is the exact deployed release.
The later outcome-documentation commit does not change this deployed build. Full regression
passed 1,863 checks with zero failures; actual receiver 5/5, owner-browser 2/2 and Linux finite
adapter 2/2 passed. The service and owner controls respond, but runtime health is degraded:
strict Codex account authentication returned 401. No observed portfolio, new authority, source
request or genuine employee turn has been activated. This is an inert deployment, not a live
paper-investment record. The public showcase and methodology URLs returned 404 at 12:00 UTC;
the website execution chat remains at a pending tool-approval boundary. Ask BotSquad is unfinished.

An active hourly **BotSquad Investment completion loop** now resumes this chat, examines the
result, generates the next concrete prompt and executes available work. Automation ID:
`botsquad-investment-completion-loop`. It is a local Codex heartbeat, so its host/app must be
available for scheduled runs. It stays quiet on unchanged state and pauses once completion
is actually verified. Website execution remains delegated to the existing asymmetri.co chat.

Decision047 records the owner's Yahoo confirmation, release authorization, methodology,
retention and finite-runtime policy. The owner is asleep and has authorized continuing work,
deployment and public release when the technical gates pass; no new licensing approval is required.

## Work locations and coordination

- Sole-writer checkout:`/Users/eugenelin/Documents/ChatGPT/Bot Messenger/bot_messenger-inv-real-01`.
- Starting source main:`b06bc51059372b633c98b68ecc3ef144f999781c`.
- Website execution chat:`01a13487-f07f-7182-84ac-84abcfb07043`, in asymmetri.co project.
- Website working document:`/Users/eugenelin/dev/asymmetri/website/docs/INV-REAL-01-WEBSITE.md`.
- Motion capacity coordination chat:`01a133de-66d0-7df3-877b-466654631f57`.
- Execution plan:`docs/exec-plans/investment-inv-real-01.md`.

The website chat has implemented observed labels/clocks, unavailable/frozen configuration
presentation, responsive pages and receiver work. Its reported202receiver tests, typecheck,
lint and both builds passed. It remains at a tool approval boundary; no deployment is inferred
from those source results. Only that project executes website changes. The parent has sent
exact canonical contract and signed receiver integration requirements.

## Source delivery and Ubuntu preparation

1. Finish the focused tests and required independent reviews; record actual outputs. Run build,
   typecheck, contracts and full serial tests. Inspect the full diff and `git diff --check`.
2. Commit, push, create/attach PR, complete normal review/merge and verify origin/main identity.
3. Back up retained HQ SQLite with supported SQLite backup and retain independent custody
   separately. Never restore an old company snapshot to replenish external authority.
4. Deploy accepted source and rebuild from that exact commit. Run migration25 and FK/integrity
   checks. Preserve workers, conversations, spent approvals and unknown effects.
5. Install pinned Python3.12.12 with a root-owned interpreter and hash-locked adapter venv;
   verify exact versions and dependency audit. The official Python Build Standalone
   [distribution guidance](https://github.com/astral-sh/python-build-standalone/blob/main/docs/distributions.rst)
   and [running guidance](https://github.com/astral-sh/python-build-standalone/blob/main/docs/running.rst)
   describe Linux install-only builds. Verify the exact official asset SHA256 before extraction;
   do not silently use the host's3.12.3 or a third-party mirror.
6. Root-own the deployed Node/runtime code, retain systemd sandboxing, set`LimitCORE=0`, and
   ensure the persistent observed path does not inherit the legacy two-hour one-shot kill gate.
7. Provision a new owner-authorized observed portfolio using existing employees and an exact
   prospective session list. Record the actual authentic reload-OFF evidence timestamp/hash,
   current read-only account/routing/model preflight and independently retained finite envelope.
   Do not create an attestation merely because operation is authorized.
8. Configure the service with`BOTSQUAD_FINITE_HQ_AUTHORITY` and its operator-owned publication
   configuration via`BOTSQUAD_OBSERVED_PUBLICATION`. Configuration/key files must be canonical,
   private regular files; the destination is fixed to`https://asymmetri.co`.

Read-only production preflight found active BotSquad at commit
`a72cee080989960d2a9e1e74d9236157ce1a0448`, Node24.21.0, Python3.12.3, about36GiB free,
roughly1.5GiB available memory and configured swap. `/opt/botsquad-runtime/node/bin/node`
was owned1001:1001; it has now been corrected to root:root755. No new authority or Python adapter runtime
was provisioned at that inspection. Subsequently the official Astral20260203 Linux install-only
Python3.12.12 archive was downloaded and verified with SHA256
`67056e6c15ad24fa7b5888f5d78f913eeafb3eebca66139123e800e82e9208d3`, then installed root:root755
at`/opt/botsquad-runtime/python31212`; version3.12.12 verified. The isolated root-owned venv at`/opt/botsquad-runtime/yahoo-inv-real-01-venv` subsequently installed all hash-locked wheels; `pip check` passed and exact Python3.12.12/yfinance1.7.0 were verified. The Linux adapter passed its authored equity/ETF test under the actual service user. A protected
copy of the production schema14 database also passed migration to25 with three reopen checks,
preserving all2,626 original rows and fields. Those preparation checks were followed by the accepted deployment described below.

## Accepted private deployment

Deployment at 11:55–11:58 UTC installed the exact accepted release, rebuilt from its locked
Node dependencies and migrated schema14→25. The pre-start preservation check retained every
original rowid and field in 102 application tables / 2,626 rows. Integrity and foreign keys pass.
Post-start checks retain 8 workers, 48 tasks, 69 executions (68 completed / 1 failed), pause=false,
and zero investment runs/journal entries/grants. No existing history or spent allowance was reset.

Protected root-only backup:
`/var/backups/botsquad/inv-real-01-20261013T115509Z` on the HQ host. It includes supported
SQLite backup and retained host state; never restore it to replenish authority. Service PID 712263
was active at verification, with actual process core limits 0/0. All 630 compiled files and 25 public
files exactly match the tested Linux staging build; source is clean and code/runtime are root-owned.
The private route `/investment-run`, its script and observed API return 200 through the existing
SSH tunnel. Default universe is AAPL/MSFT/GOOGL/AMZN/JPM/JNJ/XOM/WMT, benchmark SPY.
See the [deployment receipt](../validation/evidence/inv-real01/deployment.json).

Existing enabled persistent internal-message employees are Atlas, Nix, Maya, Turing, Linus,
Ada, Grace and Scout. Exact run membership/roles remain frozen by consent; an independent
reviewer must differ from the proposer. Eligibility alone is not authenticated model readiness.
The owner controls and actual finite authority must succeed before dispatch.

## Production account hold

At2026-10-13 approximately10:46UTC the supported App Server `account/read` again returned workspace-routing authentication401 after one supported refresh of the existing login. Zero model turns were sent. A model catalog alone did not verify an authenticated account. Genuine employee activation is held until the service user signs in through the supported Codex login flow and the strict account/routing/eligibility preflight succeeds. Do not copy another user’s credentials or manufacture account/reload attestations. Source deployment can remain inert while this is repaired. The installed CLI explicitly supports
`codex login --device-auth`. The owner can restore the service-account login from an interactive
SSH session using the following command, then resume the strict read-only preflight:

```sh
ssh -t botsquad 'cd /var/lib/botsquad && runuser -u botsquad -- env HOME=/var/lib/botsquad CODEX_HOME=/var/lib/botsquad/.codex PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin /opt/botsquad/node_modules/.bin/codex login --device-auth'
```

Complete the displayed official sign-in flow personally; do not paste its temporary code or
credentials into a project document. No new login flow was initiated while the owner slept.

## Public release and restart

Create Ed25519 service credentials without logging private material. Send only the public key,
exact publisher/key/generation/scope IDs and canonical owner-approved run configuration to
the website project. The receiver must preserve the signed request authority through its
reverse proxy, install the exact grant, approve the run and select the official run. Publish the
initial truthful configured/waiting state before any market session if appropriate. Verify the
methodology route and public experiment, run, team, discussion, decision and performance views.

The standing local grant uses`futureFinancial:true,futureSummaries:true,contentTypes:[]`.
Receiver v1 scope carries`contentTypes:["application/json"]` solely because its schema requires
a nonempty list. Local upload authority remains empty. Source projection contains no artifacts.
Public methodological link:`https://asymmetri.co/botsquad/investment/methodology`.

A service restart fences publication even when the ledger is intact. Advance receiver generation,
regrant the exact current preview and reconcile receiver receipts/watermark before delivery.
An actual old snapshot conflict must stay blocked; never bypass reconciliation. The overnight
continuation may coordinate these authorized operational steps with the website project.

## Session timing and honest availability

With default60minute research, collection begins105minutes before the regular open. For
2026-10-13 this is11:45UTC, research12:00, cutoff13:00 and open13:30. Close collection begins
20:05UTC, modeled opening fills20:20 and mark20:25. If deployment misses a prospective window,
select later sessions and show waiting status. Do not backdate data, decisions, fills or AI work.

At most8exact sessions and31days are authorized per epoch. Renewal preserves capital,
positions, losses, decisions and old consumption. The current calendar ends in2026; extending
it requires a reviewed prospective amendment. AI answers, including HOLD, are genuine runtime
outcomes and cannot be promised in advance. Unknown outcome/source denial holds the system.

## Morning report template

Record completed changes, exact accepted commit/PR/build, tests and failures, schema and backup,
private/public URLs, source receipts and actual model counts, publication generation/receipts,
current cash/positions and pending sessions. List incomplete work explicitly, especially real
sessions that have not elapsed, blocked approvals, calendar amendment and any later Ask BotSquad
features. Preserve this handoff for the website ChatGPT project manager. Never claim the whole
project is online solely because source tests pass.


## Missed initial benchmark recovery

A missed initial opening cannot be allocated retroactively from historical prices. An exact
owner-selected renewal may prospectively defer unused initial benchmark funding only after
its old opening window expires and before the selected future source window. The append-only
`benchmark_defer` record preserves the original configuration, cash and unavailable comparisons.
Its resulting comparator is **cash followed by SPY**, not full-period SPY buy-and-hold. Public
status and subsequent snapshot limitations disclose both dates. No deferral is allowed after
any benchmark allocation. Only that scheduled benchmark allocation may recover through a
benchmark-only missing valuation; discretionary BUY stays blocked until healthy valuation.
Locally failed or interrupted employee work remains retained through renewal/restart only when
the trusted adapter confirms the provider completed its turn and every authoritative usage
category is complete. The execution remains failed/interrupted and its old authority must be
retired. A settled provider failure alone cannot prove response coverage: missing, retried,
unknown or incomplete provider outcomes still prohibit renewal. Historical incomplete records
are never reclassified.

## Continuation objective and next prompt

The implementation is accepted and privately deployed. On the next continuation, inspect this handoff, the execution
plan, the validation record and the latest website-chat result. Generate the next concrete
prompt from evidence, then execute its authorized work. Keep the same portfolio and retained
authority history. Route website implementation to the existing asymmetri.co chat. Complete
the Ask contract/intake, HQ employee routing, visitor interface and cross-system acceptance
using the existing Ask roadmap and separate finite authority. No canned employee answers.

The shortest activation prompt, once login and website execution are available, is:

> Continue INV-REAL-01 from deployed d262a8d and the current operation record. Verify the repaired
> service-account identity and eligibility, preserve the authentic reload-OFF timestamp, select
> two future exchange sessions and existing eligible employees, provision the exact finite
> observed/source/publication scopes, coordinate receiver approval and official-run selection
> with asymmetri.co, and start the authorized paper operation. Verify real source and model
> receipts and public read-back; observe both actual sessions without advancing time or
> resetting the portfolio. Keep Ask BotSquad work and its independent limits visible until
> the full project is complete. Deployment and release are already owner-authorized.


The next independent source packet while login/site execution remains held is **INV-ASK-01**
from `docs/experiments/investment/ASK_BOTSQUAD_ROADMAP.md`: freeze the canonical session-private
question/lease/result contract and adversarial golden fixtures in HQ, send the exact digest and
website intake prompt to the existing website chat, and review both sides before progressing
to employee routing. Use the accepted launcher and requirements; do not combine public archive
and visitor-private storage. This source work does not need a successful production login.
