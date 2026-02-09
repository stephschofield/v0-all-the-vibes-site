 'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development, could send to error tracking service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, #e8d5e7 0%, #c9e4eb 50%, #d4c5e8 100%)',
      }}
    >
      <div
        className="max-w-lg w-full rounded-2xl overflow-hidden"
        style={{
          background: 'var(--ide-bg, rgba(25, 25, 30, 0.95))',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.12))',
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.4),
            0 12px 24px -8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `,
          backdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        {/* Title bar mimicking VS Code */}
        <div
          className="flex items-center px-4 py-3 gap-2"
          style={{
            background: 'var(--ide-titlebar, rgba(35, 35, 42, 0.98))',
            borderBottom: '1px solid var(--ide-border, rgba(60, 60, 70, 0.6))',
          }}
        >
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <span
            className="ml-3 text-sm font-mono"
            style={{ color: 'var(--text-secondary, #A1A1AA)' }}
          >
            error.tsx — All The Vibes
          </span>
        </div>

        {/* Error content */}
        <div className="p-8 space-y-6">
          {/* Error icon */}
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(248, 113, 113, 0.15)',
                border: '2px solid var(--accent-red, #F87171)',
              }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="var(--accent-red, #F87171)"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Error message */}
          <div className="text-center space-y-2">
            <h1
              className="text-xl font-semibold"
              style={{ color: 'var(--text-bright, #FAFAFA)' }}
            >
              Something went wrong
            </h1>
            <p
              className="text-sm"
              style={{ color: 'var(--text-secondary, #A1A1AA)' }}
            >
              The application encountered an unexpected error. Don&apos;t worry, your work is safe.
            </p>
          </div>

          {/* Error details (collapsible) */}
          <details
            className="rounded-lg overflow-hidden"
            style={{
              background: 'var(--ide-sidebar, rgba(20, 20, 25, 0.98))',
              border: '1px solid var(--ide-border, rgba(60, 60, 70, 0.6))',
            }}
          >
            <summary
              className="px-4 py-3 cursor-pointer text-sm font-mono flex items-center gap-2"
              style={{ color: 'var(--text-secondary, #A1A1AA)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Error Details
            </summary>
            <div
              className="px-4 py-3 text-xs font-mono border-t overflow-auto max-h-32"
              style={{
                color: 'var(--accent-red, #F87171)',
                borderColor: 'var(--ide-border, rgba(60, 60, 70, 0.6))',
              }}
            >
              <p>{error.message || 'An unknown error occurred'}</p>
              {error.digest && (
                <p className="mt-2" style={{ color: 'var(--text-muted, #71717A)' }}>
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          </details>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                background: 'var(--accent-blue, #4A9EFF)',
                color: '#FFFFFF',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                background: 'var(--ide-tab-active, rgba(40, 40, 48, 1))',
                color: 'var(--text-primary, #E4E4E7)',
                border: '1px solid var(--ide-border, rgba(60, 60, 70, 0.6))',
              }}
            >
              Go Home
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div
          className="px-4 py-2 flex items-center justify-between text-xs font-mono"
          style={{
            background: 'var(--status-bg, rgba(30, 90, 180, 0.9))',
            color: 'var(--status-text, #FFFFFF)',
          }}
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F87171] animate-pulse" />
            Error State
          </span>
          <span>All The Vibes 2025</span>
        </div>
      </div>
    </div>
  );
}
