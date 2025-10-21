/**
 * Component Unit Tests
 * Tests for React components with proper mocking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from '../../theme';
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';

// Mock Tauri APIs
vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

// Mock RDKit
vi.mock('@rdkit/rdkit', () => ({
  getRDKitModule: vi.fn(() => Promise.resolve({
    get_mol: vi.fn(),
    get_smiles: vi.fn(),
    get_molblock: vi.fn(),
  })),
}));

// Mock PubChem API
vi.mock('../../lib/pubchem/api', () => ({
  getCIDBySMILES: vi.fn(),
  getPropertiesByCID: vi.fn(),
  getCASNumber: vi.fn(),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>
    {children}
  </ThemeProvider>
);

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <TestWrapper>
        <ErrorBoundary onError={vi.fn()}>
          <div>Test content</div>
        </ErrorBoundary>
      </TestWrapper>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <TestWrapper>
        <ErrorBoundary onError={vi.fn()}>
          <ThrowError />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it('calls onError when an error occurs', () => {
    const onError = vi.fn();
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <TestWrapper>
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );
  });
});

describe('LoadingScreen', () => {
  it('renders loading screen', () => {
    render(
      <TestWrapper>
        <LoadingScreen onComplete={vi.fn()} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading GlChemDraw/i)).toBeInTheDocument();
  });

  it('calls onComplete after loading', async () => {
    const onComplete = vi.fn();
    
    render(
      <TestWrapper>
        <LoadingScreen onComplete={onComplete} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});

describe('Component Integration', () => {
  it('handles theme switching', () => {
    const { rerender } = render(
      <TestWrapper>
        <div data-testid="test-content">Content</div>
      </TestWrapper>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    
    // Test theme switching would go here
    rerender(
      <TestWrapper>
        <div data-testid="test-content">Content</div>
      </TestWrapper>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
});
