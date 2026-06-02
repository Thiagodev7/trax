'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileBarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  UserRound,
  Activity,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { TenantBranding } from '@/lib/tenant'
import { canAccessNavItem, type NavRole } from '@/lib/roles'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const ALL_NAV_ITEMS: Array<{
  href: string
  label: string
  icon: typeof LayoutDashboard
  roles: NavRole[]
}> = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
  { href: '/clients', label: 'Clientes', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { href: '/reports', label: 'Relatórios', icon: FileBarChart2, roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
  { href: '/users', label: 'Equipe', icon: UserRound, roles: ['ADMIN'] },
  { href: '/audit-log', label: 'Atividades', icon: Activity, roles: ['ADMIN'] },
  { href: '/settings', label: 'Configurações', icon: Settings, roles: ['ADMIN'] },
]

interface SidebarProps {
  tenant: TenantBranding
  userRole: string
}

export function Sidebar({ tenant, userRole }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const navItems = ALL_NAV_ITEMS.filter((item) => canAccessNavItem(userRole, item.roles))

  const hasCustomLogo = Boolean(tenant.branding.logoUrl)

  return (
    <TooltipProvider delayDuration={300}>
      <motion.aside
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative flex flex-col h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] z-20 overflow-hidden"
      >
        {/* Logo / Agency Name */}
        <div className="h-16 flex items-center px-4 border-b border-[var(--color-border)] shrink-0">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 overflow-hidden"
              >
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
                <span className="font-semibold text-sm text-[var(--color-foreground)] truncate">
                  {tenant.name}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto"
              >
                {hasCustomLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenant.branding.logoUrl!}
                    alt={tenant.name}
                    className="h-7 w-7 object-contain rounded"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-[var(--radius-md)] gradient-primary flex items-center justify-center text-white font-bold text-sm">
                    {tenant.name[0]}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-hidden">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            const linkContent = (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150 group relative',
                  isActive
                    ? 'text-[var(--color-primary-foreground)] bg-[var(--color-primary)] shadow-md'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)]',
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                    isActive && 'drop-shadow-sm',
                  )}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-[var(--radius-md)] bg-[var(--color-primary)] -z-10"
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  />
                )}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              )
            }

            return linkContent
          })}
        </nav>

        {/* Powered by Trax — omitir quando tenant tem logo própria (white-label) */}
        {!hasCustomLogo && (
          <div className="px-3 py-3 border-t border-[var(--color-border)]">
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]"
                >
                  <Zap className="w-3 h-3 text-[var(--color-accent)] shrink-0" />
                  <span className="text-xs text-[var(--color-muted)]">
                    Powered by{' '}
                    <span className="font-semibold text-[var(--color-foreground-muted)]">Trax</span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface)] transition-all shadow-md z-30"
          aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </motion.aside>
    </TooltipProvider>
  )
}
