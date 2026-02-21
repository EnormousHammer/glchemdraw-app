/**
 * Unit Tests for ErrorBoundary Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@components/ErrorBoundary';

// Component that throws error
const ThrowError = () => {
  throw new Error('Test error');
};

// Component that works
const WorkingComponent = () => <div>Working Component</div>;

describe('ErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Working Component')).toBeInTheDocument();
  });

  it('should catch errors and display error UI', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    // Use getAllByText - error message may appear in Alert and stack trace
    expect(screen.getAllByText(/something went wrong/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/test error/i).length).toBeGreaterThanOrEqual(1);
    
    consoleError.mockRestore();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalled();
    
    consoleError.mockRestore();
  });

  it('should show reload button', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    const reloadButtons = screen.getAllByRole('button', { name: /reload application/i });
    expect(reloadButtons.length).toBeGreaterThanOrEqual(1);
    expect(reloadButtons[0]).toBeInTheDocument();
    
    consoleError.mockRestore();
  });
});

