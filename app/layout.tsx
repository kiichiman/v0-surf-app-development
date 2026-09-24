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
  title: 'Surf Life - 潮見表・波情報・気象情報',
  description: 'サーファー・釣り人のための潮見表、タイドグラフ、波情報、気象情報を提供するウェブアプリ',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Surf Life',
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
    title: 'Surf Life - 潮見表・波情報・気象情報',
    description: 'サーファー・釣り人のための潮見表、タイドグラフ、波情報、気象情報を提供するウェブアプリ',
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
