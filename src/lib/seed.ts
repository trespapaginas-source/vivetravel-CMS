import { db } from '@/lib/db'
import { slugify } from '@/lib/sluggify'

export async function seedDatabase() {
  console.log('🌱 Starting database seed with real data...')

  // Clean existing data
  await db.activityLog.deleteMany()
  await db.testimonial.deleteMany()
  await db.planHighlight.deleteMany()
  await db.planExclude.deleteMany()
  await db.planInclude.deleteMany()
  await db.planImage.deleteMany()
  await db.tourPlan.deleteMany()
  await db.planCategory.deleteMany()
  await db.cabinRule.deleteMany()
  await db.cabinHighlight.deleteMany()
  await db.cabinAmenity.deleteMany()
  await db.cabinImage.deleteMany()
  await db.cabin.deleteMany()
  await db.contactMessage.deleteMany()
  await db.heroImage.deleteMany()
  await db.tripImage.deleteMany()
  await db.siteContent.deleteMany()
  await db.profile.deleteMany()

  console.log('  ✅ Cleaned existing data')

  // 1. Create Admin & Editor profiles
  const admin = await db.profile.create({
    data: {
      email: 'admin@vivetravel.com',
      password: 'admin123',
      fullName: 'Admin Vive Travel',
      role: 'administrador',
    },
  })

  const editor = await db.profile.create({
    data: {
      email: 'editor@vivetravel.com',
      password: 'editor123',
      fullName: 'Editor Demo',
      role: 'editor',
    },
  })

  console.log('  ✅ Created profiles')

  // 2. Create Plan Categories
  const categoriesData = [
    { name: 'Naturaleza', slug: 'naturaleza', color: '#059669', icon: 'Leaf', sortOrder: 1 },
    { name: 'Playa', slug: 'playa', color: '#0E7490', icon: 'Waves', sortOrder: 2 },
    { name: 'Aventura', slug: 'aventura', color: '#F97316', icon: 'Mountain', sortOrder: 3 },
    { name: 'Ecoturismo', slug: 'ecoturismo', color: '#059669', icon: 'Sparkles', sortOrder: 4 },
    { name: 'Experiencia', slug: 'experiencia', color: '#FB7185', icon: 'Star', sortOrder: 5 },
    { name: 'Cultural', slug: 'cultural', color: '#D4A574', icon: 'Landmark', sortOrder: 6 },
    { name: 'Nacional', slug: 'nacional', color: '#10B981', icon: 'Map', sortOrder: 7 },
    { name: 'Internacional', slug: 'internacional', color: '#3B82F6', icon: 'Globe', sortOrder: 8 },
    { name: 'Grupal', slug: 'grupal', color: '#8B5CF6', icon: 'Users', sortOrder: 9 },
    { name: 'Tours', slug: 'tours', color: '#EC4899', icon: 'Compass', sortOrder: 10 },
  ]

  const categoriesMap: Record<string, string> = {}
  for (const cat of categoriesData) {
    const created = await db.planCategory.create({ data: cat })
    categoriesMap[created.name] = created.id
  }

  console.log('  ✅ Created categories')

  // 3. Create Tour Plans (15 plans from data.ts)
  const plansData = [
    {
      name: 'Plan Manglar Mallorquín',
      slug: 'plan-manglar-mallorquin',
      shortDescription: 'Recorre los manglares de Mallorquín en kayak y descubre la fauna del ecosistema costero del Atlántico.',
      fullDescription: 'Sumérgete en una experiencia única navegando por los canales del manglar de Mallorquín, uno de los ecosistemas más importantes de la costa caribe colombiana. Este plan incluye un recorrido guiado en kayak por los canales del manglar, donde podrás observar aves, cangrejos y otra fauna local en su hábitat natural. El guía te contará sobre la importancia ecológica del manglar y los esfuerzos de conservación. Disfruta de un refrigerio típico frente al mar y finaliza con tiempo libre en la playa de Mallorquín para relajarte y tomar fotografías.',
      price: 85000,
      priceRange: '$85.000 - $120.000 COP',
      duration: 'Medio día (4 horas)',
      location: 'Manglar de Mallorquín, Puerto Colombia',
      category: 'Naturaleza',
      difficulty: 'Fácil',
      schedule: '7:00 AM - 11:00 AM / 2:00 PM - 6:00 PM',
      meetingPoint: 'Parque principal de Puerto Colombia',
      rating: 4.8,
      reviewCount: 124,
      maxGuests: 12,
      published: true,
      sortOrder: 0,
      images: [
        'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
      ],
      includes: [
        'Guía profesional bilingüe',
        'Equipo de kayak completo',
        'Refrigerio típico',
        'Seguro de accidentes',
        'Transporte ida y vuelta desde puntos de encuentro',
        'Charla de conservación ambiental',
      ],
      excludes: ['Gastos personales', 'Fotografía profesional', 'Comidas adicionales'],
      highlights: [
        'Avistamiento de aves y fauna del manglar',
        'Navegación en kayak por canales naturales',
        'Playa de Mallorquín',
        'Refrigerio típico costeño',
      ]
    },
    {
      name: 'Plan Playa Blanca',
      slug: 'plan-playa-blanca',
      shortDescription: 'Disfruta de un día paradisíaco en Playa Blanca con transporte, comida y actividades acuáticas incluidas.',
      fullDescription: 'Vive un día completo en una de las playas más hermosas del Caribe colombiano. Playa Blanca te espera con sus aguas cristalinas y arenas blancas. El plan incluye transporte cómodo desde Barranquilla, ingreso al sector premium de la playa, almuerzo típico costeño con opciones de pescado frito o pollo, y actividades acuáticas como snorkel y paddleboard. También tendrás acceso a zonas de descanso con camas y sombrillas. Un día perfecto para relajarte, nadar y disfrutar del Caribe.',
      price: 150000,
      priceRange: '$150.000 - $200.000 COP',
      duration: 'Día completo (10 horas)',
      location: 'Playa Blanca, Barú',
      category: 'Playa',
      difficulty: 'Fácil',
      schedule: '6:00 AM - 4:00 PM',
      meetingPoint: 'Centro Comercial Buenavista, Barranquilla',
      rating: 4.9,
      reviewCount: 287,
      maxGuests: 25,
      published: true,
      sortOrder: 1,
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800&h=600&fit=crop',
      ],
      includes: [
        'Transporte ida y vuelta en bus climatizado',
        'Ingreso a zona premium de playa',
        'Almuerzo típico costeño',
        'Equipo de snorkel',
        'Paddleboard (30 min)',
        'Cama y sombrilla',
        'Seguro de viaje',
      ],
      excludes: ['Bebidas alcohólicas', 'Gastos personales', 'Fotos y videos profesionales'],
      highlights: [
        'Aguas cristalinas del Caribe',
        'Almuerzo costeño incluido',
        'Snorkel y paddleboard',
        'Zona premium con camas y sombrillas',
      ]
    },
    {
      name: 'Plan Senderismo Cerro de la Vieja',
      slug: 'plan-senderismo-cerro-vieja',
      shortDescription: 'Aventura de senderismo con vistas panorámicas del Atlántico desde el Cerro de la Vieja.',
      fullDescription: 'Desafía tus sentidos con esta caminata ecológica hasta el Cerro de la Vieja, uno de los miradores naturales más impresionantes del departamento del Atlántico. Durante el recorrido, atravesarás bosques secos tropicales, observarás flora y fauna endémica, y llegarás a una cima con vistas 360° que abarcan desde la Sierra Nevada de Santa Marta hasta el mar Caribe. El plan incluye guía experto en senderismo, refrigerio energético, kit de primeros auxilios y certificado de participación. Ideal para amantes de la naturaleza y la aventura.',
      price: 95000,
      priceRange: '$95.000 - $130.000 COP',
      duration: 'Medio día (5 horas)',
      location: 'Cerro de la Vieja, Luruaco',
      category: 'Aventura',
      difficulty: 'Moderado',
      schedule: '5:30 AM - 10:30 AM',
      meetingPoint: 'Parque principal de Luruaco',
      rating: 4.7,
      reviewCount: 89,
      maxGuests: 10,
      published: true,
      sortOrder: 2,
      images: [
        'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&h=600&fit=crop',
      ],
      includes: [
        'Guía de senderismo certificado',
        'Refrigerio energético',
        'Kit de primeros auxilios',
        'Seguro de accidentes',
        'Transporte desde punto de encuentro',
        'Certificado de participación',
      ],
      excludes: ['Calzado de senderizo', 'Gastos personales', 'Fotografía profesional'],
      highlights: [
        'Vista panorámica 360°',
        'Bosque seco tropical',
        'Avistamiento de fauna endémica',
        'Cerro a 350m sobre el nivel del mar',
      ]
    },
    {
      name: 'Plan Tour Galápago del Atlántico',
      slug: 'plan-tour-galapago-atlantico',
      shortDescription: 'Visita el santuario de tortugas galápagos y aprende sobre conservación marina en el Atlántico.',
      fullDescription: 'Conoce el fascinante mundo de las tortugas galápagos en este tour educativo y ecológico por el Atlántico. Visitarás el centro de conservación donde expertos biólogos te explicarán los programas de protección de estas especies milenarias. Podrás observar las tortugas en su entorno natural, aprender sobre su ciclo de vida y los esfuerzos para preservarlas. El tour también incluye un paseo en lancha por la bahía y tiempo para disfrutar de la playa cercana. Una experiencia perfecta para familias y amantes de la naturaleza.',
      price: 110000,
      priceRange: '$110.000 - $160.000 COP',
      duration: 'Medio día (5 horas)',
      location: 'Bahía de Santa Verónica, Atlántico',
      category: 'Ecoturismo',
      difficulty: 'Fácil',
      schedule: '8:00 AM - 1:00 PM',
      meetingPoint: 'Plaza de Santa Verónica',
      rating: 4.6,
      reviewCount: 56,
      maxGuests: 15,
      published: true,
      sortOrder: 3,
      images: [
        'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
      ],
      includes: [
        'Guía biólogo marino',
        'Visita al centro de conservación',
        'Paseo en lancha por la bahía',
        'Refrigerio ecológico',
        'Seguro de accidentes',
        'Material educativo',
        'Transporte desde punto de encuentro',
      ],
      excludes: ['Souvenirs y artesanías', 'Gastos personales', 'Fotografía profesional bajo el agua'],
      highlights: [
        'Observación de tortugas galápagos',
        'Centro de conservación marino',
        'Paseo en lancha',
        'Educación ambiental',
      ]
    },
    {
      name: 'Plan Noche de Estrellas en la Costa',
      slug: 'plan-noche-estrellas-costa',
      shortDescription: 'Vive una noche mágica bajo las estrellas en la costa del Atlántico con cena y observación astronómica.',
      fullDescription: 'Una experiencia inolvidable que combina la belleza del mar Caribe con la majestuosidad del cielo nocturno. Este plan incluye traslado al mirador costero, una cena gourmet frente al mar con mariscos frescos de la región, y una sesión de observación astronómica guiada con telescopios profesionales. Aprenderás sobre las constelaciones visibles desde el Caribe colombiano y las leyendas indígenas asociadas. Incluye barra libre de cócteles tropicales, música en vivo con sonidos del Caribe y una fogata en la playa. Romántico y educativo, perfecto para parejas y grupos pequeños.',
      price: 180000,
      priceRange: '$180.000 - $250.000 COP',
      duration: 'Noche completa (6 horas)',
      location: 'Mirador Costero, Juan de Acosta',
      category: 'Experiencia',
      difficulty: 'Fácil',
      schedule: '6:00 PM - 12:00 AM',
      meetingPoint: 'Hotel lobby zona norte, Barranquilla',
      rating: 4.9,
      reviewCount: 67,
      maxGuests: 8,
      published: true,
      sortOrder: 4,
      images: [
        'https://images.unsplash.com/photo-1475274047050-1d0c55b0033b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=600&fit=crop',
      ],
      includes: [
        'Transporte ida y vuelta',
        'Cena gourmet frente al mar',
        'Barra libre de cócteles tropicales',
        'Observación astronómica con telescopios',
        'Guía astrónomo',
        'Música en vivo',
        'Fogata en la playa',
        'Seguro de accidentes',
      ],
      excludes: ['Vinos premium', 'Souvenirs', 'Fotografía profesional'],
      highlights: [
        'Observación de estrellas con telescopio',
        'Cena gourmet de mariscos',
        'Fogata y música en vivo',
        'Mirador costero exclusivo',
      ]
    },
    {
      name: 'Plan Ruta del Bolívar Costero',
      slug: 'plan-ruta-bolivar-costero',
      shortDescription: 'Recorre los sitios históricos del litoral del Atlántico relacionados con la gesta libertadora.',
      fullDescription: 'Viaja en el tiempo por la costa del Atlántico siguiendo los pasos del Libertador Simón Bolívar. Este tour cultural e histórico te lleva por los sitios más emblemáticos de la gesta independentista en el Caribe colombiano: el Museo Bolivariano, el antiguo puerto de Sabanilla, y las fortificaciones coloniales. Incluye almuerzo típico en restaurante histórico, guía historiador experto y material didáctico. Aprenderás sobre la importancia estratégica del Atlántico en la independencia de Colombia y disfrutarás de las vistas del mar Caribe desde perspectivas históricas únicas.',
      price: 75000,
      priceRange: '$75.000 - $100.000 COP',
      duration: 'Medio día (4 horas)',
      location: 'Zona histórica, Barranquilla y Sabanilla',
      category: 'Cultural',
      difficulty: 'Fácil',
      schedule: '9:00 AM - 1:00 PM',
      meetingPoint: 'Museo Bolivariano, Barranquilla',
      rating: 4.5,
      reviewCount: 43,
      maxGuests: 20,
      published: true,
      sortOrder: 5,
      images: [
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1568702846914-96b305d2ced1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1466442929976-97f336a657be?w=800&h=600&fit=crop',
      ],
      includes: [
        'Guía historiador certificado',
        'Entradas a museos y sitios históricos',
        'Almuerzo típico',
        'Transporte entre sitios',
        'Material didáctico',
        'Seguro de viaje',
      ],
      excludes: ['Souvenirs y artesanías', 'Gastos personales', 'Propinas'],
      highlights: [
        'Museo Bolivariano',
        'Puerto histórico de Sabanilla',
        'Fortificaciones coloniales',
        'Almuerzo en restaurante histórico',
      ]
    },
    {
      name: 'Magia del Eje Cafetero',
      slug: 'magia-eje-cafetero',
      shortDescription: 'Descubre la cultura cafetera, paisajes verdes y pueblos con encanto en un viaje inolvidable de 4 días.',
      fullDescription: 'Un viaje de 4 días y 3 noches por el corazón de Colombia. Recorre el Valle de Cocora con sus imponentes palmas de cera, visita fincas cafeteras tradicionales donde aprenderás todo el proceso del café desde la semilla hasta la taza, y relájate en las aguas termales de Santa Rosa de Cabal. Incluye alojamiento en hacienda típica, alimentación completa y guías expertos de la región.',
      price: 1250000,
      priceRange: '$1.250.000 - $1.500.000 COP',
      duration: '4 días, 3 noches',
      location: 'Eje Cafetero, Colombia',
      category: 'Nacional',
      difficulty: 'Fácil',
      schedule: 'Salidas todos los jueves',
      meetingPoint: 'Aeropuerto El Dorado',
      rating: 4.9,
      reviewCount: 156,
      maxGuests: 15,
      published: true,
      sortOrder: 6,
      images: [
        'https://images.unsplash.com/photo-1622308644420-b30fbdf94f1c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1518182170546-076616fdcbdd?w=800&h=600&fit=crop',
      ],
      includes: ['Vuelos ida y vuelta', 'Alojamiento 3 noches', 'Desayunos y cenas', 'Tour cafetero', 'Entrada a termales'],
      excludes: ['Almuerzos', 'Propinas', 'Gastos personales'],
      highlights: ['Valle de Cocora', 'Tour del Café', 'Termales de Santa Rosa'],
    },
    {
      name: 'Aventura en Parque Tayrona',
      slug: 'aventura-parque-tayrona',
      shortDescription: 'Conecta con la selva y el mar en el espectacular Parque Nacional Natural Tayrona por 3 noches.',
      fullDescription: 'Explora uno de los parques naturales más hermosos del mundo durante 4 días y 3 noches. Camina por senderos ecológicos rodeados de selva tropical hasta llegar a playas paradisíacas como Cabo San Juan y Arrecifes. Duerme en eco-habs con vista al mar y disfruta de la gastronomía local. Una experiencia perfecta para desconectar y llenarse de la energía de la Sierra Nevada.',
      price: 980000,
      priceRange: '$980.000 - $1.200.000 COP',
      duration: '4 días, 3 noches',
      location: 'Santa Marta, Colombia',
      category: 'Nacional',
      difficulty: 'Moderado',
      schedule: 'Salidas viernes y sábados',
      meetingPoint: 'Terminal de Transportes',
      rating: 4.8,
      reviewCount: 210,
      maxGuests: 12,
      published: true,
      sortOrder: 7,
      images: [
        'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1620002093390-8d5926ec3fb4?w=800&h=600&fit=crop',
      ],
      includes: ['Transporte terrestre', 'Alojamiento en eco-habs', 'Desayunos', 'Entrada al Parque', 'Seguro médico'],
      excludes: ['Almuerzos y cenas', 'Gastos personales'],
      highlights: ['Cabo San Juan', 'Senderismo guiado', 'Playas vírgenes'],
    },
    {
      name: 'Paraíso en Punta Cana',
      slug: 'paraiso-punta-cana',
      shortDescription: 'Disfruta del Caribe al máximo con un plan todo incluido en las playas de Punta Cana.',
      fullDescription: 'Relájate en las playas de arena blanca y aguas cristalinas de República Dominicana con este viaje de 5 días y 4 noches. Alójate en un resort 5 estrellas con sistema todo incluido (comidas y bebidas ilimitadas). Disfruta de shows nocturnos, deportes acuáticos no motorizados y acceso a piscinas exclusivas. El plan perfecto para descansar sin preocupaciones.',
      price: 3500000,
      priceRange: '$3.500.000 - $4.200.000 COP',
      duration: '5 días, 4 noches',
      location: 'Punta Cana, Rep. Dominicana',
      category: 'Internacional',
      difficulty: 'Fácil',
      schedule: 'Salidas diarias',
      meetingPoint: 'Aeropuerto Internacional',
      rating: 4.9,
      reviewCount: 342,
      maxGuests: 30,
      published: true,
      sortOrder: 8,
      images: [
        'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582294406180-2c40b82bc0e3?w=800&h=600&fit=crop',
      ],
      includes: ['Vuelos directos', 'Alojamiento Todo Incluido', 'Traslados aeropuerto-hotel', 'Seguro de viaje'],
      excludes: ['Tours opcionales', 'Gastos personales'],
      highlights: ['Resort 5 estrellas', 'Bebidas ilimitadas', 'Playa privada'],
    },
    {
      name: 'Escape a San Andrés Islas',
      slug: 'escape-san-andres',
      shortDescription: 'Sumérgete en el mar de los 7 colores con este plan completo a la isla de San Andrés.',
      fullDescription: 'Descubre la belleza del Caribe colombiano en este viaje internacionalmente reconocido de 4 días y 3 noches. Disfruta de las playas de arena blanca, recorre la isla en un carrito de golf, visita el Acuario y Johnny Cay. Incluye alojamiento en hotel frente al mar, alimentación y tours emblemáticos para vivir la isla al máximo.',
      price: 1800000,
      priceRange: '$1.800.000 - $2.100.000 COP',
      duration: '4 días, 3 noches',
      location: 'San Andrés Islas',
      category: 'Internacional',
      difficulty: 'Fácil',
      schedule: 'Salidas diarias',
      meetingPoint: 'Aeropuerto',
      rating: 4.7,
      reviewCount: 421,
      maxGuests: 25,
      published: true,
      sortOrder: 9,
      images: [
        'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1580228373356-820875298a00?w=800&h=600&fit=crop',
      ],
      includes: ['Vuelos', 'Alojamiento con desayunos y cenas', 'Tour al Acuario', 'Vuelta a la isla'],
      excludes: ['Tarjeta de turismo', 'Almuerzos'],
      highlights: ['Mar de 7 colores', 'Johnny Cay', 'Hoyo Soplador'],
    },
    {
      name: 'Aventura en Cancún',
      slug: 'aventura-cancun',
      shortDescription: 'Descubre la vibrante vida nocturna, zonas arqueológicas y playas espectaculares de Cancún.',
      fullDescription: 'Un espectacular viaje de 6 días y 5 noches al corazón del Caribe mexicano. Hospédate en un excelente resort en la zona hotelera con sistema todo incluido. Opcionalmente podrás visitar Chichén Itzá, cenotes cristalinos o parques temáticos como Xcaret. Un destino vibrante que lo tiene todo: relax, fiesta y cultura milenaria.',
      price: 4200000,
      priceRange: '$4.200.000 - $5.500.000 COP',
      duration: '6 días, 5 noches',
      location: 'Cancún, México',
      category: 'Internacional',
      difficulty: 'Fácil',
      schedule: 'Salidas diarias',
      meetingPoint: 'Aeropuerto Internacional',
      rating: 4.9,
      reviewCount: 512,
      maxGuests: 40,
      published: true,
      sortOrder: 10,
      images: [
        'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800&h=600&fit=crop',
      ],
      includes: ['Vuelos directos', 'Hotel Todo Incluido', 'Traslados', 'Asistencia médica'],
      excludes: ['Tours arqueológicos', 'Propinas'],
      highlights: ['Zona Hotelera', 'Playas increíbles', 'Vida nocturna'],
    },
    {
      name: 'Tour Grupal de las Islas',
      slug: 'tour-islas-cartagena-tintipan',
      shortDescription: 'Un viaje en grupo recorriendo las islas de Cartagena y Tintipán en un ambiente festivo.',
      fullDescription: 'Únete a este increíble viaje grupal de un día completo explorando los archipiélagos más hermosos. Navegaremos en lancha rápida desde Cartagena hacia las Islas del Rosario y Tintipán. Habrá música, refrigerios, paradas estratégicas para hacer snorkel y un almuerzo isleño espectacular. Ideal para celebrar con amigos o conocer gente nueva.',
      price: 320000,
      priceRange: '$320.000 - $380.000 COP',
      duration: 'Día completo (10 horas)',
      location: 'Cartagena / Tintipán',
      category: 'Grupal',
      difficulty: 'Fácil',
      schedule: '7:00 AM - 5:00 PM',
      meetingPoint: 'Muelle de los Pegasos, Cartagena',
      rating: 4.8,
      reviewCount: 189,
      maxGuests: 40,
      published: true,
      sortOrder: 11,
      images: [
        'https://images.unsplash.com/photo-1550953181-e28a50f75f92?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1580228373356-820875298a00?w=800&h=600&fit=crop',
      ],
      includes: ['Transporte en lancha', 'Almuerzo isleño', 'Snorkel', 'Guía animador'],
      excludes: ['Impuesto portuario', 'Bebidas alcohólicas'],
      highlights: ['Islas del Rosario', 'Tintipán', 'Snorkel y fiesta'],
    },
    {
      name: 'Expedición Grupal Sierra Limón',
      slug: 'expedicion-sierra-limon',
      shortDescription: 'Aventura grupal de un día descubriendo cascadas y senderos ocultos en Sierra Limón.',
      fullDescription: 'Forma parte de esta expedición de un día pensada para grupos. Caminaremos por senderos ecológicos hasta llegar a las impresionantes cascadas de Sierra Limón. Un plan perfecto para team building o grupos de amigos que buscan aventura y naturaleza. Terminaremos con un almuerzo tradicional preparado por la comunidad local.',
      price: 180000,
      priceRange: '$180.000 - $220.000 COP',
      duration: 'Día completo (8 horas)',
      location: 'Sierra Limón',
      category: 'Grupal',
      difficulty: 'Moderado',
      schedule: '6:00 AM - 4:00 PM',
      meetingPoint: 'Plaza Central',
      rating: 4.6,
      reviewCount: 88,
      maxGuests: 35,
      published: true,
      sortOrder: 12,
      images: [
        'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
      ],
      includes: ['Transporte en bus', 'Guía local', 'Almuerzo tradicional', 'Seguro de viaje'],
      excludes: ['Gastos personales'],
      highlights: ['Cascadas escondidas', 'Senderismo', 'Almuerzo comunitario'],
    },
    {
      name: 'Salto en Paracaidismo',
      slug: 'tour-paracaidismo',
      shortDescription: 'Siente la adrenalina extrema en una experiencia de paracaidismo tandem.',
      fullDescription: 'Para los amantes de la adrenalina pura. Una experiencia corta pero indefinida donde realizarás un salto en paracaídas tipo tandem junto a un instructor certificado. Disfruta de una caída libre a más de 200 km/h y luego planea suavemente admirando un paisaje inigualable desde el aire.',
      price: 650000,
      priceRange: '$650.000 - $800.000 COP',
      duration: 'Tour corto (3 horas)',
      location: 'Aeródromo local',
      category: 'Tours',
      difficulty: 'Fácil',
      schedule: 'Varios horarios disponibles',
      meetingPoint: 'Aeródromo',
      rating: 4.9,
      reviewCount: 205,
      maxGuests: 2,
      published: true,
      sortOrder: 13,
      images: [
        'https://images.unsplash.com/photo-1520114757270-b1836a0fb494?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1521685360661-04ba71a06288?w=800&h=600&fit=crop',
      ],
      includes: ['Vuelo escénico', 'Salto tandem', 'Instructor certificado', 'Seguro'],
      excludes: ['Fotos y video', 'Transporte al aeródromo'],
      highlights: ['Caída libre de 1 minuto', 'Vuelo de 5 minutos en paracaídas'],
    },
    {
      name: 'Tour de Buceo en San Andrés',
      slug: 'tour-buceo-san-andres',
      shortDescription: 'Explora los increíbles arrecifes de coral en esta inmersión para principiantes.',
      fullDescription: 'Descubre el maravilloso mundo submarino del mar de los siete colores en un tour corto de buceo. Diseñado especialmente para principiantes (no necesitas certificación). Incluye una clase teórica, práctica en aguas poco profundas y una inmersión guiada en el arrecife de coral, donde podrás ver peces tropicales, mantarrayas y vida marina colorida.',
      price: 250000,
      priceRange: '$250.000 - $300.000 COP',
      duration: 'Tour corto (4 horas)',
      location: 'San Andrés Islas',
      category: 'Tours',
      difficulty: 'Moderado',
      schedule: '8:00 AM o 2:00 PM',
      meetingPoint: 'Centro de Buceo',
      rating: 4.8,
      reviewCount: 310,
      maxGuests: 6,
      published: true,
      sortOrder: 14,
      images: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582967177931-50e82c5f1cd3?w=800&h=600&fit=crop',
      ],
      includes: ['Clase teórica y práctica', 'Equipo completo de buceo', '1 inmersión guiada', 'Instructor PADI'],
      excludes: ['Fotos submarinas', 'Transporte al centro de buceo'],
      highlights: ['Arrecifes de coral', 'Buceo seguro para novatos'],
    }
  ]

  for (const plan of plansData) {
    const categoryId = categoriesMap[plan.category] || null
    await db.tourPlan.create({
      data: {
        name: plan.name,
        slug: plan.slug,
        shortDescription: plan.shortDescription,
        fullDescription: plan.fullDescription,
        price: plan.price,
        priceRange: plan.priceRange,
        duration: plan.duration,
        location: plan.location,
        categoryId: categoryId,
        difficulty: plan.difficulty,
        schedule: plan.schedule,
        meetingPoint: plan.meetingPoint,
        rating: plan.rating,
        reviewCount: plan.reviewCount,
        maxGuests: plan.maxGuests,
        published: plan.published,
        sortOrder: plan.sortOrder,
        images: {
          create: plan.images.map((url, idx) => ({
            url,
            caption: 'Imagen del plan',
            source: 'external',
            sortOrder: idx
          }))
        },
        includes: {
          create: plan.includes.map((text, idx) => ({
            text,
            sortOrder: idx
          }))
        },
        excludes: {
          create: plan.excludes.map((text, idx) => ({
            text,
            sortOrder: idx
          }))
        },
        highlights: {
          create: plan.highlights.map((text, idx) => ({
            text,
            sortOrder: idx
          }))
        }
      }
    })
  }

  console.log('  ✅ Created plans')

  // 4. Create Cabins (5 cabins from data.ts)
  const cabinsData = [
    {
      name: 'Cabaña Caribe Coral',
      slug: 'cabana-caribe-coral',
      shortDescription: 'Cabaña frente al mar con diseño caribeño, piscina privada y acceso directo a la playa.',
      fullDescription: 'Disfruta de la auténtica experiencia caribeña en esta hermosa cabaña frente al mar. Diseñada con materiales locales y una decoración que fusiona lo rústico con lo moderno, la Cabaña Caribe Coral ofrece todo lo que necesitas para unas vacaciones perfectas. Cuenta con piscina privada con vista al mar, terraza con hamacas, cocina totalmente equipada y habitaciones con aire acondicionado. Despierta con el sonido de las olas y relájate en tu oasis privado en la costa del Atlántico.',
      pricePerNight: 280000,
      priceRange: '$280.000 - $380.000 COP / noche',
      location: 'Santa Verónica, Atlántico',
      address: 'Vía Santa Verónica, Km 15',
      capacity: 6,
      bedrooms: 2,
      bathrooms: 2,
      lat: 10.95,
      lng: -75.05,
      checkIn: '3:00 PM',
      checkOut: '11:00 AM',
      cancellationPolicy: 'Cancelación gratuita hasta 7 días antes del check-in',
      rating: 4.9,
      reviewCount: 98,
      published: true,
      sortOrder: 0,
      images: [
        'https://images.unsplash.com/photo-1499793983394-e58f8b6a1109?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=800&h=600&fit=crop',
      ],
      amenities: [
        'Piscina privada',
        'Aire acondicionado',
        'Cocina equipada',
        'Terraza con hamacas',
        'Acceso directo a la playa',
        'WiFi gratuito',
        'Estacionamiento',
        'Parrilla/BBQ',
        'TV Smart 55"',
        'Toallas de playa',
      ],
      highlights: [
        'Frente al mar',
        'Piscina privada',
        'Diseño caribeño auténtico',
        'Acceso directo a la playa',
      ],
      rules: [
        'No fiestas ni eventos',
        'No fumar dentro de la cabaña',
        'No mascotas',
        'Check-in: 3:00 PM, Check-out: 11:00 AM',
        'Máximo 6 huéspedes',
        'Silencio después de las 10:00 PM',
      ],
    },
    {
      name: 'Cabaña Manglar Eco-Lodge',
      slug: 'cabana-manglar-eco-lodge',
      shortDescription: 'Eco-cabaña rodeada de manglares con experiencia de turismo sostenible y naturaleza pura.',
      fullDescription: 'Sumérgete en la naturaleza sin renunciar al confort en esta eco-cabaña ubicada en medio de un bosque de manglares restaurado. La Cabaña Manglar Eco-Lodge fue construida con materiales sostenibles y energía solar, ofreciendo una experiencia única de turismo responsable. Disfruta de un muelle privado para kayaks, observación de aves desde tu terraza, y ducha al aire libre con agua caliente solar. La cabaña tiene una cama king size con mosquitero, cocina básica y un ambiente de total desconexión. Ideal para parejas que buscan reconectarse con la naturaleza.',
      pricePerNight: 195000,
      priceRange: '$195.000 - $250.000 COP / noche',
      location: 'Manglar de Mallorquín, Puerto Colombia',
      address: 'Ciénaga de Mallorquín',
      capacity: 2,
      bedrooms: 1,
      bathrooms: 1,
      lat: 10.99,
      lng: -74.96,
      checkIn: '2:00 PM',
      checkOut: '12:00 PM',
      cancellationPolicy: 'Cancelación gratuita hasta 5 días antes del check-in',
      rating: 4.8,
      reviewCount: 67,
      published: true,
      sortOrder: 1,
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&h=600&fit=crop',
      ],
      amenities: [
        'Energía solar',
        'Muelle privado para kayaks',
        'Terraza de observación',
        'Ducha al aire libre',
        'Cocina básica',
        'Mosquiteros',
        'Kayak incluido',
        'Binoculares para avistamiento',
        'Hamaca',
        'Agua caliente solar',
      ],
      highlights: [
        '100% sostenible',
        'Rodeada de manglares',
        'Muelle privado',
        'Observación de aves',
      ],
      rules: [
        'No fumar',
        'No mascotas',
        'Respetar la fauna local',
        'No música alta',
        'Check-in: 2:00 PM, Check-out: 12:00 PM',
      ],
    },
    {
      name: 'Cabaña Sol y Arena Familiar',
      slug: 'cabana-sol-arena-familiar',
      shortDescription: 'Amplia cabaña familiar con 3 habitaciones, piscina compartida y zona de juegos infantiles.',
      fullDescription: 'La cabaña perfecta para familias que buscan diversión y descanso. Con tres amplias habitaciones, sala de estar, cocina completa y una terraza gigante con vista al mar, esta cabaña tiene espacio de sobra para toda la familia. Los más pequeños disfrutarán del área de juegos infantiles y la piscina compartida del complejo, mientras los adultos relax en las hamacas o preparan una parrillada en la zona BBQ. Ubicada en un complejo residencial con seguridad 24/7, estacionamiento y acceso a la playa por sendero peatonal.',
      pricePerNight: 350000,
      priceRange: '$350.000 - $450.000 COP / noche',
      location: 'Playa Mendoza, Atlántico',
      address: 'Calle 5, Puerto Colombia',
      capacity: 8,
      bedrooms: 3,
      bathrooms: 2,
      lat: 10.92,
      lng: -75.12,
      checkIn: '3:00 PM',
      checkOut: '11:00 AM',
      cancellationPolicy: 'Cancelación gratuita hasta 10 días antes del check-in',
      rating: 4.7,
      reviewCount: 134,
      published: true,
      sortOrder: 2,
      images: [
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
      ],
      amenities: [
        'Piscina compartida',
        'Zona de juegos infantiles',
        'Cocina completa',
        'Aire acondicionado en todas las habitaciones',
        'Terraza con vista al mar',
        'Zona BBQ',
        'Seguridad 24/7',
        'Estacionamiento para 2 vehículos',
        'WiFi gratuito',
        'Lavadora',
      ],
      highlights: [
        'Ideal para familias',
        '3 habitaciones amplias',
        'Zona de juegos infantiles',
        'Seguridad 24/7',
      ],
      rules: [
        'No fiestas después de las 10:00 PM',
        'No fumar dentro de la cabaña',
        'Mascotas permitidas',
        'Check-in: 3:00 PM, Check-out: 11:00 AM',
      ],
    },
    {
      name: 'Cabaña Brisa del Mar',
      slug: 'cabana-brisa-del-mar',
      shortDescription: 'Cabaña romántica para parejas con jacuzzi privado, decoración bohemia y atardeceres increíbles.',
      fullDescription: 'Un refugio romántico diseñado para parejas que buscan escapar de la rutina. La Cabaña Brisa del Mar combina decoración bohemia chic con todas las comodidades modernas. Su pieza estrella es el jacuzzi privado en la terraza con vista al mar, perfecto para disfrutar de los atardeceres más hermosos del Caribe. La cabaña cuenta con una habitación principal con cama king size, baño con ducha de lluvia, cocina americana equipada y un espacio de lectura con hamaca. Incluye botella de vino de bienvenida y desayuno continental incluido.',
      pricePerNight: 320000,
      priceRange: '$320.000 - $420.000 COP / noche',
      location: 'Juan de Acosta, Atlántico',
      address: 'Playa Blanca Sector Norte',
      capacity: 2,
      bedrooms: 1,
      bathrooms: 1,
      lat: 10.82,
      lng: -75.05,
      checkIn: '3:00 PM',
      checkOut: '12:00 PM',
      cancellationPolicy: 'Cancelación gratuita hasta 5 días antes del check-in',
      rating: 5.0,
      reviewCount: 45,
      published: true,
      sortOrder: 3,
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
      ],
      amenities: [
        'Jacuzzi privado en terraza',
        'Vino de bienvenida',
        'Desayuno continental incluido',
        'Cama king size',
        'Ducha de lluvia',
        'Cocina americana',
        'Hamaca de lectura',
        'Aire acondicionado',
        'WiFi gratuito',
      ],
      highlights: [
        'Jacuzzi privado con vista al mar',
        'Romántica y bohemia',
        'Desayuno incluido',
        'Atardeceres únicos',
      ],
      rules: [
        'Solo adultos (18+)',
        'No niños',
        'No mascotas',
        'No fiestas',
        'Check-in: 3:00 PM, Check-out: 12:00 PM',
      ],
    },
    {
      name: 'Cabaña Palma Costeña',
      slug: 'cabana-palma-costena',
      shortDescription: 'Cabaña típica costeña con techo de palma, perfecta para una experiencia auténtica y económica.',
      fullDescription: 'Vive la auténtica experiencia costeña en esta cabaña tradicional con techo de palma y paredes de madera. La Cabaña Palma Costeña te transporta a la esencia del Caribe colombiano, con su decoración artesanal, muebles de madera local y ambiente fresco y natural. Ubicada en un terreno amplio con palmeras y jardín tropical, ofrece sombra natural y brisa marina constante. Cuenta con lo esencial para una estadía cómoda: cama matrimonial, ventilador de techo, cocina al aire libre y ducha con agua fría/caliente. Ideal para viajeros que buscan autenticidad sin gastar de más.',
      pricePerNight: 120000,
      priceRange: '$120.000 - $160.000 COP / noche',
      location: 'Tubará, Atlántico',
      address: 'Vereda La Playa, Tubará',
      capacity: 4,
      bedrooms: 1,
      bathrooms: 1,
      lat: 10.87,
      lng: -75.03,
      checkIn: '2:00 PM',
      checkOut: '11:00 AM',
      cancellationPolicy: 'Cancelación gratuita hasta 3 días antes del check-in',
      rating: 4.4,
      reviewCount: 78,
      published: true,
      sortOrder: 4,
      images: [
        'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
      ],
      amenities: [
        'Techo de palma tradicional',
        'Cocina al aire libre',
        'Jardín tropical',
        'Ventilador de techo',
        'Hamaca',
        'Estacionamiento',
        'Ducha con agua fría/caliente',
      ],
      highlights: [
        'Experiencia auténtica costeña',
        'Techo de palma tradicional',
        'Económica',
        'Jardín tropical privado',
      ],
      rules: [
        'No fiestas',
        'No fumar dentro de la cabaña',
        'Mascotas permitidas',
        'Check-in: 2:00 PM, Check-out: 11:00 AM',
      ],
    },
  ]

  for (const cabin of cabinsData) {
    await db.cabin.create({
      data: {
        name: cabin.name,
        slug: cabin.slug,
        shortDescription: cabin.shortDescription,
        fullDescription: cabin.fullDescription,
        pricePerNight: cabin.pricePerNight,
        priceRange: cabin.priceRange,
        location: cabin.location,
        address: cabin.address,
        capacity: cabin.capacity,
        bedrooms: cabin.bedrooms,
        bathrooms: cabin.bathrooms,
        lat: cabin.lat,
        lng: cabin.lng,
        checkIn: cabin.checkIn,
        checkOut: cabin.checkOut,
        cancellationPolicy: cabin.cancellationPolicy,
        rating: cabin.rating,
        reviewCount: cabin.reviewCount,
        published: cabin.published,
        sortOrder: cabin.sortOrder,
        images: {
          create: cabin.images.map((url, idx) => ({
            url,
            caption: 'Imagen de cabaña',
            source: 'external',
            sortOrder: idx
          }))
        },
        amenities: {
          create: cabin.amenities.map((text, idx) => ({
            text,
            sortOrder: idx
          }))
        },
        highlights: {
          create: cabin.highlights.map((text, idx) => ({
            text,
            sortOrder: idx
          }))
        },
        rules: {
          create: cabin.rules.map((text, idx) => ({
            text,
            sortOrder: idx
          }))
        }
      }
    })
  }

  console.log('  ✅ Created cabins')

  // 5. Create Testimonials (from data.ts)
  await db.testimonial.createMany({
    data: [
      {
        name: 'Carolina Mendoza',
        avatar: 'CM',
        location: 'Bogotá, Colombia',
        text: 'El Plan Manglar Mallorquín fue una experiencia increíble. Los guías son muy conocedores y el paisaje es breathtaking. 100% recomendado para desconectar de la ciudad.',
        rating: 5,
        tripName: 'Plan Manglar Mallorquín',
        published: true,
        sortOrder: 0,
      },
      {
        name: 'Andrés Pérez',
        avatar: 'AP',
        location: 'Medellín, Colombia',
        text: 'Fuimos con un grupo de amigos a Playa Blanca y todo fue perfecto. La organización, la comida, las actividades. Vive Travel nos hizo sentir como en casa lejos de casa.',
        rating: 5,
        tripName: 'Plan Playa Blanca',
        published: true,
        sortOrder: 1,
      },
      {
        name: 'María Fernanda López',
        avatar: 'ML',
        location: 'Barranquilla, Colombia',
        text: 'La Cabaña Caribe Coral es un paraíso. Piscina privada frente al mar, no se puede pedir más. Ideal para una escapada romántica.',
        rating: 5,
        tripName: 'Cabaña Caribe Coral',
        published: true,
        sortOrder: 2,
      },
      {
        name: 'Diego Torres',
        avatar: 'DT',
        location: 'Cali, Colombia',
        text: 'El senderismo al Cerro de la Vieja fue desafiante pero gratificante. Las vistas desde la cima son las mejores que he visto en el Atlántico. Guía excelente.',
        rating: 4,
        tripName: 'Plan Senderismo Cerro de la Vieja',
        published: true,
        sortOrder: 3,
      },
      {
        name: 'Laura Gutiérrez',
        avatar: 'LG',
        location: 'Bucaramanga, Colombia',
        text: 'La noche de estrellas fue mágica. La cena, el telescopio, la fogata... todo estaba perfectamente organizado. Una experiencia que nunca olvidará.',
        rating: 5,
        tripName: 'Plan Noche de Estrellas en la Costa',
        published: true,
        sortOrder: 4,
      },
      {
        name: 'Roberto Sánchez',
        avatar: 'RS',
        location: 'Cartagena, Colombia',
        text: 'Nos quedamos en la Cabaña Brisa del Mar con mi esposa y fue la mejor decisión. El jacuzzi al atardecer es algo que todo mundo debería experimentar.',
        rating: 5,
        tripName: 'Cabaña Brisa del Mar',
        published: true,
        sortOrder: 5,
      },
    ],
  })

  console.log('  ✅ Created testimonials')

  // 6. Create Contact Messages
  await db.contactMessage.createMany({
    data: [
      {
        name: 'Laura Sánchez',
        email: 'laura.sanchez@email.com',
        phone: '+57 300 123 4567',
        subject: 'Consulta sobre Isla Grande',
        message: 'Hola, me gustaría saber si tienen disponibilidad para la excursión a Isla Grande el próximo fin de semana. Somos un grupo de 4 personas.',
        contactMethod: 'whatsapp',
        isRead: false,
      },
      {
        name: 'Roberto Díaz',
        email: 'roberto.diaz@email.com',
        phone: '+57 310 987 6543',
        subject: 'Reserva cabaña',
        message: 'Quisiera hacer una reserva para la Cabaña del Lago para el mes que viene. ¿Podrían enviarme la disponibilidad?',
        contactMethod: 'email',
        isRead: false,
      },
    ],
  })

  console.log('  ✅ Created contact messages')

  // 7. Create Site Content Sections (EXACTLY matching CMS spec JSON schemas)
  const siteContentData = [
    {
      sectionKey: 'hero',
      content: {
        brandLabel: 'Vive Travel Atlántico',
        title: 'Descubre la Magia del',
        titleHighlight: 'Atlántico',
        subtitle: 'Experiencias únicas en el Caribe colombiano. Desde playas paradisíacas hasta aventuras en la naturaleza, tu próximo viaje comienza aquí.',
        ctaPlans: 'Explorar Planes',
        ctaCabins: 'Ver Cabañas',
      },
    },
    {
      sectionKey: 'influencer',
      content: {
        name: 'Luis Méndez',
        role: 'Fundador y Viajero',
        quote: 'Mi propósito no es solo venderte un viaje, sino asegurarme de que vivas la misma experiencia increíble que yo descubrí He recorrido cada uno de estos destinos para garantizarte calidad, seguridad y recuerdos inolvidables.',
        imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=1000&fit=crop&q=80',
        instagramUrl: 'https://instagram.com/luismendez',
        instagramLabel: 'Sigue mis viajes',
        statsLabel: '+500 viajeros felices',
      },
    },
    {
      sectionKey: 'featuredPlans',
      content: {
        title: 'Planes Turísticos Destacados',
        subtitle: 'Vive experiencias inolvidables en los rincones más hermosos del departamento del Atlántico',
        priceLabel: 'Desde',
        viewMore: 'Ver más',
        viewAll: 'Ver todos los planes',
      },
    },
    {
      sectionKey: 'carousel',
      content: {
        title: 'Lo que dicen nuestros viajeros',
        subtitle: 'Historias reales de quienes vivieron la experiencia Vive Travel',
        brandHover: 'Vive Travel',
        stats: [
          { value: '500+', label: 'Viajeros felices' },
          { value: '25+', label: 'Destinos' },
          { value: '98%', label: 'Satisfacción' },
          { value: '4.9', label: 'Calificación promedio' },
        ],
      },
    },
    {
      sectionKey: 'groupTrips',
      content: {
        label: 'Viajes en Grupo',
        title: 'Viaja en',
        titleHighlight: 'Grupo',
        description: 'Organiza viajes inolvidables con tu familia, amigos o empresa. Ofrecemos planes personalizados con descuentos especiales para grupos.',
        ctaQuote: 'Solicitar Cotización',
        ctaPlans: 'Ver planes',
        benefits: [
          { title: 'Descuentos grupales', description: 'Hasta 20% de descuento para grupos de 8 o más personas' },
          { title: 'Itinerarios flexibles', description: 'Fechas y horarios adaptados a tu grupo' },
          { title: 'Experiencias compartidas', description: 'Crea recuerdos inolvidables con quienes más quieres' },
          { title: 'Atención personalizada', description: 'Un coordinador dedicado para tu grupo' },
        ],
        stats: [
          { value: '50+', label: 'Viajes grupales' },
          { value: '200+', label: 'Participantes' },
          { value: '4.9★', label: 'Calificación' },
        ],
      },
    },
    {
      sectionKey: 'customTrips',
      content: {
        label: 'Viajes Personalizados',
        title: 'Tu Viaje a',
        titleHighlight: 'Medida',
        description: 'Diseñamos experiencias únicas adaptadas a tus gustos, presupuesto y ritmo. Tú sueñas, nosotros lo hacemos realidad.',
        benefits: [
          { title: 'Flexibilidad total', description: 'Elige tus destinos, actividades y ritmo de viaje. Tú decides cómo vivir el Atlántico.' },
          { title: 'Expertos locales', description: 'Nuestros guías conocen cada rincón del departamento y te llevan a lugares únicos.' },
          { title: 'Mejores precios', description: 'Sin intermediarios. Armamos tu viaje a medida con tarifas directas y transparentes.' },
        ],
        ctaTitle: '¿Listo para tu aventura?',
        ctaDescription: 'Cuéntanos qué tipo de experiencia buscas y diseñaremos un viaje perfecto para ti.',
        ctaContact: 'Hablar con un experto',
        ctaPlans: 'Ver planes',
      },
    },
    {
      sectionKey: 'contact',
      content: {
        badge: 'Contáctanos',
        title: '¿Listo para',
        titleHighlight: 'Viajar',
        subtitle: 'Estamos aquí para ayudarte a planificar la experiencia perfecta. Escríbenos y te responderemos lo antes posible.',
        formTitle: 'Envíanos un mensaje',
        whatsapp: '+57 300 123 4567',
        email: 'info@vivetravel.co',
        location: 'Barranquilla, Atlántico, Colombia',
        hours: 'Lun - Sáb: 8:00 AM - 6:00 PM\nDom: 9:00 AM - 1:00 PM',
        instagramUrl: 'https://instagram.com/vivetravel',
        facebookUrl: 'https://facebook.com/vivetravel',
        whatsappUrl: 'https://wa.me/573001234567',
        socialLabel: 'Síguenos en redes',
        chatTitle: 'Chatea con nosotros',
        chatDescription: 'Resolvemos tus dudas al instante por WhatsApp',
        chatButton: 'Abrir WhatsApp',
      },
    },
    {
      sectionKey: 'policies',
      content: {
        badge: 'Políticas',
        title: 'Políticas de',
        titleHighlight: 'Reserva',
        subtitle: 'Transparencia y confianza en cada reserva. Conoce nuestras políticas antes de tu viaje.',
        bookingTitle: 'Políticas de Reserva',
        bookingSubtitle: 'Condiciones para asegurar tu experiencia',
        cancellationTitle: 'Políticas de Cancelación',
        cancellationSubtitle: 'Entendemos que los planes pueden cambiar',
        footerText: 'Nos comprometemos a brindarte la mejor experiencia. Si tienes preguntas sobre nuestras políticas, no dudes en contactarnos.',
        lastUpdate: 'Última actualización: Marzo 2025',
        bookingPolicies: [
          { id: 'booking-process', title: 'Proceso de Reserva', content: '- Selecciona el plan o cabaña de tu preferencia\n- Completa el formulario de reserva con tus datos\n- Recibirás confirmación por correo electrónico\n- **Pago inicial del 30%** para confirmar la reserva' },
          { id: 'payments', title: 'Métodos de Pago', content: '- **Transferencia bancaria:** Bancolombia, Davivienda\n- **Nequi y Daviplata:** Pago inmediato\n- **Efectivo:** Solo en oficina física\n- **Tarjeta de crédito:** Con recargo del 4%' },
        ],
        cancellationPolicies: [
          { id: 'early-cancellation', title: 'Cancelación Anticipada', content: '- **7+ días antes:** Reembolso del 100%\n- **3-6 días antes:** Reembolso del 70%\n- **1-2 días antes:** Reembolso del 50%' },
        ],
      },
    },
    {
      sectionKey: 'homeConfig',
      content: {
        order: ['hero', 'influencer', 'plans', 'gallery', 'international', 'stats', 'groups', 'custom', 'testimonials', 'team'],
        active: {
          hero: true,
          influencer: true,
          plans: true,
          gallery: true,
          international: true,
          stats: true,
          groups: true,
          custom: true,
          testimonials: true,
          team: true,
        },
      },
    },
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
    {
      sectionKey: 'campaign',
      content: {
        active: false,
        bannerText: '🎉 ¡Descuento de temporada activo!',
        ctaText: 'Ver Planes',
        ctaUrl: '#',
      },
    },
    {
      sectionKey: 'seo',
      content: {
        metaTitle: 'Vive Travel Atlántico',
        metaDescription: 'Tu agencia de viajes en el Caribe colombiano',
        openGraphImage: '',
      },
    },
  ]

  for (const section of siteContentData) {
    await db.siteContent.create({ data: section })
  }

  console.log('  ✅ Created site content sections')

  console.log('🎉 Seed completed successfully with real data!')
  return { success: true }
}
