'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  BarChart3,
  LayoutDashboard,
  Building2,
  Settings,
  LogOut,
  Shield,
  Users,
  TrendingUp,
  ScrollText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin-panel', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin-panel/agencies', label: 'Agências', icon: Building2 },
  { href: '/admin-panel/users', label: 'Usuários', icon: Users },
  { href: '/admin-panel/activity', label: 'Atividade', icon: ScrollText },
  { href: '/admin-panel/revenue', label: 'Receita', icon: TrendingUp },
  { href: '/admin-panel/settings', label: 'Configurações', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 border-r border-white/[0.06] bg-[#0a0a12] flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
          <BarChart3 className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-white tracking-tight">Trax</span>
          <span className="ml-1.5 text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full align-middle">
            Admin
          </span>
        </div>
      </div>

      {/* Badge */}
      <div className="mx-4 mt-4 mb-2 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
        <Shield className="w-4 h-4 text-red-400 shrink-0" />
        <div>
          <p className="text-[11px] font-bold text-red-300">Modo Super Admin</p>
          <p className="text-[10px] text-red-400/60 mt-0.5">Acesso total à plataforma</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]',
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-red-400' : '')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={() => signOut({ callbackUrl: '/admin-panel/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
