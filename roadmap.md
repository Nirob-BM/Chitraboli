# Requested review fixes

- [x] Payment results: verify saved status, clear once, reuse orders and provide recovery actions (1–3, 21).
- [x] Cart: reliable merge, serialized quantity changes and visible persistence failures (4–5, 7–8).
- [x] Checkout: stock/price validation, payment availability, phone validation and private progress (9–15).
- [x] Privacy/settings/loading: redact logs, correct WhatsApp setting, defer checkout, loading errors and warnings (16–20).
- [x] Accessibility and presentation: labels, line totals, delivery clarity, tokens and mobile controls (22–33).
- Excluded by request: leave the Test product and Demo category unchanged (6).
- Reported root-file error: neither the named file nor instruction-like property exists in this React project; validate actual diagnostics.
## Verification limitations
- Live gateway settlement could not be exercised: bKash gateway reports not configured.
- Real inventory has zero stock quantities; no quantities were invented or increased. A temporary QA item/order verified checkout and tracking, then was removed.
- Browser checks passed for signed-in cart merge, three-unit addition, phone rejection, COD confirmation, CHB tracking and mobile fit; six regression tests passed.

# Admin dashboard review fixes (all 30 requested)
- [x] Customer data erasure and saved notes (1–2).
- [x] Product form: sizes/colors/stock/SKU, photo handling, upload failures, refresh, validation, errors (3–12, 27).
- [x] Orders/customers/charts: load errors, paging, paid-only sales, forward-only statuses, per-order spinners, verified success (13–20, 30).
- [x] Menu, phones and access: collapsed menu, phone slide-over, retry on access check, section in address, unsaved warning, labels, keyboard cards (21–26, 28–29).

# Selected security scan findings
- [x] Protect paid AI endpoints with verified user sessions and restrict caller-supplied chat roles.
- [x] Bind delivery SMS to the customer phone saved on its order and approved notification types.
- [x] Restrict media-library records to administrators and expose only approved public review fields.
- [x] Test, deploy, and verify the selected security protections; 13 regression tests pass.
