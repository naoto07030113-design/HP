import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: '統合業務システム | 鍼灸整骨院',
  description: '鍼灸整骨院・訪問マッサージ・介護事業 統合業務システム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
