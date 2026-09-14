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
    console.error('Mobile App ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center min-h-[350px] bg-white rounded-3xl border border-rose-100 shadow-xl m-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-rose-100">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">
            {this.props.fallbackTitle || 'Display Refresh Required'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
            A temporary display issue occurred while loading this view. Tap below to refresh your institutional dashboard.
          </p>
          {this.state.error && (
            <p className="text-[10px] font-mono text-rose-500 mt-2 max-w-xs truncate bg-rose-50 p-2 rounded-lg">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="mt-5 px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Dashboard</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
