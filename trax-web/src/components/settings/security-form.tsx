'use client'

import { useState, useEffect } from 'react'
import { Loader2, KeyRound, ShieldCheck, ShieldOff, Copy, CheckCircle2, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { useApiClient } from '@/lib/api-client-browser'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

type TotpStep = 'idle' | 'setup' | 'enabling' | 'confirm-disable'

export function SecurityForm() {
  const api = useApiClient()
  const { data: session } = useSession()

  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // 2FA state
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [totpStep, setTotpStep] = useState<TotpStep>('idle')
  const [totpSetupData, setTotpSetupData] = useState<{ secret: string; otpauthUri: string; qrCodeUrl: string } | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [totpLoading, setTotpLoading] = useState(false)

  useEffect(() => {
    // Tenta inferir o estado atual do 2FA via /auth/me
    api.get('/auth/me').then((me: any) => {
      setTotpEnabled(me?.totpEnabled ?? false)
    }).catch(() => {})
  }, [])

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { toast.error('As senhas não coincidem'); return }
    if (newPassword.length < 8) { toast.error('A nova senha deve ter pelo menos 8 caracteres'); return }
    setSaving(true)
    try {
      await api.patch('/auth/me/password', { currentPassword, newPassword })
      toast.success('Senha atualizada com sucesso')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao alterar senha')
    } finally {
      setSaving(false)
    }
  }

  async function startTotpSetup() {
    setTotpLoading(true)
    try {
      const data = await api.post('/auth/totp/setup', {}) as any
      // Gera QR code via API externa do Google Charts
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.otpauthUri)}`
      setTotpSetupData({ ...data, qrCodeUrl })
      setTotpStep('setup')
    } catch {
      toast.error('Falha ao iniciar configuração 2FA')
    } finally {
      setTotpLoading(false)
    }
  }

  async function enableTotp() {
    if (verifyCode.length !== 6) return
    setTotpLoading(true)
    try {
      await api.post('/auth/totp/enable', { code: verifyCode })
      setTotpEnabled(true)
      setTotpStep('idle')
      setTotpSetupData(null)
      setVerifyCode('')
      toast.success('Autenticação de dois fatores ativada!')
    } catch {
      toast.error('Código inválido. Tente novamente.')
      setVerifyCode('')
    } finally {
      setTotpLoading(false)
    }
  }

  async function disableTotp() {
    if (verifyCode.length !== 6) return
    setTotpLoading(true)
    try {
      await api.post('/auth/totp/disable', { code: verifyCode })
      setTotpEnabled(false)
      setTotpStep('idle')
      setVerifyCode('')
      toast.success('Autenticação de dois fatores desativada.')
    } catch {
      toast.error('Código inválido. Tente novamente.')
      setVerifyCode('')
    } finally {
      setTotpLoading(false)
    }
  }

  function copySecret() {
    if (totpSetupData?.secret) {
      navigator.clipboard.writeText(totpSetupData.secret)
      toast.success('Chave copiada!')
    }
  }

  const inputClass = 'w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:border-[var(--color-primary)] outline-none transition-colors'

  return (
    <div className="space-y-6">
      {/* Alterar senha */}
      <div className="card p-6 border-[var(--color-border)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-foreground)]">Alterar senha</h3>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Use uma senha forte com pelo menos 8 caracteres.</p>
          </div>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">Senha atual</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">Nova senha</label>
            <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">Confirmar nova senha</label>
            <input type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
          </div>
          <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Salvando...' : 'Atualizar senha'}
          </button>
        </form>
      </div>

      {/* Autenticação de dois fatores */}
      <div className="card p-6 border-[var(--color-border)]">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${totpEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'}`}>
              {totpEnabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-foreground)]">Autenticação em dois fatores (2FA)</h3>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                {totpEnabled ? 'Sua conta está protegida com 2FA via TOTP.' : 'Adicione uma camada extra de segurança à sua conta.'}
              </p>
            </div>
          </div>
          {totpEnabled ? (
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Ativo
            </span>
          ) : (
            <span className="shrink-0 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] px-2.5 py-1 rounded-full">Inativo</span>
          )}
        </div>

        {/* Setup TOTP */}
        {totpStep === 'idle' && !totpEnabled && (
          <button
            onClick={startTotpSetup}
            disabled={totpLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all disabled:opacity-60"
          >
            {totpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
            Ativar autenticação 2FA
          </button>
        )}

        {totpStep === 'setup' && totpSetupData && (
          <div className="space-y-5 max-w-sm">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 space-y-4">
              <p className="text-sm text-[var(--color-foreground)] font-medium">
                1. Escaneie o QR Code com seu app autenticador
              </p>
              <div className="flex justify-center p-4 bg-white rounded-xl">
                <img
                  src={totpSetupData.qrCodeUrl}
                  alt="QR Code 2FA"
                  width={160}
                  height={160}
                  className="rounded-lg"
                />
              </div>

              <div>
                <p className="text-xs text-[var(--color-muted-foreground)] mb-2">Ou insira a chave manualmente:</p>
                <div className="flex items-center gap-2 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] px-3 py-2">
                  <code className="text-xs font-mono text-[var(--color-foreground)] flex-1 break-all">
                    {totpSetupData.secret}
                  </code>
                  <button onClick={copySecret} className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors shrink-0">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--color-foreground)]">
                2. Digite o código gerado pelo app para confirmar
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className={`${inputClass} text-center text-xl tracking-[0.4em] font-mono`}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={enableTotp}
                disabled={totpLoading || verifyCode.length !== 6}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all disabled:opacity-60"
              >
                {totpLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Ativar 2FA
              </button>
              <button
                type="button"
                onClick={() => { setTotpStep('idle'); setTotpSetupData(null); setVerifyCode('') }}
                className="px-4 py-2 text-sm text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {totpEnabled && totpStep === 'idle' && (
          <button
            onClick={() => { setTotpStep('confirm-disable'); setVerifyCode('') }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
          >
            <ShieldOff className="w-4 h-4" />
            Desativar 2FA
          </button>
        )}

        {totpStep === 'confirm-disable' && (
          <div className="space-y-4 max-w-sm">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-300">
                Para confirmar, insira o código atual do seu app autenticador.
              </p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className={`${inputClass} text-center text-xl tracking-[0.4em] font-mono`}
            />
            <div className="flex gap-3">
              <button
                onClick={disableTotp}
                disabled={totpLoading || verifyCode.length !== 6}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:opacity-90 transition-all disabled:opacity-60"
              >
                {totpLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar desativação
              </button>
              <button
                type="button"
                onClick={() => { setTotpStep('idle'); setVerifyCode('') }}
                className="px-4 py-2 text-sm text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
