'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TopicsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error for debugging/monitoring
    console.error('Topics page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-3xl font-bold">Weekly Call Topics</h1>
          <p className="mt-2 text-gray-400">
            What would you like us to cover? Submit your ideas below.
          </p>
        </header>

        {/* Error card matching IDE style */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--ide-bg, rgba(25, 25, 30, 0.95))',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.12))',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Tab-like header */}
          <div
            className="flex items-center px-4 py-2 gap-3"
            style={{
              background: 'var(--ide-titlebar, rgba(35, 35, 42, 0.98))',
              borderBottom: '1px solid var(--ide-border, rgba(60, 60, 70, 0.6))',
            }}
          >
            <div
              className="px-3 py-1.5 rounded text-xs font-mono flex items-center gap-2"
              style={{
                background: 'var(--ide-tab-active, rgba(40, 40, 48, 1))',
                color: 'var(--accent-red, #F87171)',
              }}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              topics/error.tsx
            </div>
          </div>

          {/* Error content */}
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Error icon */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="var(--accent-red, #F87171)"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>

              {/* Message */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2
                    className="text-lg font-semibold mb-1"
                    style={{ color: 'var(--text-bright, #FAFAFA)' }}
                  >
                    Failed to load topics
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--text-secondary, #A1A1AA)' }}
                  >
                    We couldn&apos;t load the topics data. This might be a temporary issue with our database connection.
                  </p>
                </div>

                {/* Error details code block */}
                <div
                  className="rounded-lg p-4 font-mono text-xs overflow-auto"
                  style={{
                    background: 'var(--ide-sidebar, rgba(20, 20, 25, 0.98))',
                    border: '1px solid var(--ide-border, rgba(60, 60, 70, 0.6))',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: 'var(--syntax-keyword, #C792EA)' }}>const</span>
                    <span style={{ color: 'var(--syntax-variable, #FFCB6B)' }}>error</span>
                    <span style={{ color: 'var(--syntax-punctuation, #89DDFF)' }}>=</span>
                    <span style={{ color: 'var(--syntax-punctuation, #89DDFF)' }}>{'{'}</span>
                  </div>
                  <div className="pl-4">
                    <span style={{ color: 'var(--syntax-property, #82AAFF)' }}>message</span>
                    <span style={{ color: 'var(--syntax-punctuation, #89DDFF)' }}>: </span>
                    <span style={{ color: 'var(--syntax-string, #A5D6A7)' }}>
                      &quot;{error.message || 'Unknown error'}&quot;
                    </span>
                    <span style={{ color: 'var(--syntax-punctuation, #89DDFF)' }}>,</span>
                  </div>
                  {error.digest && (
                    <div className="pl-4">
                      <span style={{ color: 'var(--syntax-property, #82AAFF)' }}>digest</span>
                      <span style={{ color: 'var(--syntax-punctuation, #89DDFF)' }}>: </span>
                      <span style={{ color: 'var(--syntax-string, #A5D6A7)' }}>
                        &quot;{error.digest}&quot;
                      </span>
                    </div>
                  )}
                  <div>
                    <span style={{ color: 'var(--syntax-punctuation, #89DDFF)' }}>{'}'}</span>
                    <span style={{ color: 'var(--syntax-punctuation, #89DDFF)' }}>;</span>
                  </div>
                </div>

                {/* Suggestions */}
                <div
                  className="text-sm space-y-1"
                  style={{ color: 'var(--text-muted, #71717A)' }}
                >
                  <p className="font-medium" style={{ color: 'var(--text-secondary, #A1A1AA)' }}>
                    Things to try:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>Check your internet connection</li>
                    <li>Refresh the page</li>
                    <li>Try again in a few moments</li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={reset}
                    className="px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:brightness-110 active:scale-[0.98] flex items-center gap-2"
                    style={{
                      background: 'var(--accent-blue, #4A9EFF)',
                      color: '#FFFFFF',
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Retry Loading
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:brightness-110 active:scale-[0.98]"
                    style={{
                      background: 'var(--ide-tab-active, rgba(40, 40, 48, 1))',
                      color: 'var(--text-primary, #E4E4E7)',
                      border: '1px solid var(--ide-border, rgba(60, 60, 70, 0.6))',
                    }}
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal-like footer */}
          <div
            className="px-4 py-2 flex items-center gap-2 text-xs font-mono"
            style={{
              background: 'var(--ide-sidebar, rgba(20, 20, 25, 0.98))',
              borderTop: '1px solid var(--ide-border, rgba(60, 60, 70, 0.6))',
              color: 'var(--text-muted, #71717A)',
            }}
          >
            <span style={{ color: 'var(--accent-red, #F87171)' }}>✕</span>
            <span>Error boundary caught: topics route</span>
            <span className="ml-auto" style={{ color: 'var(--text-muted, #71717A)' }}>
              Press retry to reload
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
