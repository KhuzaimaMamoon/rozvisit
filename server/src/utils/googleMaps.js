const GOOGLE_MAPS_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
]);
const COORDINATE_PATTERNS = [
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  /!3d(-?\d+(?:\.\d+)?).*?!4d(-?\d+(?:\.\d+)?)/,
];

function isAllowedHost(hostname) {
  const host = hostname.toLowerCase();
  return GOOGLE_MAPS_HOSTS.has(host) || host.endsWith('.google.com');
}

function validCoordinates(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function parseGoogleMapsCoordinates(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !isAllowedHost(url.hostname)) return null;

  for (const key of ['destination', 'query', 'q', 'll']) {
    const match = url.searchParams
      .get(key)
      ?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (validCoordinates(lat, lng)) return { lat, lng };
    }
  }
  for (const pattern of COORDINATE_PATTERNS) {
    const match = decodeURIComponent(url.href).match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (validCoordinates(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

export async function resolveGoogleMapsShareUrl(value, { fetchImpl = globalThis.fetch } = {}) {
  let current;
  try {
    current = new URL(value);
  } catch {
    throw new Error('Paste a complete Google Maps share link beginning with https://.');
  }
  if (current.protocol !== 'https:' || !isAllowedHost(current.hostname)) {
    throw new Error('Use a Google Maps share link from maps.google.com or maps.app.goo.gl.');
  }

  for (let redirect = 0; redirect <= 3; redirect += 1) {
    const coordinates = parseGoogleMapsCoordinates(current.href);
    if (coordinates) return { coordinates, resolvedUrl: current.href };
    if (redirect === 3) break;

    let response;
    try {
      response = await fetchImpl(current, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      throw new Error('We could not open that Google Maps link. Try copying the full Maps URL.');
    }
    const location = response.headers.get('location');
    if (!location) break;
    const next = new URL(location, current);
    if (next.protocol !== 'https:' || !isAllowedHost(next.hostname)) {
      throw new Error('The map link redirected outside Google Maps. Copy a new Google Maps link.');
    }
    current = next;
  }
  throw new Error(
    'We could not find a pin in that link. In Google Maps, open the exact pin, tap Share, and copy the link.',
  );
}

export function googleMapsDirectionsUrl(location) {
  const [lng, lat] = location.coordinates;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
