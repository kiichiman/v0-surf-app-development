import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0ea5e9',
}

export const metadata: Metadata = {
  title: 'しまいま - 奄美大島・徳之島の潮・天気・災害情報',
  description: '奄美大島・徳之島の潮見表、波・天気と、停電・断水・通信障害の通報マップをひとつにまとめたウェブアプリ',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'しまいま',
  },
  icons: {
    icon: [
      {
        url: '/app-icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/app-icon.svg',
  },
  openGraph: {
    title: 'しまいま - 奄美大島・徳之島の潮・天気・災害情報',
    description: '奄美大島・徳之島の潮見表、波・天気と、停電・断水・通信障害の通報マップをひとつにまとめたウェブアプリ',
    type: 'website',
    locale: 'ja_JP',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className="bg-background">
      <body className="font-sans antialiased min-h-screen">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
