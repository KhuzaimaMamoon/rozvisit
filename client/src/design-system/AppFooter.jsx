import { navigateFromLink } from '../navigation.js';

export default function AppFooter() {
  return (
    <footer className="shrink-0 border-t border-border bg-surface px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <p>RozVisit · Clear, accountable care coordination.</p>
        <div className="flex gap-4">
          <a
            className="font-medium text-primary underline"
            href="/privacy"
            onClick={(event) => navigateFromLink(event, '/privacy')}
          >
            Privacy
          </a>
          <a
            className="font-medium text-primary underline"
            href="/terms"
            onClick={(event) => navigateFromLink(event, '/terms')}
          >
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
