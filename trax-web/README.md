# Trax Web — Frontend Developer Guide

> Frontend Next.js 16 do Trax — guia completo para desenvolvimento, design system e padrões.

---

## Visão Geral

O `trax-web` é o frontend React do Trax, construído com Next.js 16 App Router + Tailwind CSS v4 + TypeScript.

**Arquitetura em uma frase:** Server Components por padrão, Client Components apenas quando necessário,
com design system baseado em CSS variables que o tenant sobrescreve em runtime.

---

## Requisitos

| Dependência | Versão |
|------------|--------|
| Node.js | 20 LTS |
| npm | 10.x |

---

## Setup Local

```bash
# A partir da raiz do monorepo (trax/)
npm run dev:web     # Inicia apenas o frontend (:3001)

# Ou com API em paralelo:
npm run dev         # API (:3000) + Web (:3001)
```

### Variáveis de Ambiente

Arquivo `.env.local` em `trax-web/`:

```bash
# URL da API (server-side — sem NEXT_PUBLIC_)
API_URL="http://localhost:3000"

# URL da API (client-side — com NEXT_PUBLIC_)
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Domínio base do SaaS
NEXT_PUBLIC_TRAX_BASE_DOMAIN="localhost"
NEXT_PUBLIC_BASE_DOMAIN="localhost"

# NextAuth
AUTH_SECRET="mesmo-valor-do-trax-api"
AUTH_URL="http://localhost:3001"

# JWT (para validar tokens da API)
JWT_SECRET="mesmo-valor-do-trax-api"
```

---

## Estrutura de Diretórios

```
trax-web/src/
│
├── app/                           # Rotas Next.js App Router
│   ├── (dashboard)/               # Route group protegido (autenticado)
│   │   ├── layout.tsx             # Valida sessão, renderiza Sidebar/Header
│   │   ├── page.tsx               # Dashboard principal (KPIs + gráficos)
│   │   ├── clients/               # CRUD de clientes
│   │   │   ├── page.tsx           # Listagem de clientes
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx       # Detalhes do cliente
│   │   │   └── new/
│   │   │       └── page.tsx       # Formulário de criação
│   │   ├── reports/               # Relatórios
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── settings/              # Configurações white-label
│   │   │   └── page.tsx
│   │   └── users/                 # Gestão de equipe
│   │       └── page.tsx
│   │
│   ├── admin-panel/               # Super Admin (apenas SUPER_ADMIN)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── (dashboard)/
│   │       ├── page.tsx           # Visão geral da plataforma
│   │       └── agencies/
│   │           ├── page.tsx
│   │           └── [id]/page.tsx
│   │
│   ├── landing/                   # Landing page pública
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── login/page.tsx             # Login white-label por tenant
│   ├── signup/page.tsx            # Cadastro de nova agência
│   ├── share/[token]/page.tsx     # Relatório público (sem login)
│   ├── logout/page.tsx            # Logout
│   │
│   ├── api/                       # Next.js Route Handlers
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth callbacks
│   │   └── tls-verify/route.ts          # Verificação Caddy
│   │
│   ├── layout.tsx                 # Root layout: tenant resolver + CSS vars + providers
│   └── globals.css                # Design system: tokens CSS, utilities, animações
│
├── components/                    # Componentes reutilizáveis
│   ├── ui/                        # Primitivos (Button, Input, Card, Badge, ...)
│   ├── layout/                    # Shell (Sidebar, Header, Topbar)
│   ├── auth/                      # LoginForm, SignupForm
│   ├── dashboard/                 # KpiCard, DashboardCharts, ActivityFeed
│   ├── clients/                   # ClientTable, ClientForm, ClientDetail
│   ├── reports/                   # ReportCard, ReportViewer
│   ├── integrations/              # IntegrationCard
│   ├── settings/                  # BrandingEditor, ColorPicker
│   ├── admin/                     # AgencyTable, PlatformMetrics
│   └── providers/                 # QueryProvider, SessionProvider
│
├── hooks/                         # Custom React hooks
│   ├── use-clients.ts             # CRUD de clientes (TanStack Query)
│   ├── use-reports.ts             # CRUD de relatórios
│   └── use-tenant-theme.ts        # Acesso ao tema do tenant
│
├── lib/                           # Utilitários e configurações
│   ├── api-client.ts              # Wrapper fetch para a API
│   ├── auth.ts                    # Configuração NextAuth v5
│   ├── domains.ts                 # isAdminHost, isClientHost, isRootDomain
│   ├── roles.ts                   # canAccessNavItem, role helpers
│   ├── tenant.ts                  # resolveTenant, brandingToCssString
│   └── utils.ts                   # cn(), formatters, helpers
│
├── types/                         # Tipos TypeScript compartilhados
│   ├── api.ts                     # Tipos de response da API
│   └── tenant.ts                  # TenantResolved, TenantBranding
│
└── middleware.ts                  # Lógica de roteamento por domínio
```

---

## Design System

### Tokens CSS — Hierarquia

```css
/* 1. Defaults do sistema (globals.css @theme) */
--color-primary: #6366f1;
--color-bg: #f8fafc;

/* 2. Dark mode (.dark class no <html>) */
.dark { --color-bg: #020617; }

/* 3. Tenant sobrescreve via <style> no layout.tsx (sem FOUC) */
:root {
  --color-primary: #E74C3C;    /* Cor da agência */
  --color-secondary: #C0392B;
  --font-family: 'Montserrat'; /* Fonte da agência */
  --radius-md: 4px;            /* Border radius da agência */
}
```

### Paleta de Cores do Sistema

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--color-primary` | Tenant | Tenant | Botões, links, destaque |
| `--color-secondary` | Tenant | Tenant | Estados hover, variante |
| `--color-accent` | Tenant | Tenant | Alertas, badges especiais |
| `--color-bg` | `#f8fafc` | `#020617` | Background geral |
| `--color-surface` | `#ffffff` | `#0f172a` | Cards, modais |
| `--color-surface-2` | `#f1f5f9` | `#1e293b` | Background secundário |
| `--color-border` | `#e2e8f0` | `#334155` | Bordas, divisores |
| `--color-foreground` | `#0f172a` | `#f1f5f9` | Texto principal |
| `--color-muted-foreground` | `#64748b` | `#94a3b8` | Texto secundário |
| `--color-success` | `#10b981` | `#10b981` | Estado positivo |
| `--color-danger` | `#ef4444` | `#ef4444` | Estado de erro |
| `--color-warning` | `#f59e0b` | `#f59e0b` | Estado de alerta |

### Classes Utilitárias Globais

```tsx
// Glassmorphism
<div className="glass">               {/* Background: rgba + blur(12px) */}
<div className="glass-strong">        {/* Background: rgba + blur(20px) */}

// Gradientes
<div className="gradient-primary">    {/* Linear gradient primary → secondary */}
<span className="gradient-text">      {/* Gradient aplicado ao texto */}

// Card base
<div className="card">                {/* Surface + border + shadow */}

// Loading skeleton
<div className="shimmer">             {/* Animação de shimmer */}

// Animações
<div className="animate-fade-in">     {/* Fade + slide up (0.4s) */}

// Glow
<button className="glow-primary">     {/* Box shadow com cor primária */}
```

---

## Componentes

### Hierarquia e Responsabilidades

```
ui/           → Primitivos sem lógica de negócio (Button, Input, Card, Badge)
               → Sem chamadas a API. Sem estado global.
               → Props mínimas, altamente composáveis.

layout/        → Shell da aplicação (Sidebar, Header, Topbar)
               → Recebem tenant e sessão via props (Server Component pai)
               → Sidebar: 'use client' (collapsed state local)

dashboard/     → Componentes específicos do dashboard
               → Podem ter TanStack Query hooks
               → KpiCard, DashboardCharts (recharts), ActivityFeed

clients/       → CRUD de clientes
reports/       → CRUD e visualização de relatórios
settings/      → Configurações white-label (ColorPicker, BrandingEditor)
admin/         → Painel do super-admin (AgencyTable, PlatformMetrics)
```

### Criando Novo Componente

```tsx
// ✅ Exemplo de componente bem estruturado
// src/components/clients/client-card.tsx

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Client } from '@/types/api'

interface ClientCardProps {
  client: Client
  className?: string
  onEdit?: (id: string) => void
}

export function ClientCard({ client, className, onEdit }: ClientCardProps) {
  return (
    <article
      className={cn(
        'card p-4 flex items-center justify-between gap-4',
        'hover:border-[var(--color-primary)] transition-colors duration-150',
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Logo ou inicial */}
        <div className="w-10 h-10 rounded-[var(--radius-md)] gradient-primary
                        flex items-center justify-center text-white font-bold shrink-0">
          {client.name[0]}
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-[var(--color-foreground)] truncate">
            {client.name}
          </p>
          {client.email && (
            <p className="text-sm text-[var(--color-muted-foreground)] truncate">
              {client.email}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={client.isActive ? 'success' : 'muted'}>
          {client.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
        {onEdit && (
          <button
            onClick={() => onEdit(client.id)}
            className="text-sm text-[var(--color-muted-foreground)]
                       hover:text-[var(--color-foreground)] transition-colors"
            aria-label={`Editar ${client.name}`}
          >
            Editar
          </button>
        )}
      </div>
    </article>
  )
}
```

---

## Data Fetching

### Server Components (SSR)

```tsx
// src/app/(dashboard)/clients/page.tsx
import { headers } from 'next/headers'
import { apiRequest } from '@/lib/api-client'

// ✅ Server Component: dados carregados no servidor, sem loading state na UI
export default async function ClientsPage() {
  const host = (await headers()).get('host') ?? ''

  // Fetch paralelo (sem waterfall)
  const [clients, reports] = await Promise.allSettled([
    apiRequest<Client[]>('/clients', { domain: host }),
    apiRequest<Report[]>('/reports?limit=5', { domain: host }),
  ])

  const clientList = clients.status === 'fulfilled' ? clients.value : []

  return <ClientsView clients={clientList} />
}
```

### Client Components (TanStack Query)

```tsx
// src/components/clients/clients-table.tsx
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

export function ClientsTable() {
  const queryClient = useQueryClient()

  // ✅ Query com cache e background refetch
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient.get<Client[]>('/clients'),
    staleTime: 30_000, // 30s antes de refetch em background
  })

  // ✅ Mutation com invalidação de cache e feedback ao usuário
  const deleteClient = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente removido com sucesso')
    },
    onError: () => toast.error('Erro ao remover cliente'),
  })

  if (isLoading) return <ClientsTableSkeleton />

  return (
    <div className="space-y-2">
      {clients?.map(client => (
        <ClientCard
          key={client.id}
          client={client}
          onDelete={(id) => deleteClient.mutate(id)}
        />
      ))}
    </div>
  )
}
```

### API Client

```typescript
// src/lib/api-client.ts — uso correto

// Server-side (Server Components, Route Handlers):
const data = await apiRequest<Client[]>('/clients', { domain: host })

// Client-side (Client Components via TanStack Query):
const data = await apiClient.get<Client[]>('/clients')
const created = await apiClient.post<Client>('/clients', { name: 'TechStore' })
const updated = await apiClient.patch<Client>(`/clients/${id}`, { name: 'New Name' })
await apiClient.delete(`/clients/${id}`)
```

---

## Formulários

### Padrão com React Hook Form + Zod

```tsx
// src/components/clients/create-client-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

// ✅ Schema Zod compartilhável com o backend
const createClientSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(255),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
})

type CreateClientForm = z.infer<typeof createClientSchema>

export function CreateClientForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateClientForm>({
    resolver: zodResolver(createClientSchema),
  })

  const createClient = useMutation({
    mutationFn: (data: CreateClientForm) => apiClient.post('/clients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente criado com sucesso!')
      reset()
      onSuccess()
    },
    onError: () => toast.error('Erro ao criar cliente. Tente novamente.'),
  })

  return (
    <form onSubmit={handleSubmit((data) => createClient.mutate(data))} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1.5
                                          text-[var(--color-foreground)]">
          Nome da empresa *
        </label>
        <input
          id="name"
          {...register('name')}
          className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)]
                     bg-[var(--color-surface-2)] text-[var(--color-foreground)]
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
                     placeholder:text-[var(--color-muted)]"
          placeholder="Ex: TechStore LTDA"
        />
        {errors.name && (
          <p className="text-sm text-[var(--color-danger)] mt-1">{errors.name.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 px-4 rounded-[var(--radius-md)] gradient-primary
                   text-white font-semibold transition-opacity
                   hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Criando...' : 'Criar cliente'}
      </button>
    </form>
  )
}
```

---

## Autenticação

### Fluxo NextAuth v5

```typescript
// src/lib/auth.ts — configuração
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, domain: {} },
      async authorize({ email, password, domain }) {
        // Chama POST /api/v1/auth/login na trax-api
        const response = await loginWithApi(email, password, domain)
        if (!response) return null
        return response.user // { id, email, name, role, agencyId, isSuperAdmin }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.agencyId = user.agencyId
        token.isSuperAdmin = user.isSuperAdmin
        token.accessToken = user.accessToken
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role
      session.user.agencyId = token.agencyId
      session.user.isSuperAdmin = token.isSuperAdmin
      return session
    },
  },
})
```

### Acessando a sessão

```tsx
// Server Component
import { auth } from '@/lib/auth'
const session = await auth()
if (!session) redirect('/login')
const userRole = session.user?.role

// Client Component
import { useSession } from 'next-auth/react'
const { data: session, status } = useSession()
```

---

## Tenant e White-Label

### Como funciona a resolução de tenant

```
1. Request chega para {slug}.localhost:3001
2. layout.tsx (Server Component) chama resolveTenant(host)
3. resolveTenant() chama GET {API_URL}/api/v1/tenant/resolve?domain={host}
4. Recebe: { agencyId, name, branding: { primaryColor, logoUrl, fontFamily, ... } }
5. brandingToCssString(branding) gera CSS string:
     ":root { --color-primary: #E74C3C; --color-secondary: ...; }"
6. <style dangerouslySetInnerHTML> injeta no <head> ANTES do render (sem FOUC)
7. Font customizada? <link> para Google Fonts injetado também
```

### Acessando o tenant em componentes

```tsx
// Server Component — via prop do layout
export default async function DashboardLayout({ children }) {
  const tenant = await resolveTenant(host)
  return <Sidebar tenant={tenant} />
}

// Client Component — via hook (Zustand store populado pelo layout)
import { useTenantTheme } from '@/hooks/use-tenant-theme'
const { primaryColor, logoUrl } = useTenantTheme()
```

---

## Anti-Patterns — O Que Evitar

### ❌ Cores Tailwind sem remapeamento

```tsx
// ❌ Errado — não responde ao tema do tenant
<div className="bg-white text-gray-900 border-gray-200">

// ✅ Correto — responde ao tenant e ao dark mode
<div className="bg-[var(--color-surface)] text-[var(--color-foreground)] border-[var(--color-border)]">
```

### ❌ Fetch desnecessário no client

```tsx
// ❌ Errado — dados estáticos buscados no cliente (causa loading state)
'use client'
export function ClientsPage() {
  const [clients, setClients] = useState([])
  useEffect(() => { fetchClients().then(setClients) }, [])
  return <ul>{clients.map(...)}</ul>
}

// ✅ Correto — Server Component, dados no servidor
export default async function ClientsPage() {
  const clients = await apiRequest('/clients', { domain: host })
  return <ul>{clients.map(...)}</ul>
}
```

### ❌ `any` no TypeScript

```tsx
// ❌ Errado
const handleResponse = (data: any) => { ... }
const user = session?.user as any

// ✅ Correto
interface ClientApiResponse { id: string; name: string; isActive: boolean }
const handleResponse = (data: ClientApiResponse) => { ... }
const user = session?.user as AuthUser
```

---

## Responsividade

```tsx
// Breakpoints disponíveis (Tailwind padrão)
// sm: 640px | md: 768px | lg: 1024px | xl: 1280px | 2xl: 1536px

// ✅ Grid responsivo (mobile-first)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// ✅ Sidebar: hidden em mobile, visível em desktop
<aside className="hidden lg:flex lg:w-60 ...">

// ✅ Topbar mobile em vez de sidebar
{isMobile ? <Topbar /> : <Sidebar />}
```

---

## Testes

### Componentes (Vitest + React Testing Library)

```tsx
// src/components/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Clique aqui</Button>)
    expect(screen.getByText('Clique aqui')).toBeInTheDocument()
  })

  it('chama onClick quando clicado', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Salvar</Button>)
    fireEvent.click(screen.getByText('Salvar'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('desabilitado quando isLoading=true', () => {
    render(<Button isLoading>Salvando...</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### E2E (Playwright)

```typescript
// tests/e2e/login.spec.ts
test('login white-label da agência', async ({ page }) => {
  await page.goto('http://agenciademo.localhost:3001/login')
  
  // Verificar branding carregado
  await expect(page.locator('img[alt="Agência Demo"]')).toBeVisible()
  
  // Login
  await page.fill('[name="email"]', 'admin@agenciademo.com')
  await page.fill('[name="password"]', 'admin123!')
  await page.click('[type="submit"]')
  
  // Redirect para dashboard
  await expect(page).toHaveURL('http://agenciademo.localhost:3001/')
  await expect(page.locator('h2')).toContainText('Dashboard')
})
```

---

## Performance — Checklist

- [ ] Server Component por padrão — `'use client'` justificado no comentário
- [ ] Imagens otimizadas: `<Image>` do Next.js para assets internos
- [ ] Loading states: skeleton em todos os dados assíncronos
- [ ] Paginação: `?limit=20&cursor=...` em listas grandes
- [ ] `staleTime` configurado no TanStack Query (não ficar refetchando sem necessidade)
- [ ] Fontes com `display: 'swap'` para evitar FOIT
- [ ] CSS variables para tema (sem JS no critical path de renderização)

---

## Referências

- [ARCHITECTURE.md](../ARCHITECTURE.md) — Decisões arquiteturais
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Radix UI Docs](https://www.radix-ui.com)
