import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import { navigate } from '../../navigation.js';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function VisitScheduling() {
  const parentId = useMemo(() => window.location.pathname.split('/')[3], []);
  const [slots, setSlots] = useState([{ day: 'Tuesday', time: '10:00' }]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [allowance, setAllowance] = useState(null);
  const [planName, setPlanName] = useState('');
  const [scheduling, setScheduling] = useState(null);

  useEffect(() => {
    api(`/parents/${parentId}`)
      .then((parent) => {
        setAllowance(parent.subscriptionSummary?.visitsPerWeek ?? null);
        setPlanName(parent.subscriptionSummary?.planKey ?? '');
        setScheduling(parent.schedulingSummary);
      })
      .catch((error) => setMessage(error.message));
  }, [parentId]);

  async function confirmSchedule() {
    if (saving) return;
    setMessage('');
    setSaving(true);
    try {
      const result = await api('/visits/schedule', {
        body: JSON.stringify({
          parentId,
          slots: slots.map((slot) => ({ dayOfWeek: days.indexOf(slot.day), time: slot.time })),
        }),
        method: 'POST',
      });
      setMessage(result.message);
      setScheduled(true);
      window.setTimeout(() => navigate(`/app/parents/${parentId}`), 1400);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Care schedule</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Choose weekly visit times
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {allowance
              ? `${planName} includes ${allowance === 7 ? 'daily visits' : `${allowance} visit${allowance === 1 ? '' : 's'} each week`}.`
              : 'Choose the weekly visit times included in your active care plan.'}
          </p>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-text">Weekly slots</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Visits are planned one week at a time. Two days before this week ends, we will notify
            you when next week’s scheduling window opens. You can choose different days and times;
            if you do not make changes, this week’s pattern continues automatically so care stays
            consistent.
          </p>
          <div className="mt-5 space-y-3">
            {slots.map((slot, index) => (
              <div
                className="grid gap-3 rounded-md border border-border bg-surface-sunken p-3 sm:grid-cols-[1fr_9rem_auto]"
                key={`${slot.day}-${index}`}
              >
                <select
                  aria-label={`Visit day ${index + 1}`}
                  className="h-10 rounded-sm border border-border bg-surface px-3 text-sm text-text"
                  value={slot.day}
                  onChange={(event) =>
                    setSlots((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, day: event.target.value } : item,
                      ),
                    )
                  }
                >
                  {days.map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
                <input
                  aria-label={`Visit time ${index + 1}`}
                  className="h-10 rounded-sm border border-border bg-surface px-3 text-sm text-text"
                  type="time"
                  value={slot.time}
                  onChange={(event) =>
                    setSlots((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, time: event.target.value } : item,
                      ),
                    )
                  }
                />
                {slots.length > 1 ? (
                  <Button
                    aria-label={`Remove visit slot ${index + 1}`}
                    className="h-10 px-3"
                    onClick={() =>
                      setSlots((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                    variant="ghost"
                    type="button"
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
          <Button
            className="mt-4"
            disabled={!allowance || scheduled || slots.length >= allowance}
            onClick={() =>
              setSlots((current) => [
                ...current,
                { day: days[current.length % days.length], time: '10:00' },
              ])
            }
            type="button"
            variant="secondary"
          >
            Add weekly slot{allowance ? ` (${slots.length}/${allowance})` : ''}
          </Button>
          <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              {scheduling?.reminderWindowOpen
                ? 'You are setting next week’s visit pattern. This week’s visits stay unchanged.'
                : 'A caregiver will be assigned after your schedule is confirmed.'}
            </p>
            <Button
              className="w-full sm:w-auto"
              loading={saving}
              onClick={() => void confirmSchedule()}
              disabled={!allowance || saving || scheduled || scheduling?.scheduleEnabled === false}
            >
              Confirm schedule
            </Button>
          </div>
        </section>
        {message ? (
          <p
            aria-live="polite"
            className="mt-5 rounded-r-md border-l-[3px] border-success bg-success-soft p-4 text-sm leading-6 text-success"
          >
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}
