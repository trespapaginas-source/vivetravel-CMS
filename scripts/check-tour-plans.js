const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.tourPlan.findMany({
    include: {
      category: true,
    }
  });
  console.log('✅ Total tour plans in DB:', plans.length);
  plans.forEach(p => {
    console.log(`- [${p.id}] ${p.name} (Slug: ${p.slug}, Published: ${p.published}, Category: ${p.category ? p.category.name : 'None'})`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
