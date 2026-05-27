const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = [
  {
    sectionKey: 'gallery',
    content: {
      title: 'Explora destinos',
      titleHighlight: 'nacionales',
      subtitle: 'Descubre los mejores tours y experiencias en los destinos más emblemáticos del Caribe colombiano',
      destinations: [
        { id: 'dest-baru', title: 'Cartagena', subtitle: 'Historia, cultura y encanto colonial', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&h=600&fit=crop&q=80' },
        { id: 'dest-pasadias', title: 'Santa Marta', subtitle: 'Naturaleza viva donde la sierra abraza el mar', image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1400&h=600&fit=crop&q=80' },
        { id: 'dest-rosario', title: 'Quindío', subtitle: 'La verdadera esencia y tradición cafetera', image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=1400&h=600&fit=crop&q=80' },
        { id: 'dest-bahia', title: 'Más de Colombia', subtitle: 'Descubre otras joyas y destinos inexplorados', image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1400&h=600&fit=crop&q=80' },
      ],
    },
  },
  {
    sectionKey: 'international',
    content: {
      title: 'Explora destinos',
      titleHighlight: 'internacionales',
      subtitle: 'Descubre escapadas inolvidables fuera de Colombia',
      destinations: [
        { name: 'Cancún', eyebrow: 'Escapadas al Caribe mexicano', image: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=900&h=1125&fit=crop&q=80' },
        { name: 'Punta Cana', eyebrow: 'Playas, descanso y resorts', image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=900&h=1125&fit=crop&q=80' },
        { name: 'San Andrés', eyebrow: 'Mar de siete colores', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&h=1125&fit=crop&q=80' },
      ],
    },
  },
  {
    sectionKey: 'team',
    content: {
      title: 'Nuestro Equipo',
      subtitle: 'Tres amigos, una pasión: conectar al mundo con la magia del Atlántico colombiano',
      description: 'Lo que comenzó como un sueño entre tres amigos se convirtió en una agencia que transforma la manera de vivir el Caribe colombiano. Cada uno aporta su talento único para que tu experiencia sea extraordinaria.',
    },
  },
  {
    sectionKey: 'testimonials',
    content: {
      title: 'Lo que dicen nuestros viajeros',
      subtitle: 'Historias reales de quienes ya viajaron con nosotros',
    },
  },
];

async function main() {
  console.log('Inserting missing sections...');
  for (const item of data) {
    const upserted = await prisma.siteContent.upsert({
      where: { sectionKey: item.sectionKey },
      update: {},
      create: {
        sectionKey: item.sectionKey,
        content: item.content,
      },
    });
    console.log(`- Upserted section: ${upserted.sectionKey}`);
  }
  console.log('✅ Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
