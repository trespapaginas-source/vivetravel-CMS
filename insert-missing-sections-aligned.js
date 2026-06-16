/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = [
  {
    sectionKey: 'navbar',
    content: {
      brandName: "Vive Travel",
      brandSub: "Colombia",
      navItems: [
        { key: "home", label: "Inicio" },
        { key: "plans", label: "Experiencias y viajes" },
        { key: "cabins", label: "Cabañas" },
        { key: "team", label: "Equipo" },
        { key: "contact", label: "Contacto" },
        { key: "policies", label: "Políticas" }
      ],
      ctaButton: "Reservar",
      ctaButtonMobile: "Reservar ahora"
    }
  },
  {
    sectionKey: 'footer',
    content: {
      brandName: "Vive Travel",
      brandSub: "Colombia",
      description: "Planes turísticos para toda Colombia, con la costa Caribe como casa. Tu próxima aventura empieza aquí.",
      instagramUrl: "#",
      facebookUrl: "#",
      whatsappUrl: "https://wa.me/573209344964",
      exploreTitle: "Explorar",
      contactTitle: "Contacto",
      phone: "+57 320 934 4964",
      email: "info@vivetravel.co",
      location: "Barranquilla, Atlántico, Colombia",
      helpTitle: "¿Necesitas ayuda?",
      helpDescription: "Escríbenos por WhatsApp y te ayudamos a planear tu viaje.",
      chatButton: "Chatear ahora",
      copyright: "© {year} Vive Travel. Todos los derechos reservados.",
      madeWith: "Hecho en la costa Caribe, para toda Colombia"
    }
  },
  {
    sectionKey: 'plansList',
    content: {
      title: "Experiencias y viajes",
      subtitle: "Experiencias en la costa Caribe y destinos de toda Colombia. Playa, naturaleza, aventura y cultura.",
      emptyState: "No hay experiencias disponibles en esta categoría",
      viewAll: "Ver todas las experiencias"
    }
  },
  {
    sectionKey: 'cabinsList',
    content: {
      title: "Alojamientos",
      subtitle: "Cabañas y alojamientos en la costa Caribe. Frente al mar, en la naturaleza o en el corazón de la ciudad.",
      emptyTitle: "¿No encuentras lo que buscas?",
      emptyDescription: "Contáctanos y te ayudamos a encontrar el alojamiento ideal.",
      contactButton: "Contáctanos"
    }
  },
  {
    sectionKey: 'promotions',
    content: {
      sectionTitle: "Módulo Promocional",
      banners: [
        {
          id: 1,
          url: "/images/banner-san-andres.webp",
          alt: "Plan 2x1 San Andrés"
        },
        {
          id: 2,
          url: "/images/banner-punta-cana.webp",
          alt: "Escápate al paraíso Punta Cana"
        },
        {
          id: 3,
          url: "/images/banner-eje-cafetero.webp",
          alt: "Tour Eje Cafetero"
        }
      ],
      valueCards: [
        {
          id: 1,
          title: "Promos y medios de pago",
          description: "Cuotas con tarjetas de crédito, transferencias y facilidades de pago."
        },
        {
          id: 2,
          title: "Beneficios y promociones",
          description: "Acumula beneficios y aprovecha todas las promociones 2x1 activas."
        },
        {
          id: 3,
          title: "Mi agente Vive Travel",
          description: "Asesoría personalizada por WhatsApp o llamada con nuestros agentes."
        }
      ]
    }
  }
];

async function main() {
  console.log('Inserting aligned missing sections...');
  for (const item of data) {
    const upserted = await prisma.siteContent.upsert({
      where: { sectionKey: item.sectionKey },
      update: {}, // Don't overwrite if it exists already, but insert if missing
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
