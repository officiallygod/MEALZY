'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white dark:bg-[#16171E] border-2 border-black dark:border-rose-500/50 rounded-3xl p-6 shadow-neo-xl text-gray-900 dark:text-white">
            <button
              onClick={this.handleReset}
              className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:scale-95 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/70 border-2 border-rose-500 flex items-center justify-center text-rose-600 shadow-neo-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-funky font-black text-base uppercase text-gray-900 dark:text-white">
                  {this.props.fallbackTitle || 'Component Recovered'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                  Mealzy protected the rest of your session
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 bg-[#FAF8F5] dark:bg-[#20222E] p-3 rounded-xl border border-black/10 dark:border-gray-800 mb-4 font-mono break-words">
              {this.state.errorMessage}
            </p>

            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-xs uppercase tracking-wider rounded-xl border-2 border-black shadow-neo flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Dismiss and Return</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
