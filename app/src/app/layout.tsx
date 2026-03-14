import type { Metadata, Viewport } from 'next';
import './globals.css';
import MobileGuard from './MobileGuard';

const siteUrl = 'https://event.ceereal.kr';
const siteTitle = '2026 짝선짝후';
const siteDescription = '건축학과 2026 짝선짝후 빙고를 모바일에서 간편하게 인증하고 점수를 확인해보세요.';
const previewImage = '/top.png';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  manifest: '/manifest.json',
  applicationName: siteTitle,
  keywords: ['짝선짝후', '빙고', '건축학과', '멘토멘티', '이벤트'],
  alternates: {
    canonical: siteUrl
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '짝선짝후'
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: siteTitle,
    locale: 'ko_KR',
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: previewImage,
        width: 2448,
        height: 1116,
        alt: '2026 짝선짝후 빙고 대표 이미지'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [previewImage]
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#20317E'
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
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link href="https://cdn.jsdelivr.net/gh/sun-typeface/SUITE@2/fonts/static/woff2/SUITE.css" rel="stylesheet" />
      </head>
      <body style={{ backgroundColor: '#20317E', margin: 0, padding: 0, display: 'flex', justifyContent: 'center', minHeight: '100dvh', fontWeight: 700 }}>
        <MobileGuard>
          {children}
        </MobileGuard>
      </body>
    </html>
  );
}
