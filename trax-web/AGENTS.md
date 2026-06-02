# Trax Web — AI Agent Rules

> Este arquivo guia agentes de IA (Antigravity, Cursor, Copilot) que trabalham no `trax-web`.
> **Leia inteiro antes de escrever qualquer linha de código.**

---

## Stack e Versões (CRÍTICO)

| Tecnologia | Versão | Observação |
|-----------|--------|-----------|
| Next.js | **16.x** (App Router) | NÃO é Next.js 14/15 — APIs podem diferir |
| React | **19.x** | Server Components por padrão |
| TypeScript | 5.x | strict mode ativado |
| Tailwind CSS | **v4** | Sintaxe @theme, não tailwind.config.js |
| NextAuth | **v5 (beta)** | Auth.js — API completamente diferente do v4 |
| TanStack Query | **v5** | `useQuery({ queryKey, queryFn })` — sem queryClient.invalidateQueries com string |
| Zod | **v4** | Algumas APIs mudaram em relação ao v3 |

> ⚠️ **ATENÇÃO**: Estas versões têm breaking changes em relação ao que provavelmente está no seu training data.
> Consulte `node_modules/next/dist/docs/` antes de usar qualquer API Next.js que não seja trivial.

---

## Arquitetura Multi-Tenant (NÃO IGNORAR)

O Trax é um SaaS onde **cada agência tem sua própria URL** e **dados completamente isolados**.

### Como o tenant é resolvido no frontend

```typescript
// layout.tsx — Root layout
// O tenant é identificado pelo HOST header HTTP (ex: agenciademo.localhost:3001)
// resolveTenant() chama a API para buscar branding por domínio
const tenant = await resolveTenant(host)

// CSS variables do tenant são injetadas ANTES do render (sem FOUC):
<style dangerouslySetInnerHTML={{ __html: brandingToCssString(tenant.branding) }} />
```

### Regras de desenvolvimento para multi-tenancy

1. **NUNCA** hardcode cores — sempre `var(--color-primary)`, `var(--color-surface)`, etc.
2. **NUNCA** use `bg-white`, `text-gray-900` — quebrará o white-label
3. **NUNCA** armazene `agencyId` no localStorage — use apenas a sessão NextAuth
4. O middleware (`src/middleware.ts`) já cuida do roteamento por domínio — não duplicar lógica

---

## Design System — Regras de Ouro

### ✅ Classes corretas

```tsx
// Backgrounds
className="bg-[var(--color-bg)]"           // Fundo geral
className="bg-[var(--color-surface)]"      // Cards, painéis
className="bg-[var(--color-surface-2)]"    // Fundo secundário

// Textos
className="text-[var(--color-foreground)]"           // Texto principal
className="text-[var(--color-muted-foreground)]"     // Texto secundário
className="text-[var(--color-primary)]"              // Destaque/accent

// Bordas
className="border-[var(--color-border)]"   // Bordas padrão

// Classes utilitárias prontas (definidas em globals.css)
className="card"                           // Card com borda e sombra
className="glass"                          // Glassmorphism
className="gradient-primary"               // Gradiente primário
className="gradient-text"                  // Texto gradiente
className="shimmer"                        // Skeleton loading
className="animate-fade-in"               // Entrada suave
```

### ❌ Anti-patterns de design

```tsx
// ❌ Cores hardcoded — quebrará white-label
className="bg-white text-gray-900"
className="border-gray-200"
style={{ color: '#6366f1' }}   // use var(--color-primary)

// ❌ Componentes genéricos sem adaptação ao tema
<div className="bg-zinc-800">  // não responde ao tenant

// ❌ Frontend que parece gerado por IA
// - Sem micro-animações (Framer Motion)
// - Gradientes ausentes nos CTAs
// - Cards sem glassmorphism onde apropriado
// - Bordas arredondadas fixas (use var(--radius-md))
// - Empty states sem ilustração/ícone
// - Loading sem skeleton (shimmer)
```

---

## Server vs Client Components

```tsx
// ✅ Server Component (padrão) — sem 'use client'
// Acessa banco, headers, cookies no servidor
// Sem state, sem event handlers, sem hooks
export default async function ClientsPage() {
  const clients = await apiRequest('/clients', { domain: host })
  return <ClientsTable clients={clients} />  // passa dados como props
}

// ✅ Client Component — apenas quando necessário
'use client'
// Use quando: useState, useEffect, event handlers, browser APIs
// Anime com Framer Motion, TanStack Query para refetch
export function ClientsTable({ initialClients }: Props) {
  const { data } = useQuery({ queryKey: ['clients'], ... })
  ...
}

// ❌ Errado: 'use client' desnecessário em componente estático
'use client'  // ← remove isso se não usa hooks/eventos
export function StaticCard({ title, value }: Props) {
  return <div>{title}: {value}</div>
}
```

---

## Data Fetching

### Server Components (SSR — preferido para dados iniciais)

```typescript
import { apiRequest } from '@/lib/api-client'
import { headers } from 'next/headers'

// O apiRequest passa o domínio para a API resolver o tenant
const host = (await headers()).get('host') ?? ''
const clients = await apiRequest<Client[]>('/clients', { domain: host })
```

### Client Components (TanStack Query — para interatividade)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['clients'],
  queryFn: () => apiClient.get<Client[]>('/clients'),
  staleTime: 30_000,
})

// Mutation com invalidação
const { mutate, isPending } = useMutation({
  mutationFn: (data: CreateClientDto) => apiClient.post('/clients', data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
})
```

---

## Estrutura de Arquivos — Convenções

```
src/components/<feature>/
  <component-name>.tsx         ← Componente principal
  <component-name>.types.ts    ← Tipos TypeScript da feature
  index.ts                     ← Re-exports públicos

src/app/(dashboard)/<route>/
  page.tsx                     ← Server Component (dados iniciais)
  <route>-client.tsx           ← Client Component (interatividade)
  loading.tsx                  ← Suspense skeleton (opcional)
  error.tsx                    ← Error boundary (opcional)
```

---

## Formulários — Padrão Obrigatório

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().optional(),
})
type FormData = z.infer<typeof schema>

export function MyForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  ...
}
```

---

## Acessibilidade (A11Y)

- Todo `<img>` deve ter `alt` descritivo
- Botões sem texto visível: `aria-label` obrigatório
- Formulários: `<label>` associado a cada `<input>` via `htmlFor` / `id`
- Cores: contraste WCAG AA mínimo (4.5:1 para texto normal)
- Foco visível: `:focus-visible` já configurado em `globals.css`
- Não usar `tabIndex > 0`

---

## Animações — Quando e Como

```tsx
import { motion, AnimatePresence } from 'framer-motion'

// ✅ Entradas de página/seção
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35, ease: 'easeOut' }}
>

// ✅ Listas (adicionar/remover itens)
<AnimatePresence>
  {items.map(item => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    />
  ))}
</AnimatePresence>

// ✅ Hover e tap em botões/cards
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}

// ❌ Excessivo — não animar elementos que já estão na tela sem motivo
// ❌ Animações longas (>500ms) sem propósito
```

---

## Erros Comuns para Evitar

1. **Usar `router.push()` em Server Component** — apenas Client Components têm `useRouter()`
2. **Usar `window`, `document`, `localStorage` direto** — verifique `typeof window !== 'undefined'`
3. **Esquecia de `await` em Server Components assíncronos** — `headers()`, `auth()` retornam Promises no Next.js 15+
4. **Passar componentes não serializáveis entre Server/Client** — funções não podem passar como props (use `'use server'` actions)
5. **Usar `fetch` com cache default em dados de tenant** — adicione `{ cache: 'no-store' }` ou `revalidate` correto
6. **Ignorar loading states** — toda chamada async precisa de skeleton/spinner

---

## Importações Absolutas

```typescript
// ✅ Sempre use @/ para imports do projeto
import { apiRequest } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import type { Client } from '@/types/api'

// ❌ Nunca use paths relativos profundos
import { Button } from '../../../components/ui/button'
```

---

## Referências

- [trax-web/README.md](./README.md) — Guia completo do frontend
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Decisões arquiteturais
- [docs/security.md](../docs/security.md) — Modelo de segurança
- `node_modules/next/dist/docs/` — Documentação local do Next.js 16
