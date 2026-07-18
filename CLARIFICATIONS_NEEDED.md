# Clarifications Needed

## Vite security-gate conflict — Resolved

- **Resolution:** Founder approved the upgrade to the latest stable Vite. Vite 8.1.5 is
  installed, and AD-28 records the build-tooling version policy.
- **Searched:** Doc 00 §13 (confirmed Vite 5 stack), Doc 33 §§3.3 and 19.2 (Vite 5 and
  mandatory high/critical audit gate), Doc 23 §28 (lint/tooling), and Doc 25 §17 (CI
  audit gate).
- **PR:** Pending — no pull request has been opened, per founder instruction. Its link
  will be added here when the PR is created.

## Full seed-data implementation before models exist — Open

- **Question:** Should a full idempotent “realistic fake data” seed implementation be
  delivered now, even though the required Mongoose models have not yet been assigned to a
  Sub-Phase A task, or should it remain the T-A19 skeleton until the relevant model tasks
  are implemented?
- **Searched:** Doc 33 §12.4 (full seed-data outcome), §14 T-A19 (seed skeleton), §13.1
  (Sub-Phase A), and Doc 11 §4–6 (model-owned data shapes).
- **What is needed:** Confirmation whether creating the feature data models solely to seed
  them is authorized before the Auth, Profile, Plan, Visit, and Admin module tasks. Without
  that approval, the seed cannot truthfully create or idempotently query the documented
  collections.
