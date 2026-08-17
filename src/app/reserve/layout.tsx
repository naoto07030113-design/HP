import { StoreHydrationProvider } from '@/components/providers/StoreHydrationProvider'
import { AmbientBackground } from '@/components/reserve/AmbientBackground'

export default function ReserveLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreHydrationProvider scope="public">
      {/* reserve-scope 配下だけ患者向けの明るい配色と演出が効く */}
      <div className="reserve-scope relative min-h-screen">
        <AmbientBackground />
        <div className="relative z-10">{children}</div>
      </div>
    </StoreHydrationProvider>
  )
}
