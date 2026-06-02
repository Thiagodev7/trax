# Trax — Modelo de Segurança

> Documentação completa do modelo de segurança do Trax SaaS.  
> Revisão obrigatória ao implementar qualquer novo endpoint ou fluxo de autenticação.

---

## Modelo de Ameaças

### Ativos a Proteger

| Ativo | Criticidade | Proteção Principal |
|-------|-------------|-------------------|
| Dados de clientes de agências | CRÍTICA | Isolamento por `agencyId`, TLS |
| Credenciais de integração (OAuth tokens) | CRÍTICA | AES-256-GCM, nunca em logs |
| Senhas de usuários | ALTA | bcrypt (cost factor 12+) |
| JWT tokens | ALTA | Short-lived (15min), httpOnly refresh |
| Dados de billing (Stripe) | ALTA | Nunca armazenados — tokenizados |
| Configurações white-label | MÉDIA | RBAC (AGENCY_ADMIN only) |
| Relatórios publicados | BAIXA | Share token opaco, expiração |

### Perfil de Ameaças

| Ameaça | Probabilidade | Impacto | Controle |
|--------|--------------|---------|---------|
| Cross-tenant data access | MÉDIO | CRÍTICO | TenantGuard + agencyId em toda query |
| Token reuse de outra agência | BAIXO | CRÍTICO | JWT agencyId vs domínio validation |
| Credential stuffing no login | ALTO | ALTO | Rate limiting 10/min + bcrypt |
| SQL injection | BAIXO | CRÍTICO | Prisma ORM (prepared statements) |
| XSS via relatório | MÉDIO | ALTO | CSP headers, sanitização |
| SSRF via upload de URL | MÉDIO | ALTO | Validação de MIME + Allowlist de dominios |
| Credential leakage em logs | ALTO | CRÍTICO | Nunca logar credenciais/tokens |
| Mass assignment no DTO | MÉDIO | ALTO | `whitelist: true` no ValidationPipe |
| IDOR em recursos | MÉDIO | ALTO | agencyId em toda query de recurso |

---

## Autenticação

### Fluxo Completo

```
┌────────────┐     POST /auth/login        ┌──────────────┐
│  Browser   │ ──── {email, password} ───► │  trax-api   │
│            │                              │             │
│            │ ◄── { access_token } ──────  │  bcrypt.compare() → OK │
│            │ ◄── Set-Cookie: refresh      │  gera access_token (JWT 15min) │
└────────────┘      (httpOnly, Secure)      │  gera refresh_token (UUID opaco) │
                                            │  armazena SHA-256(refresh) no banco │
                                            └──────────────┘

Uso do access_token:
GET /clients HTTP/1.1
Authorization: Bearer eyJhbGc...  (expira em 15min)

Quando access_token expira:
POST /auth/refresh HTTP/1.1
Cookie: refresh_token=<opaco>   (httpOnly, não visível ao JS)

Resposta: { access_token: "novo..." } + novo cookie refresh_token
→ Token anterior marcado como revogado (revokedAt = now())
```

### Armazenamento de Tokens

| Token | Onde fica | Por quê |
|-------|-----------|---------|
| `access_token` | Memória JS (NextAuth session) | Não persiste em localStorage (XSS) |
| `refresh_token` | Cookie httpOnly Secure | Inacessível ao JavaScript |
| Hash do refresh | Banco (RefreshToken table) | Permite revogação individual |

### Refresh Token Rotation

```typescript
// Cada uso do refresh token gera NOVO par e revoga o anterior
// → Detecção de roubo de token: se token revogado for usado, invalidar TODOS
async rotateRefreshToken(userId: string, oldTokenHash: string) {
  const existing = await this.prisma.refreshToken.findFirst({
    where: { tokenHash: oldTokenHash, revokedAt: null },
  });

  if (!existing) {
    // Token já foi revogado → possível roubo → revogar todos
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
    throw new UnauthorizedException('Refresh token inválido');
  }

  // Revogar token atual e emitir novo
  await this.prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return this.generateNewTokenPair(userId);
}
```

---

## Autorização — RBAC

### Matriz de Permissões

| Ação | SUPER_ADMIN | AGENCY_ADMIN | AGENCY_VIEWER | CLIENT_VIEWER |
|------|:-----------:|:------------:|:-------------:|:-------------:|
| Ver todas as agências | ✅ | ❌ | ❌ | ❌ |
| Criar/editar agência | ✅ | ❌ | ❌ | ❌ |
| Config white-label da agência | ❌ | ✅ | ❌ | ❌ |
| CRUD de clientes | ❌ | ✅ | ❌ | ❌ |
| Ver todos os clientes | ❌ | ✅ | ✅ | ❌ |
| Ver clientes atribuídos | ❌ | ✅ | ✅ | ✅ |
| CRUD de usuários | ❌ | ✅ | ❌ | ❌ |
| Criar/editar relatório | ❌ | ✅ | ❌ | ❌ |
| Publicar relatório | ❌ | ✅ | ❌ | ❌ |
| Ver relatórios | ❌ | ✅ | ✅ | ✅* |
| Configurar integrações | ❌ | ✅ | ❌ | ❌ |
| Ver métricas de integração | ❌ | ✅ | ✅ | ✅* |

*CLIENT_VIEWER: apenas dos clientes atribuídos

### Implementação do Guard

```typescript
// ✅ Aplicação correta de guards em ordem
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(UserRole.AGENCY_ADMIN)
@Post('clients')
async createClient(@Body() dto: CreateClientDto) {
  // 1. JwtAuthGuard: valida access_token (expirado = 401)
  // 2. TenantGuard: valida agencyId do JWT === agencyId do domínio (diverge = 403)
  // 3. RolesGuard: valida que user.role está em Roles() (insuficiente = 403)
  return this.createClientUseCase.execute(dto);
}
```

---

## Isolamento Multi-Tenant

### A Regra de Ouro

```typescript
// ❌ NUNCA — agencyId do request pode ser manipulado
async getReport(id: string, @Query('agencyId') agencyId: string) {
  return this.prisma.report.findFirst({ where: { id, agencyId } });
}

// ❌ NUNCA — agencyId do JWT pode divergir do domínio
async getReport(id: string, @GetUser() user: AuthUser) {
  return this.prisma.report.findFirst({ where: { id, agencyId: user.agencyId } });
}

// ✅ SEMPRE — agencyId do contexto resolvido pelo domínio
async getReport(id: string) {
  const agencyId = this.tenantContext.getAgencyId();
  const report = await this.prisma.report.findFirst({ where: { id, agencyId } });
  if (!report) throw new ReportNotFoundError(id); // 404, não 403 (não revelar existência)
  return report;
}
```

### TenantGuard — Implementação

```typescript
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContext) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser; // populado pelo JwtAuthGuard

    const contextAgencyId = this.tenantContext.getAgencyId();
    const tokenAgencyId = user?.agencyId;

    // Super admin não tem agencyId no token — não aplicar TenantGuard
    if (user?.isSuperAdmin) return true;

    if (!contextAgencyId || !tokenAgencyId || contextAgencyId !== tokenAgencyId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    return true;
  }
}
```

---

## Criptografia de Credenciais

### AES-256-GCM para OAuth Tokens

```typescript
// src/common/utils/crypto.util.ts

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const TAG_LENGTH = 16; // 128 bits

export function encryptCredential(plaintext: string, hexKey: string): string {
  const key = Buffer.from(hexKey, 'hex'); // ENCRYPTION_KEY do .env
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Armazenado como JSON no banco:
  return JSON.stringify({
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted.toString('hex'),
  });
}

export function decryptCredential(encryptedJson: string, hexKey: string): string {
  const { iv, authTag, data } = JSON.parse(encryptedJson);
  const key = Buffer.from(hexKey, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
}
```

### Rotação de Chave de Criptografia

> [!WARNING]
> A rotação da `ENCRYPTION_KEY` exige re-criptografar TODAS as credenciais armazenadas.
> Implementar script de migração antes de qualquer rotação em produção.

---

## Rate Limiting

### Configuração Global

```typescript
// Throttler global (app.module.ts)
ThrottlerModule.forRoot([{
  name: 'default',
  ttl: 60_000, // 1 minuto
  limit: 100,  // 100 requests por IP por minuto
}])

// Throttler customizado para auth
ThrottlerModule.forRoot([
  { name: 'default', ttl: 60_000, limit: 100 },
  { name: 'auth', ttl: 60_000, limit: 10 },    // Mais restritivo
])

// Uso no controller de auth
@Throttle({ auth: { ttl: 60_000, limit: 10 } })
@Post('login')
async login() { ... }
```

---

## Upload de Arquivos — Segurança

```typescript
// Validações obrigatórias no endpoint de upload:

// 1. Autenticação: apenas AGENCY_ADMIN
@Roles(UserRole.AGENCY_ADMIN)
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)

// 2. Validação de MIME type (nunca confiar no Content-Type do cliente)
const validMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
if (!validMimes.includes(file.mimetype)) {
  throw new BadRequestException('Tipo de arquivo não permitido');
}

// 3. Validação real do buffer (magic bytes)
import FileType from 'file-type';
const type = await FileType.fromBuffer(file.buffer);
if (!type || !validMimes.includes(type.mime)) {
  throw new BadRequestException('Arquivo inválido');
}

// 4. Limite de tamanho por tipo
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
if (file.size > MAX_LOGO_SIZE) {
  throw new BadRequestException('Arquivo muito grande (máx. 2MB)');
}

// 5. Nome do arquivo: sempre slug-based (sem path traversal)
const extension = type.ext;
const filename = `logo-${agencyId}.${extension}`;
const storagePath = `agencies/${agencyId}/${filename}`;
```

---

## Variáveis de Ambiente — Gestão de Segredos

### Classificação por Sensibilidade

| Variável | Sensibilidade | Rotação |
|----------|--------------|---------|
| `JWT_SECRET` | CRÍTICA | Semestral (requer logout forçado) |
| `JWT_REFRESH_SECRET` | CRÍTICA | Semestral |
| `AUTH_SECRET` | CRÍTICA | Semestral |
| `ENCRYPTION_KEY` | CRÍTICA | Anual (com migração de dados) |
| `DATABASE_URL` | ALTA | Trimestral |
| `REDIS_URL` | ALTA | Trimestral |
| `STRIPE_SECRET_KEY` | ALTA | Anual |
| `RESEND_API_KEY` | MÉDIA | Anual |
| `GOOGLE_ADS_CLIENT_SECRET` | ALTA | Após vazamento |

### Regras de Segredos

```bash
# ✅ Geração correta de segredos
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
AUTH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)  # Deve ter exatamente 64 caracteres hex

# ❌ Nunca usar valores previsíveis
JWT_SECRET="mysecret"          # INSEGURO
JWT_SECRET="development"       # INSEGURO
ENCRYPTION_KEY="00000...000"   # INSEGURO

# ✅ Verificação do ENCRYPTION_KEY
echo -n "$ENCRYPTION_KEY" | wc -c  # Deve retornar 64
```

---

## Headers HTTP (Helmet)

```typescript
// main.ts — configuração do Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // Next.js inline scripts
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"], // logos via CDN
      connectSrc: ["'self'", process.env.NEXT_PUBLIC_API_URL],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    features: {
      camera: [],
      microphone: [],
      geolocation: [],
    },
  },
}));
```

---

## CORS

```typescript
// main.ts — configuração CORS
app.enableCors({
  origin: (origin, callback) => {
    // 1. Requests sem origin (mobile apps, Postman em dev) — permitir
    if (!origin) return callback(null, true);

    // 2. Origins explícitas em CORS_ORIGINS (.env)
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // 3. Qualquer subdomínio do domínio principal
    if (tenantOriginPattern.test(origin)) return callback(null, true);

    // 4. *.localhost em desenvolvimento
    if (isDev && localhostOriginPattern.test(origin)) return callback(null, true);

    // 5. Rejeitar
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true, // necessário para cookies httpOnly
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
```

---

## Audit Log

Todas as ações críticas são registradas na tabela `agency_audit_logs`:

```typescript
// Ações que DEVEM ser auditadas:
const AUDITED_ACTIONS = [
  'LOGIN',          // Todo login bem-sucedido (com IP e User-Agent)
  'LOGOUT',         // Todo logout
  'CREATE',         // Criação de cliente, usuário, relatório
  'UPDATE',         // Alterações em configurações, plano, dados sensíveis
  'DELETE',         // Remoção de qualquer entidade
  'PUBLISH',        // Publicação de relatório
  'INVITE',         // Convite de usuário
  'SYNC',           // Sync manual de integração
];

// Exemplo de registro:
await this.auditLog.record({
  agencyId,
  actorType: 'AGENCY_USER',
  userId: currentUser.id,
  action: 'CREATE',
  entityType: 'CLIENT',
  entityId: newClient.id,
  entityName: newClient.name,
  description: `Cliente "${newClient.name}" criado por ${currentUser.email}`,
  ipAddress: request.ip,
  userAgent: request.headers['user-agent'],
});
```

---

## Checklist de Segurança — Review de PR

### Antes de aprovar qualquer PR com mudanças de segurança:

**Autenticação e Autorização**
- [ ] Guards corretos aplicados: `JwtAuthGuard`, `TenantGuard`, `RolesGuard`
- [ ] `agencyId` vem exclusivamente do `TenantContext`
- [ ] Recursos verificam `agencyId` + `id` na query (não só `id`)
- [ ] Roles corretas declaradas com `@Roles()`

**Validação de Input**
- [ ] DTO com `class-validator` para todos os campos
- [ ] `ValidationPipe` com `whitelist: true` — campos extras removidos
- [ ] Campos de upload validados por MIME type real (magic bytes)
- [ ] Strings sanitizadas antes de usar em queries dinâmicas

**Segredos e Dados Sensíveis**
- [ ] Credenciais não logadas em console/logger
- [ ] Campos sensíveis com `@Exclude()` nos DTOs de response
- [ ] Novas credenciais armazenadas via `CryptoService.encrypt()`
- [ ] Nenhum segredo hardcoded no código

**Logging e Audit**
- [ ] Ações críticas registradas no audit log
- [ ] Erros sem stack trace em produção (`NODE_ENV !== 'production'` check)
- [ ] Mensagens de erro não revelam dados internos

---

## Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [ARCHITECTURE.md](../ARCHITECTURE.md)
