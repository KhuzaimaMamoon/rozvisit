export function assertMediaStorage(storage) {
  if (
    typeof storage.createUploadPermit !== 'function' ||
    typeof storage.createConsentUploadPermit !== 'function' ||
    typeof storage.createConsentPlaybackUrl !== 'function' ||
    typeof storage.createVisitMediaPlaybackUrl !== 'function'
  ) {
    throw new TypeError(
      'MediaStorage must provide the approved upload, consent, and playback methods.',
    );
  }

  return storage;
}
