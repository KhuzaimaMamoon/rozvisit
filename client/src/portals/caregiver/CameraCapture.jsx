import { useEffect, useRef, useState } from 'react';
import Button from '../../design-system/Button.jsx';

const PREVIEW_TIMEOUT_MS = 5000;

export default function CameraCapture({ captureLimitReached = false, disabled, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const previewTimerRef = useRef(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    window.clearTimeout(previewTimerRef.current);
  }

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (!active || !streamRef.current || !videoRef.current) return undefined;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play().catch(() => setError('Camera preview unavailable — try again.'));
    previewTimerRef.current = window.setTimeout(() => {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        setError('Camera preview unavailable — try again.');
      }
    }, PREVIEW_TIMEOUT_MS);
    return () => window.clearTimeout(previewTimerRef.current);
  }, [active]);

  async function start() {
    stopCamera();
    setError('');
    setPreviewReady(false);
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
      setActive(true);
    } catch {
      setError('Camera access is needed to capture visit proof.');
    }
  }

  function tryAgain() {
    setActive(false);
    void start();
  }

  function closeCamera() {
    stopCamera();
    setActive(false);
    setPreviewReady(false);
    setError('');
  }

  function capture() {
    const video = videoRef.current;
    if (!previewReady || !video?.videoWidth || !video?.videoHeight) {
      setError('Camera preview unavailable — try again.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture({
          blob,
          capturedAt: new Date().toISOString(),
          clientMediaId: crypto.randomUUID(),
          mediaType: 'photo',
        });
      },
      'image/jpeg',
      0.9,
    );
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="border-b border-border bg-primary-soft px-5 py-4 sm:px-6">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Visit proof</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text">Capture a new photo</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
              Use your device camera during this visit. The photo library is intentionally
              unavailable.
            </p>
          </div>
          {!active ? (
            <Button disabled={disabled} onClick={start} variant="secondary">
              Open camera
            </Button>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Button
                className="w-full sm:w-auto"
                disabled={disabled || !previewReady || captureLimitReached}
                onClick={capture}
              >
                Capture photo
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={disabled}
                onClick={closeCamera}
                variant="ghost"
              >
                Close camera
              </Button>
            </div>
          )}
        </div>
      </div>
      {active ? (
        <div className="relative aspect-[4/3] min-h-72 bg-text lg:aspect-auto lg:flex-1">
          <video
            autoPlay
            className="absolute inset-0 block h-full w-full object-cover"
            muted
            onLoadedData={() => {
              window.clearTimeout(previewTimerRef.current);
              setPreviewReady(true);
              setError('');
            }}
            playsInline
            ref={videoRef}
          />
          {!previewReady && !error ? (
            <div className="absolute inset-0 grid place-items-center bg-text/90 px-6 text-center text-sm text-surface">
              Preparing your live camera preview…
            </div>
          ) : null}
          {error ? (
            <div className="absolute inset-0 grid place-items-center bg-text/90 p-6 text-center">
              <div>
                <p className="text-sm font-medium text-surface">
                  Camera preview unavailable — try again.
                </p>
                <Button className="mt-4" onClick={tryAgain} variant="secondary">
                  Try camera again
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid aspect-[4/3] min-h-72 place-items-center bg-background px-6 py-10 text-center lg:flex-1 lg:aspect-auto">
          <p className="max-w-sm text-sm leading-6 text-muted">
            Open the camera to take live visit proof. Your preview will appear here before anything
            is captured.
          </p>
        </div>
      )}
      {error && !active ? (
        <p className="border-t border-emergency bg-emergency-soft px-5 py-3 text-sm text-emergency">
          {error}
        </p>
      ) : null}
      {captureLimitReached ? (
        <p className="border-t border-pending bg-pending-soft px-5 py-3 text-sm text-pending">
          You have captured the maximum five photos for this visit.
        </p>
      ) : null}
    </section>
  );
}
