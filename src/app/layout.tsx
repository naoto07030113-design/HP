import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pre-Site Sales AI Engine',
  description: 'AI事前制作型HP営業システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
