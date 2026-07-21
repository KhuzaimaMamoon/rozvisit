import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { assertMediaStorage } from './MediaStorage.js';

const PERMIT_TTL_SECONDS = 10 * 60;
const MAX_FILE_SIZE = 52_428_800;
const ALLOWED_FORMATS = Object.freeze(['jpg', 'jpeg', 'png', 'heic', 'mp4', 'mov']);
const CONSENT_ALLOWED_FORMATS = Object.freeze(['mp3', 'm4a', 'wav', 'mp4', 'mov']);

cloudinary.config({
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  cloud_name: env.cloudinary.cloudName,
  secure: true,
});

function compactIso(value) {
  return value
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function cloudinarySignature(params) {
  const joined = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : value}`)
    .join('&');
  return crypto.createHash('sha1').update(`${joined}${env.cloudinary.apiSecret}`).digest('hex');
}

function publicIdFromConsentReference(recordingRef) {
  if (!recordingRef.startsWith('http')) return { publicId: recordingRef, type: 'authenticated' };
  const parsed = new URL(recordingRef);
  if (parsed.hostname !== `res.cloudinary.com` && !parsed.hostname.endsWith('.cloudinary.com')) {
    throw new TypeError('Consent recording reference is not a Cloudinary asset.');
  }
  const uploadMarker = '/upload/';
  const markerIndex = parsed.pathname.indexOf(uploadMarker);
  if (markerIndex === -1) throw new TypeError('Consent recording reference cannot be played.');
  const assetPath = parsed.pathname
    .slice(markerIndex + uploadMarker.length)
    .replace(/^v\d+\//, '')
    .replace(/\.[^.]+$/, '');
  if (!assetPath) throw new TypeError('Consent recording reference cannot be played.');
  return { publicId: decodeURIComponent(assetPath), type: 'upload' };
}

export const cloudinaryMediaStorage = assertMediaStorage({
  createUploadPermit({ visitId, clientMediaId, capturedAt }) {
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = new Date((timestamp + PERMIT_TTL_SECONDS) * 1000).toISOString();
    const folder = `rozvisit/visits/${visitId}/`;
    const publicId = `${visitId}*${clientMediaId}*${compactIso(capturedAt)}`;
    // Cloudinary signs only parameters submitted with the direct-upload form.
    // resource_type selects the URL path; the policy fields below remain permit metadata.
    const signedParams = {
      folder,
      public_id: publicId,
      timestamp,
    };
    return {
      clientMediaId,
      cloudName: env.cloudinary.cloudName,
      apiKey: env.cloudinary.apiKey,
      timestamp,
      signature: cloudinarySignature(signedParams),
      folder,
      publicId,
      resourceType: 'auto',
      maxFileSize: MAX_FILE_SIZE,
      allowedFormats: ALLOWED_FORMATS,
      expiresAt,
    };
  },
  createConsentUploadPermit({ parentId }) {
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = new Date((timestamp + PERMIT_TTL_SECONDS) * 1000).toISOString();
    const folder = `rozvisit/consent/${parentId}/`;
    const publicId = `${parentId}_${compactIso(new Date(timestamp * 1000))}`;
    const type = 'authenticated';
    const signedParams = { folder, public_id: publicId, timestamp, type };
    return {
      cloudName: env.cloudinary.cloudName,
      apiKey: env.cloudinary.apiKey,
      timestamp,
      signature: cloudinarySignature(signedParams),
      folder,
      publicId,
      type,
      resourceType: 'auto',
      maxFileSize: MAX_FILE_SIZE,
      allowedFormats: CONSENT_ALLOWED_FORMATS,
      expiresAt,
    };
  },
  createConsentPlaybackUrl({ recordingRef }) {
    const { publicId, type } = publicIdFromConsentReference(recordingRef);
    const expiresAt = Math.floor(Date.now() / 1000) + PERMIT_TTL_SECONDS;
    return {
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      url: cloudinary.utils.private_download_url(publicId, undefined, {
        expires_at: expiresAt,
        resource_type: 'video',
        type,
      }),
    };
  },
});
