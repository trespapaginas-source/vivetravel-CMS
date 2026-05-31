const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const plansData = [
  {
    id: "plan-16",
    name: "Eurotrip Clásico",
    slug: "eurotrip-clasico",
    shortDescription: "Recorre las capitales europeas más icónicas: Madrid, París y Roma en un circuito completo de 15 días.",
    fullDescription: "El viaje de tus sueños por el viejo continente. Descubre la historia imperial de Madrid, la magia y romance de la Ciudad de la Luz en París, y la majestuosidad de la Ciudad Eterna en Roma. Este circuito incluye pasajes de avión, hotelería de categoría superior, desayunos buffet, traslados en autobús de lujo y visitas guiadas con expertos locales en cada destino.",
    images: [
      "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop",
    ],
    price: 6500000,
    priceRange: "$6.500.000 - $7.800.000 COP",
    duration: "15 días, 14 noches",
    location: "Madrid, París y Roma",
    category: "Circuito",
    includes: [
      "Tiquetes aéreos internacionales",
      "Alojamiento 14 noches en hoteles 4★",
      "Desayunos buffet diarios",
      "Visita con guía local en Madrid, París y Roma",
      "Traslados aeropuerto-hotel-aeropuerto",
      "Tarjeta de asistencia médica",
    ],
    excludes: [
      "Almuerzos y cenas no especificados",
      "Entradas a monumentos no descritos",
      "Gastos personales y propinas",
    ],
    highlights: [
      "Visita al Coliseo y Foro Romano",
      "Subida al segundo piso de la Torre Eiffel",
      "Tour por el Palacio Real de Madrid",
      "Crucero nocturno por el Río Sena",
    ],
    rating: 4.9,
    reviewCount: 148,
    maxGuests: 25,
    difficulty: "Fácil",
    schedule: "Salidas el primer sábado de cada mes",
    meetingPoint: "Aeropuerto Internacional El Dorado, Bogotá"
  },
  {
    id: "plan-17",
    name: "Japón Esencial",
    slug: "japon-esencial",
    shortDescription: "La combinación perfecta entre tradición milenaria y tecnología del futuro en Tokio, Kioto y Osaka.",
    fullDescription: "Embárcate en un fascinante circuito de 10 días por la tierra del sol naciente. Desde los rascacielos iluminados y templos antiguos de Tokio, hasta los serenos jardines zen de Kioto y la gastronomía callejera de Osaka, este viaje te mostrará la verdadera esencia de Japón. Viaja en el tren bala Shinkansen y alójate en un Ryokan tradicional con aguas termales (Onsen).",
    images: [
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&h=600&fit=crop",
    ],
    price: 8200000,
    priceRange: "$8.200.000 - $9.500.000 COP",
    duration: "10 días, 9 noches",
    location: "Tokio, Kioto y Osaka",
    category: "Circuito",
    includes: [
      "Tiquetes aéreos internacionales",
      "Pase de tren Japan Rail Pass (JR Pass)",
      "Alojamiento 8 noches en hotel + 1 noche en Ryokan",
      "Desayunos diarios y 1 cena tradicional Kaiseki",
      "Guía acompañante de habla hispana",
      "Entradas a todos los templos descritos",
    ],
    excludes: [
      "Almuerzos y cenas no descritos",
      "Seguro de viaje de cobertura médica extendida",
      "Propinas y gastos personales",
    ],
    highlights: [
      "Viaje en el Tren Bala Shinkansen",
      "Paseo por el bosque de bambú de Arashiyama",
      "Templo Senso-ji en Asakusa, Tokio",
      "Visita al santuario Fushimi Inari-Taisha",
    ],
    rating: 4.9,
    reviewCount: 94,
    maxGuests: 15,
    difficulty: "Moderado",
    schedule: "Salidas programadas en época de cerezos (Abril) y otoño (Octubre)",
    meetingPoint: "Aeropuerto Internacional El Dorado, Bogotá"
  },
  {
    id: "plan-18",
    name: "Turquía y Dubái",
    slug: "turquia-dubai",
    shortDescription: "La magia de Estambul y los globos de Capadocia junto con el lujo futurista y los safaris de Dubái.",
    fullDescription: "Un circuito extraordinario de 12 días que une dos de los mundos más exóticos del planeta. Déjate cautivar por las mezquitas y bazares históricos de Estambul, sobrevuela en globo los paisajes lunares de Capadocia en Turquía y luego vuela hacia el desierto para vivir la modernidad, rascacielos y safaris de lujo en Dubái.",
    images: [
      "https://images.unsplash.com/photo-1527838832700-50592524df7e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=600&fit=crop",
    ],
    price: 5900000,
    priceRange: "$5.900.000 - $6.900.000 COP",
    duration: "12 días, 11 noches",
    location: "Estambul, Capadocia y Dubái",
    category: "Circuito",
    includes: [
      "Tiquetes de vuelo internacional y doméstico",
      "Alojamiento 11 noches en hoteles 4★ y 5★",
      "Desayunos diarios y cenas en Turquía",
      "Safari por el desierto de Dubái con cena BBQ",
      "Crucero privado por el Río Bósforo en Estambul",
      "Guías locales en español en ambos países",
    ],
    excludes: [
      "Vuelo en globo aerostático en Capadocia (opcional)",
      "Impuesto turístico de Dubái (Tourism Dirham)",
      "Almuerzos no especificados",
    ],
    highlights: [
      "Safari 4x4 por las dunas rojas de Dubái",
      "Visita a la Mezquita Azul y Santa Sofía en Estambul",
      "Paisajes de chimeneas de hadas en Capadocia",
      "Entrada a la plataforma del Burj Khalifa",
    ],
    rating: 4.8,
    reviewCount: 112,
    maxGuests: 20,
    difficulty: "Fácil",
    schedule: "Salidas grupales los días 15 de cada mes",
    meetingPoint: "Aeropuerto Internacional El Dorado, Bogotá"
  }
];

async function main() {
  console.log("Iniciando inserción de circuitos en la base de datos...");

  // 1. Obtener o crear la categoría de Circuitos
  let category = await prisma.planCategory.findUnique({
    where: { slug: "circuitos" }
  });

  if (!category) {
    console.log("Categoría 'circuitos' no encontrada. Creándola...");
    category = await prisma.planCategory.create({
      data: {
        name: "Circuitos",
        slug: "circuitos",
        color: "#0E7490",
        sortOrder: 2
      }
    });
  }
  console.log(`Usando categoría: ${category.name} (ID: ${category.id})`);

  // 2. Insertar cada plan
  for (const p of plansData) {
    console.log(`\nProcesando plan: ${p.name} (slug: ${p.slug})...`);

    // Comprobar si existe por slug
    const existing = await prisma.tourPlan.findUnique({
      where: { slug: p.slug }
    });

    if (existing) {
      console.log(`Plan existente encontrado. Eliminando plan ID ${existing.id}...`);
      await prisma.tourPlan.delete({
        where: { id: existing.id }
      });
    }

    // Insertar plan nuevo
    const createdPlan = await prisma.tourPlan.create({
      data: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        fullDescription: p.fullDescription,
        price: p.price,
        priceRange: p.priceRange,
        duration: p.duration,
        location: p.location,
        categoryId: category.id,
        difficulty: p.difficulty,
        schedule: p.schedule,
        meetingPoint: p.meetingPoint,
        rating: p.rating,
        reviewCount: p.reviewCount,
        maxGuests: p.maxGuests,
        published: true,
        sortOrder: 0
      }
    });
    console.log(`Plan creado con ID: ${createdPlan.id}`);

    // Insertar imágenes relacionadas
    console.log("Insertando imágenes...");
    for (let i = 0; i < p.images.length; i++) {
      await prisma.planImage.create({
        data: {
          url: p.images[i],
          sortOrder: i,
          source: "external",
          planId: createdPlan.id
        }
      });
    }

    // Insertar inclusiones
    console.log("Insertando inclusiones...");
    for (let i = 0; i < p.includes.length; i++) {
      await prisma.planInclude.create({
        data: {
          text: p.includes[i],
          sortOrder: i,
          planId: createdPlan.id
        }
      });
    }

    // Insertar exclusiones
    console.log("Insertando exclusiones...");
    for (let i = 0; i < p.excludes.length; i++) {
      await prisma.planExclude.create({
        data: {
          text: p.excludes[i],
          sortOrder: i,
          planId: createdPlan.id
        }
      });
    }

    // Insertar puntos destacados
    console.log("Insertando highlights...");
    for (let i = 0; i < p.highlights.length; i++) {
      await prisma.planHighlight.create({
        data: {
          text: p.highlights[i],
          sortOrder: i,
          planId: createdPlan.id
        }
      });
    }
  }

  console.log("\n¡Circuitos insertados con éxito en la base de datos de Supabase!");
}

main()
  .catch((e) => {
    console.error("Error al sembrar datos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
