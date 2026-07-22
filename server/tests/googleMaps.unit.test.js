import { describe, expect, it, jest } from '@jest/globals';
import {
  googleMapsDirectionsUrl,
  parseGoogleMapsCoordinates,
  resolveGoogleMapsShareUrl,
} from '../src/utils/googleMaps.js';

describe('Google Maps location links', () => {
  it.each([
    ['https://www.google.com/maps?q=33.6844,73.0479', { lat: 33.6844, lng: 73.0479 }],
    ['https://www.google.com/maps/place/Home/@33.6844,73.0479,17z', { lat: 33.6844, lng: 73.0479 }],
    ['https://maps.google.com/x/data=!3d33.6844!4d73.0479', { lat: 33.6844, lng: 73.0479 }],
  ])('extracts coordinates from %s', (url, expected) => {
    expect(parseGoogleMapsCoordinates(url)).toEqual(expected);
  });

  it('follows an allowlisted short-link redirect without leaving Google', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      headers: new Headers({
        location: 'https://www.google.com/maps?q=33.6844,73.0479',
      }),
    });
    await expect(
      resolveGoogleMapsShareUrl('https://maps.app.goo.gl/example', { fetchImpl }),
    ).resolves.toEqual({
      coordinates: { lat: 33.6844, lng: 73.0479 },
      resolvedUrl: 'https://www.google.com/maps?q=33.6844,73.0479',
    });
  });

  it('refuses redirects outside Google Maps', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      headers: new Headers({ location: 'https://attacker.example/location' }),
    });
    await expect(
      resolveGoogleMapsShareUrl('https://maps.app.goo.gl/example', { fetchImpl }),
    ).rejects.toThrow('redirected outside Google Maps');
  });

  it('creates a navigation-mode directions link', () => {
    expect(googleMapsDirectionsUrl({ coordinates: [73.0479, 33.6844] })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=33.6844,73.0479',
    );
  });
});
