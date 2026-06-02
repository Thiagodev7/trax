# Trax API — AI Agent Rules

> Este arquivo guia agentes de IA (Antigravity, Cursor, Copilot) que trabalham no `trax-api`.
> **Leia inteiro antes de escrever qualquer linha de código.**

---

## Stack e Versões

| Tecnologia | Versão | Observação |
|-----------|--------|-----------|
| NestJS | **10.x** | |
| TypeScript | **5.x** | strict mode — sem `any` |
| Prisma | **5.x** | ORM — NÃO usar queries raw sem motivo |
| Node.js | **20 LTS** | |
| PostgreSQL | **16** | |
| Redis | **7** (ioredis) | |

---

## A Regra de Ouro — Multi-Tenancy (NUNCA VIOLAR)

> [!CAUTION]
> **TODA query ao banco que acessa dados de agência DEVE incluir `agencyId` da `TenantContext`.**
> Violação = falha crítica de segurança (data leakage entre clientes).

```typescript
// ✅ CORRETO — agencyId do AsyncLocalStorage (resolvido pelo domínio HTTP)
async execute(): Promise<Client[]> {
  const agencyId = this.tenantContext.getAgencyId();
  return this.prisma.client.findMany({ where: { agencyId } });
}

// ❌ ERRADO — agencyId do body/params pode ser manipulado
async execute(agencyId: string): Promise<Client[]> {
  return this.prisma.client.findMany({ where: { agencyId } }); // INSECURE
}

// ❌ ERRADO — agencyId do JWT pode ser de outra agência (token reuse)
async execute(user: AuthUser): Promise<Client[]> {
  return this.prisma.client.findMany({ where: { agencyId: user.agencyId } }); // INSECURE
}
```

---

## Clean Architecture — Regras de Camada

```
Presentation (Controller, DTO)
  ↓ chama
Application (Use Case)
  ↓ chama
Domain (Repository interface, Entity)
  ↑ implementado por
Infrastructure (PrismaRepository)
```

**Proibições:**
- Controller **NUNCA** importa Prisma
- Controller **NUNCA** contém lógica de negócio
- Use Case **NUNCA** importa Controller
- Domain **NUNCA** importa NestJS, Prisma, ou qualquer framework
- Use Case recebe `agencyId` do `TenantContext`, **nunca** do DTO

---

## Estrutura de Módulo — Template

Ao criar novo módulo, sempre seguir esta estrutura:

```
src/modules/<nome>/
  presentation/
    <nome>.controller.ts
    dto/
      create-<nome>.dto.ts
      update-<nome>.dto.ts
      <nome>-response.dto.ts
  application/
    use-cases/
      create-<nome>.use-case.ts
      list-<nome>.use-case.ts
      ...
  domain/
    entities/
      <nome>.entity.ts             ← Classe pura, sem decorators
    repositories/
      <nome>.repository.ts         ← Abstract class (interface)
    errors/
      <nome>-not-found.error.ts   ← extends Error
  infrastructure/
    repositories/
      prisma-<nome>.repository.ts  ← implements <nome>.repository
  <nome>.module.ts
```

---

## Guards — Aplicação Correta

```typescript
// Ordem OBRIGATÓRIA dos guards:
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(UserRole.AGENCY_ADMIN)
@Post('clientes')
async criar(@Body() dto: CriarClienteDto) { ... }

// Rota pública (sem auth):
@Get('shared/:token')
async getPublico(@Param('token') token: string) { ... }

// Rota apenas autenticada (sem verificação de tenant):
@UseGuards(JwtAuthGuard)
@Get('me')
async getMe(@GetUser() user: AuthUser) { ... }
```

---

## DTOs — Regras

```typescript
// ✅ DTO de input com validação completa
export class CreateClienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ example: 'TechStore LTDA' })
  nome: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

// ✅ DTO de response com @Exclude() para segurança
@Exclude()
export class ClienteResponseDto {
  @Expose() id: string;
  @Expose() nome: string;
  // agencyId NÃO é exposto
  // passwordHash NÃO é exposto
  // credentialsEnc NÃO é exposto
}

// ValidationPipe global já está configurado com:
// whitelist: true          → remove campos extras automaticamente
// forbidNonWhitelisted: true → retorna 400 para campos extras
```

---

## Queries Prisma — Padrões

```typescript
// ✅ SEMPRE incluir agencyId
await this.prisma.client.findMany({
  where: { agencyId },           // ← OBRIGATÓRIO
  orderBy: { createdAt: 'desc' },
  take: limit,
})

// ✅ findFirst com agencyId + id (evitar IDOR)
await this.prisma.report.findFirst({
  where: { id, agencyId },       // ← dupla verificação
})

// ✅ Paginação cursor-based em listas grandes
await this.prisma.dailyMetric.findMany({
  where: { integrationId, agencyId },
  take: limit + 1,
  ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  orderBy: { date: 'desc' },
})

// ❌ NUNCA: query sem agencyId em tabela de tenant
await this.prisma.client.findMany({ where: { isActive: true } }) // INSECURE

// ❌ NUNCA: findUnique por id sem verificar agencyId
await this.prisma.report.findUnique({ where: { id } }) // INSECURE
```

---

## Erros de Domínio

```typescript
// ✅ Erros tipados (src/modules/<nome>/domain/errors/)
export class ClienteNaoEncontradoError extends Error {
  constructor(id: string) {
    super(`Cliente não encontrado: ${id}`);
    this.name = 'ClienteNaoEncontradoError';
  }
}

// ✅ GlobalExceptionFilter mapeia para HTTP
// Nunca usar: throw new HttpException('...', 404)  dentro de Use Case
// Sempre usar: throw new ClienteNaoEncontradoError(id)

// Mapeamento no filter:
if (exception instanceof ClienteNaoEncontradoError) {
  status = 404;
  code = 'CLIENT_NOT_FOUND';
}
```

---

## Injeção de Dependência — Tokens

```typescript
// ✅ Sempre use token simbólico, nunca implementação concreta
export const CLIENTE_REPOSITORY_TOKEN = Symbol('ClienteRepository');

// No módulo:
{
  provide: CLIENTE_REPOSITORY_TOKEN,
  useClass: PrismaClienteRepository,
}

// No use case:
constructor(
  @Inject(CLIENTE_REPOSITORY_TOKEN)
  private readonly clienteRepo: ClienteRepository,  // interface, não Prisma
) {}
```

---

## Segurança — Checklist por Endpoint

Antes de finalizar qualquer endpoint:

- [ ] `agencyId` vem do `TenantContext` (nunca do body/params/query/JWT)
- [ ] Guards: `JwtAuthGuard + TenantGuard` aplicados
- [ ] Role: `@Roles()` configurado corretamente
- [ ] DTO com `@IsNotEmpty()`, `@MaxLength()` e tipos corretos
- [ ] Response DTO com `@Exclude()` (não expor dados internos)
- [ ] Paginação em endpoints de listagem (não retornar todos os registros)
- [ ] Erro de domínio tipado (não `throw new Error('mensagem')`)
- [ ] Audit log para ações CREATE/UPDATE/DELETE

---

## Teste de Isolamento Multi-Tenant — OBRIGATÓRIO

Todo novo Use Case DEVE ter este teste:

```typescript
it('NUNCA usa agencyId externo — sempre do TenantContext', async () => {
  const dtoMalicioso = { nome: 'Hacker', agencyId: 'outra-agencia' };

  await useCase.execute(dtoMalicioso as any);

  expect(repo.create).toHaveBeenCalledWith(
    expect.objectContaining({ agencyId: 'minha-agencia' })  // do contexto
  );
  expect(repo.create).not.toHaveBeenCalledWith(
    expect.objectContaining({ agencyId: 'outra-agencia' })
  );
});
```

---

## Nomenclatura — Referência Rápida

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Arquivo | `kebab-case.type.ts` | `create-client.use-case.ts` |
| Classe | `PascalCase` | `CreateClientUseCase` |
| Método | `camelCase` | `execute()`, `findByAgency()` |
| Constante de token | `SCREAMING_SNAKE_CASE` | `CLIENT_REPOSITORY_TOKEN` |
| Variável de ambiente | `SCREAMING_SNAKE_CASE` | `JWT_SECRET` |
| Endpoint REST | `kebab-case` | `/api/v1/agency-settings` |

---

## Referências

- [trax-api/README.md](./README.md) — Guia completo do backend
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Decisões arquiteturais
- [docs/security.md](../docs/security.md) — Modelo de segurança
- [Prisma Schema](./prisma/schema.prisma) — Fonte da verdade do banco
- [Swagger UI](http://localhost:3000/api/docs) — Documentação da API
