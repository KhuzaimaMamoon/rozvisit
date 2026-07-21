import { useEffect, useRef, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';

function preferredMimeType(mediaType) {
  const options =
    mediaType === 'video'
      ? ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
      : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return options.find((option) => MediaRecorder.isTypeSupported(option)) ?? '';
}

function extensionForMimeType(mimeType, mediaType) {
  if (mimeType.includes('webm')) return 'webm';
  return mediaType === 'video' ? 'mp4' : 'm4a';
}

async function uploadRecording(permit, blob, mediaType, mimeType) {
  const body = new FormData();
  body.append('file', blob, `consent-recording.${extensionForMimeType(mimeType, mediaType)}`);
  body.append('api_key', permit.apiKey);
  body.append('timestamp', String(permit.timestamp));
  body.append('signature', permit.signature);
  body.append('folder', permit.folder);
  body.append('public_id', permit.publicId);
  body.append('type', permit.type);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${permit.cloudName}/${permit.resourceType}/upload`,
    { method: 'POST', body },
  );
  if (!response.ok) throw new Error('The consent recording could not be uploaded yet.');
  return response.json();
}

export default function ConsentPanel({ parentId, visitId, onResolved }) {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const [state, setState] = useState({
    blob: null,
    error: '',
    mimeType: '',
    previewUrl: null,
    recording: false,
    saving: false,
  });
  const [mediaType, setMediaType] = useState('audio');
  const [choices, setChoices] = useState({ other: '', photoBoundaries: '', preferredTimes: '' });

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    },
    [state.previewUrl],
  );

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mediaType === 'video',
      });
      const chunks = [];
      const mimeType = preferredMimeType(mediaType);
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType });
        setState((current) => ({
          ...current,
          blob,
          error: '',
          mimeType: blob.type,
          previewUrl: URL.createObjectURL(blob),
          recording: false,
        }));
      };
      recorder.start();
      setState((current) => ({ ...current, error: '', recording: true }));
    } catch {
      setState((current) => ({ ...current, error: 'Camera or microphone access is needed.' }));
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  async function recordConsent(stateValue) {
    setState((current) => ({ ...current, error: '', saving: true }));
    try {
      if (stateValue === 'declined') {
        await api(`/parents/${parentId}/consent`, {
          body: JSON.stringify({ byVisitId: visitId, state: 'declined' }),
          method: 'POST',
        });
      } else {
        if (!state.blob) throw new Error('Record the parent’s agreement before continuing.');
        const permit = await api(`/parents/${parentId}/consent-permit`, {
          body: JSON.stringify({ byVisitId: visitId, mediaType }),
          method: 'POST',
        });
        const uploaded = await uploadRecording(permit, state.blob, mediaType, state.mimeType);
        await api(`/parents/${parentId}/consent`, {
          body: JSON.stringify({
            byVisitId: visitId,
            choices: {
              other: choices.other || undefined,
              photoBoundaries: choices.photoBoundaries || undefined,
              preferredTimes: choices.preferredTimes
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean),
            },
            recordingRef: uploaded.public_id,
            state: 'given',
          }),
          method: 'POST',
        });
      }
      onResolved(stateValue);
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, saving: false }));
      return;
    }
    setState((current) => ({ ...current, saving: false }));
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
      <p className="text-sm font-medium uppercase tracking-wide text-primary">
        First visit consent
      </p>
      <h2 className="mt-1 text-lg font-semibold text-text">Record the parent’s own words</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Explain the visit and the photo boundaries. Audio is enough when the parent prefers not to
        be on camera.
      </p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Consent recording type">
        {['audio', 'video'].map((type) => (
          <button
            className={`min-h-11 rounded-full border px-4 text-sm font-medium ${
              mediaType === type
                ? 'border-primary bg-primary text-surface'
                : 'border-border bg-surface text-text'
            }`}
            key={type}
            onClick={() => {
              if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
              setMediaType(type);
              setState((current) => ({ ...current, blob: null, mimeType: '', previewUrl: null }));
            }}
            type="button"
          >
            {type === 'audio' ? 'Audio only' : 'Video'}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FormInput
          id="preferred-times"
          label="Preferred times"
          onChange={(event) => setChoices({ ...choices, preferredTimes: event.target.value })}
          optional
          value={choices.preferredTimes}
        />
        <FormInput
          id="photo-boundaries"
          label="Photo boundaries"
          onChange={(event) => setChoices({ ...choices, photoBoundaries: event.target.value })}
          optional
          value={choices.photoBoundaries}
        />
      </div>
      <FormInput
        className="mt-3"
        id="consent-other"
        label="Other choice"
        onChange={(event) => setChoices({ ...choices, other: event.target.value })}
        optional
        value={choices.other}
      />
      <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
        {state.recording ? (
          <Button className="w-full sm:w-auto" onClick={stopRecording} variant="secondary">
            Stop recording
          </Button>
        ) : (
          <Button className="w-full sm:w-auto" onClick={startRecording} variant="secondary">
            {state.blob ? 'Record again' : 'Record agreement'}
          </Button>
        )}
        <Button
          className="w-full sm:w-auto"
          disabled={!state.blob || state.saving}
          onClick={() => recordConsent('given')}
        >
          Save agreement
        </Button>
        <Button
          className="w-full sm:w-auto"
          disabled={state.saving}
          onClick={() => recordConsent('declined')}
          variant="ghost"
        >
          Record decline
        </Button>
      </div>
      {state.previewUrl ? (
        <div className="mt-4 rounded-md border border-border bg-primary-soft p-3">
          <p className="text-sm font-medium text-text">Review the recording before saving</p>
          {mediaType === 'video' ? (
            <video className="mt-3 w-full rounded-sm bg-text" controls src={state.previewUrl} />
          ) : (
            <audio className="mt-3 w-full" controls src={state.previewUrl} />
          )}
        </div>
      ) : null}
      {state.error ? <p className="mt-3 text-sm text-emergency">{state.error}</p> : null}
    </section>
  );
}
