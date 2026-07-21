# MVP Acceptance Criteria Evidence

## Batch 1 — Playwright acceptance coverage

| Criterion | Automated evidence | Status |
|---|---|---|
| AC-01 | `e2e/acceptance.batch1.spec.js` — client registration, verification, parent/map-pin creation, plan selection, admin activation, and scheduling | Passed locally on desktop, tablet, and 360×740 phone viewports |
| AC-03 | `e2e/acceptance.batch1.spec.js` — caregiver application, incomplete-gate approval block, three recorded gates, approval, and Today list | Passed locally on desktop, tablet, and 360×740 phone viewports |
| AC-05 | `e2e/acceptance.batch1.spec.js` — no-gallery camera UI and completion gate | Passed locally on desktop, tablet, and 360×740 phone viewports |
| AC-06 | `e2e/acceptance.batch1.spec.js` — offline queue, reconnection, and capture/upload time integrity | Passed locally on desktop, tablet, and 360×740 phone viewports |

The remaining AC records will be added in Batches 2 and 3. Production launch also requires the four evidence items in Doc 18 §38.

## Batch 2 — Playwright acceptance coverage

| Criterion | Automated evidence | Status |
|---|---|---|
| AC-02 | `e2e/acceptance.batch2.spec.js` — a Standard client submits four weekly slots and receives the documented three-visit allowance refusal in the browser | Passed locally on desktop, tablet, and 360×740 phone viewports |
| AC-04 | `e2e/acceptance.batch2.spec.js` — first-visit consent decline closes the visit no-fault and pauses the parent profile | Passed locally on desktop, tablet, and 360×740 phone viewports |
| AC-07 | `e2e/acceptance.batch2.spec.js` — owner feed shows completed checklist/photo evidence through minted media links; a different client receives a denial | Passed locally on desktop, tablet, and 360×740 phone viewports; Cloudinary delivery-type clarification remains open |
| AC-08 | `e2e/acceptance.batch2.spec.js` — missed visit feed entry includes the recorded reason and make-up plan | Passed locally on desktop, tablet, and 360×740 phone viewports |
| AC-09 | `e2e/acceptance.batch2.spec.js` — CNIC/interview/reference gates, approval, and mark-missed actions all create attributable audit records | Passed locally on desktop, tablet, and 360×740 phone viewports |
