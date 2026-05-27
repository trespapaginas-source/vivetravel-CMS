const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sections = await prisma.siteContent.findMany({
    select: {
      sectionKey: true
    }
  });
  console.log('✅ Section keys in database:', sections.map(s => s.sectionKey));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
