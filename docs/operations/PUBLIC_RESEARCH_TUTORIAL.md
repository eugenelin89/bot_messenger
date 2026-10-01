# Ask your team to research public information

This is an instructional guide, not a recorded acceptance run. See the
[WE-01 validation report](../validation/worker-empowerment-01.md) for tested results and
the [implementation decision](../decisions/decision_020_scoped_public_research.md) for
exact boundaries.

## Enable permission once

Open the private HQ through its normal SSH tunnel. Select **Atlas**, then
**Capabilities & research**. Check that the worker is eligible, company policy is enabled
and the provider is configured. Choose **Confirm & enable Public Research**. Do the
same for **Scout**, or another eligible researcher who will receive delegated work.

In the retained HQ checked on October 1, Atlas and Maya are present; Scout is not.
Maya can use granted research in her direct conversation, but the existing delegated
research Task workflow requires a researcher. If you want Scout, first use **Assign
objective** to ask Atlas to hire a persistent researcher named Scout, return after hiring,
and perform no research or delegation yet. Once Scout appears, confirm Scout's Public
Research permission here, then assign the research objective below. This setup uses
the existing hiring boundary; it does not give Atlas grant authority.

This confirmation grants repeated public searches and page reads during research Tasks
and conversations. It does not grant accounts, outreach, publication, purchases, shell
access or repository changes. A manager cannot enable its own permission or grant it to
another worker. The preset has no expiry in this UI; revoke it here at any time. The
trusted API also supports an explicit future expiry.

Company Knowledge is separate. Select only the approved reference documents the worker
needs, then choose **Confirm selected document access**. Reading a document internally
does not authorize sending it, or private conversation content, to a public search.
Existing approved Task reference-document access follows its earlier permission rules.

## Ask a current-information question

Select Atlas → **Open conversations**. Open the existing conversation or create one.
Enter:

> What's the current weather in Vancouver, British Columbia? Tell me when the
> information was observed and show the source.

Choose **Send & request reply**. This requests one conversation reply and creates no
Task. A passive message only saves context; it does not invoke a model or a search.
Normal lookups within the standing grant need no further owner approval.

A useful answer identifies the place, units, source and observation time, and distinguishes
observations from forecasts. A retrieved-today page can contain an older observation.
If the provider or source is unavailable, the worker should say what it could not verify
rather than supply a plausible answer from memory.

## Inspect the sources

Follow the HTTPS links in the reply. In the worker's **Capabilities & research** view,
select a recent research operation. The inspector shows the request, outcome, grant,
provider, actual source URL, retrieval time, freshness status and retained excerpt/hash.
A search snippet is not a full page read; a generated provider summary is labeled
separately. Unknown publication/observation times remain unknown in metadata; source
text may state the relevant time. Old source evidence keeps its original timestamps
when a context is replaced or HQ restarts.

## Assign useful research

In the **Executive channel**, use **Assign objective** for work such as:

> Research the public onboarding, documentation and support approaches of three
> software products relevant to a small software team. Delegate to Scout. Identify
> practical lessons, cite actual sources, distinguish facts from recommendations,
> and note what you could not verify. Save a report and evaluate it for me. Do not
> contact anyone, sign up, publish or change anything.

Atlas can assign Scout a bounded research Task, receive the saved report, and evaluate
its conclusions. The team chooses the products, queries and recommendations. A grant
to Atlas alone does not authorize Scout; enable each eligible worker explicitly.

## Revoke permission and understand limits

Open the same capability view and choose **Revoke Public Research**. New public lookups
are denied even if the old model context still lists a research tool. Company Knowledge
remains separate. Already transmitted queries cannot be withdrawn; pending late results
are withheld. Historical source evidence remains visible to the owner.

The default budget allows 32 research operations and eight search sessions per work,
120 operations per worker per UTC day, and 12 per minute. A delegated Task shares the
root assignment budget. Search sessions have a 90-second deadline and managed pages a
15-second deadline. Source text and replies are bounded. A search provider may perform
several internal lookups per session; these are not individually counted by BotSquad.
Retries, new grants and replacement contexts do not erase consumed budgets.

A provider-outcome-unknown error is different from an ordinary page error: further
worker work stays blocked pending operator inspection, because the provider may still
be running. Do not clear that fence or blindly retry to obtain a nicer status. Ordinary
source timeouts, inaccessible pages and rate limits can be explained or handled with
another source within the remaining budget.

## Research inside a working group

In **Capabilities & research**, explicitly include working-group discussions when granting
Public Research to an eligible worker. Old Task/direct grants remain as originally issued;
revoke and replace one if you intend to extend it. The group's charter must also permit
research. Other participants can read explicitly shared source excerpts without receiving
lookup rights. A Company Knowledge grant alone never exports a document to a group.

Use the owner group sharing form for a selected approved-document excerpt or retained
private-work public source. Review the audience and scope before submitting. This exports
only the selected material and provenance, not the producer's private query or history.
Group researchers can share bounded sources obtained for that same group without per-source
approval. Group-wide and individual budgets both apply and survive restart/extension.
See the [working-group tutorial](../tutorials/working-groups.md).
