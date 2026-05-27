'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Shield, CreditCard, Bell } from 'lucide-react'
import { BrandingForm } from '@/components/settings/branding-form'
import { PlanSection } from '@/components/settings/plan-section'
import { SecurityForm } from '@/components/settings/security-form'
import { NotificationsForm } from '@/components/settings/notifications-form'
import { useApiClient } from '@/lib/api-client-browser'
import { cn } from '@/lib/utils'

type Tab = 'branding' | 'plan' | 'security' | 'notifications'

const TAB_IDS: Tab[] = ['branding', 'plan', 'security', 'notifications']

function parseTab(value: string | null): Tab {
  if (value && TAB_IDS.includes(value as Tab)) return value as Tab
  return 'branding'
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>(() => parseTab(searchParams.get('tab')))
  const [brandingData, setBrandingData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const api = useApiClient()

  useEffect(() => {
    setActiveTab(parseTab(searchParams.get('tab')))
  }, [searchParams])

  useEffect(() => {
    async function fetchBranding() {
      try {
        const data = await api.get('/agency/branding')
        setBrandingData(data)
      } catch (err) {
        console.error('Failed to fetch agency branding:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBranding()
  }, [])

  const tabs: { id: Tab; label: string; icon: typeof Palette }[] = [
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'plan', label: 'Plano e Cobrança', icon: CreditCard },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">
          Configurações da Agência
        </h2>
        <p className="text-[var(--color-muted-foreground)] mt-1 text-sm">
          Gerencie o whitelabel, plano, segurança e preferências de notificação.
        </p>
      </div>

      <div className="border-b border-[var(--color-border)]">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap',
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="settingsTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'branding' && (
            <div className="space-y-6">
              {loading ? (
                <div className="card p-12 text-center border-[var(--color-border)] animate-pulse">
                  <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mx-auto mb-3" />
                  <p className="text-sm text-[var(--color-muted-foreground)]">Carregando configurações...</p>
                </div>
              ) : brandingData ? (
                <BrandingForm initialData={brandingData} />
              ) : (
                <div className="card p-12 text-center border-[var(--color-border)]">
                  <p className="text-[var(--color-muted-foreground)]">
                    Não foi possível carregar as configurações de branding no momento.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'plan' && <PlanSection />}
          {activeTab === 'security' && <SecurityForm />}
          {activeTab === 'notifications' && <NotificationsForm />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
