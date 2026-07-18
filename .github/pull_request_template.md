## What

<!-- One or two sentences. What does this change do? -->

## Why

<!-- What problem does it solve? Link the requirement / story / issue. -->

## How

<!-- Any non-obvious decision worth flagging for the reviewer. -->

## Tests

- [ ] Unit tests added or updated
- [ ] Integration tests added or updated (if API surface changed)
- [ ] E2E tests added or updated (if a user-visible flow changed)
- [ ] Manual test on real device (if caregiver portal changed)

## Docs

- [ ] Rule 8 respected — any canonical fact change updates the doc in this PR

## Review checklist (from Doc 23 §27)

- [ ] Import direction respected
- [ ] Middleware order unchanged (or reasoned)
- [ ] `validate(schema)` on any new endpoint
- [ ] `respond.ok/created` — no handwritten JSON
- [ ] Every new list query has an index and a limit
- [ ] Every thrown error is an `AppError` subclass
- [ ] No `console.log`, `dangerouslySetInnerHTML`, or arbitrary Tailwind colors
- [ ] Sensitive fields go through `crypto.js` and `sensitiveFields.js`

## Risk

<!-- Rollback plan if this ships and misbehaves. Usually "revert the merge." -->
