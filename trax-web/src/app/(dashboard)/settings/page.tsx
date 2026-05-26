'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Shield, CreditCard, Bell, Smartphone, Laptop, CheckCircle2 } from 'lucide-react'
import { BrandingForm } from '@/components/settings/branding-form'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Tab = 'branding' | 'plan' | 'security' | 'notifications'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('branding')
  const [brandingData, setBrandingData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const api = useApiClient()

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

  const tabs: { id: Tab; label: string; icon: any }[] = [
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
          Gerencie o whitelabel, seu plano de assinatura, segurança e preferências.
        </p>
      </div>

      {/* Tabs */}
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
          {/* ─── Branding ────────────────────────────────────────── */}
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
                  <p className="text-[var(--color-muted-foreground)]">Não foi possível carregar as configurações de branding no momento.</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Plan & Billing ──────────────────────────────────── */}
          {activeTab === 'plan' && (
            <div className="space-y-6">
              <div className="card p-6 border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-primary)]/5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-foreground)]">Plano Pro (Atual)</h3>
                    <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                      Você está no plano <strong>Pro</strong>. Próxima cobrança de R$ 297,00 em 15 de Julho, 2026.
                    </p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all whitespace-nowrap">
                    Fazer Upgrade
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--color-border)]">
                  <div>
                    <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">Clientes Ativos</p>
                    <p className="text-2xl font-bold text-[var(--color-foreground)] mt-1">12 <span className="text-sm text-[var(--color-muted-foreground)] font-normal">/ ilimitado</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">Integrações</p>
                    <p className="text-2xl font-bold text-[var(--color-foreground)] mt-1">45 <span className="text-sm text-[var(--color-muted-foreground)] font-normal">/ ilimitado</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">Membros da Equipe</p>
                    <p className="text-2xl font-bold text-[var(--color-foreground)] mt-1">3 <span className="text-sm text-[var(--color-muted-foreground)] font-normal">/ 5 incluídos</span></p>
                  </div>
                </div>
              </div>

              <div className="card border-[var(--color-border)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--color-border)]">
                  <h3 className="font-semibold text-[var(--color-foreground)]">Histórico de Faturas</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-surface-2)]">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-[var(--color-muted-foreground)]">Data</th>
                      <th className="px-6 py-3 text-left font-medium text-[var(--color-muted-foreground)]">Valor</th>
                      <th className="px-6 py-3 text-left font-medium text-[var(--color-muted-foreground)]">Status</th>
                      <th className="px-6 py-3 text-right font-medium text-[var(--color-muted-foreground)]">Recibo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {[
                      { date: '15/06/2026', amount: 'R$ 297,00', status: 'Pago' },
                      { date: '15/05/2026', amount: 'R$ 297,00', status: 'Pago' },
                      { date: '15/04/2026', amount: 'R$ 297,00', status: 'Pago' },
                    ].map((inv, i) => (
                      <tr key={i} className="hover:bg-[var(--color-surface-2)] transition-colors">
                        <td className="px-6 py-4 text-[var(--color-foreground)]">{inv.date}</td>
                        <td className="px-6 py-4 text-[var(--color-foreground)] font-medium">{inv.amount}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-[var(--color-primary)] hover:underline text-sm font-medium">Download PDF</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── Security ────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card p-6 border-[var(--color-border)]">
                <h3 className="font-semibold text-[var(--color-foreground)] mb-4">Alterar Senha</h3>
                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">Senha Atual</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:border-[var(--color-primary)] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">Nova Senha</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:border-[var(--color-primary)] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">Confirmar Nova Senha</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:border-[var(--color-primary)] outline-none" />
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all w-full sm:w-auto">
                    Atualizar Senha
                  </button>
                </div>
              </div>

              <div className="card overflow-hidden border-[var(--color-border)]">
                <div className="px-6 py-4 border-b border-[var(--color-border)]">
                  <h3 className="font-semibold text-[var(--color-foreground)]">Sessões Ativas</h3>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1">Dispositivos logados na sua conta atualmente.</p>
                </div>
                <div className="divide-y divide-[var(--color-border)]">
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-foreground)] flex items-center gap-2">
                          Mac OS · Chrome
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Sessão Atual</span>
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">São Paulo, BR · IP 187.x.x.x</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] flex items-center justify-center border border-[var(--color-border)]">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-foreground)]">iOS · Safari</p>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Ativo há 2 dias · Rio de Janeiro, BR</p>
                      </div>
                    </div>
                    <button className="text-xs font-medium text-red-400 hover:text-red-300 hover:underline">
                      Revogar Acesso
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Notifications ────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="card p-6 border-[var(--color-border)]">
                <h3 className="font-semibold text-[var(--color-foreground)] mb-6">Preferências de Notificação</h3>
                
                <div className="space-y-6 max-w-2xl">
                  {/* Alert Toggle Item */}
                  {[
                    { title: 'Relatórios Publicados', desc: 'Receba um e-mail quando um relatório for finalizado e publicado.', checked: true },
                    { title: 'Erros de Integração', desc: 'Seja alertado imediatamente se uma integração com Meta/Google falhar.', checked: true },
                    { title: 'Novo Cliente', desc: 'Notifique a equipe quando um novo cliente for adicionado à plataforma.', checked: false },
                    { title: 'Resumo Semanal', desc: 'Receba um relatório semanal com o desempenho geral da sua agência.', checked: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-foreground)]">{item.title}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{item.desc}</p>
                      </div>
                      {/* Simple Toggle CSS */}
                      <div className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out border-2 border-transparent", item.checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-2)]')}>
                        <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", item.checked ? 'translate-x-4' : 'translate-x-0')} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
                  <button className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all">
                    Salvar Preferências
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}