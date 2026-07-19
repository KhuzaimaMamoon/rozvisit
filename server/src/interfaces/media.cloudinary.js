import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { assertMediaStorage } from './MediaStorage.js';

const PERMIT_TTL_SECONDS = 10 * 60;
const MAX_FILE_SIZE = 52_428_800;
const ALLOWED_FORMATS = Object.freeze(['jpg', 'jpeg', 'png', 'heic', 'mp4', 'mov']);

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

export const cloudinaryMediaStorage = assertMediaStorage({
  createUploadPermit({ visitId, clientMediaId, capturedAt }) {
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = new Date((timestamp + PERMIT_TTL_SECONDS) * 1000).toISOString();
    const folder = `rozvisit/visits/${visitId}/`;
    const publicId = `${visitId}*${clientMediaId}*${compactIso(capturedAt)}`;
    const params = {
      allowed_formats: ALLOWED_FORMATS,
      folder,
      max_file_size: MAX_FILE_SIZE,
      public_id: publicId,
      resource_type: 'auto',
      timestamp,
    };
    return {
      clientMediaId,
      cloudName: env.cloudinary.cloudName,
      apiKey: env.cloudinary.apiKey,
      timestamp,
      signature: cloudinarySignature(params),
      folder,
      publicId,
      resourceType: 'auto',
      maxFileSize: MAX_FILE_SIZE,
      allowedFormats: ALLOWED_FORMATS,
      expiresAt,
    };
  },
});
