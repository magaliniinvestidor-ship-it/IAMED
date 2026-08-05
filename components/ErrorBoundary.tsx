'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  moduleName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (typeof window !== 'undefined') {
      console.error(`[ErrorBoundary${this.props.moduleName ? `: ${this.props.moduleName}` : ''}]`, error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[300px] bg-rose-50 border border-rose-200 rounded-xl">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
          <h3 className="text-lg font-bold text-rose-800 mb-2">
            {this.props.moduleName ? `Erro em ${this.props.moduleName}` : 'Erro inesperado'}
          </h3>
          <p className="text-sm text-rose-600 mb-4 text-center max-w-md">
            {this.state.error?.message || 'Ocorreu um erro ao renderizar este módulo. Os demais módulos continuam funcionando.'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
