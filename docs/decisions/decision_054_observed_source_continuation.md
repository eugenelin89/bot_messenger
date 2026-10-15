# Decision 054 — Owner-authorized continuation after a known research-quality failure

Accepted 2026-10-15 within the owner's instruction to fix and finish the Trade rerun, including all required model allowance. This path does not consume or grant additional model allowance.

A newly approved observed renewal can fail during research collection before any model work. A known `unavailable` outcome with exact reason `financial_ohlc_order` may be acknowledged once under the same authority. All collection effects must be known settled, the discussion untouched, and the portfolio unchanged with no pending orders. Active/unknown effects, provider circuits, different errors, changed evidence, or any model work do not qualify.

The reusable boundary permits exactly one such failure among at most nine frozen research requests, with at least one retained success and one unattempted request. This incident's exact proof is six retained responses, rejected XOM and unattempted WMT/SPY. The complete instrument/request set and every retained outcome are hash-bound; the implementation does not hardcode a ticker or silently omit a second failure.

Preparation appends an immutable local record and two future occurrence rows while leaving the loop blocked. It preserves the original occurrence identities, plan digest and independent envelope. A separate independent `source_continuation` event binds the preparation digest, owner receipt, portfolio head, custody checkpoint, retained evidence and settlement hashes, the failed request, unspent requests, and original/effective schedules. Older binaries reject this event and schema30. No migration creates authority.

Release clears only the exact approved source hold. Only the narrowly recognized startup hold may intervene across preparation/release; duplicates never clear a newer hold. Activation is a local transaction requiring current independent approval, unchanged preparation and future starts. It records an activation receipt, increments generation and cancels the replaced pending research row. Generic Resume requires the durable activation receipt; a changed generation alone is insufficient. Original failed source rows and all budgets remain retained.

Collection reuses validated successes and fetches only unspent requests. The rejected instrument appears as explicitly unavailable, with no fabricated observation or price. It cannot be ordered in this cycle. Later close collection, normalization and fill qualification remain unchanged. Public decision and discussion summaries include a trusted limitation; proposal acceptance reserves space for that complete notice under the existing public contract.

This is an explicit one-use repair, not an automatic source retry, data-cleaning exception, perpetual budget, or permission for real trades. Ask remains paused.
