import { describe, expect, it } from '@jest/globals';
import { dateForSlot } from '../src/services/visit.service.js';

describe('weekly visit date resolution', () => {
  it('moves a passed weekday to its next occurrence instead of scheduling in the past', () => {
    const tuesday = new Date(2026, 6, 21, 9, 0, 0);

    const scheduledAt = dateForSlot(tuesday, 0, '10:00', tuesday);

    expect(scheduledAt.getFullYear()).toBe(2026);
    expect(scheduledAt.getMonth()).toBe(6);
    expect(scheduledAt.getDate()).toBe(26);
    expect(scheduledAt.getHours()).toBe(10);
    expect(scheduledAt.getTime()).toBeGreaterThan(tuesday.getTime());
  });

  it('keeps an upcoming weekday in the current week', () => {
    const tuesday = new Date(2026, 6, 21, 9, 0, 0);

    const scheduledAt = dateForSlot(tuesday, 3, '10:00', tuesday);
    expect(scheduledAt.getDate()).toBe(22);
    expect(scheduledAt.getHours()).toBe(10);
  });
});
