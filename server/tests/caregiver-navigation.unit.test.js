import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { navigateFromLink } from '../../client/src/navigation.js';

describe('caregiver internal navigation', () => {
  const originalWindow = global.window;
  const originalPopStateEvent = global.PopStateEvent;

  afterEach(() => {
    global.window = originalWindow;
    global.PopStateEvent = originalPopStateEvent;
  });

  it('keeps the active session in the SPA when a caregiver opens a visit detail link', () => {
    const preventDefault = jest.fn();
    const pushState = jest.fn();
    const dispatchEvent = jest.fn();
    global.window = { dispatchEvent, history: { pushState } };
    global.PopStateEvent = class PopStateEvent {
      constructor(type) {
        this.type = type;
      }
    };

    navigateFromLink({ preventDefault }, '/care/visits/visit-123');

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(pushState).toHaveBeenCalledWith({}, '', '/care/visits/visit-123');
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'popstate' }));
  });
});
