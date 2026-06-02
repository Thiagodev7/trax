# Trax API — Developer Guide

> Backend NestJS do Trax — guia completo para desenvolvimento, padrões e contribuição.

---

## Visão Geral

O `trax-api` é o backend REST do Trax, construído com NestJS 10 + Prisma 5 + PostgreSQL 16.

**Princípios fundamentais:**
- **Clean Architecture** — separação estrita de camadas
- **Multi-tenant seguro** — `agencyId` via `TenantContext`, nunca do request body
- **TypeScript estrito** — sem `any`, sem atalhos
- **Testes primeiro** — Use Cases testáveis sem banco

---

## Requisitos

| Dependência | Versão |
|------------|--------|
| Node.js | 20 LTS |
| PostgreSQL | 16 |
| Redis | 7 |
| npm | 10.x |

---

## Setup Local

```bash
# A partir da raiz do monorepo (trax/)
npm run infra:up          # Postgres + Redis
npm run db:migrate        # Aplica migrations
npm run db:seed           # Dados de demonstração
npm run dev:api           # Inicia apenas a API (:3000)

# Ou tudo junto:
npm run dev               # API (:3000) + Web (:3001)
```

### Variáveis de Ambiente

Copie `../.env.example` para `../.env` e ajuste:

```bash
# Banco de dados
DATABASE_URL="postgresql://trax:trax@localhost:5432/trax?schema=public"
DIRECT_URL="postgresql://trax:trax@localhost:5432/trax?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT (gere com: openssl rand -base64 32)
JWT_SECRET="seu-segredo-aqui"
JWT_REFRESH_SECRET="outro-segredo-aqui"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Auth (NextAuth)
AUTH_SECRET="outro-segredo-aqui"

# Criptografia de credenciais (gere com: openssl rand -hex 32)
ENCRYPTION_KEY="64-chars-hex-aqui"

# Domínio base
TRAX_BASE_DOMAIN="localhost"
NODE_ENV="development"
APP_PORT=3000
```

---

## Estrutura de Diretórios

```
trax-api/
├── src/
│   ├── main.ts                    # Bootstrap: segurança, CORS, Swagger, versioning
│   ├── app.module.ts              # Módulo raiz + TenantMiddleware global
│   │
│   ├── common/                    # Infraestrutura transversal
│   │   ├── config/
│   │   │   └── domains.ts         # Lógica de resolução de domínios
│   │   ├── context/
│   │   │   └── tenant.context.ts  # AsyncLocalStorage do agencyId
│   │   ├── decorators/
│   │   │   ├── get-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts  # Mapeia erros → HTTP responses
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── tenant.guard.ts    # Valida agencyId JWT === agencyId do domínio
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   └── audit-context.interceptor.ts
│   │   ├── middleware/
│   │   │   └── tenant.middleware.ts  # Resolve agencyId por Host header
│   │   └── utils/
│   │       └── crypto.util.ts     # AES-256-GCM encrypt/decrypt
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts      # PrismaClient singleton com logging
│   │
│   └── modules/                   # Módulos de negócio
│       ├── agency/
│       ├── auth/
│       ├── audit-log/
│       ├── client/
│       │   └── meta-config/
│       ├── email/
│       ├── health/
│       ├── integration/
│       ├── metrics/
│       ├── onboarding/
│       ├── report/
│       ├── scheduling/
│       ├── super-admin/
│       ├── tenant/
│       ├── upload/
│       └── user/
│
└── prisma/
    ├── schema.prisma              # FONTE DA VERDADE do banco
    ├── migrations/                # Histórico de migrações (commitar sempre)
    └── seed.ts                    # Dados de demonstração
```

---

## Criando um Novo Módulo

### 1. Estrutura de arquivos

```bash
# Exemplo: criar módulo "invoice"
mkdir -p src/modules/invoice/{presentation/dto,application/use-cases,domain/{entities,repositories,errors},infrastructure/repositories}
touch src/modules/invoice/invoice.module.ts
```

### 2. Domain Entity (sem dependências de framework)

```typescript
// src/modules/invoice/domain/entities/invoice.entity.ts
export class Invoice {
  constructor(
    public readonly id: string,
    public readonly agencyId: string,
    public readonly amount: number,
    public readonly dueAt: Date,
    public readonly paidAt: Date | null,
  ) {}

  isPaid(): boolean {
    return this.paidAt !== null;
  }

  isOverdue(): boolean {
    return !this.isPaid() && new Date() > this.dueAt;
  }
}
```

### 3. Repository Interface (Domain)

```typescript
// src/modules/invoice/domain/repositories/invoice.repository.ts
export abstract class InvoiceRepository {
  abstract findByAgency(agencyId: string, cursor?: string, limit?: number): Promise<Invoice[]>;
  abstract findById(id: string, agencyId: string): Promise<Invoice | null>;
  abstract create(data: Omit<Invoice, 'id'>): Promise<Invoice>;
  abstract update(id: string, agencyId: string, data: Partial<Invoice>): Promise<Invoice>;
}

// Token para injeção de dependência
export const INVOICE_REPOSITORY_TOKEN = Symbol('InvoiceRepository');
```

### 4. Domain Errors

```typescript
// src/modules/invoice/domain/errors/invoice-not-found.error.ts
export class InvoiceNotFoundError extends Error {
  constructor(id: string) {
    super(`Invoice not found: ${id}`);
    this.name = 'InvoiceNotFoundError';
  }
}
```

### 5. Use Case (Application)

```typescript
// src/modules/invoice/application/use-cases/create-invoice.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { TenantContext } from '@common/context/tenant.context';
import { InvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/repositories/invoice.repository';
import { CreateInvoiceDto } from '../../presentation/dto/create-invoice.dto';

@Injectable()
export class CreateInvoiceUseCase {
  constructor(
    private readonly tenantContext: TenantContext,
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepo: InvoiceRepository,
  ) {}

  async execute(dto: CreateInvoiceDto) {
    const agencyId = this.tenantContext.getAgencyId(); // NUNCA do DTO
    
    // Lógica de negócio aqui
    return this.invoiceRepo.create({ agencyId, ...dto });
  }
}
```

### 6. Prisma Repository (Infrastructure)

```typescript
// src/modules/invoice/infrastructure/repositories/prisma-invoice.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { InvoiceRepository } from '../../domain/repositories/invoice.repository';
import { Invoice } from '../../domain/entities/invoice.entity';

@Injectable()
export class PrismaInvoiceRepository implements InvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAgency(agencyId: string, cursor?: string, limit = 20): Promise<Invoice[]> {
    const records = await this.prisma.invoice.findMany({
      where: { agencyId }, // ← agencyId SEMPRE presente
      take: limit,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
    });
    return records.map(this.toEntity);
  }

  async findById(id: string, agencyId: string): Promise<Invoice | null> {
    const record = await this.prisma.invoice.findFirst({
      where: { id, agencyId }, // ← dupla verificação id + agencyId
    });
    return record ? this.toEntity(record) : null;
  }

  private toEntity(record: any): Invoice {
    return new Invoice(record.id, record.agencyId, record.amount, record.dueAt, record.paidAt);
  }
}
```

### 7. DTOs (Presentation)

```typescript
// src/modules/invoice/presentation/dto/create-invoice.dto.ts
import { IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @IsNumber()
  @Min(0.01)
  @ApiProperty({ example: 497.00, description: 'Valor em reais' })
  amount: number;

  @IsDateString()
  @ApiProperty({ example: '2026-07-01' })
  dueAt: string;
}
```

### 8. Controller

```typescript
// src/modules/invoice/presentation/invoice.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateInvoiceUseCase } from '../application/use-cases/create-invoice.use-case';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly createInvoice: CreateInvoiceUseCase) {}

  @Post()
  @Roles(UserRole.AGENCY_ADMIN)
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateInvoiceDto) {
    return this.createInvoice.execute(dto);
  }
}
```

### 9. Module

```typescript
// src/modules/invoice/invoice.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { TenantModule } from '../tenant/tenant.module';
import { InvoiceController } from './presentation/invoice.controller';
import { CreateInvoiceUseCase } from './application/use-cases/create-invoice.use-case';
import { INVOICE_REPOSITORY_TOKEN } from './domain/repositories/invoice.repository';
import { PrismaInvoiceRepository } from './infrastructure/repositories/prisma-invoice.repository';

@Module({
  imports: [PrismaModule, TenantModule],
  controllers: [InvoiceController],
  providers: [
    CreateInvoiceUseCase,
    {
      provide: INVOICE_REPOSITORY_TOKEN,
      useClass: PrismaInvoiceRepository,
    },
  ],
})
export class InvoiceModule {}
```

---

## Autenticação e Guards

### Aplicação de Guards

```typescript
// Rota pública (sem guard)
@Get('health')
healthCheck() {}

// Rota autenticada (JWT válido, qualquer tenant)
@UseGuards(JwtAuthGuard)
@Get('me')
getProfile() {}

// Rota de tenant (JWT válido + agencyId bate com domínio)
@UseGuards(JwtAuthGuard, TenantGuard)
@Get('clients')
listClients() {}

// Rota com role específica
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(UserRole.AGENCY_ADMIN)
@Post('clients')
createClient() {}

// Rota super-admin (tabela separada)
@UseGuards(SuperAdminGuard)
@Get('admin/agencies')
listAgencies() {}
```

### Decorators de Contexto

```typescript
// Pegar usuário autenticado do JWT
@Get('me')
getProfile(@GetUser() user: AuthUser) {
  return { id: user.sub, role: user.role };
}

// O agencyId sempre pelo TenantContext (não pelo usuário)
const agencyId = this.tenantContext.getAgencyId();
```

---

## Testes

### Testes de Use Case (Unit)

```typescript
// src/modules/client/application/use-cases/create-client.use-case.spec.ts
describe('CreateClientUseCase', () => {
  let useCase: CreateClientUseCase;
  let clientRepo: jest.Mocked<ClientRepository>;
  let tenantContext: jest.Mocked<TenantContext>;

  beforeEach(() => {
    clientRepo = { create: jest.fn(), findByAgency: jest.fn() } as any;
    tenantContext = { getAgencyId: jest.fn().mockReturnValue('agency-uuid') } as any;
    useCase = new CreateClientUseCase(tenantContext, clientRepo);
  });

  it('deve criar cliente com agencyId do contexto (não do DTO)', async () => {
    const dto = { name: 'TechStore', email: 'tech@store.com' };
    clientRepo.create.mockResolvedValue({ id: 'client-uuid', agencyId: 'agency-uuid', ...dto });

    await useCase.execute(dto);

    expect(clientRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ agencyId: 'agency-uuid' })
    );
  });

  it('nunca deve usar agencyId do body do DTO', async () => {
    const maliciousDto = { name: 'Hacker', agencyId: 'other-agency' }; // campo extra
    
    await useCase.execute(maliciousDto as any);
    
    // agencyId no create deve ser do contexto, não do DTO
    expect(clientRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ agencyId: 'agency-uuid' })
    );
  });
});
```

### Testes de Integração (Controller)

```typescript
// Usa supertest + banco de teste em memória ou testcontainers
describe('ClientController (integration)', () => {
  it('POST /api/v1/clients sem token → 401', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/clients')
      .send({ name: 'Test' })
      .expect(401);
  });

  it('POST /api/v1/clients com token de outra agência → 403', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${tokenDeOutraAgencia}`)
      .set('Host', 'agencia1.localhost')
      .send({ name: 'Test' })
      .expect(403);
  });
});
```

### Executar testes

```bash
# Testes unitários
npm test                     # watch mode
npm run test:cov            # com coverage

# Testes E2E
npm run test:e2e
```

---

## Endpoints da API

A documentação interativa completa está disponível em:
- **Desenvolvimento**: http://localhost:3000/api/docs
- **Produção**: desabilitado (apenas desenvolvimento)

### Grupos de endpoints

| Prefixo | Descrição | Auth |
|---------|-----------|------|
| `POST /api/v1/auth/login` | Login | Público |
| `POST /api/v1/auth/refresh` | Renovar tokens | Cookie |
| `POST /api/v1/auth/logout` | Logout | JWT |
| `GET /api/v1/auth/me` | Perfil | JWT |
| `GET /api/v1/tenant/resolve` | Resolve tenant por domínio | Público |
| `GET/PATCH /api/v1/agency/settings` | Config da agência | JWT + Admin |
| `GET/POST /api/v1/clients` | CRUD de clientes | JWT + Tenant |
| `GET/POST /api/v1/reports` | CRUD de relatórios | JWT + Tenant |
| `GET /api/v1/reports/shared/:token` | Relatório público | Público |
| `GET/POST /api/v1/integrations` | Integrações | JWT + Admin |
| `GET/POST /api/v1/users` | Usuários da agência | JWT + Admin |
| `POST /api/v1/onboarding/agency` | Cadastro de nova agência | Público |
| `GET /api/v1/admin/*` | Super Admin | Super Admin JWT |
| `GET /api/v1/health` | Health check | Público |

---

## Banco de Dados

### Workflow de Migrações

```bash
# Criar nova migration após alterar schema.prisma
npx prisma migrate dev --name descricao-da-mudanca

# Aplicar em produção (sem criar nova migration)
npx prisma migrate deploy

# Reset completo (desenvolvimento apenas)
npx prisma migrate reset

# Abrir GUI do banco
npx prisma studio
```

### Regras de Schema

1. Sempre adicionar `@@index([agencyId])` em tabelas de tenant
2. Usar `agencyId` denormalizado em tabelas N:N (ex: `UserClient`, `ReportIntegration`)
3. Nunca remover colunas em migration — adicionar `@deprecated` e remover depois
4. `DateTime` sempre em UTC — sem `@db.Timestamptz` (Prisma gerencia)
5. Campos sensíveis: sufixo `Enc` e tipo `@db.Text`

---

## Segurança — Checklist para Novos Endpoints

Antes de abrir PR com novo endpoint:

- [ ] `agencyId` vem do `TenantContext`, nunca do request body/params
- [ ] Guards aplicados: `JwtAuthGuard`, `TenantGuard`, `RolesGuard` (conforme necessário)
- [ ] DTO com `@IsNotEmpty()`, `@MaxLength()`, tipos corretos
- [ ] Não expõe campos sensíveis (`passwordHash`, `credentialsEnc`, `agencyId` interno)
- [ ] Paginação implementada para endpoints de listagem
- [ ] Teste de isolamento cross-tenant escrito
- [ ] Erro de domínio tipado (não `throw new Error('...')`)
- [ ] Registro em audit log para ações críticas (CREATE, UPDATE, DELETE)

---

## Referências

- [ARCHITECTURE.md](../ARCHITECTURE.md) — Decisões arquiteturais completas
- [Prisma Schema](./prisma/schema.prisma) — Fonte da verdade do banco
- [Swagger UI](http://localhost:3000/api/docs) — Documentação interativa da API
- [NestJS Docs](https://docs.nestjs.com) — Framework reference
