'use client';

import { Component, type ReactNode } from 'react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 *
 * A React error boundary component that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI instead of crashing
 * the component tree.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallbackMessage="Something went wrong with the editor">
 *   <PageEditor {...props} />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    // Reset the error boundary state
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center p-8 text-center"
          data-testid="error-boundary-fallback"
        >
          <div className="max-w-md">
            <h2 className="text-lg font-semibold text-leather-900 mb-2">
              {this.props.fallbackMessage || 'Something went wrong'}
            </h2>
            <p className="text-sm text-leather-600 mb-4">
              Your content is safe. Try refreshing to continue.
            </p>
            <Button
              onClick={this.handleRetry}
              variant="primary"
              data-testid="error-boundary-retry"
            >
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
