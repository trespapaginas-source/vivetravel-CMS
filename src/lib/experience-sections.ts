export const EXPERIENCE_SECTIONS = [
  {
    id: "pasadias",
    label: "Pasadías",
    title: "Pasadías",
    subtitle:
      "Experiencias de un día para disfrutar playas, naturaleza, aventura y cultura.",
  },
  {
    id: "nacionales",
    label: "Destinos nacionales",
    title: "Destinos nacionales",
    subtitle:
      "Viajes de varios días por Colombia, organizados para descubrir nuevos destinos.",
  },
  {
    id: "internacionales",
    label: "Internacionales",
    title: "Internacionales",
    subtitle:
      "Escapadas fuera de Colombia con enfoque en descanso, playa y experiencias memorables.",
  },
  {
    id: "grupales",
    label: "Grupales",
    title: "Grupales",
    subtitle:
      "Viajes de un día para grupos, equipos, familias y comunidades.",
  },
  {
    id: "tours",
    label: "Tours",
    title: "Tours",
    subtitle:
      "Experiencias y actividades cortas para complementar tu estadía en la ciudad.",
  },
] as const;

export type ExperienceSectionId = (typeof EXPERIENCE_SECTIONS)[number]["id"];

export const DEFAULT_EXPERIENCE_SECTION: ExperienceSectionId = "pasadias";

export function getExperienceSection(id: string | null | undefined) {
  return (
    EXPERIENCE_SECTIONS.find((section) => section.id === id) ??
    EXPERIENCE_SECTIONS[0]
  );
}

export function getPlanExperienceSection(plan: {
  name: string;
  category?: { name: string; slug: string } | null;
  duration?: string | null;
  location?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
}): ExperienceSectionId {
  const categoryStr = plan.category?.name?.toLowerCase() || plan.category?.slug?.toLowerCase() || "";
  const searchable = [
    plan.name,
    plan.category?.name || "",
    plan.duration || "",
    plan.location || "",
    plan.shortDescription || "",
    plan.fullDescription || "",
  ]
    .join(" ")
    .toLowerCase();

  if (categoryStr.includes("internacional") || searchable.includes("internacional") || searchable.includes("cancún") || searchable.includes("cancun") || searchable.includes("punta cana") || searchable.includes("san andrés")) {
    return "internacionales";
  }

  if (categoryStr.includes("grupal") || searchable.includes("grupal") || searchable.includes("grupo") || searchable.includes("islas") || searchable.includes("sierra limón")) {
    return "grupales";
  }

  if (categoryStr.includes("nacional") || searchable.includes("nacional") || searchable.includes("nacionales") || /\b[2-9]\s*d[ií]as\b/.test(searchable) || searchable.includes("eje cafetero") || searchable.includes("tayrona")) {
    return "nacionales";
  }

  if (categoryStr.includes("tour") || (searchable.includes("tour") && (searchable.includes("paracaidismo") || searchable.includes("buceo") || searchable.includes("corto")))) {
    return "tours";
  }

  return "pasadias";
}
