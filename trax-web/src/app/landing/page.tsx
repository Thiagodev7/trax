'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { tenantHostname } from '@/lib/domains'
import {
  BarChart3,
  Zap,
  Shield,
  Globe,
  Users,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Star,
  Layers,
  PieChart,
  Target,
  ChevronRight,
  Sparkles,
  LineChart,
  LayoutDashboard,
  Palette,
  Link2,
  FileText,
} from 'lucide-react'

const EXAMPLE_TENANT_HOST = tenantHostname('suaagencia')

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const stagger = {
  show: { transition: { staggerChildren: 0.1 } },
}

// ──────────────────────────────────────────────────────────────────────────────
// Navigation
// ──────────────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Trax</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {['Funcionalidades', 'Como Funciona', 'Planos', 'Depoimentos'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-white/70 hover:text-white transition-colors hidden sm:block"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Hero
// ──────────────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0f] pt-16">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-indigo-400/10 rounded-full blur-[80px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Plataforma white-label para agências de marketing
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6"
        >
          Relatórios que{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            impressionam
          </span>
          <br />
          seus clientes
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Conecte Meta Ads, Google Ads e outras plataformas. Entregue dashboards profissionais com
          a sua marca para cada cliente — tudo automatizado, sem planilhas.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/signup"
            className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 text-base"
          >
            Começar gratuitamente
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#como-funciona"
            className="flex items-center gap-2 text-white/60 hover:text-white font-medium px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 transition-all text-base"
          >
            Ver como funciona
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 flex items-center justify-center gap-8 text-sm text-white/30"
        >
          {['Sem cartão de crédito', 'Trial de 14 dias grátis', 'Cancele quando quiser'].map(
            (item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                {item}
              </div>
            ),
          )}
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10 pointer-events-none rounded-2xl" />
          <div className="bg-[#111118] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0d0d14]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="flex-1 mx-3 bg-white/5 rounded-md px-3 py-1 text-xs text-white/30 text-center">
                {EXAMPLE_TENANT_HOST}
              </div>
            </div>

            {/* Fake dashboard content */}
            <div className="p-6 grid grid-cols-4 gap-4">
              {[
                { label: 'Leads gerados', value: '1.847', change: '+24%', color: 'indigo' },
                { label: 'Investimento', value: 'R$ 12.400', change: '-3%', color: 'violet' },
                { label: 'CPL médio', value: 'R$ 6,71', change: '+8%', color: 'purple' },
                { label: 'ROAS', value: '4.2x', change: '+31%', color: 'blue' },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"
                >
                  <p className="text-xs text-white/40 mb-2">{kpi.label}</p>
                  <p className="text-2xl font-bold text-white">{kpi.value}</p>
                  <p
                    className={`text-xs mt-1 ${kpi.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}
                  >
                    {kpi.change} vs mês anterior
                  </p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 h-32 flex items-end gap-1 overflow-hidden">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100, 80, 88].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-sm opacity-80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 h-32 flex flex-col justify-between">
                <p className="text-xs text-white/40">Meta Ads</p>
                <div className="space-y-2">
                  {[
                    { label: 'Impressões', w: '75%' },
                    { label: 'Cliques', w: '45%' },
                    { label: 'Conversões', w: '30%' },
                  ].map((bar) => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-[10px] text-white/30 mb-0.5">
                        <span>{bar.label}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: bar.w }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Logos / Social proof
// ──────────────────────────────────────────────────────────────────────────────
function SocialProof() {
  const integrations = [
    'Meta Ads',
    'Google Ads',
    'Google Analytics',
    'LinkedIn Ads',
    'TikTok Ads',
    'Nectar CRM',
  ]
  return (
    <section className="bg-[#0d0d14] border-y border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-white/30 mb-8">
          Integrado com as plataformas que você já usa
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {integrations.map((name) => (
            <span key={name} className="text-sm font-semibold text-white/25">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Features
// ──────────────────────────────────────────────────────────────────────────────
const features = [
  {
    icon: Palette,
    title: 'White-label completo',
    desc: 'Sua logo, suas cores, seu domínio. O cliente acessa o painel e vê apenas a marca da sua agência — sem rastro do Trax.',
    color: 'from-indigo-500 to-violet-600',
  },
  {
    icon: Link2,
    title: 'Integrações nativas',
    desc: 'Conecte Meta Ads, Google Ads, Google Analytics, LinkedIn e TikTok com poucos cliques. Dados atualizados automaticamente.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: FileText,
    title: 'Relatórios automáticos',
    desc: 'Monte templates de relatório uma vez. Publique para todos os clientes automaticamente com dados em tempo real.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard por cliente',
    desc: 'Cada cliente acessa um subdomínio exclusivo com seu painel personalizado, login e dados isolados.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    icon: Users,
    title: 'Gestão de equipe',
    desc: 'Convide colaboradores com diferentes níveis de acesso. Defina quem vê qual cliente ou relatório.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Shield,
    title: 'Segurança enterprise',
    desc: 'Isolamento total entre agências. JWT + refresh token. Dados criptografados em repouso e em trânsito.',
    color: 'from-orange-500 to-red-600',
  },
]

function Features() {
  return (
    <section id="funcionalidades" className="bg-[#0a0a0f] py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-20"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <Zap className="w-3.5 h-3.5" />
            Funcionalidades
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-white mb-5 tracking-tight">
            Tudo que sua agência precisa
            <br />
            <span className="text-white/40">em um só lugar</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/50 max-w-xl mx-auto text-lg">
            Do onboarding ao relatório publicado, o Trax cobre todo o fluxo de trabalho da sua agência.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="group bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.07] hover:border-white/15 rounded-2xl p-7 transition-all duration-300 cursor-default"
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// How it works
// ──────────────────────────────────────────────────────────────────────────────
const steps = [
  {
    number: '01',
    icon: Globe,
    title: 'Crie sua conta de agência',
    desc: 'Configure seu subdomínio, faça upload da sua logo e defina as cores da marca. Em menos de 5 minutos você tem sua plataforma no ar.',
  },
  {
    number: '02',
    icon: Link2,
    title: 'Conecte as plataformas',
    desc: 'Integre Meta Ads, Google Ads e outros canais de cada cliente. Os dados são sincronizados automaticamente.',
  },
  {
    number: '03',
    icon: LineChart,
    title: 'Publique relatórios',
    desc: 'Monte os dashboards, publique para os clientes e deixe que eles acompanhem os resultados em tempo real com a sua marca.',
  },
]

function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-[#0d0d14] py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-20"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <Target className="w-3.5 h-3.5" />
            Como Funciona
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-white mb-5 tracking-tight">
            Simples como deve ser
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/50 max-w-xl mx-auto text-lg">
            Três passos para transformar a entrega de resultados da sua agência.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
        >
          {/* Connector line */}
          <div className="hidden md:block absolute top-14 left-1/3 right-1/3 h-px bg-gradient-to-r from-indigo-500/30 via-violet-500/50 to-indigo-500/30" />

          {steps.map((step) => {
            const Icon = step.icon
            return (
              <motion.div key={step.number} variants={fadeUp} className="relative text-center">
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center">
                    <Icon className="w-10 h-10 text-indigo-400" />
                  </div>
                  <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-indigo-500/40">
                    {step.number.slice(1)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Pricing
// ──────────────────────────────────────────────────────────────────────────────
const plans = [
  {
    name: 'Starter',
    price: null,
    desc: 'Para agências começando a escalar a entrega de resultados.',
    features: [
      'Até 5 clientes',
      '2 usuários na equipe',
      'Integrações Meta + Google Ads',
      'Dashboard por cliente',
      'Suporte via e-mail',
    ],
    cta: 'Começar trial',
    highlight: false,
  },
  {
    name: 'Pro',
    price: null,
    desc: 'Para agências em crescimento que querem entregar mais com menos esforço.',
    features: [
      'Clientes ilimitados',
      '5 usuários na equipe',
      'Todas as integrações',
      'White-label completo (domínio próprio)',
      'Relatórios agendados',
      'Suporte prioritário',
    ],
    cta: 'Começar trial Pro',
    highlight: true,
  },
  {
    name: 'Agency',
    price: null,
    desc: 'Para grandes agências e grupos com múltiplos times.',
    features: [
      'Tudo do Pro',
      'Usuários ilimitados',
      'API de acesso',
      'SLA de uptime 99.9%',
      'Onboarding dedicado',
      'Suporte 24/7',
    ],
    cta: 'Falar com vendas',
    highlight: false,
  },
]

function Pricing() {
  return (
    <section id="planos" className="bg-[#0a0a0f] py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <PieChart className="w-3.5 h-3.5" />
            Planos
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-white mb-5 tracking-tight">
            Preços em breve
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/50 max-w-lg mx-auto text-lg">
            Estamos finalizando nossa estrutura de planos. Cadastre-se agora e garanta
            condições especiais de lançamento.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              className={`relative rounded-2xl p-8 border transition-all ${
                plan.highlight
                  ? 'bg-indigo-600/10 border-indigo-500/50 shadow-xl shadow-indigo-500/10'
                  : 'bg-white/[0.03] border-white/[0.08]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-indigo-500/40">
                  Mais popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-black text-white/30">Em breve</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed">{plan.desc}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/60">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.highlight
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                }`}
              >
                {plan.cta}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Testimonials
// ──────────────────────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: 'Mariana Costa',
    role: 'CEO · Agência Pixel',
    quote:
      'O Trax transformou como entregamos relatórios. Nossos clientes adoram o painel com nossa marca — parece que desenvolvemos um software próprio.',
    rating: 5,
  },
  {
    name: 'Rafael Mendes',
    role: 'Head de Performance · GrowthLab',
    quote:
      'Antes passávamos horas montando relatórios no Google Sheets. Agora tudo é automático e muito mais profissional. Valeu cada centavo.',
    rating: 5,
  },
  {
    name: 'Juliana Ferreira',
    role: 'Diretora Comercial · NovaMídia',
    quote:
      'A integração com Meta e Google Ads funcionou de primeira. O suporte é excelente e a plataforma evoluiu muito rápido.',
    rating: 5,
  },
]

function Testimonials() {
  return (
    <section id="depoimentos" className="bg-[#0d0d14] py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <Star className="w-3.5 h-3.5 fill-current" />
            Depoimentos
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-white mb-5 tracking-tight">
            Agências que já confiam no Trax
          </motion.h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-7"
            >
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-6 italic">"{t.quote}"</p>
              <div>
                <p className="text-sm font-bold text-white">{t.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// CTA Section
// ──────────────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="bg-[#0a0a0f] py-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.div
            variants={fadeUp}
            className="relative bg-gradient-to-br from-indigo-600/20 via-violet-600/15 to-purple-600/10 border border-indigo-500/30 rounded-3xl p-16 overflow-hidden"
          >
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-indigo-500/20 blur-[60px] pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
                <TrendingUp className="w-3.5 h-3.5" />
                Comece hoje
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-5 tracking-tight">
                Pronto para impressionar
                <br />
                seus clientes?
              </h2>
              <p className="text-white/50 text-lg mb-10 max-w-lg mx-auto">
                Crie sua conta em menos de 2 minutos e comece a entregar relatórios profissionais
                com a sua marca.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 text-base"
                >
                  Criar conta grátis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <p className="text-white/30 text-sm mt-6">
                14 dias grátis · Sem cartão de crédito · Cancele quando quiser
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Footer
// ──────────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0a0a0f] border-t border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Trax</span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              Plataforma white-label de relatórios de marketing para agências que querem escalar
              com qualidade.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Produto</h4>
            <ul className="space-y-3">
              {['Funcionalidades', 'Planos', 'Integrações', 'Segurança'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-3">
              {['Sobre', 'Blog', 'Termos de Uso', 'Privacidade'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} Trax Soluções. Todos os direitos reservados.
          </p>
          <p className="text-xs text-white/25">
            contato@traxsolucoes.com.br
          </p>
        </div>
      </div>
    </footer>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans antialiased">
      <Nav />
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  )
}
