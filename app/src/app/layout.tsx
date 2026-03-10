import type { Metadata } from 'next';
import './globals.css';
import MobileGuard from './MobileGuard';

export const metadata: Metadata = {
  title: '2026 짝선짝후',
  description: '2026 짝선짝후 빙고',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link href="https://cdn.jsdelivr.net/gh/sun-typeface/SUITE@2/fonts/static/woff2/SUITE.css" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body style={{ backgroundColor: '#20317E', margin: 0, padding: 0, display: 'flex', justifyContent: 'center', minHeight: '100dvh', fontWeight: 700 }}>
        <MobileGuard>
          {children}
        </MobileGuard>
      </body>
    </html>
  );
}
