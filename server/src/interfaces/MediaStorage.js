export function assertMediaStorage(storage) {
  if (
    typeof storage.createUploadPermit !== 'function' ||
    typeof storage.createConsentUploadPermit !== 'function' ||
    typeof storage.createConsentPlaybackUrl !== 'function'
  ) {
    throw new TypeError('MediaStorage must provide the approved upload and consent methods.');
  }

  return storage;
}
