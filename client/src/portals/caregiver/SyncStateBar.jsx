import StatusBadge from '../../design-system/StatusBadge.jsx';

export default function SyncStateBar({ state }) {
  const pending = state === 'pending';
  return (
    <div
      className={`flex items-center justify-between gap-3 border px-4 py-3 text-sm ${
        pending
          ? 'border-pending bg-pending-soft text-pending'
          : 'border-success bg-success-soft text-success'
      }`}
    >
      <span>{pending ? 'Saved offline, waiting to send.' : 'Saved and synced.'}</span>
      <StatusBadge variant={pending ? 'pending' : 'success'}>
        {pending ? 'Waiting' : 'Sent'}
      </StatusBadge>
    </div>
  );
}
