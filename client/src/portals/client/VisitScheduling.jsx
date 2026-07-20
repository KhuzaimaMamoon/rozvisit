import { useMemo, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function VisitScheduling() {
  const parentId = useMemo(() => window.location.pathname.split('/')[3], []);
  const [slots, setSlots] = useState([{ day: 'Tuesday', time: '10:00' }]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function confirmSchedule() {
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
            Choose the weekly visit times included in your active care plan.
          </p>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-text">Weekly slots</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your plan allowance is checked when you confirm this schedule.
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
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
          <Button
            className="mt-4"
            disabled={slots.length >= 3}
            onClick={() => setSlots((current) => [...current, { day: 'Thursday', time: '10:00' }])}
            variant="secondary"
          >
            Add weekly slot
          </Button>
          <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              A caregiver will be assigned after your schedule is confirmed.
            </p>
            <Button
              className="w-full sm:w-auto"
              loading={saving}
              onClick={() => void confirmSchedule()}
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
