import { Component, Suspense, type ReactNode } from 'react';

export class DeferredPanel extends Component<{ name: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    const { name, children } = this.props;
    if (this.state.failed) {
      return <div className="panel">
        <p role="alert">Could not open {name}.</p>
        <button onClick={() => window.location.reload()}>Reload page</button>
      </div>;
    }
    return <Suspense fallback={<p role="status">Loading {name}…</p>}>{children}</Suspense>;
  }
}
