import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {error: null};

  static getDerivedStateFromError(error: Error): State {
    return {error};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[vera-admin] render error', error, info.componentStack);
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div className="auth-screen">
          <div className="auth-card" style={{textAlign: 'center'}}>
            <img className="auth-logo" src="/vera-icon.png" alt="" />
            <h1 className="auth-title">Coś poszło nie tak</h1>
            <p className="auth-sub" style={{marginBottom: 16}}>
              Odśwież stronę, aby spróbować ponownie.
            </p>
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
              Odśwież
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
