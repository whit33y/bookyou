import { config } from 'dotenv';
config();

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as unknown as ConstructorParameters<
  typeof PrismaClient
>[0]);

const categories = [
  { name: 'Fryzjer', slug: 'fryzjer', icon: '💇‍♀️' },
  { name: 'Barber', slug: 'barber', icon: '💈' },
  { name: 'Kosmetyczka', slug: 'kosmetyczka', icon: '💅' },
  { name: 'Masaż', slug: 'masaz', icon: '💆‍♀️' },
  { name: 'Paznokcie', slug: 'paznokcie', icon: '🧖‍♀️' },
  { name: 'Fizjoterapia', slug: 'fizjoterapia', icon: '🏋️' },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log('Seeded categories.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
