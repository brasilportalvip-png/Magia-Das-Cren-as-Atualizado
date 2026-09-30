import { getPlanetaryHour } from "./spiritualUtils";

export interface PabloDaimonInput {
  birthDate: string;
  birthTime?: string;
  question?: string;
  consultationDate?: Date;
}

export type PabloDaimonProfile = {
  nome: string;
  planeta: string;
  dominio: string;
  luz: string;
  sombra: string;
  direcao: string;
};

const PLANETARY_DAIMONS: Record<string, PabloDaimonProfile> = {
  Sol: {
    nome: "Daimon Solar",
    planeta: "Sol",
    dominio: "identidade, autoridade, brilho, propósito e direção.",
    luz: "clareza, presença, liderança, vitalidade e confiança.",
    sombra: "orgulho, necessidade de reconhecimento e excesso de centralização.",
    direcao: "usar presença e autoridade sem perder humildade e consciência.",
  },
  Lua: {
    nome: "Daimon Lunar",
    planeta: "Lua",
    dominio: "emoções, memória, sonhos, intuição e vínculos.",
    luz: "sensibilidade, percepção, acolhimento e profundidade emocional.",
    sombra: "oscilação, apego, medo, carência e excesso de absorção emocional.",
    direcao: "ouvir a intuição sem deixar que medo e ansiedade conduzam as escolhas.",
  },
  Mercúrio: {
    nome: "Daimon Mercurial",
    planeta: "Mercúrio",
    dominio: "comunicação, inteligência, negociação, estudo e movimento.",
    luz: "agilidade mental, estratégia, fala, aprendizado e adaptação.",
    sombra: "dispersão, ansiedade, contradição e excesso de pensamento.",
    direcao: "usar palavra e inteligência com foco, verdade e intenção.",
  },
  Vênus: {
    nome: "Daimon Venusiano",
    planeta: "Vênus",
    dominio: "amor, prazer, beleza, magnetismo, vínculos e valores.",
    luz: "encanto, harmonia, afeto, criatividade e capacidade de atrair.",
    sombra: "carência, vaidade, dependência emocional e idealização.",
    direcao: "cultivar relações e desejos sem perder identidade e equilíbrio.",
  },
  Marte: {
    nome: "Daimon Marcial",
    planeta: "Marte",
    dominio: "ação, coragem, luta, desejo, proteção e conquista.",
    luz: "força, iniciativa, firmeza, coragem e capacidade de enfrentar obstáculos.",
    sombra: "agressividade, pressa, impulsividade e conflitos desnecessários.",
    direcao: "usar força para avançar e proteger, não para agir por impulso.",
  },
  Júpiter: {
    nome: "Daimon Jupiteriano",
    planeta: "Júpiter",
    dominio: "expansão, prosperidade, conhecimento, confiança e crescimento.",
    luz: "visão ampla, generosidade, oportunidade, fé e capacidade de crescer.",
    sombra: "exagero, excesso de confiança, promessas grandes demais e desperdício.",
    direcao: "expandir com estratégia, responsabilidade e medida.",
  },
  Saturno: {
    nome: "Daimon Saturnino",
    planeta: "Saturno",
    dominio: "tempo, disciplina, responsabilidade, limites e amadurecimento.",
    luz: "estrutura, persistência, maturidade, paciência e capacidade de construir.",
    sombra: "rigidez, medo, isolamento, cobrança e excesso de peso.",
    direcao: "transformar limite em estrutura e disciplina em realização.",
  },
  Desconhecido: {
    nome: "Daimon não definido",
    planeta: "não calculado",
    dominio: "a associação depende da hora de nascimento disponível no cadastro.",
    luz: "nenhuma associação deve ser inventada sem os dados necessários.",
    sombra: "forçar uma correspondência sem base do sistema.",
    direcao: "usar somente os dados efetivamente disponíveis.",
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

  if (text.includes("espiritual") || text.includes("daimon") || text.includes("guia")) {
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

export function buildPabloDaimon(input: PabloDaimonInput) {
  const planetaryHour = getPlanetaryHour(input.birthTime || "");
  const profile =
    PLANETARY_DAIMONS[planetaryHour] ||
    PLANETARY_DAIMONS.Desconhecido;

  const now = input.consultationDate || new Date();

  return {
    consultationMoment: consultationMoment(now),

    natalBase: {
      birthDate: input.birthDate || "",
      birthTime: input.birthTime || "",
      planetaryHour,
      daimon: profile,
    },

    consultation: {
      theme: detectTheme(input.question || ""),
      question: input.question || "",
    },
  };
}

export function formatPabloDaimon(
  result: ReturnType<typeof buildPabloDaimon>
): string {
  return `
DAIMON — CIGANO PABLO

MOMENTO DA CONSULTA:
${result.consultationMoment}

HORA PLANETÁRIA DA BASE:
${result.natalBase.planetaryHour}

ASSOCIAÇÃO TRADICIONAL DO SISTEMA:
${result.natalBase.daimon.nome}

PLANETA:
${result.natalBase.daimon.planeta}

DOMÍNIO:
${result.natalBase.daimon.dominio}

LUZ:
${result.natalBase.daimon.luz}

SOMBRA:
${result.natalBase.daimon.sombra}

DIREÇÃO:
${result.natalBase.daimon.direcao}

TEMA DA CONSULTA:
${result.consultation.theme}
`.trim();
}
