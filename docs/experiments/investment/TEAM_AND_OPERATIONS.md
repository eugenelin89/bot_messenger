# Team, scheduling and operations

**Version:** 1.0 | **Status:** Proposed workflow, not active | [Guide](README.md)

## 1. Team responsibilities, not permission by title

Use the actual retained roster. A possible responsibility mapping is Atlas as coordinator/final decision maker, Scout as market researcher, and eligible Maya/Turing/Grace participants for company analysis, quantitative questions and independent challenge. These are experiment assignments, not changes to their global product-manager/CTO/reviewer roles. No worker is assumed present or eligible solely because this design names them.

INV-01 inspects current types, role checks, hierarchy and runtime tools. INV-08 implements only the missing bounded paper-investment capability and compatible context/tool schema. Do not route arbitrary financial Tasks through engineering-only task kinds or pretend changing a mission string supplies missing tools. Public research eligibility and working-group opt-in remain separately enforced per worker.

The owner selects existing workers, coordinator, potential independent reviewers, finite budgets and a public-audience scope. A full eight-worker company does not require hiring an extra team. Do not increase roster, depth or concurrency limits to pass the experiment. Shared workers retain their unrelated project responsibilities.

The team chooses useful research and discussion inside the envelope, rather than following a fixed author-by-author script. It can HOLD, disagree, ask for missing evidence and stop. Mandatory accounting/risk checks are deterministic constraints, not an instruction about which stock to buy.

## 2. Required authority intersections

| Action | Required authority |
| --- | --- |
| Read approved reference material | Existing current document/work scope |
| Search/read public sources | Current eligible-worker research grant, including discussion mode when relevant |
| Share material inside a group | Explicit audience/evidence export under current group rules |
| Generate a public contribution | Active experiment participation plus public-audience context and approved evidence |
| Submit a paper order | Active run, current worker/execution capability, decision/review and frozen rules |
| Publish a public projection | Separate owner publication envelope, current source rights and trusted publisher scope |
| Change grants/rules/official state | Trusted owner action, never model prose |

A standing paper-order grant may allow ordinary valid paper orders without per-trade human approval. It is still a newly implemented bounded capability and must be explicitly activated. A standing export grant similarly avoids per-message micromanagement while restricting the run, audience, fields and record classes. Neither grants real financial authority.

Before any public-audience work, show the owner the proposed exported roster, source packet, event classes, artifact examples, destination and irrevocability of already downloaded copies. Existing private conversations are never retroactively public merely because their workers join this experiment.

## 3. Scoped memory and review

Use fresh compatible public-experiment contexts. Rehydrate only authorized run history, decisions, evidence, previous outcomes, open questions and current obligations. Do not inject private direct conversations, whole-company documents or unrelated provider history.

Each decision captures evidence available at commitment, source/artifact versions, alternatives, risks and thesis-invalidating conditions. Independent review addresses the same proposal revision and is attributable to a different eligible worker. A changed instrument, quantity, guard or thesis invalidates the old exact review and requires a new one. Review is not a simulated execution receipt.

Outcome reviews link to original reasoning and new observations, preserve dissent and explicitly identify what was learned versus merely hypothesized. A later successful price move does not prove every original claim. Unknown sources and costs remain unknown. Preserve existing provider-outcome uncertainty fences through context replacement; publication failure alone does not justify replaying model work.

## 4. Daily loop

The initial model is one bounded decision cycle per exchange trading session, not continuous trading. Time is stored in UTC with the exchange calendar's `America/New_York` semantics; the owner can display Vancouver time. Holidays, early closes and unexpected closures come from the trusted versioned calendar.

| Stage | Trusted behavior | Model behavior |
| --- | --- | --- |
| Prior session completes | Admit licensed closing observations and publish quality-labelled valuation | Review holdings/results when authorized work is due |
| Research window | Admit only scoped source evidence; enforce budgets | Choose questions, research and discuss useful alternatives |
| Before target opening cutoff | Enforce exact deadline, review/configuration and order reservations | Commit BUY/SELL/HOLD decisions with rationale |
| Target regular-session open | Fill already locked valid orders from verified raw observations; record delays and guards | No retrospective decision change using the known fill price |
| Session marking | Reprice under the licensed convention without model calls | No model needed merely for a moving chart |
| Later review | Dispatch a real durable scheduled occurrence | Evaluate intervening observations; continue, revise, HOLD or stop |

The proposed submission cutoff is 30 minutes before the target open; exact rules are in [Simulation rules](SIMULATION_RULES.md). Missed deadlines cannot be repaired by backdating. An expired decision may lead to a new future-session decision, not a replay at the missed price.

Use the existing durable scheduler and dispatcher. A proposed default is 12 model executions per cycle and 24 per trading session, beneath existing work limits; owner must choose a finite total horizon and grant expiry. Record consumed model/research/order budgets, not only successful results. Internal price polling/heartbeat may run in bounded trusted code without model invocation.

Do not run one worker simultaneously in multiple contexts. Keep two global slots and existing scheduling priority semantics. Queue the investment work behind unavailable shared employees and display that fact. Deadlines expire rather than stealing slots, enlarging limits or starving unrelated projects.

## 5. Owner controls

Controls need separate labels and precise effects:

| Control | Effect |
| --- | --- |
| Pause new model dispatch | Existing company-wide rule: holds eligible future AI work; does not undo completed work or alone cancel already committed paper orders |
| Interrupt active model work | Requests interruption; preserves uncertain outcomes and committed records |
| Pause investment run | Blocks new investment work/orders and cancels unfilled paper orders by default in one serialized transition; completed fills remain |
| Resume investment run | Requires current grants, data and reconciled state; does not resurrect cancelled orders or missed deadlines |
| Stop investment run | Ends new orders/cycles; keeps archive and optionally authorized read-only valuation |
| Revoke research | Stops new lookups/current delivery per existing research rules; does not erase published sources |
| Revoke publication | Stops unsent export attempts; retains local ledger/history and late receipt evidence |
| Cancel paper order | Succeeds only before fill commitment; after-fill response states already filled |
| Withdraw public content | Owner-only exceptional visibility action and cache invalidation; not a trade reversal |

The owner UI should offer a clearly described “Pause investment run” action for immediate experiment control, rather than implying the global model-pause button stops all deterministic operations. Run pause and a fill race resolve under one ledger transaction/generation check: either the fill committed before pause and remains, or pause cancels it before execution.

On accounting uncertainty, essential stale data, unsupported corporate action, expired authority, exhausted budget or excessive backlog, fail closed on new risk and publish a safe status when permitted. Existing holdings may still lose value; a pause is not capital protection.

## 6. Operator workflow

1. Create a passive draft run and review proposed configuration, roster and evidence scope.
2. Verify provider rights/access, budgets and finite calendar horizon; choose trial mode first.
3. Preview public projections, artifact formats and receiving destination.
4. Activate separately required research, paper and publication authority through trusted UI.
5. Start the mandate/run explicitly; watch actual work and receipts, not only status prose.
6. Inspect the first complete research → discussion → artifact → decision → ledger → public view chain.
7. Review owner attention and the next scheduled occurrence; no Mac session is required for the installed HQ scheduler to operate.
8. Pause/stop through the correct control and retain evidence when testing is finished.

All listed controls are target UI behavior, not claims that the current UI already provides investment controls. INV-09 must produce a learn-by-doing operator guide using actual implemented labels and verified steps.

## 7. Service and credential operations

Receiver and publisher use dedicated non-root service ownership and separate secrets from application source. Inspect actual host state before adding service files, ports, directories or Nginx routes. Do not reuse broad website SSH/deployment authority for runtime publication. HQ remains loopback/private.

Inventory publisher identities, public verification fingerprints, exact run scope, expiry, quotas and rotation state without storing private credential contents in documentation. Rotation introduces a new verification key under the same stable publisher identity, verifies both paths, then retires the old key. Test that retirement denies writes and receipt access without losing deduplication history.

Keep the public page/read endpoints separate from private trial visibility. An unlinked public URL is not private. Trial receivers need local/private transport or explicit access protection, and no indexing/public announcement. Production demo fixtures, if ever authorized, remain clearly labelled synthetic.

## 8. Health, costs and storage

Owner health shows runtime readiness, due/blocked work, grant expiry, last market event, valuation coverage, last published receipt, receiver heartbeat, oldest outbox age, pending bytes and storage headroom. Public health exposes only safe summaries, not host identifiers, private paths or provider configuration.

Proposed stop-new-risk backlog limits are one trading session without a confirmed financial publication or a finite byte quota, whichever occurs first; choose actual thresholds in configuration. Never drop committed/unacknowledged records to fit the quota. A bounded operational heartbeat has no model charge by itself; do not invent cost totals when usage accounting is unavailable.

Report model executions and tokens where actually available, provider requests and measured monetary expenses separately. Subscription-inclusive costs may be unknown; unknown is not free. Do not subtract operational subscription costs from paper equity without a separately published methodology.

Before launch, set explicit soft/hard storage limits and alert thresholds based on measured host capacity. Logs are bounded/rotated and contain safe identifiers, not private bodies or credentials. Published artifacts/history are retained by policy; orphan staging cleanup checks dependencies and grace periods.

## 9. Backup, restore and rollback

Back up HQ and public receiver databases through supported consistent SQLite backup methods, with immutable content manifests and checksums. Copying a live main database file while ignoring WAL/transaction state is not acceptance evidence. Store backups off the active host where authorized; treat private HQ backups as sensitive. Signing credentials require a separate protected recovery process, not inclusion in public artifact bundles.

Test restoration into an isolated location before calling backups usable. Verify database integrity, foreign keys, journal totals, artifact hashes, exact-version links, receipts, grants and pending outbox state. A receiver archive epoch changes when cursor continuity cannot be preserved; clients resync explicitly.

Before a restored HQ publishes, ensure only one publisher instance is active, reconcile remote receipts and journal watermark, and fence stale generations. A restored older database cannot overwrite newer public history or issue duplicate trades. Conflicting financial sequences stop the publisher for investigation.

Rollback first disables new admission/publishing, then uses compatible previous binaries while retaining new data. No destructive migration downgrade or reset of a losing portfolio. Website rollback preserves the experiment archive and Motion routes. Public withdrawal is an emergency visibility operation, not normal rollback.

## 10. Required handoff

Record both repository commits, deployed service/build identities when actually verified, contract/migration versions, run ID/configuration hash, active grant scopes/expiry, budgets, data-rights evidence, next schedule, backup/restore evidence, stop/rotation/withdrawal instructions and known limitations. No secrets or unsupported “all green” claims. Implementation status belongs in the [roadmap](ROADMAP.md); operational evidence belongs in each packet's validation record.
