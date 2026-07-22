# Phase 0 Pilot Launch-Gate Record

**Recorded:** 23 July 2026  
**Owner:** Khuzaima Mamoon  
**Scope:** Phase 0 pilot with five families

This record documents the four launch-gate decisions required by Document 18 §38. Because the
restore drill and a backup incident owner are deliberately deferred, this is approval for the
limited Phase 0 pilot only. It is not the final production-launch sign-off described by Document 18.

## Gate decisions

| Launch condition | Decision | Evidence and rationale |
|---|---|---|
| Airplane-mode visit | **Passed** | AC-06 is covered by `e2e/acceptance.batch1.spec.js`. The Playwright scenario captures a visit offline, preserves it in the queue, reconnects, syncs it, and verifies the honest capture/upload timestamps. See [Acceptance Criteria Evidence](./acceptance-criteria.md#batch-1--playwright-acceptance-coverage). |
| Adversarial authentication | **Passed** | `server/tests/auth.integration.test.js` verifies identical HTTP 401 error codes, messages, and response shapes for an unknown email, an incorrect password, and an unverified account, consistent with AD-29. |
| Restore drill | **Deferred — accepted pilot risk** | MongoDB Atlas M0 does not provide the automated backup/snapshot capability needed for the planned restore drill. During the five-family Phase 0 pilot, data volume is expected to remain minimal and operational data can be recreated if necessary. Backups and a documented restore drill must be revisited before onboarding paying customers with meaningful real-data volume, when Atlas is upgraded to M10 or another paid tier with appropriate backup support. This exception applies only to the Phase 0 pilot. |
| On-call arrangement | **Documented for pilot** | The current arrangement is described below. It has a named incident owner, but no backup person or formal rotation while RozVisit is operated by a solo founder. A proper on-call rotation and backup contact are required as the team grows. |

## On-call arrangement

RozVisit is currently monitored by its solo founder, **Khuzaima Mamoon**, who is the incident owner
for the Phase 0 pilot.

When a production issue occurs, the incident owner will:

1. Check Render service status and application logs for backend failures.
2. Check the current Vercel deployment status for frontend build or delivery failures.
3. Check MongoDB Atlas cluster health and connectivity.
4. If service is disrupted during the pilot, communicate directly with the five participating
   families through WhatsApp, giving an honest status update and any required workaround.

This solo-founder arrangement is temporary. It will be replaced by a documented on-call rotation,
including a backup incident owner and formal escalation coverage, when the team grows.

## Revisit triggers

This record must be reviewed when any of the following occurs:

- RozVisit upgrades from Atlas M0 to M10 or another backup-capable tier.
- Paying customers are onboarded or production data volume becomes material.
- A second operational team member becomes available for on-call backup.
- The Phase 0 five-family pilot ends and RozVisit prepares for full production launch.

At that review, the restore drill must be performed and documented, and the on-call condition must
be reassessed against the complete requirements in Document 18 §38.
