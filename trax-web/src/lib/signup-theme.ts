export type SignupThemeMode = 'light' | 'dark'

export function getSignupUi(theme: SignupThemeMode) {
  const light = theme === 'light'
  return {
    // ── Page ──────────────────────────────────────────────────────
    page: light
      ? 'bg-gradient-to-br from-slate-100 via-white to-slate-100'
      : 'bg-[#0A0F1E]',

    // ── Card ──────────────────────────────────────────────────────
    card: light
      ? 'bg-white border-slate-200/80 shadow-xl shadow-slate-200/60'
      : 'bg-white/[0.04] backdrop-blur-2xl border-white/10 shadow-2xl',

    // ── Text ──────────────────────────────────────────────────────
    title: light ? 'text-slate-900' : 'text-white',
    subtitle: light ? 'text-slate-500' : 'text-white/40',
    label: light ? 'text-slate-800 font-medium' : 'text-white/80',
    muted: light ? 'text-slate-500' : 'text-white/40',
    faint: light ? 'text-slate-400' : 'text-white/25',
    icon: light ? 'text-slate-400' : 'text-white/30',

    // ── Inputs ────────────────────────────────────────────────────
    // bg-slate-50 on white card = visible; add border-slate-300 for definition
    input: light
      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/25 focus:bg-white'
      : 'bg-white/5 border-white/10 text-white placeholder-white/25 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/30',
    inputSlugOk: light
      ? 'border-emerald-500 bg-emerald-50 focus:border-emerald-500 focus:ring-emerald-500/25'
      : 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/30',
    inputSlugErr: light
      ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-400/25'
      : 'border-red-500 focus:border-red-500 focus:ring-red-500/30',

    // ── Panels / dividers ──────────────────────────────────────────
    panel: light
      ? 'border-slate-200 bg-slate-50/60'
      : 'border-white/10 bg-white/5',
    panelDivide: light ? 'divide-slate-100' : 'divide-white/5',

    // ── Buttons ───────────────────────────────────────────────────
    btnGhost: light
      ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300'
      : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10',

    // ── Step indicator ────────────────────────────────────────────
    stepIdle: light ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-white/5 text-white/30',
    stepLine: light ? 'bg-slate-300' : 'bg-white/10',

    // ── Logo / link ───────────────────────────────────────────────
    logoText: light ? 'text-slate-900' : 'text-white',
    link: light
      ? 'text-slate-600 hover:text-slate-900 font-medium'
      : 'text-white/50 hover:text-white',

    // ── Color picker ──────────────────────────────────────────────
    ringOffset: light ? 'ring-offset-white' : 'ring-offset-[#0F172A]',
    colorPickerBox: light
      ? 'border-slate-200 bg-slate-50'
      : 'border-white/10 bg-white/5',
    colorPickerRing: light
      ? 'ring-slate-300 hover:ring-slate-400'
      : 'ring-white/20 hover:ring-white/40',

    // ── Preview mini-dashboard ────────────────────────────────────
    previewOuter: light
      ? 'border-slate-200 bg-slate-50'
      : 'border-white/10 bg-[#0F172A]',
    previewSidebar: light ? 'border-slate-200' : 'border-white/10',
    previewMutedBar: light ? 'bg-slate-300' : 'bg-white/20',
    previewCard: light ? 'bg-white border border-slate-200' : 'bg-white/5',
    previewCaption: light ? 'text-slate-400' : 'text-white/30',

    // ── Background decoration ──────────────────────────────────────
    // On light: subtle tinted grid, low-opacity orbs
    gridPattern: light ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.1)',
    orbOpacity: light ? '0.08' : '0.20',        // primary orb
    orbAmberOpacity: light ? '0.06' : '0.15',   // amber orb
    orbWhiteClass: light ? 'opacity-0' : 'opacity-5',

    // ── Theme toggle ──────────────────────────────────────────────
    themeToggleTrack: light
      ? 'bg-slate-100 border border-slate-200'
      : 'bg-white/10',
    themeToggleInactive: light ? 'text-slate-500 hover:text-slate-700' : 'text-white/40',
    themeToggleActive: light
      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
      : 'bg-white/15 text-white shadow-sm',
  }
}

export type SignupUi = ReturnType<typeof getSignupUi>
