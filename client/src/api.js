let accessToken = null;

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
}

export function clearAccessToken() {
  accessToken = null;
}

async function decode(response) {
  const payload = await response.json();
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

export async function refreshAccessToken() {
  const response = await fetch('/api/v1/auth/refresh', {
    credentials: 'include',
    method: 'POST',
  });
  const data = await decode(response);
  setAccessToken(data.accessToken);
  return data.accessToken;
}

export async function api(path, { retry = true, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`/api/v1${path}`, {
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
