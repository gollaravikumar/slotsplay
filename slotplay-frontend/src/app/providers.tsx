/**
 * app/providers.tsx
 *
 * Client-side provider tree — updated to include AuthHydrator.
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { AuthHydrator } from '@/components/auth/AuthHydrator';

const ReactQueryDevtools = dynamic(
  () =>
    import('@tanstack/react-query-devtools').then(
      (module) => module.ReactQueryDevtools,
    ),
  { ssr: false },
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {/* Silently restores session on page load */}
        <AuthHydrator />

        {children}

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#1f2937',
              color: '#f9fafb',
              fontSize: '14px',
            },
          }}
        />
      </ThemeProvider>

      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
