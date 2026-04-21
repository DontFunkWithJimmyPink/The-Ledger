import type { Metadata, Viewport } from 'next';
import '@fontsource/lora/400.css';
import '@fontsource/lora/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'The Ledger',
    template: '%s | The Ledger',
  },
  description: 'Digital Notebook App — Journal, tasks, and notes in one place',
  keywords: ['notebook', 'journal', 'tasks', 'notes', 'digital ledger'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
