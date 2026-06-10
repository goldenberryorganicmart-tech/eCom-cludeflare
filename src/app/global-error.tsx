'use client';

export const runtime = 'edge';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <html>
      <head>
        <title>Something went wrong</title>
      </head>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          color: '#fafafa',
          fontFamily: 'system-ui, sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '48px', marginBottom: '16px', fontWeight: 'bold' }}>Oops! Something went wrong</h1>
          <p style={{ color: '#a1a1aa', marginBottom: '24px', maxWidth: '500px' }}>
            A critical error occurred. We have logged the issue and are working to resolve it.
          </p>
          <Button 
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '8px'
            }}
          >
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
