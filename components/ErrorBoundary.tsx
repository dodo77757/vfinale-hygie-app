import React, { Component, ErrorInfo, ReactNode } from 'react';
import { notificationService } from '../services/notificationService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    notificationService.error(`Une erreur est survenue: ${error.message}`);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#0d0d0d] p-6">
          <div className="hud-card p-8 rounded-3xl max-w-md w-full text-center space-y-6 border-red-700">
            <h2 className="font-bebas text-3xl text-red-400">ERREUR SYSTÈME</h2>
            <p className="text-gray-300 font-mono text-sm">
              {this.state.error?.message || 'Une erreur inattendue est survenue'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 bg-[var(--primary-gold)] text-black font-bebas text-xl rounded-xl"
            >
              REcharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

