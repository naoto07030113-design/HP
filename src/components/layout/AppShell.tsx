'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: React.ReactNode
}

export function AppShell({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* デスクトップ サイドバー */}
      <aside className="hidden lg:flex lg:flex-shrink-0 lg:w-56 xl:w-60">
        <Sidebar />
      </aside>

      {/* モバイル オーバーレイ */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-64 max-w-xs bg-white z-50">
            <div className="absolute top-3 right-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* モバイル ヘッダー */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-green-100 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-800 flex items-center justify-center">
              <span className="text-white font-bold text-[10px] tracking-tight">IMC</span>
            </div>
            <span className="font-semibold text-green-900 text-sm">統合業務システム</span>
          </div>
        </header>

        {/* ページコンテンツ */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
