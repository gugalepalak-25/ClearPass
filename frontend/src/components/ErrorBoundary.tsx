import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ClearPass ErrorBoundary caught an exception]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 24px',
            background: 'rgba(12, 31, 23, 0.8)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '14px',
            margin: '24px auto',
            maxWidth: '680px',
            textAlign: 'center',
            color: '#f0fdf4',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: '#ef4444',
            }}
          >
            <AlertTriangle size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
            {this.props.fallbackTitle || 'Component Encountered an Unexpected Error'}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px', maxWidth: '480px' }}>
            {this.state.error?.message || 'An error occurred while rendering this interface module.'}
          </p>
          <button
            onClick={this.handleReset}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} /> Reload Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

