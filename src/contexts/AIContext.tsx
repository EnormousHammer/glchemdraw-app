/**
 * AI Context - Extra info for AI prompts
 * User can add experimental NMR, reaction conditions, synthesis goals, etc.
 * Stored in React state and passed to all AI prompts when present.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AIContextValue {
  context: string;
  setContext: (value: string) => void;
  appendContext: (value: string) => void;
  clearContext: () => void;
  hasContext: boolean;
}

const AIContext = createContext<AIContextValue | null>(null);

export function AIContextProvider({ children }: { children: React.ReactNode }) {
  const [context, setContextState] = useState('');

  const setContext = useCallback((value: string) => {
    setContextState(String(value ?? '').trim());
  }, []);

  const appendContext = useCallback((value: string) => {
    const v = String(value ?? '').trim();
    if (!v) return;
    setContextState((prev) => (prev ? `${prev}\n\n${v}` : v));
  }, []);

  const clearContext = useCallback(() => {
    setContextState('');
  }, []);

  const value: AIContextValue = {
    context,
    setContext,
    appendContext,
    clearContext,
    hasContext: context.length > 0,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAIContext(): AIContextValue {
  const ctx = useContext(AIContext);
  if (!ctx) {
    return {
      context: '',
      setContext: () => {},
      appendContext: () => {},
      clearContext: () => {},
      hasContext: false,
    };
  }
  return ctx;
}

/**
 * Append user context to a user message if present.
 * Use when building prompts for chatWithOpenAI.
 */
export function appendUserContext(userMessage: string, context: string | undefined): string {
  const trimmed = (context ?? '').trim();
  if (!trimmed) return userMessage;
  return `${userMessage}\n\nUser context (use this to tailor your response):\n${trimmed}`;
}
