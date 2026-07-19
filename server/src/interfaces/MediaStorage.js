export function assertMediaStorage(storage) {
  if (typeof storage.createUploadPermit !== 'function') {
    throw new TypeError('MediaStorage must provide createUploadPermit(input).');
  }

  return storage;
}
