'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Menu, X } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

export function AppShell({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[hsl(var(--surface))] overflow-hidden">
      {/* デスクトップ サイドバー */}
      <aside className="hidden lg:flex lg:flex-shrink-0 lg:w-56 xl:w-60">
        <Sidebar />
      </aside>

      {/* モバイル オーバーレイ */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-green-950/60 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-64 max-w-xs z-50">
            <div className="absolute top-4 right-3 z-10">
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-center h-8 w-8 rounded-lg text-green-100/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* モバイル ヘッダー */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-green-950 text-white flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-green-100/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-green-700 to-green-900 ring-1 ring-gold-400/40 flex items-center justify-center">
              <span className="text-gold-200 font-bold text-[9px] tracking-widest">IMC</span>
            </div>
            <span className="font-semibold text-white text-sm tracking-wide">統合業務システム</span>
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
