# RozVisit — Git and Development Workflow
### Document 24

**Sources:** Documents 00–23. This document specifies the workflow — how changes move from idea to production — while cross-referencing the owning documents for underlying rules (repository layout in Doc 10, coding standards in Doc 23, testing in Doc 09/20, secrets in Doc 18).
**Labels:** Everything here is confirmed unless marked *(Assumption)*, *(Recommendation)*, or *(Open)*.

**One overriding fact:** RozVisit is built by one part-time developer during Phase 0–1, with no live users. Much of this document is deliberately lightweight for that reality. Section 25 states the current-workflow simplifications explicitly; Section 26 states what changes when the team grows. Both are on record so the transition is a set of switches, not a rewrite.

---

## 1. Repository Strategy

- **One private GitHub repository** — `rozvisit/rozvisit`.
- **Monorepo** using npm workspaces (Doc 10 §1): `client/`, `server/`, `docs/`, `scripts/`.
- Why monorepo: one developer, one product, tightly coupled halves (the client calls exactly this server), the docs travel with the code, and cross-repo change ceremony is a cost with no buyer at this scale.
- **Access at MVP:** the founder alone; **Phase 2 onward:** additional collaborators as they arrive, with role-appropriate GitHub permissions.
- **Repository visibility:** private throughout MVP and pilot. A future open-source consideration (a caregiver reference implementation, for instance) is not on any roadmap.

## 2. Branch Strategy

RozVisit uses a **trunk-based** flow with short-lived feature branches — the simplest model that works and the one a solo developer can sustain.

```
main   ────●───●───●───●───●───●───●───●───●───►  (protected, deployable)
              \           \      \
               feat/...    fix/... hotfix/...
```

- **`main`** is always deployable. Every merge to `main` is a candidate for production.
- **Feature branches** are short-lived (aim for < 3 days of work) and branched from `main`.
- **No `develop` branch.** Git Flow's `develop` layer would double the ceremony for a solo developer with no meaningful gain. If the team grows to a size where an integration branch helps, Section 26 revisits.

### Branch types

| Branch | Purpose | Lifetime |
|---|---|---|
| `main` | Always deployable trunk | Permanent, protected |
| `feat/<slug>` | New capability | Short-lived; merged and deleted |
| `fix/<slug>` | Bug fix in normal flow | Short-lived; merged and deleted |
| `hotfix/<slug>` | Urgent production fix | Short-lived; merged and deleted |
| `docs/<slug>` | Documentation-only change | Short-lived; merged and deleted |
| `chore/<slug>` | Housekeeping (deps, tooling) | Short-lived; merged and deleted |
| `refactor/<slug>` | Structural change with no behavior change | Short-lived; merged and deleted |
| `release/<version>` | Release preparation *(Phase 2+ only, see §15)* | Short-lived |

## 3. Branch Naming

- All lowercase, hyphenated.
- Format: `<type>/<short-imperative-slug>`.
- Slug is 3–6 words; describes the change, not the file.

**Good:** `feat/visit-offline-queue`, `fix/reset-link-expiry`, `hotfix/emergency-broadcast-timeout`, `docs/api-spec-cursor-pagination`, `refactor/split-visit-service`

**Bad:** `feat/khuzaima-work`, `fix/bug`, `updates`, `feat/VisitService.js`, `feature/asana-1234`

Ticket references, when tickets exist (Phase 2+), go in the commit body or PR description — never the branch name (branches are for humans reading `git branch`, ticket IDs are for machines).

## 4. Feature Workflow

The path from idea to `main` for a normal capability:

```
1. Open (or reference) an issue for the story.        (Section 18)
2. git switch -c feat/<slug>                          (from main)
3. Write code, tests, and (per Rule 8) doc updates    (Doc 23 §27 review checklist)
4. Push the branch; open a PR.                        (Section 9)
5. CI runs: lint, tests, build.                       (Section 12)
6. Self-review pass, or peer review at Phase 2+.      (Section 11)
7. Merge (squash) to main.                            (Section 13)
8. Delete the branch. Render deploys on green main.   (Section 21)
```

**Solo-developer simplification** (Section 25 states this concretely): the "self-review pass" is a real pass, not a rubber stamp — the PR is opened, CI is watched, and the review checklist (Doc 23 §27) is walked, then merge happens. This is not the same as merging straight to main.

## 5. Bug-Fix Workflow

Same as Feature Workflow, but the branch is `fix/<slug>` and the PR title uses `fix(...)` per Conventional Commits (Section 8).

Bug fixes must add a **regression test** — a test that would fail on the old code and passes on the new. This is not a "nice to have"; it is the mechanism by which bug fixes stop being flaky.

## 6. Hotfix Workflow

For **urgent production issues** — a broken login, a failing emergency broadcast (Phase 2), a data-safety bug.

```
1. git switch -c hotfix/<slug>                        (from main)
2. Minimum change to fix; add a test.
3. Push; open a PR marked urgent.
4. CI runs. If green: merge.
5. Render deploys automatically.
6. Verify in production; the incident owner (Doc 18 §34) records the event in docs/incidents/
```

**Rules for hotfix scope:**
- One problem per hotfix. No unrelated cleanup, no "while I'm here."
- No new feature work rides along.
- The fix is the smallest change that resolves the issue safely.
- If a fix needs new dependencies or new schema fields, it is not a hotfix — it is a normal `fix/` with the usual pace.

**MVP reality:** with no live users, "hotfix" is theoretical. It becomes real from Phase 2. The workflow is documented now so it exists before it is needed.

## 7. Commit Conventions

- **One commit per logical change.** A commit that changes ten unrelated things is at least ten commits.
- Present tense, imperative mood: "add", "fix", "refactor" — not "added", "adds", "fixed".
- Subject line ≤ 72 characters.
- Body wraps at 100 characters and explains *why*, not *what*. The diff is the "what."
- Reference an issue or a requirement ID where relevant: `Closes #42`, or `Implements FR-045`.
- Never commit secrets, keys, or personal data (Doc 18 §20 and §23).
- Commit signatures *(Recommendation)* — enabled once the developer's GPG/SSH setup is in place; not blocking at MVP.

## 8. Conventional Commits

Confirmed convention (Doc 10 §24 lists this already). Format:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types used:**

| Type | Meaning |
|---|---|
| `feat` | A new capability |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `chore` | Housekeeping (deps, tooling, config) |
| `refactor` | Structural change with no behavior change |
| `test` | Adding or refactoring tests |
| `perf` | Performance improvement |
| `security` | Security-relevant change |

**Scopes are the module** (visits, plans, admin, notifications, docs, ci, etc.) — one word, matching the folder names in Doc 10.

**Breaking changes** carry a `BREAKING CHANGE:` footer (rare at MVP because the API is unversioned externally — reserved for changes that would move us to `/api/v2`, per Doc 12 §3).

**Examples:**

```
feat(visits): enforce completion rule (checklist + at least one photo)

Refuses to mark a visit complete without a finished checklist and at
least one in-app camera photo. Emits ConflictError("VALIDATION_FAILED")
so the client can show the FR-045 message.

Implements FR-045.

Closes #42
```

```
fix(auth): unify wrong-email and wrong-password response

Prior behavior returned different messages for "no such email" and
"wrong password," allowing account enumeration. Both now return
UNAUTHENTICATED with the same message and time.

Addresses Doc 13 §2 uniform-response rule.
```

## 9. Pull Requests

**Every change lands via a PR to `main`.** No direct commits to `main`, even for the founder — the CI checks (Section 12) run only on PRs, and skipping them removes the safety net.

- **PR size guidance:** aim for < 400 lines changed. A larger change usually splits into a preparatory `refactor/` PR and a feature PR.
- **One PR per concern.** Reviewing (or self-reviewing) two changes woven together is where bugs hide.
- **The PR description follows the template** (Section 10) and does the reviewer's work up front.
- **Draft PRs are allowed** for work-in-progress — CI still runs, but the "ready for review" label is not applied yet.

## 10. Pull Request Template

Placed at `.github/pull_request_template.md` — appears automatically on new PRs.

```markdown
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
```

The template is a working tool, not paperwork — filling it in *is* the self-review pass at MVP.

## 11. Code Review Rules

**MVP (solo developer):** self-review is a discipline, not a formality. The developer opens the PR, reads their own diff in the PR view (which reads differently from the editor), walks Doc 23 §27's checklist, and only then merges. **A change that is not read in the PR view before merge is a change that will surprise its author later.**

**Team stage (Section 26):**
- One approving review required from someone other than the author.
- Reviewer walks Doc 23 §27's checklist explicitly.
- Reviewer response times: aim for same-day; unblock urgent PRs within hours.
- Author addresses feedback in follow-up commits (not force-push on shared branches).
- Nitpicks are prefixed `nit:`; blocking concerns are unmarked.
- **Never approve without reading the code.** "Looks good" without a real read is a review-blocking pattern.

**What is never a review comment:** style opinions the linter or Prettier already decided (Doc 23 §29). The tools decide those; reviewers focus on things tools cannot see.

## 12. Required Checks

CI runs on every PR (Doc 10 §22, `.github/workflows/ci.yml`):

1. **Install** — `npm ci` for deterministic builds.
2. **Lint** — Oxlint + Prettier check pass (Doc 23 §28–29).
3. **Test** — Jest unit + Supertest integration tests pass.
4. **Build** — the client and server build without errors.
5. **Bundle budget** *(Recommendation, Doc 21 §3)* — the client's first-screen payload stays under 300 KB compressed.
6. **`npm audit`** — no unresolved high/critical findings (Doc 18 §26).

**All checks must be green.** No merge without green — including on the solo-developer path (the whole point of trunk-based flow is that `main` is trustworthy).

**E2E (Playwright)** runs pre-release rather than per-commit at MVP (Doc 10 §22); at Phase 2+ with a staging environment, E2E joins per-PR.

## 13. Merge Strategy

**Squash merge** is the default for feature and fix branches. Rationale:
- The commit history on `main` reads like a changelog — one merge per feature.
- The messy in-branch commit history (typos, WIPs, "fix lint") disappears.
- Reverting a feature is one revert (Section 24).

**When squash is not used:**
- **Merge commit (no squash)** for `release/` branches at Phase 2+ (preserves the release-preparation history).
- **Rebase-and-merge** is not used — it rewrites hashes and complicates other people's local branches when the team grows.

**Branch cleanup:** the branch is deleted from GitHub immediately after merge. Local branches are pruned monthly (`git fetch --prune`).

## 14. Conflict Handling

- **Rebase your feature branch on `main` before opening (or refreshing) a PR.** This is the developer's job, not the reviewer's.
- **`git pull --rebase`** for local branches with a matching remote — never a merge commit into a feature branch.
- **Conflicts on the `docs/` folder** are almost always semantic — the two changes were about different canonical facts. Resolve by reading both changes carefully; Rule 8 keeps facts consistent.
- **Conflicts on `package-lock.json`** are resolved by regenerating: accept `package.json` changes, then `npm install`, commit the fresh lockfile.
- **When in doubt, ask the diff first, not the file** — the wrong side of a conflict resolved silently is a bug waiting.

## 15. Release Branches

**MVP: not used.** Every merged PR is deployable; production is `main`.

**Phase 2 onward:** `release/<version>` branches appear when a staging environment exists (Doc 08 §26, Doc 10 §23). Workflow:

```
1. git switch -c release/1.4.0                        (from main)
2. Only bug fixes and doc updates land on the release branch
3. Deploy to staging; run E2E and manual QA
4. When green: tag main at the merge commit; deploy to production
5. Delete the release branch
```

This lets `main` keep receiving feature work while a release is being stabilized.

## 16. Version Tags

- **SemVer** (`MAJOR.MINOR.PATCH`), tagged on `main`.
- `MAJOR` — a genuinely breaking change (in this product, effectively "we moved to `/api/v2`"; extremely rare).
- `MINOR` — a shipped new capability (a phase transition, a new module).
- `PATCH` — bug fixes and small improvements.
- Tags are annotated: `git tag -a v1.3.0 -m "Phase 2 emergency system live"`.
- Tags trigger the release process (auto-changelog generation, deployment step at Phase 2+).

**Pre-release tags** for the pilot: `v0.9.0-pilot.1`, `v0.9.0-pilot.2` — signals we are running with real families but pre-1.0.

## 17. Changelog

- **`CHANGELOG.md`** at the repo root.
- **Kept manually at MVP** *(Recommendation)* — updated on each release with the human summary of what changed. This is cheap, honest, and the alternative (auto-generated from commits) is noisier than useful at pilot scale.
- **Kept auto-generated at team stage** — a tool like `conventional-changelog` produces the human-readable diff from Conventional Commits since the last tag; the release-branch owner curates it before publish.
- Every entry names the version, the date, and the phase transition if any.
- Breaking changes are called out with a `⚠️ BREAKING` marker.

## 18. Issue Templates

Placed at `.github/ISSUE_TEMPLATE/`. Two templates at MVP, more at team stage.

**Feature or story** (`feature.md`):

```markdown
## Story
<!-- As a [user], I want [capability], so that [benefit]. -->

## Traces to
<!-- Which BR / US / FR does this implement? -->

## Acceptance criteria
- [ ] ...

## Notes
```

**Bug report** (`bug.md`):

```markdown
## What happened

## What I expected

## Steps to reproduce
1.
2.

## Impact
<!-- Who is affected and how? -->

## Environment
<!-- Portal, browser, connection. Include the correlation ID if you have one (Doc 20 §26). -->
```

Team-stage additions: `security.md` (private security-vulnerability disclosure — filed as a security advisory, not a public issue) and `docs.md` (documentation-only changes).

## 19. Definition of Ready

An issue is **ready to work** when:

- [ ] It traces to a business requirement, user story, or documented decision.
- [ ] Acceptance criteria exist (Given/When/Then where a user-visible flow is involved).
- [ ] Any UI change references the relevant screen in Doc 16.
- [ ] Any API change names the endpoint (Doc 12) or explicitly proposes a new one.
- [ ] Any data-model change is compatible with Doc 11.
- [ ] Dependencies (other issues, external decisions) are listed.
- [ ] The founder has confirmed the recommendation values it depends on (Doc 10 §20).

**Anything that fails this list is not ready.** Working on it produces a PR that gets sent back with questions.

## 20. Definition of Done

A PR is **done** when all of the following are true:

- [ ] Code satisfies Doc 23 §27's review checklist.
- [ ] Tests exist for the change (unit for services, integration for endpoints, E2E for user-visible flows).
- [ ] All required CI checks are green (Section 12).
- [ ] Docs are updated per Rule 8 (Doc 00 §Source of Truth Rules).
- [ ] Constants values pulled from `config/constants.js` (Doc 10 §20).
- [ ] Sensitive fields flow through `crypto.js` and `sensitiveFields.js` (Doc 18 §22).
- [ ] The correlation ID (Doc 20 §26) is present on any new log lines and error paths.
- [ ] Rule 4 respected — no invention that isn't traceable to a source or labeled `(Recommendation)`.
- [ ] The PR description explains *why*, not only *what*.
- [ ] A revert plan is stated (usually "revert the merge").

**"Done" is not "the code runs on my machine."** It is the above list, walked.

## 21. Environment Promotion

**MVP (Doc 09 §26):**
- **Local development** — seeded fake data, one command starts everything.
- **Production** — `main` deploys to Render on green CI.

That is the entire promotion pipeline at MVP. No staging environment; no manual gates. It is small on purpose.

**Phase 2 onward:**
- **Local → staging → production.**
- `main` deploys automatically to **staging**.
- `release/*` branches (Section 15) deploy to **production** after staging verification.
- The AD-12 hosting move is a prerequisite for the emergency system going live in production (Doc 08 §30).

**Rollback path is not a "promotion" but is here for the same reason:** it is a one-click Render re-deploy of the last healthy commit (Section 24).

## 22. Secrets Rules

Fully owned by Doc 18 §19–20. Workflow-level restatement:

- Secrets never appear in code, in commits, in comments, in PR descriptions, in issues, or in logs.
- `.env` is `.gitignore`d. `.env.example` documents shape only.
- Production secrets live in Render's environment settings; developer secrets in each developer's own `.env`.
- **If a secret is ever committed** (mistakes happen): the incident owner is paged; the secret is **rotated immediately** (not just removed from git); the leak is documented in `docs/incidents/`; the "revoke everything + force reset" lever (Doc 13 §27) is used if credentials are affected.
- Rewriting git history to remove a leaked secret is a **secondary** step — the primary defense is rotation, because the secret has already been leaked.

## 23. Documentation Update Rule

**Rule 8 restated as workflow:**

> If a PR changes a canonical fact — a decision, a numeric threshold, an architectural boundary — the documentation change lands in the same PR, and the doc reviewer notes which section moved.

Concretely:
- Changing a value like `CANCEL_CUTOFF_HOURS` from `12` → `18`: `constants.js` and Doc 07 (SRS) and Doc 10 §20 all update in the PR.
- Adding a new API endpoint: Doc 12 (API Spec) and Doc 10 (route naming), same PR.
- Changing the middleware order: Doc 09 §7 and Doc 10 §7 and Doc 23 §5, same PR.

**A PR that changes canonical facts without updating the docs is sent back.** This is how the documentation series stays trustworthy over time.

## 24. Rollback Workflow

**The default rollback is a Render redeploy of the last healthy commit.** One click. Sub-minute recovery for a bad deploy.

**When a code revert is needed:**

```
1. Identify the PR that introduced the regression.
2. git revert -m 1 <merge-commit-sha>       (squash-merge revert)
3. Push as revert/<original-slug>; open PR.
4. Green CI; merge.
5. Render redeploys; verify.
```

**When a data change is involved** (a bad migration, a corrupted write):
1. Stop the traffic that would compound the issue (Render pause is one click).
2. Restore from Atlas backup to a temporary cluster to inspect.
3. Fix forward with a scripted correction (no in-place hand edits — the correction is a `scripts/migrations/` entry so it is reviewable and replayable).
4. Communicate honestly with affected users (Doc 18 §34 posture).

**Rollback is rehearsed, not first-tried in production.** The BCK-003 rule ("an untested backup counts as no backup") applies to rollback workflows too.

## 25. Solo-Developer Workflow

The concrete simplifications while the developer is alone and no live users exist:

- **Self-review counts as review** — the discipline is real (the checklist is walked); the sign-off is one person.
- **No staging environment** — deploys go straight to production because production has no users during MVP (Doc 08 §26, AD-9).
- **CI checks are non-negotiable even alone** — the linter, tests, and build must be green before merge. This is not for anyone else; it is for the developer's future self.
- **The PR template is filled in honestly** — the reviewer and the author are the same person and both need the answers.
- **Bypass with `--no-verify` on commit hooks** (Doc 23 §30) is allowed only for real emergencies — the CI catch is the real gate.
- **One branch at a time** — long-running parallel work becomes stale and painful; ship one thing.
- **Weekly "boring maintenance" pass** *(Recommendation)* — a dedicated 30 minutes for `npm audit`, dependency updates, lint warnings, TODO sweep. Keeps entropy from compounding.

## 26. Future Team Workflow

The switches that flip when the team grows.

**When the second developer joins:**
- **Peer review becomes mandatory** — no self-merge on non-hotfix PRs.
- **CODEOWNERS file** appears in `.github/`, naming the reviewer for each module (Doc 10 §26).
- **Staging environment activates** (Doc 08 §26).
- **Release branches** (Section 15) become the norm for production deploys.
- **Per-PR E2E in CI** (was pre-release-only at MVP).
- **Standing weekly reviews** of open PRs, TODOs, and dependency updates.

**When the team reaches ~5 developers:**
- **RFC process** for architectural changes — a small doc in `docs/rfcs/` before implementation, reviewed by the founder + one senior developer.
- **Feature flags** for large changes shipped incrementally *(Recommendation)*.
- **Formal on-call rotation** for incident response (Doc 18 §34) — the incident owner rotates rather than always being the founder.
- **Post-merge preview environments** *(Recommendation)* — one ephemeral environment per open PR, deployed on push.

**When the team reaches ~10 developers:**
- **Team-scoped repositories may appear** — a services split if measurement justifies it (Doc 08 §22 large-scale row). Even then, the monorepo may remain best; this is a decision for that day, informed by the pain (or lack of it) up to then.
- **Formal engineering ladder and code ownership zones** — Doc 10's ownership rules become team-level, not file-level.

**The one rule that does not change with team size:** the documentation series is the source of truth. Rule 8 becomes more important with more developers, not less.

---

*End of Document 24 — RozVisit Git and Development Workflow*
