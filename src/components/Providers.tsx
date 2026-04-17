'use client';

import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-cream-100)',
            color: 'var(--color-ink-900)',
            border: '1px solid var(--color-leather-500)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-leather-700)',
              secondary: 'var(--color-cream-50)',
            },
          },
          error: {
            iconTheme: {
              primary: '#DC2626',
              secondary: 'var(--color-cream-50)',
            },
          },
        }}
      />
    </>
  );
}
