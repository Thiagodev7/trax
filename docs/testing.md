# Trax — Estratégia de Testes

> Guia completo de testes do Trax SaaS — pirâmide, padrões, e execução.

---

## Filosofia

- **Testes são cidadãos de primeira classe** — escritos junto com o código, não depois
- **Pirâmide de testes**: muitos unitários, alguns de integração, poucos E2E
- **Use Cases são o coração**: toda lógica de negócio testada em isolamento (sem banco)
- **Segurança multi-tenant testada explicitamente**: isolamento cross-tenant em todo Use Case

---

## Pirâmide de Testes

```
                    ╔═══════════════════╗
                    ║   E2E / Playwright ║  ~5%
                    ║  Fluxos críticos   ║  Lento, frágil
                    ╠═══════════════════╣
                  ╔══════════════════════════╗
                  ║  Integration / Supertest  ║  ~20%
                  ║  Controllers + Banco real ║  Médio
                  ╠══════════════════════════╣
               ╔═════════════════════════════════╗
               ║         Unit / Jest              ║  ~75%
               ║  Use Cases + Domain (mocks)      ║  Rápido
               ╚═════════════════════════════════╝
```

---

## Testes Unitários (Backend — Jest)

### Localização

```
trax-api/src/modules/<module>/application/use-cases/<use-case>.spec.ts
trax-api/src/modules/<module>/domain/entities/<entity>.spec.ts
```

### Template de Teste de Use Case

```typescript
// create-client.use-case.spec.ts
import { CreateClientUseCase } from './create-client.use-case';
import { ClientRepository } from '../../domain/repositories/client.repository';
import { TenantContext } from '@common/context/tenant.context';
import { PlanLimitExceededError } from '../../domain/errors/plan-limit-exceeded.error';

describe('CreateClientUseCase', () => {
  let useCase: CreateClientUseCase;
  let clientRepo: jest.Mocked<ClientRepository>;
  let agencyRepo: jest.Mocked<AgencyRepository>;
  let tenantContext: jest.Mocked<TenantContext>;

  const AGENCY_ID = 'agency-uuid-1234';

  beforeEach(() => {
    clientRepo = {
      create: jest.fn(),
      countByAgency: jest.fn().mockResolvedValue(0),
    } as any;

    agencyRepo = {
      findById: jest.fn().mockResolvedValue({
        id: AGENCY_ID,
        maxClients: 5,
        plan: 'STARTER',
      }),
    } as any;

    tenantContext = {
      getAgencyId: jest.fn().mockReturnValue(AGENCY_ID),
    } as any;

    useCase = new CreateClientUseCase(tenantContext, clientRepo, agencyRepo);
  });

  describe('Caso de sucesso', () => {
    it('cria cliente com agencyId do contexto', async () => {
      const dto = { name: 'TechStore LTDA', email: 'tech@store.com' };
      clientRepo.create.mockResolvedValue({ id: 'client-1', agencyId: AGENCY_ID, ...dto });

      const result = await useCase.execute(dto);

      expect(clientRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ agencyId: AGENCY_ID, name: 'TechStore LTDA' })
      );
      expect(result.agencyId).toBe(AGENCY_ID);
    });
  });

  describe('Isolamento multi-tenant', () => {
    it('NUNCA usa agencyId do DTO — apenas do contexto', async () => {
      const maliciousDto = { name: 'Hacker', agencyId: 'other-agency-id' };

      await useCase.execute(maliciousDto as any);

      expect(clientRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ agencyId: AGENCY_ID }) // sempre do contexto
      );
      expect(clientRepo.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ agencyId: 'other-agency-id' })
      );
    });
  });

  describe('Limites de plano', () => {
    it('rejeita criação quando limite atingido', async () => {
      agencyRepo.findById.mockResolvedValue({ maxClients: 2, plan: 'STARTER' } as any);
      clientRepo.countByAgency.mockResolvedValue(2); // já no limite

      await expect(useCase.execute({ name: 'Extra Client' }))
        .rejects.toThrow(PlanLimitExceededError);
    });

    it('permite criação em plano ilimitado (AGENCY)', async () => {
      agencyRepo.findById.mockResolvedValue({ maxClients: -1, plan: 'AGENCY' } as any);
      clientRepo.countByAgency.mockResolvedValue(100);

      await expect(useCase.execute({ name: 'Client 101' })).resolves.toBeDefined();
    });
  });
});
```

### Template de Teste de Entidade de Domínio

```typescript
// invoice.entity.spec.ts
import { Invoice } from './invoice.entity';

describe('Invoice Entity', () => {
  const makeInvoice = (overrides = {}) => new Invoice(
    'inv-1',
    'agency-1',
    497.00,
    new Date('2026-07-01'),
    null,
    { ...overrides },
  );

  it('isPaid() retorna false quando paidAt é null', () => {
    const invoice = makeInvoice({ paidAt: null });
    expect(invoice.isPaid()).toBe(false);
  });

  it('isPaid() retorna true quando paidAt está preenchido', () => {
    const invoice = makeInvoice({ paidAt: new Date() });
    expect(invoice.isPaid()).toBe(true);
  });

  it('isOverdue() retorna true para fatura vencida não paga', () => {
    const invoice = makeInvoice({ dueAt: new Date('2020-01-01'), paidAt: null });
    expect(invoice.isOverdue()).toBe(true);
  });

  it('isOverdue() retorna false mesmo vencida se paga', () => {
    const invoice = makeInvoice({ dueAt: new Date('2020-01-01'), paidAt: new Date() });
    expect(invoice.isOverdue()).toBe(false);
  });
});
```

### Executar Testes Unitários

```bash
cd trax-api

# Watch mode (desenvolvimento)
npm test

# Com coverage
npm run test:cov

# Arquivo específico
npx jest create-client.use-case --watch

# Cobertura por módulo
npx jest --coverage --collectCoverageFrom="src/modules/client/**/*.ts"
```

---

## Testes de Integração (Backend — Supertest)

### Localização

```
trax-api/test/
  modules/
    client.e2e-spec.ts
    auth.e2e-spec.ts
    report.e2e-spec.ts
  setup/
    test-app.factory.ts
    seed-test-db.ts
```

### Template de Teste de Controller

```typescript
// test/modules/client.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { seedTestDatabase, cleanTestDatabase } from '../setup/seed-test-db';
import { generateTestJwt } from '../setup/auth.helper';

describe('ClientController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let viewerToken: string;
  let otherAgencyToken: string;

  const AGENCY_ID = 'test-agency-id';
  const OTHER_AGENCY_ID = 'other-agency-id';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    await seedTestDatabase();

    // Tokens para diferentes cenários
    adminToken = generateTestJwt({ agencyId: AGENCY_ID, role: 'AGENCY_ADMIN' });
    viewerToken = generateTestJwt({ agencyId: AGENCY_ID, role: 'AGENCY_VIEWER' });
    otherAgencyToken = generateTestJwt({ agencyId: OTHER_AGENCY_ID, role: 'AGENCY_ADMIN' });
  });

  afterAll(async () => {
    await cleanTestDatabase();
    await app.close();
  });

  describe('POST /api/v1/clients', () => {
    it('201 — AGENCY_ADMIN cria cliente', () => {
      return request(app.getHttpServer())
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Host', `${AGENCY_SLUG}.localhost`)
        .send({ name: 'TechStore LTDA', email: 'tech@store.com' })
        .expect(201)
        .expect(({ body }) => {
          expect(body.id).toBeDefined();
          expect(body.name).toBe('TechStore LTDA');
          expect(body.agencyId).toBeUndefined(); // não exposto na response
        });
    });

    it('401 — sem token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/clients')
        .send({ name: 'Test' })
        .expect(401);
    });

    it('403 — AGENCY_VIEWER não pode criar', () => {
      return request(app.getHttpServer())
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${viewerToken}`)
        .set('Host', `${AGENCY_SLUG}.localhost`)
        .send({ name: 'Test' })
        .expect(403);
    });

    it('403 — ISOLAMENTO: token de outra agência rejeitado', () => {
      return request(app.getHttpServer())
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${otherAgencyToken}`)
        .set('Host', `${AGENCY_SLUG}.localhost`) // Host da agência A
        .send({ name: 'Tentativa Cross-Tenant' })
        .expect(403); // JWT agencyId !== domínio agencyId
    });

    it('400 — nome vazio rejeitado', () => {
      return request(app.getHttpServer())
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Host', `${AGENCY_SLUG}.localhost`)
        .send({ name: '' })
        .expect(400)
        .expect(({ body }) => {
          expect(body.message).toContain('name');
        });
    });
  });

  describe('GET /api/v1/clients', () => {
    it('200 — lista apenas clientes da agência correta', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Host', `${AGENCY_SLUG}.localhost`)
        .expect(200);

      // Verificar que todos são da agência correta
      body.data.forEach((client: any) => {
        expect(client.agencyId).toBeUndefined(); // não exposto
      });
      // Verificar count correto via banco
      expect(body.data.length).toBe(EXPECTED_CLIENT_COUNT);
    });
  });
});
```

---

## Testes E2E (Playwright)

### Localização

```
trax-web/tests/e2e/
  auth/
    login.spec.ts
    logout.spec.ts
    refresh-token.spec.ts
  agency/
    onboarding.spec.ts
  dashboard/
    clients.spec.ts
    reports.spec.ts
  share/
    public-report.spec.ts
```

### Fluxos E2E Obrigatórios

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://agenciademo.localhost:3001';

test.describe('Login white-label', () => {
  test('exibe branding da agência na tela de login', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Branding carregado
    await expect(page.locator('[data-testid="agency-logo"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Agência Demo');

    // Página não exibe nenhum dado de outra agência
    await expect(page.locator('text=Trax Admin')).not.toBeVisible();
  });

  test('login com credenciais válidas → redirect para dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.fill('[name="email"]', 'admin@agenciademo.com');
    await page.fill('[name="password"]', 'admin123!');
    await page.click('[type="submit"]');

    await page.waitForURL(`${BASE_URL}/`);
    await expect(page.locator('h2')).toContainText('Dashboard');
  });

  test('login com credencial inválida → exibe erro', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.fill('[name="email"]', 'wrong@email.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('[type="submit"]');

    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.url()).toContain('/login');
  });

  test('usuário já logado → redirect para dashboard (não volta ao login)', async ({ page, context }) => {
    // Simular sessão ativa
    await context.addCookies([/* session cookie */]);

    await page.goto(`${BASE_URL}/login`);
    await page.waitForURL(`${BASE_URL}/`);
  });
});

test.describe('Isolamento cross-tenant', () => {
  test('acesso com cookie de outra agência → redirect para login', async ({ page, context }) => {
    // Cookie de sessão da agência B
    await context.addCookies([{ name: 'next-auth.session-token', value: 'other-agency-session', domain: 'agenciademo.localhost' }]);

    await page.goto(`${BASE_URL}/clients`);
    await page.waitForURL(`${BASE_URL}/login`);
  });
});
```

### Configuração Playwright

```typescript
// playwright.config.ts (trax-web/)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Cobertura de Testes — Metas

### Backend (Jest)

| Camada | Meta | Medição |
|--------|------|---------|
| Domain (Entities) | 90%+ | `npm run test:cov` |
| Application (Use Cases) | 80%+ | `npm run test:cov` |
| Common (Guards, Filters) | 70%+ | `npm run test:cov` |
| Infrastructure (Repositories) | 60%+ | Integration tests |

### Frontend (Vitest + RTL)

| Tipo | Meta | Escopo |
|------|------|--------|
| UI Primitivos (Button, Input, etc.) | 80%+ | Render, props, eventos |
| Componentes de negócio | 60%+ | Smoke tests, estados |
| Hooks customizados | 70%+ | Comportamento de cache |

### E2E (Playwright)

Fluxos obrigatórios com 100% de cobertura:

- [ ] Onboarding completo de nova agência
- [ ] Login / Logout / Refresh token expirado
- [ ] CRUD de clientes (criar, editar, inativar)
- [ ] Criar e publicar relatório
- [ ] Acessar relatório via share token público (sem login)
- [ ] Super admin: login, listar agências, bloquear/desbloquear
- [ ] Isolamento: token de agência A rejeitado em agência B

---

## Executar os Testes

### Backend

```bash
cd trax-api

# Unitários + integração
npm test                  # modo watch
npm run test:cov         # com relatório de coverage
npm run test:e2e         # E2E com supertest

# Apenas um arquivo
npx jest auth.use-case --watch

# Apenas um grupo (describe)
npx jest --testNamePattern="isolamento multi-tenant"
```

### Frontend

```bash
cd trax-web

# Unit (componentes)
npx vitest run            # once
npx vitest               # watch

# E2E (Playwright)
npx playwright test
npx playwright test --ui  # modo interativo
npx playwright test auth/ # apenas autenticação
```

### CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/test.yml (referência)
jobs:
  test-api:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
      redis:
        image: redis:7
    steps:
      - run: npm test --coverage
      - run: npm run test:e2e

  test-web:
    runs-on: ubuntu-latest
    steps:
      - run: npx vitest run
      - run: npx playwright test --project=chromium
```

---

## Dados de Teste

### Seed de Desenvolvimento (seed.ts)

O seed em `trax-api/prisma/seed.ts` cria:

| Entidade | Quantidade | Descrição |
|----------|-----------|-----------|
| SuperAdmin | 1 | `super@traxsolucoes.com.br` |
| Agency | 1 | `agenciademo` (STARTER plan) |
| Users | 3 | ADMIN + VIEWER + CLIENT_VIEWER |
| Clients | 3 | com integrações mockadas |
| Reports | 5 | mix DRAFT + PUBLISHED |
| DailyMetrics | ~180 | 60 dias de dados mockados |

### Isolação de Testes

```typescript
// Para testes de integração: usar banco separado
DATABASE_URL="postgresql://trax:trax@localhost:5432/trax_test"

// Limpar entre suites:
beforeAll(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE clients CASCADE`;
  await seedMinimalData();
});

afterAll(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE clients CASCADE`;
});
```

---

## Referências

- [ARCHITECTURE.md](../ARCHITECTURE.md) — Decisões técnicas
- [docs/security.md](./security.md) — Testes de segurança
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Playwright Docs](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/)
