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
  title: '統合業務システム | 鍼灸整骨院',
  description: '鍼灸整骨院・訪問マッサージ・介護事業 統合業務システム',
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
