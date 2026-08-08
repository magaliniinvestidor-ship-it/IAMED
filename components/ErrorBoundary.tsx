'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  moduleName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorFallbackProps {
  moduleName?: string;
  error: Error | null;
  onReset: () => void;
}

function ErrorBoundaryFallback({ moduleName, error, onReset }: ErrorFallbackProps) {
  const { t } = useI18n();
  const title = moduleName
    ? t('eb_error_title', 'app').replace('{module}', moduleName)
    : t('eb_unexpected_error', 'app');

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[300px] bg-rose-50 border border-rose-200 rounded-xl">
      <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
      <h3 className="text-lg font-bold text-rose-800 mb-2">
        {title}
      </h3>
      <p className="text-sm text-rose-600 mb-4 text-center max-w-md">
        {error?.message || t('eb_error_message', 'app')}
      </p>
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-sm transition"
      >
        <RefreshCw className="w-4 h-4" />
        {t('eb_retry', 'app')}
      </button>
    </div>
  );
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
        <ErrorBoundaryFallback
          moduleName={this.props.moduleName}
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;