# Decision042 — Offline Yahoo bootstrap compatibility

**Date:** 2026-10-12 America/Vancouver  
**Status:** Source-only implementation; independent acceptance tracked separately  
**Authority:** HQ-READY-03F authorizes offline investigation, correction, validation and reviewed Git integration only

## Supported mismatch and boundary

Pinned yfinance1.7.0 accepts a returned cookie-bootstrap response without checking its status.
BotSquad's accepted bridge, gateway and owner custody instead stop on non-200. This confirms a
compatibility mismatch; it does not establish that the destroyed03E response was benign.
[Investigation and acceptance](../validation/investment/HQ-READY-03F.md) distinguish those claims.

The narrow correction uses the existing Python adapter, HTTPS transport and FinancialDataGateway.
A new offline profile permits only GET `https://fc.yahoo.com/` (including the library's equivalent
URL without its trailing slash), no parameters, with original status404 retained. Acceptance
requires a complete bounded UTF-8 response, `text/plain` (optionally `charset=utf-8`), body exactly
`Not Found` or `404 Not Found` with at most one optional LF/CRLF, no Retry-After, Location, Refresh
or authentication challenge, and a newly received nonempty unexpired Secure A3 cookie valid for
both the audited crumb and chart paths. Ordinary TLS, public-address pinning, header/body/encoding
limits and aggregate request accounting still apply. Unrecognized content fails closed.

Cookies stay in the trusted parent's memory. Python receives only a nonsecret cookie-presence
verdict; its cookie jar and persistent cache remain empty. This is anonymous bootstrap state,
not proof of a logged-in account or broader access permission. Missing, expired, wrongly scoped
or changed cookies stop. A valid plain-text crumb must accompany charts. No-crumb fallback,
consent/login flows, redirects, alternate hosts, and retries after refusals or uncertain outcomes
are not authorized. Check cookie eligibility again immediately before wire creation after DNS/spacing.

Completed rejected responses retain known HTTP status, actual bytes and hash in the gateway
ledger, without entering financial evidence or reaching yfinance. Incomplete/aborted transport
retains conservative unknown charging and no replay. The compatibility wire remains terminal
after any failure. Every accepted404 still consumes a full attempt and its actual response bytes;
no status rewriting, refund or retry exemption exists. Five seconds after response completion
must pass before the next compatibility wire request.

## No authority change

The exception is restricted to synthetic scope and authored fixture transport. Only a fake-driver
factory opts into the new wire profile; no owner CLI selects it. Existing03B/03D/03E issuers,
manifest bytes, strict non-200 custody fences, private receipts and spent markers are unchanged.
Their prior decisions/acceptance records remain immutable historical evidence. No new live
approval, manifest, reservation, anchor or capability is prepared or consumed. Decision037
remains exhausted4/4; Decision029 remains US$0.

This deliberately leaves live compatibility activation for a separately approved source packet
that reuses existing custody with a distinct identity and reviewed nonfatal-bootstrap settlement.
The [exact next proposal](../operations/YAHOO_AAPL_QUALIFICATION_PROPOSAL.md) creates no authority.
A generic allow-all404 change is rejected: response status alone and the historical issue cannot
distinguish provider barriers. The03E body's known4585-byte length exceeds the accepted grammar;
its content and cookies were destroyed and are not reconstructed or reclassified.

FinancialAdmission, simulator/paper-order eligibility, ordinary employees, recurring collectors,
production, public publication and Asymmetri remain unchanged. Authored AAPL values prove code
behavior only; provider availability, true coverage and source permissions remain unqualified.
