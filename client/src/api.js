let accessToken = null;
let accessTokenGeneration = 0;
const refreshesInFlight = new Map();
// Production always uses the first-party Vercel rewrite. This keeps the
// HttpOnly refresh cookie first-party on iOS WebKit while protected calls
// continue to carry the memory-only access token as a Bearer header.
const apiBaseUrl = (
  import.meta.env.PROD ? '/api/v1' : (import.meta.env.VITE_API_BASE_URL ?? '/api/v1')
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor({ code, fields, message, status }) {
    super(message);
    this.code = code;
    this.fields = fields;
    this.status = status;
  }
}

export function setAccessToken(token) {
  accessToken = token;
  accessTokenGeneration += 1;
}

export function clearAccessToken() {
  accessToken = null;
  accessTokenGeneration += 1;
}

function portalRoleForCurrentPath() {
  const root = window.location.pathname.split('/')[1];
  if (root === 'app') return 'client';
  if (root === 'care') return 'caregiver';
  if (root === 'admin') return 'admin';
  return null;
}

async function decode(response) {
  const text = await response.text();
  let payload;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError({
      code: 'INVALID_RESPONSE',
      message: 'The service returned an invalid response. Please try again.',
      status: response.status,
    });
  }

  if (!payload) {
    throw new ApiError({
      code: 'EMPTY_RESPONSE',
      message: 'The service returned an empty response. Please try again.',
      status: response.status,
    });
  }

  if (!response.ok) {
    throw new ApiError({
      code: payload.error?.code,
      fields: payload.error?.fields,
      message: payload.error?.message ?? 'Something went wrong. Please try again.',
      status: response.status,
    });
  }
  return payload.data;
}

export async function refreshAccessToken(expectedRole = portalRoleForCurrentPath()) {
  const refreshKey = expectedRole ?? 'unscoped';
  if (!refreshesInFlight.has(refreshKey)) {
    const generationAtStart = accessTokenGeneration;
    const refreshRequest = fetch(`${apiBaseUrl}/auth/refresh`, {
      credentials: 'include',
      headers: expectedRole ? { 'X-RozVisit-Portal': expectedRole } : undefined,
      method: 'POST',
    })
      .then(decode)
      .then((data) => {
        // A login/logout may finish while a slower refresh request is still in
        // flight (especially during a Render cold start on mobile). Never let
        // that stale response overwrite the newer authentication decision.
        if (accessTokenGeneration === generationAtStart) setAccessToken(data.accessToken);
        return data;
      })
      .finally(() => {
        refreshesInFlight.delete(refreshKey);
      });
    refreshesInFlight.set(refreshKey, refreshRequest);
  }
  return refreshesInFlight.get(refreshKey);
}

export async function api(path, { retry = true, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });
  if (response.status === 401 && retry && path !== '/auth/refresh') {
    try {
      await refreshAccessToken();
      return api(path, { ...options, retry: false });
    } catch {
      clearAccessToken();
    }
  }
  return decode(response);
}
