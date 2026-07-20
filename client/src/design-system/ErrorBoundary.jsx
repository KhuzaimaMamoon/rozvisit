import { Component } from 'react';
import BrandMark from './BrandMark.jsx';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="portal-placeholder bg-background px-4">
        <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 text-center shadow-sm">
          <BrandMark className="justify-center" />
          <h1 className="mt-6 text-2xl font-semibold text-text">
            Something went wrong on our side
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Please try again. If the problem continues, contact support.
          </p>
          <button
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-surface"
            onClick={() => window.location.reload()}
            type="button"
          >
            Retry
          </button>
        </section>
      </main>
    );
  }
}
