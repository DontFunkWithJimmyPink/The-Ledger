import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Ledger',
  description: 'Digital Notebook App',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
