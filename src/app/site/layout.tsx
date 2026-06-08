import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '有限会社イトーメディカルケア',
  description: '千葉県袖ケ浦市・富津市で鍼灸整骨院グループを運営する有限会社イトーメディカルケア',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
