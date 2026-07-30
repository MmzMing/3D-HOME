import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('3D Home render failure', error, info.componentStack);
  }

  public render() {
    if (this.state.error !== null) {
      return (
        <main className="fatal-error">
          <p className="eyebrow">ROOM OFFLINE</p>
          <h1>房间暂时无法显示</h1>
          <p>{this.state.error.message}</p>
          <button type="button" className="primary-action" onClick={() => window.location.reload()}>
            重新载入
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
