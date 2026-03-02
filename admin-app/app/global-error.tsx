'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for observability; replace with Sentry/reporting service when available
    console.error('[GlobalError]', error.message, error.digest ?? '');
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Something went wrong / เกิดข้อผิดพลาด
          </h1>
          <p style={{ color: '#666', maxWidth: '420px', marginBottom: '1.5rem' }}>
            An unexpected error occurred. Please try again or contact support if
            the problem persists.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: '#1a1a2e',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Try again / ลองอีกครั้ง
          </button>
        </main>
      </body>
    </html>
  );
}
