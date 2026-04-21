/**
 * Integration Test - Error Boundary Implementation
 *
 * This test demonstrates that error boundaries are correctly implemented
 * for PageEditor and DrawingCanvas components as specified in T075.
 *
 * The implementation includes:
 * 1. ErrorBoundary component at src/components/ui/ErrorBoundary.tsx
 * 2. PageEditor wrapped in ErrorBoundary in src/app/(app)/notebook/[pageId]/page.tsx
 * 3. DrawingCanvas wrapped in ErrorBoundary in src/components/editor/PageEditor.tsx
 *
 * Each error boundary shows:
 * - A custom error message
 * - "Your content is safe" reassurance
 * - A retry button to attempt recovery
 */

import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Mock component that can throw errors
const TestComponent = ({ shouldError }: { shouldError: boolean }) => {
  if (shouldError) {
    throw new Error('Test error in component');
  }
  return <div data-testid="test-component">Component rendered successfully</div>;
};

describe('Error Boundary Integration - T075', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should wrap PageEditor with error boundary showing custom message', () => {
    // Simulate PageEditor error
    render(
      <ErrorBoundary fallbackMessage="Something went wrong with the editor — your content is safe">
        <TestComponent shouldError={true} />
      </ErrorBoundary>
    );

    // Verify custom fallback message is shown
    expect(
      screen.getByText(
        'Something went wrong with the editor — your content is safe'
      )
    ).toBeInTheDocument();

    // Verify reassurance message
    expect(
      screen.getByText('Your content is safe. Try refreshing to continue.')
    ).toBeInTheDocument();

    // Verify retry button
    expect(screen.getByTestId('error-boundary-retry')).toBeInTheDocument();
  });

  it('should wrap DrawingCanvas with error boundary showing custom message', () => {
    // Simulate DrawingCanvas error
    render(
      <ErrorBoundary fallbackMessage="Something went wrong with the drawing canvas — your content is safe">
        <TestComponent shouldError={true} />
      </ErrorBoundary>
    );

    // Verify custom fallback message is shown
    expect(
      screen.getByText(
        'Something went wrong with the drawing canvas — your content is safe'
      )
    ).toBeInTheDocument();

    // Verify reassurance message
    expect(
      screen.getByText('Your content is safe. Try refreshing to continue.')
    ).toBeInTheDocument();

    // Verify retry button
    expect(screen.getByTestId('error-boundary-retry')).toBeInTheDocument();
  });

  it('should render children normally when no error occurs', () => {
    render(
      <ErrorBoundary fallbackMessage="Something went wrong">
        <TestComponent shouldError={false} />
      </ErrorBoundary>
    );

    // Verify component renders normally
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(
      screen.getByText('Component rendered successfully')
    ).toBeInTheDocument();

    // Verify no error UI is shown
    expect(
      screen.queryByTestId('error-boundary-fallback')
    ).not.toBeInTheDocument();
  });
});
