import { PrismaClient, UserRole } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Agency ---
  const agency = await prisma.agency.upsert({
    where: { slug: 'demo-agency' },
    update: {},
    create: {
      name: 'Demo Agency',
      slug: 'demo-agency',
      customDomain: null,
      logoUrl: 'https://placehold.co/200x60/6366F1/FFFFFF?text=Demo+Agency',
      primaryColor: '#6366F1',
      secondaryColor: '#818CF8',
      accentColor: '#F59E0B',
    },
  });
  console.log(`✅ Agency: ${agency.name} (${agency.id})`);

  // --- Admin User ---
  const passwordHash = crypto
    .createHash('sha256')
    .update('admin123')
    .digest('hex');

  const admin = await prisma.user.upsert({
    where: { agencyId_email: { agencyId: agency.id, email: 'admin@demo-agency.com' } },
    update: {},
    create: {
      agencyId: agency.id,
      email: 'admin@demo-agency.com',
      passwordHash,
      name: 'Admin Demo',
      role: UserRole.AGENCY_ADMIN,
    },
  });
  console.log(`✅ User (Admin): ${admin.email}`);

  // --- Client ---
  const client = await prisma.client.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      agencyId: agency.id,
      name: 'Cliente Demo S.A.',
      email: 'contato@clientedemo.com',
      website: 'https://clientedemo.com',
    },
  });
  console.log(`✅ Client: ${client.name}`);

  console.log('\n🚀 Seed concluído com sucesso!');
  console.log('   URL API:   http://localhost:3000');
  console.log('   Login:     admin@demo-agency.com / admin123');
  console.log('   Subdomínio: demo-agency.trax.app');
}

main()
  .catch((e) => {
    console.error('❌ Seed falhou:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
