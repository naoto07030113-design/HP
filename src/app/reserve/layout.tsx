import { StoreHydrationProvider } from '@/components/providers/StoreHydrationProvider'

export default function ReserveLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreHydrationProvider scope="public">
      {children}
    </StoreHydrationProvider>
  )
}
