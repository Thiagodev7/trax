/**
 * Trax — Seed de desenvolvimento
 * Cria uma agência demo com admin, viewer e cliente com relatórios.
 *
 * Executar: npm run db:seed
 */
import { PrismaClient, UserRole, ReportStatus, AgencyPlan, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

async function main() {
  console.log('🌱 Iniciando seed do banco de dados Trax...\n');

  // ─────────────────────────────────────────────────────
  // 1. Agência Demo (Tenant Principal)
  // ─────────────────────────────────────────────────────
  const agency = await prisma.agency.upsert({
    where: { slug: 'agenciademo' },
    update: {},
    create: {
      name: 'Agência Demo',
      slug: 'agenciademo',
      customDomain: null,
      logoUrl: 'https://placehold.co/200x60/6366F1/FFFFFF?text=AgênciaDemo',
      faviconUrl: null,
      primaryColor: '#6366F1',
      secondaryColor: '#818CF8',
      accentColor: '#F59E0B',
      fontFamily: 'Inter',
      plan: AgencyPlan.PRO,
      maxClients: 20,
      maxUsers: 10,
      isActive: true,
      trialEndsAt: null,
    },
  });

  console.log(`✅ Agência criada: ${agency.name} (slug: ${agency.slug})`);

  // ─────────────────────────────────────────────────────
  // 2. Usuários
  // ─────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123!', BCRYPT_ROUNDS);
  const viewerPassword = await bcrypt.hash('viewer123!', BCRYPT_ROUNDS);
  const clientPassword = await bcrypt.hash('cliente123!', BCRYPT_ROUNDS);

  const adminUser = await prisma.user.upsert({
    where: { agencyId_email: { agencyId: agency.id, email: 'admin@agenciademo.com' } },
    update: { passwordHash: adminPassword },
    create: {
      agencyId: agency.id,
      email: 'admin@agenciademo.com',
      passwordHash: adminPassword,
      name: 'Admin Demo',
      role: UserRole.AGENCY_ADMIN,
      isActive: true,
    },
  });

  const viewerUser = await prisma.user.upsert({
    where: { agencyId_email: { agencyId: agency.id, email: 'viewer@agenciademo.com' } },
    update: { passwordHash: viewerPassword },
    create: {
      agencyId: agency.id,
      email: 'viewer@agenciademo.com',
      passwordHash: viewerPassword,
      name: 'Viewer Demo',
      role: UserRole.AGENCY_VIEWER,
      isActive: true,
    },
  });

  console.log(`✅ Usuário admin: ${adminUser.email} | senha: admin123!`);
  console.log(`✅ Usuário viewer: ${viewerUser.email} | senha: viewer123!`);

  // ─────────────────────────────────────────────────────
  // 3. Clientes da agência
  // ─────────────────────────────────────────────────────
  const client1 = await prisma.client.upsert({
    where: { id: 'aaaaaaaa-0001-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'aaaaaaaa-0001-0000-0000-000000000001',
      agencyId: agency.id,
      name: 'TechStore E-commerce',
      email: 'marketing@techstore.com.br',
      website: 'https://techstore.com.br',
      logoUrl: 'https://placehold.co/200x60/0EA5E9/FFFFFF?text=TechStore',
      isActive: true,
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 'aaaaaaaa-0001-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'aaaaaaaa-0001-0000-0000-000000000002',
      agencyId: agency.id,
      name: 'Clínica Saúde Total',
      email: 'marketing@saudetotal.med.br',
      website: 'https://saudetotal.med.br',
      logoUrl: 'https://placehold.co/200x60/10B981/FFFFFF?text=SaúdeTotal',
      isActive: true,
    },
  });

  console.log(`✅ Clientes: ${client1.name}, ${client2.name}`);

  // ─────────────────────────────────────────────────────
  // 4. Usuário CLIENT_VIEWER vinculado ao client1
  // ─────────────────────────────────────────────────────
  const clientViewer = await prisma.user.upsert({
    where: { agencyId_email: { agencyId: agency.id, email: 'contato@techstore.com.br' } },
    update: { passwordHash: clientPassword },
    create: {
      agencyId: agency.id,
      email: 'contato@techstore.com.br',
      passwordHash: clientPassword,
      name: 'João TechStore',
      role: UserRole.CLIENT_VIEWER,
      isActive: true,
    },
  });

  await prisma.userClient.upsert({
    where: { userId_clientId: { userId: clientViewer.id, clientId: client1.id } },
    update: {},
    create: {
      userId: clientViewer.id,
      clientId: client1.id,
      agencyId: agency.id,
    },
  });

  console.log(`✅ Client viewer: ${clientViewer.email} | senha: cliente123!`);

  // ─────────────────────────────────────────────────────
  // 5. Relatórios demo
  // ─────────────────────────────────────────────────────
  const shareToken = randomBytes(48).toString('base64url');

  const report1 = await prisma.report.upsert({
    where: { id: 'bbbbbbbb-0001-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'bbbbbbbb-0001-0000-0000-000000000001',
      agencyId: agency.id,
      clientId: client1.id,
      title: 'Relatório Google Ads — Maio 2026',
      description: 'Performance das campanhas de busca e display no mês de Maio.',
      status: ReportStatus.PUBLISHED,
      shareToken,
      publishedAt: new Date(),
      periodStart: new Date('2026-05-01'),
      periodEnd: new Date('2026-05-31'),
      layoutJson: {
        widgets: [
          { type: 'kpi', metric: 'clicks', label: 'Cliques', value: 12450, delta: 8.3 },
          { type: 'kpi', metric: 'impressions', label: 'Impressões', value: 245000, delta: 12.1 },
          { type: 'kpi', metric: 'ctr', label: 'CTR', value: 5.08, delta: -0.5 },
          { type: 'kpi', metric: 'conversions', label: 'Conversões', value: 384, delta: 22.4 },
          { type: 'kpi', metric: 'roas', label: 'ROAS', value: 4.2, delta: 5.0 },
          { type: 'chart_line', metric: 'clicks_over_time', label: 'Cliques ao longo do tempo' },
        ],
      },
    },
  });

  const report2 = await prisma.report.upsert({
    where: { id: 'bbbbbbbb-0001-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'bbbbbbbb-0001-0000-0000-000000000002',
      agencyId: agency.id,
      clientId: client2.id,
      title: 'Relatório Meta Ads — Abril 2026',
      description: 'Resultados das campanhas de alcance e conversão no Facebook e Instagram.',
      status: ReportStatus.DRAFT,
      periodStart: new Date('2026-04-01'),
      periodEnd: new Date('2026-04-30'),
      layoutJson: Prisma.JsonNull,
    },
  });

  console.log(`✅ Relatório publicado: "${report1.title}" (shareToken: ${shareToken.substring(0, 20)}...)`);
  console.log(`✅ Relatório rascunho: "${report2.title}"`);

  // ─────────────────────────────────────────────────────
  // Resumo
  // ─────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  console.log('🚀 Seed concluído com sucesso!');
  console.log('══════════════════════════════════════════════════');
  console.log(`\n📡 Portal da agência demo:`);
  console.log(`   URL base: http://agenciademo.localhost:3000`);
  console.log(`   Header alternativo: X-Agency-Domain: agenciademo.trax.app`);
  console.log(`\n👤 Credenciais:`);
  console.log(`   AGENCY_ADMIN  → admin@agenciademo.com / admin123!`);
  console.log(`   AGENCY_VIEWER → viewer@agenciademo.com / viewer123!`);
  console.log(`   CLIENT_VIEWER → contato@techstore.com.br / cliente123!`);
  console.log(`\n🔗 Relatório público (sem login):`);
  console.log(`   GET /api/v1/reports/shared/${shareToken}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
