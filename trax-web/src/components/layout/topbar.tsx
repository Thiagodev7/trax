'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileBarChart2,
  Settings,
  Bell,
  Menu,
  LogOut,
  User,
  X,
  Zap,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import type { Session } from 'next-auth'
import type { TenantBranding } from '@/lib/tenant'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { canAccessNavItem, canAccessSettings, getRoleLabel, type NavRole } from '@/lib/roles'

const ALL_NAV_ITEMS: Array<{
  href: string
  label: string
  icon: typeof LayoutDashboard
  roles: NavRole[]
}> = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
  { href: '/companies', label: 'Empresas', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { href: '/reports', label: 'Relatórios', icon: FileBarChart2, roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
  { href: '/settings', label: 'Configurações', icon: Settings, roles: ['ADMIN'] },
]

interface TopbarProps {
  session: Session
  tenant: TenantBranding
  userRole: string
}

export function Topbar({ session, tenant, userRole }: TopbarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = session?.user

  if (!user) return null

  const navItems = ALL_NAV_ITEMS.filter((item) => canAccessNavItem(userRole, item.roles))
  const hasCustomLogo = Boolean(tenant.branding.logoUrl)
  const roleLabel = getRoleLabel(userRole)
  const showSettings = canAccessSettings(userRole)

  return (
    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          {hasCustomLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.branding.logoUrl!}
              alt={tenant.name}
              className="h-8 object-contain shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-[var(--radius-md)] gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
              {tenant.name[0]}
            </div>
          )}
          <span className="font-semibold text-sm text-[var(--color-foreground)] hidden sm:inline-block">
            {tenant.name}
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150 group relative',
                  isActive
                    ? 'text-[var(--color-primary-foreground)]'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)]',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTopbar"
                    className="absolute inset-0 rounded-[var(--radius-md)] bg-[var(--color-primary)] -z-10"
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  />
                )}
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Powered by Trax — apenas quando sem logo customizada */}
        {!hasCustomLogo && (
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]">
            <Zap className="w-3 h-3 text-[var(--color-accent)] shrink-0" />
            <span className="text-[10px] text-[var(--color-muted)]">
              Powered by <span className="font-semibold text-[var(--color-foreground-muted)]">Trax</span>
            </span>
          </div>
        )}

        {roleLabel && (
          <Badge variant="default" className="hidden sm:inline-flex">
            {roleLabel}
          </Badge>
        )}

        <button
          className="relative p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors rounded-full hover:bg-[var(--color-surface-2)] hidden sm:block"
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
        </button>

        <div className="w-px h-6 bg-[var(--color-border)] hidden sm:block" />

        {/* User dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
              <Avatar>
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'Avatar'} />
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

        {/* Mobile menu button */}
        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <Dialog.Trigger asChild>
            <button
              className="md:hidden p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)] transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-[var(--color-surface)] border-r border-[var(--color-border)] shadow-2xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-300">
              {/* Drawer header */}
              <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  {hasCustomLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tenant.branding.logoUrl!} alt={tenant.name} className="h-7 object-contain" />
                  ) : (
                    <div className="w-7 h-7 rounded-[var(--radius-md)] gradient-primary flex items-center justify-center text-white font-bold text-xs">
                      {tenant.name[0]}
                    </div>
                  )}
                  <span className="font-semibold text-sm text-[var(--color-foreground)]">{tenant.name}</span>
                </div>
                <Dialog.Close asChild>
                  <button className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Drawer nav */}
              <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
                  return (
                    <Dialog.Close asChild key={href}>
                      <Link
                        href={href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150',
                          isActive
                            ? 'text-[var(--color-primary-foreground)] bg-[var(--color-primary)] shadow-sm'
                            : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)]',
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {label}
                      </Link>
                    </Dialog.Close>
                  )
                })}
              </nav>

              {/* Drawer footer */}
              <div className="px-4 py-4 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'Avatar'} />
                    <AvatarFallback>{user.name?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{user.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] rounded-[var(--radius-md)] hover:bg-[var(--color-danger)]/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  )
}
