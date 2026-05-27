'use client'

import Link from 'next/link'
import { Bell, Search, LogOut, User, Settings } from 'lucide-react'
import { signOut } from 'next-auth/react'
import type { Session } from 'next-auth'
import type { TenantBranding } from '@/lib/tenant'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { canAccessSettings, getRoleLabel } from '@/lib/roles'

interface HeaderProps {
  session: Session
  tenant: TenantBranding
}

export function Header({ session, tenant: _tenant }: HeaderProps) {
  const user = session?.user
  if (!user) return null

  const role = (user as any).role as string | undefined
  const roleLabel = getRoleLabel(role)
  const showSettings = canAccessSettings(role)

  return (
    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-muted)] max-w-xs w-full focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/15 transition-all">
          <Search className="w-4 h-4 shrink-0" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent border-none outline-none w-full text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] text-sm"
          />
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-[var(--color-muted-foreground)] bg-[var(--color-surface)] border border-[var(--color-border)] select-none">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {roleLabel && (
          <Badge variant="default" className="hidden sm:inline-flex">
            {roleLabel}
          </Badge>
        )}

        {showSettings && (
          <Link
            href="/settings?tab=notifications"
            className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors rounded-full hover:bg-[var(--color-surface-2)]"
            aria-label="Preferências de notificação"
          >
            <Bell className="w-5 h-5" />
          </Link>
        )}

        <div className="w-px h-6 bg-[var(--color-border)]" />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
              <Avatar>
                <AvatarImage src={user.avatarUrl ?? user.image ?? undefined} alt={user.name ?? 'Avatar'} />
                <AvatarFallback delayMs={600}>
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[240px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-xl overflow-hidden p-1 data-[side=bottom]:animate-fade-in"
              sideOffset={8}
              align="end"
            >
              <div className="px-3 py-2.5 border-b border-[var(--color-border)] mb-1">
                <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{user.name}</p>
                <p className="text-xs text-[var(--color-muted-foreground)] truncate">{user.email}</p>
              </div>

              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] outline-none rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors">
                <User className="w-4 h-4 text-[var(--color-muted)]" />
                Meu Perfil
              </DropdownMenu.Item>

              {showSettings && (
                <DropdownMenu.Item asChild>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] outline-none rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[var(--color-muted)]" />
                    Configurações
                  </Link>
                </DropdownMenu.Item>
              )}

              <DropdownMenu.Separator className="h-px bg-[var(--color-border)] my-1" />

              <DropdownMenu.Item
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] outline-none rounded-[var(--radius-md)] hover:bg-[var(--color-danger)]/10 cursor-pointer transition-colors"
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
