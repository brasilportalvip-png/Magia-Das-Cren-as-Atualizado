import { getGuardianAngel } from "./spiritualUtils";

export interface PabloGuardianAngelInput {
  birthDate: string;
  birthTime?: string;
  question?: string;
  consultationDate?: Date;
}

type GuardianAngelProfile = {
  nome: string;
  luz: string;
  sombra: string;
  missao: string;
  campos: string[];
};

const GUARDIAN_ANGELS: Record<string, GuardianAngelProfile> = {
  Metatron: {
    nome: "Metatron",
    luz: "ordem, direção, inteligência espiritual e organização.",
    sombra: "rigidez, excesso de cobrança e necessidade de controlar tudo.",
    missao: "transformar conhecimento em direção prática e consciência.",
    campos: ["ordem", "propósito", "decisões", "clareza", "disciplina"],
  },
  Jofiel: {
    nome: "Jofiel",
    luz: "sabedoria, beleza interior, clareza mental e discernimento.",
    sombra: "perfeccionismo, crítica excessiva e confusão mental.",
    missao: "usar inteligência e percepção sem se perder na cobrança.",
    campos: ["sabedoria", "estudos", "clareza", "autoestima", "decisões"],
  },
  Samuel: {
    nome: "Samuel",
    luz: "coragem, firmeza, proteção e capacidade de enfrentar conflitos.",
    sombra: "impulsividade, raiva e confrontos desnecessários.",
    missao: "usar força com equilíbrio e responsabilidade.",
    campos: ["proteção", "coragem", "justiça", "decisões", "superação"],
  },
  Gabriel: {
    nome: "Gabriel",
    luz: "comunicação, intuição, sensibilidade e expressão.",
    sombra: "instabilidade emocional, medo de falar e excesso de sensibilidade.",
    missao: "transformar emoção em verdade e comunicação clara.",
    campos: ["comunicação", "família", "amor", "intuição", "mensagens"],
  },
  Rafael: {
    nome: "Rafael",
    luz: "equilíbrio, cuidado, restauração e proteção.",
    sombra: "excesso de preocupação, ansiedade e tentativa de salvar todos.",
    missao: "cuidar sem se sobrecarregar e buscar equilíbrio.",
    campos: ["cura", "proteção", "equilíbrio", "família", "bem-estar"],
  },
  Uriel: {
    nome: "Uriel",
    luz: "sabedoria prática, estabilidade, prosperidade e visão concreta.",
    sombra: "apego, rigidez e medo de perder segurança.",
    missao: "construir com consciência e confiança.",
    campos: ["prosperidade", "trabalho", "estabilidade", "decisões", "sabedoria"],
  },
  Cassiel: {
    nome: "Cassiel",
    luz: "paciência, maturidade, disciplina e profundidade.",
    sombra: "isolamento, tristeza, rigidez e demora excessiva.",
    missao: "aprender com o tempo sem se fechar para a vida.",
    campos: ["maturidade", "disciplina", "karma", "tempo", "superação"],
  },
  Miguel: {
    nome: "Miguel",
    luz: "proteção, coragem, justiça e firmeza.",
    sombra: "dureza, confronto e excesso de defesa.",
    missao: "proteger sem viver permanentemente em guerra.",
    campos: ["proteção", "justiça", "coragem", "cortes", "decisões"],
  },
  Haniel: {
    nome: "Haniel",
    luz: "amor, sensibilidade, magnetismo, harmonia e intuição.",
    sombra: "carência, idealização e dependência emocional.",
    missao: "amar com equilíbrio e preservar a própria identidade.",
    campos: ["amor", "autoestima", "intuição", "harmonia", "relacionamentos"],
  },
  Raziel: {
    nome: "Raziel",
    luz: "mistério, conhecimento oculto, percepção e profundidade.",
    sombra: "confusão, excesso de pensamento e busca sem direção.",
    missao: "transformar conhecimento profundo em entendimento claro.",
    campos: ["mistérios", "espiritualidade", "estudos", "intuição", "conhecimento"],
  },
  Serafim: {
    nome: "Serafim",
    luz: "proteção, elevação, pureza de intenção e força espiritual.",
    sombra: "idealização, distanciamento da realidade e excesso de expectativa.",
    missao: "unir espiritualidade e vida prática.",
    campos: ["proteção", "espiritualidade", "equilíbrio", "fé", "direção"],
  },
};

function normalize(text: string): string {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function detectTheme(question: string): string {
  const text = normalize(question);

  if (text.includes("amor") || text.includes("relacionamento") || text.includes("ex")) {
    return "amor";
  }

  if (text.includes("dinheiro") || text.includes("trabalho") || text.includes("emprego")) {
    return "prosperidade";
  }

  if (text.includes("familia") || text.includes("filho") || text.includes("casa")) {
    return "família";
  }

  if (text.includes("protecao") || text.includes("inveja") || text.includes("demanda")) {
    return "proteção";
  }

  if (text.includes("espiritual") || text.includes("guia") || text.includes("anjo")) {
    return "espiritualidade";
  }

  return "geral";
}

function consultationMoment(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function buildPabloGuardianAngel(input: PabloGuardianAngelInput) {
  const angelName = getGuardianAngel(input.birthDate || "");
  const profile = GUARDIAN_ANGELS[angelName] || GUARDIAN_ANGELS.Serafim;
  const now = input.consultationDate || new Date();

  return {
    consultationMoment: consultationMoment(now),

    natalBase: {
      birthDate: input.birthDate || "",
      birthTime: input.birthTime || "",
      guardianAngel: angelName,
      profile,
    },

    consultation: {
      theme: detectTheme(input.question || ""),
      question: input.question || "",
    },
  };
}

export function formatPabloGuardianAngel(
  result: ReturnType<typeof buildPabloGuardianAngel>
): string {
  return `
ANJO GUARDIÃO — CIGANO PABLO

MOMENTO DA CONSULTA:
${result.consultationMoment}

ANJO GUARDIÃO DA BASE:
${result.natalBase.guardianAngel}

LUZ:
${result.natalBase.profile.luz}

SOMBRA:
${result.natalBase.profile.sombra}

MISSÃO:
${result.natalBase.profile.missao}

CAMPOS:
${result.natalBase.profile.campos.join(", ")}

TEMA DA CONSULTA:
${result.consultation.theme}
`.trim();
}
