import { useState } from 'react';
import Button from '../../design-system/Button.jsx';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function VisitScheduling() {
  const [slots, setSlots] = useState([{ day: 'Tuesday', time: '10:00' }]);
  const [message, setMessage] = useState('');
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-border pb-6">
          <p className="text-lg font-semibold text-primary">RozVisit</p>
          <p className="mt-5 text-sm font-medium text-primary">Care schedule</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text">
            Choose weekly visit times
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your Standard plan includes 3 visits each week.
          </p>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-text">Weekly slots</h2>
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
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
            <p className="text-sm text-muted">
              A caregiver will be assigned after your schedule is confirmed.
            </p>
            <Button
              onClick={() =>
                setMessage('Your visit is scheduled and a caregiver will be assigned shortly.')
              }
            >
              Confirm schedule
            </Button>
          </div>
        </section>
        {message ? (
          <p
            aria-live="polite"
            className="mt-5 border-l-[3px] border-success bg-success-soft p-4 text-sm text-success"
          >
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}
