'use client'

import { Bell, Search, Menu, LogOut, User, Settings } from 'lucide-react'
import { signOut } from 'next-auth/react'
import type { Session } from 'next-auth'
import type { TenantBranding } from '@/lib/tenant'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Avatar from '@radix-ui/react-avatar'

interface HeaderProps {
  session: Session
  tenant: TenantBranding
}

export function Header({ session, tenant }: HeaderProps) {
  const user = session?.user

  if (!user) return null

  return (
    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Esquerda: Search (Placeholder por enquanto) */}
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden p-2 -ml-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-muted)] max-w-sm w-full focus-within:border-[var(--color-primary)] transition-colors">
          <Search className="w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent border-none outline-none w-full text-[var(--color-foreground)] placeholder-[var(--color-muted)]"
          />
          <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-[var(--color-muted-foreground)] bg-[var(--color-surface)] border border-[var(--color-border)]">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Direita: Notificações & Perfil */}
      <div className="flex items-center gap-4">
        {/* Badges de role */}
        <div className="hidden sm:flex items-center gap-2">
           <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
             {(user as any).role}
           </span>
        </div>

        <button className="relative p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors rounded-full hover:bg-[var(--color-surface-2)]">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
        </button>

        <div className="w-px h-6 bg-[var(--color-border)] mx-1" />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 outline-none">
              <Avatar.Root className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] shrink-0 overflow-hidden select-none">
                <Avatar.Image
                  className="w-full h-full object-cover"
                  src={user.image ?? undefined}
                  alt={user.name ?? 'Avatar'}
                />
                <Avatar.Fallback
                  className="w-full h-full flex items-center justify-center text-xs font-medium bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                  delayMs={600}
                >
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
                </Avatar.Fallback>
              </Avatar.Root>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[240px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden p-1 data-[side=bottom]:animate-fade-in"
              sideOffset={8}
              align="end"
            >
              {/* Header do Menu */}
              <div className="px-3 py-2.5 border-b border-[var(--color-border)] mb-1">
                <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{user.name}</p>
                <p className="text-xs text-[var(--color-muted-foreground)] truncate">{user.email}</p>
              </div>

              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] outline-none rounded-md hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors">
                <User className="w-4 h-4 text-[var(--color-muted)]" />
                Meu Perfil
              </DropdownMenu.Item>
              
              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] outline-none rounded-md hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors">
                <Settings className="w-4 h-4 text-[var(--color-muted)]" />
                Configurações
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-[var(--color-border)] my-1" />

              <DropdownMenu.Item
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 outline-none rounded-md hover:bg-red-400/10 hover:text-red-300 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
