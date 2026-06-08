import { AppShell } from '@/components/layout/AppShell'
import { StoreHydrationProvider } from '@/components/providers/StoreHydrationProvider'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreHydrationProvider>
      <AppShell>{children}</AppShell>
    </StoreHydrationProvider>
  )
}
