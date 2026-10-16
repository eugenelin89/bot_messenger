# HQ design and interaction system

Preserve BotSquad navy/blue identity and existing employee portraits. No new visual brand or generated portraits.

- Type: system sans, 16px base, 14–16px ordinary body text and 12–14px supporting labels, 28–32px page heading. Technical records may use readable monospace.
- Color: navy rail; white panels; pale neutral canvas; blue primary action. Shared muted/status/focus tokens must pass their applicable contrast requirements. Text labels accompany every status.
- Space: 4/8px rhythm, 16–24px panel padding, restrained borders and 10–14px radii. One primary action per workflow.
- Navigation: six main destinations, contextual secondary row, clear current page and heading. Header New task and Help; skip link before rail. URL fragment preserves section.
- Forms: persistent labels, explanatory text before consequential action, native validation, errors inside the initiating modal, preserved draft, no background auto-submit or auto-retry.
- Disclosure: results and human-readable progress first; original records and configuration under named details. Exact approval scope is never hidden from its approval action.
- Focus: visible high-contrast outline for buttons, links, inputs, select, textarea and summary. Restore equivalent focus/selection on refresh; intentional navigation focuses heading; dialog names heading, Escape closes and focus returns to a sensible invoker.
- Updates: small live status announcer; never announce whole historical screen repeatedly. Loading, disconnected and stale states are explicit; preserve existing mutation gates.
- Responsive: single column below tablet; wrapping local navigation and actions; tables scroll within panels. Test 320, 390, 768 and 1440px, text scaling, and reduced motion.
- Empty/error states: say what is missing and show a relevant next action. No false completion, availability, percentage or ETA.

Target applicable WCAG 2.2 AA patterns. Record measured coverage and limitations in USABILITY-VALIDATION.md; automated checks do not certify conformance.

Rendered acceptance samples 863 text elements across 16 sections and two dialogs; those samples meet the applicable 4.5:1 / large-text 3:1 thresholds. This does not certify every populated legacy state, placeholder, non-text or assistive-technology pattern.
