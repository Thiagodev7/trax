# Trax Web — Cursor Rules

> Regras para Cursor AI trabalhando no `trax-web`.
> Complementa o AGENTS.md com regras no formato preferido pelo Cursor.

---

## Projeto

Trax é um SaaS de relatórios de marketing white-label multi-tenant.
Frontend: Next.js 16 App Router + React 19 + Tailwind CSS v4 + TypeScript strict.

Cada agência tem sua URL própria, logo e cores. O tema é aplicado via CSS custom properties.

## Arquivos de Referência

- [../ARCHITECTURE.md](../ARCHITECTURE.md) — Decisões arquiteturais do projeto
- [./AGENTS.md](./AGENTS.md) — Regras completas para agentes de IA
- [./README.md](./README.md) — Guia do desenvolvedor

## Regras Críticas

### Multi-Tenancy

NUNCA hardcode agencyId. NUNCA leia agencyId de localStorage.
O tenant é resolvido em `src/lib/tenant.ts` via Host header HTTP.
Sessão NextAuth contém role e dados do usuário — não agencyId como source de truth de segurança.

### Design System

NUNCA use cores Tailwind direto (bg-white, text-gray-900, border-gray-200).
SEMPRE use CSS variables: `var(--color-bg)`, `var(--color-surface)`, `var(--color-foreground)`, `var(--color-border)`, `var(--color-primary)`.
Classes utilitárias prontas em globals.css: `.card`, `.glass`, `.gradient-primary`, `.gradient-text`, `.shimmer`, `.animate-fade-in`.

### Server vs Client Components

Server Components por padrão. `'use client'` apenas com justificativa.
Dados iniciais: `apiRequest()` em Server Components.
Interatividade e refetch: TanStack Query em Client Components.

### TypeScript

strict mode. ZERO `any`. ZERO `as any`.
Props sempre tipadas com interfaces explícitas.
Usar `unknown` + type guards quando necessário.

## Qualidade Visual

O frontend NÃO pode parecer gerado por IA.
Obrigatório: micro-animações com Framer Motion, glassmorphism onde apropriado,
gradientes nos CTAs, skeleton shimmer em loading states, empty states com ícone/ilustração.
Border radius sempre `var(--radius-md)` ou similar (não hardcoded).
