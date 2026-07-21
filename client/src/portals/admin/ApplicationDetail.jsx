import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';
import { FormValidationBanner } from '../../design-system/FormValidation.jsx';
import StatusBadge from '../../design-system/StatusBadge.jsx';

function GateCard({ children, title }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export default function ApplicationDetail() {
  const applicationId = useMemo(() => window.location.pathname.split('/').at(-1), []);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [message, setMessage] = useState('');
  const [cnic, setCnic] = useState({ cnicDocRef: '', note: '', verified: false });
  const [interview, setInterview] = useState({
    interviewRecordingRef: '',
    note: '',
    passed: false,
  });
  const [reference, setReference] = useState({ note: '', referenceOutcome: 'unreachable' });
  const [decisionNote, setDecisionNote] = useState('');
  const [savingAction, setSavingAction] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const loadApplication = useCallback(() => {
    api(`/admin/applications/${applicationId}`)
      .then((data) => {
        setApplication(data);
        setCnic({
          cnicDocRef: data.verification.cnicDocRef ?? '',
          note: '',
          verified: data.gates.cnic,
        });
        setInterview({
          interviewRecordingRef: data.verification.interviewRecordingRef ?? '',
          note: '',
          passed: data.gates.interview,
        });
        setReference({
          note: '',
          referenceOutcome: data.verification.referenceOutcome ?? 'unreachable',
        });
      })
      .catch((requestError) => setError(requestError.message));
  }, [applicationId]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  async function saveGate(path, body) {
    if (savingAction) return;
    if (path === 'cnic-gate' && !body.cnicDocRef.trim()) {
      setFields({ cnicDocRef: ['Enter the CNIC document reference before recording this check.'] });
      setValidationMessage('Please fill in the required information below.');
      window.requestAnimationFrame(() => {
        const field = document.getElementById('cnic-document-reference');
        field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        field?.focus({ preventScroll: true });
      });
      return;
    }
    setError('');
    setFields({});
    setValidationMessage('');
    setMessage('');
    setSavingAction(path);
    try {
      const requestBody = { ...body };
      if (path === 'interview-gate' && !requestBody.interviewRecordingRef?.trim()) {
        delete requestBody.interviewRecordingRef;
      }
      const data = await api(`/admin/applications/${applicationId}/${path}`, {
        body: JSON.stringify(requestBody),
        method: 'PATCH',
      });
      setApplication(data);
      setMessage('Verification gate recorded.');
    } catch (requestError) {
      setError(requestError.message);
      setFields(requestError.fields ?? {});
    } finally {
      setSavingAction('');
    }
  }

  async function decide(decision) {
    if (savingAction) return;
    setError('');
    setMessage('');
    setSavingAction(decision);
    try {
      const data = await api(`/admin/applications/${applicationId}/decision`, {
        body: JSON.stringify({ decision, note: decisionNote || undefined }),
        method: 'POST',
      });
      setApplication(data);
      setMessage('Application decision recorded.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingAction('');
    }
  }

  if (!application && !error) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
        <section className="mx-auto max-w-7xl rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
          <p className="text-sm text-muted">Loading application…</p>
        </section>
      </main>
    );
  }
  if (!application)
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
        <section className="mx-auto max-w-7xl rounded-lg border border-emergency bg-emergency-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm text-emergency">{error}</p>
        </section>
      </main>
    );

  const allGatesComplete = Object.values(application.gates).every(Boolean);

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                Admin operations
              </p>
              <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-text sm:text-3xl">
                {application.applicant.name}
              </h1>
              <p className="mt-2 text-sm text-muted">
                {application.applicant.email} · {application.applicant.phone}
              </p>
            </div>
            <StatusBadge variant={application.status === 'verified' ? 'success' : 'pending'}>
              {application.status.replace('_', ' ')}
            </StatusBadge>
          </div>
        </header>
        {message ? <p className="mt-5 text-sm text-success">{message}</p> : null}
        {error && Object.keys(fields).length === 0 ? (
          <p className="mt-5 text-sm text-emergency">{error}</p>
        ) : null}
        <div className="mt-5">
          <FormValidationBanner message={validationMessage} />
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-5">
            <GateCard title="CNIC check">
              <p className="text-sm text-muted">Viewing this record is logged.</p>
              <dl className="rounded-md bg-primary-soft p-4 text-sm">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  CNIC number
                </dt>
                <dd className="mt-1 font-medium text-text">
                  {application.verification.cnicNumber}
                </dd>
              </dl>
              <FormInput
                error={fields.cnicDocRef?.[0]}
                id="cnic-document-reference"
                label="CNIC document reference"
                onChange={(event) => setCnic({ ...cnic, cnicDocRef: event.target.value })}
                value={cnic.cnicDocRef}
              />
              <label className="mt-3 flex items-center gap-2 text-sm text-text">
                <input
                  checked={cnic.verified}
                  onChange={(event) => setCnic({ ...cnic, verified: event.target.checked })}
                  type="checkbox"
                />
                CNIC is genuine and matches the applicant
              </label>
              <FormInput
                id="cnic-note"
                label="Note (optional)"
                onChange={(event) => setCnic({ ...cnic, note: event.target.value })}
                value={cnic.note}
              />
              <Button
                className="w-full sm:w-auto"
                loading={savingAction === 'cnic-gate'}
                onClick={() => saveGate('cnic-gate', cnic)}
                type="button"
              >
                Record CNIC check
              </Button>
            </GateCard>
            <GateCard title="Interview">
              <FormInput
                id="interview-recording-reference"
                label="Interview recording reference (optional)"
                onChange={(event) =>
                  setInterview({ ...interview, interviewRecordingRef: event.target.value })
                }
                value={interview.interviewRecordingRef}
              />
              <label className="mt-3 flex items-center gap-2 text-sm text-text">
                <input
                  checked={interview.passed}
                  onChange={(event) => setInterview({ ...interview, passed: event.target.checked })}
                  type="checkbox"
                />
                Interview passed
              </label>
              <FormInput
                id="interview-note"
                label="Note (optional)"
                onChange={(event) => setInterview({ ...interview, note: event.target.value })}
                value={interview.note}
              />
              <Button
                className="w-full sm:w-auto"
                loading={savingAction === 'interview-gate'}
                onClick={() => saveGate('interview-gate', interview)}
                type="button"
              >
                Record interview
              </Button>
            </GateCard>
            <GateCard title="Reference">
              <label className="block text-sm font-medium text-text">
                Reference outcome
                <select
                  className="mt-2 w-full border border-border bg-surface px-3 py-2 text-text"
                  onChange={(event) =>
                    setReference({ ...reference, referenceOutcome: event.target.value })
                  }
                  value={reference.referenceOutcome}
                >
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="unreachable">Unreachable</option>
                </select>
              </label>
              <FormInput
                id="reference-note"
                label="Note"
                onChange={(event) => setReference({ ...reference, note: event.target.value })}
                value={reference.note}
              />
              <Button
                className="w-full sm:w-auto"
                loading={savingAction === 'reference-gate'}
                onClick={() => saveGate('reference-gate', reference)}
                type="button"
              >
                Record reference
              </Button>
            </GateCard>
          </div>
          <aside className="h-fit rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-text">Decision</h2>
            <p className="mt-2 text-sm text-muted">
              Approve becomes available when all three verification gates are complete.
            </p>
            <div className="mt-5 space-y-5">
              <FormInput
                id="decision-note"
                label="Decision note (optional)"
                onChange={(event) => setDecisionNote(event.target.value)}
                value={decisionNote}
              />
              <div className="grid gap-3">
                <Button
                  className="w-full"
                  disabled={!allGatesComplete}
                  loading={savingAction === 'approve'}
                  onClick={() => decide('approve')}
                  type="button"
                >
                  Approve
                </Button>
                <Button
                  className="w-full"
                  onClick={() => decide('request_info')}
                  loading={savingAction === 'request_info'}
                  type="button"
                  variant="secondary"
                >
                  Request information
                </Button>
                <Button
                  className="w-full"
                  onClick={() => decide('reject')}
                  loading={savingAction === 'reject'}
                  type="button"
                  variant="secondary"
                >
                  Reject
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
