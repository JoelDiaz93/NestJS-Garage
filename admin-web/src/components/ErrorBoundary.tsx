import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('GarageFlow UI error', error, info);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return <main className="fatal-screen"><div className="fatal-card"><span className="logo-mark">GF</span><h1>El panel encontró un error</h1><p>{this.state.error.message}</p><button className="primary" onClick={() => window.location.reload()}>Recargar aplicación</button></div></main>;
  }
}
