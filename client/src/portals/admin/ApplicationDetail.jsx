import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import BrandMark from '../../design-system/BrandMark.jsx';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';
import StatusBadge from '../../design-system/StatusBadge.jsx';

function GateCard({ children, title }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ApplicationDetail() {
  const applicationId = useMemo(() => window.location.pathname.split('/').at(-1), []);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cnic, setCnic] = useState({ cnicDocRef: '', note: '', verified: false });
  const [interview, setInterview] = useState({
    interviewRecordingRef: '',
    note: '',
    passed: false,
  });
  const [reference, setReference] = useState({ note: '', referenceOutcome: 'unreachable' });
  const [decisionNote, setDecisionNote] = useState('');

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
    setError('');
    setMessage('');
    try {
      const data = await api(`/admin/applications/${applicationId}/${path}`, {
        body: JSON.stringify(body),
        method: 'PATCH',
      });
      setApplication(data);
      setMessage('Verification gate recorded.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function decide(decision) {
    setError('');
    setMessage('');
    try {
      const data = await api(`/admin/applications/${applicationId}/decision`, {
        body: JSON.stringify({ decision, note: decisionNote || undefined }),
        method: 'POST',
      });
      setApplication(data);
      setMessage('Application decision recorded.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (!application && !error) {
    return <main className="portal-placeholder text-sm text-muted">Loading application…</main>;
  }
  if (!application)
    return <main className="portal-placeholder text-sm text-emergency">{error}</main>;

  const allGatesComplete = Object.values(application.gates).every(Boolean);

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-border pb-6">
          <BrandMark />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-primary">Admin operations</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text">
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
        {error ? <p className="mt-5 text-sm text-emergency">{error}</p> : null}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-5">
            <GateCard title="CNIC check">
              <p className="text-sm text-muted">Viewing this record is logged.</p>
              <p className="mt-3 text-sm text-text">CNIC: {application.verification.cnicNumber}</p>
              <FormInput
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
                label="Note (optional)"
                onChange={(event) => setCnic({ ...cnic, note: event.target.value })}
                value={cnic.note}
              />
              <Button onClick={() => saveGate('cnic-gate', cnic)} type="button">
                Record CNIC check
              </Button>
            </GateCard>
            <GateCard title="Interview">
              <FormInput
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
                label="Note (optional)"
                onChange={(event) => setInterview({ ...interview, note: event.target.value })}
                value={interview.note}
              />
              <Button onClick={() => saveGate('interview-gate', interview)} type="button">
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
                label="Note"
                onChange={(event) => setReference({ ...reference, note: event.target.value })}
                value={reference.note}
              />
              <Button onClick={() => saveGate('reference-gate', reference)} type="button">
                Record reference
              </Button>
            </GateCard>
          </div>
          <aside className="h-fit rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-text">Decision</h2>
            <p className="mt-2 text-sm text-muted">
              Approve becomes available when all three verification gates are complete.
            </p>
            <FormInput
              label="Decision note (optional)"
              onChange={(event) => setDecisionNote(event.target.value)}
              value={decisionNote}
            />
            <div className="mt-4 space-y-3">
              <Button disabled={!allGatesComplete} onClick={() => decide('approve')} type="button">
                Approve
              </Button>
              <Button onClick={() => decide('request_info')} type="button" variant="secondary">
                Request information
              </Button>
              <Button onClick={() => decide('reject')} type="button" variant="secondary">
                Reject
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
