import type { Metadata } from 'next'
import { Zen_Kaku_Gothic_New } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const zenKaku = Zen_Kaku_Gothic_New({
  weight: ['400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-zen',
})

export const metadata: Metadata = {
  title: '経費・出納帳',
  description: 'レシート・通帳・請求書をAIで読み取る経費／出納帳アプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={zenKaku.variable}>
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
