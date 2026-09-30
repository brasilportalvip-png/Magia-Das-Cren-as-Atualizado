export type PabloOrixaProfile = {
  nome: string;
  forca: string;
  luz: string;
  sombra: string;
  missao: string;
  campos: string[];
  saudacao?: string;
};

export interface PabloOrixasInput {
  regentOduNumber?: number;
  regentOduName?: string;
  regentOrixa?: string;
  spiritualElement?: string;
  question?: string;
  consultationDate?: Date;
}

export const PABLO_ORIXAS: Record<string, PabloOrixaProfile> = {
  Exu: {
    nome: "Exu",
    forca: "movimento, comunicação, abertura de caminhos e transformação.",
    luz: "inteligência, estratégia, rapidez, negociação e capacidade de destravar situações.",
    sombra: "impulsividade, conflito, excesso de pressa e caminhos confusos.",
    missao: "aprender a mover a vida com responsabilidade, consciência e direção.",
    campos: ["caminhos", "comunicação", "trabalho", "negócios", "decisões"]
  },
  Ogum: {
    nome: "Ogum",
    forca: "trabalho, coragem, luta, ferro e abertura de caminhos.",
    luz: "disciplina, força, conquista, proteção e capacidade de vencer obstáculos.",
    sombra: "agressividade, teimosia, desgaste e confrontos desnecessários.",
    missao: "usar força e coragem para construir, não para destruir.",
    campos: ["trabalho", "coragem", "proteção", "conquista", "caminhos"]
  },
  Oxum: {
    nome: "Oxum",
    forca: "amor, prosperidade, fertilidade, beleza e sensibilidade.",
    luz: "encanto, abundância, cuidado, intuição e força afetiva.",
    sombra: "carência, vaidade, dependência emocional e ilusões afetivas.",
    missao: "cultivar amor e prosperidade sem perder dignidade e equilíbrio.",
    campos: ["amor", "prosperidade", "família", "autoestima", "fertilidade"]
  },
  Xangô: {
    nome: "Xangô",
    forca: "justiça, autoridade, equilíbrio e poder de decisão.",
    luz: "liderança, firmeza, senso de justiça e capacidade de organizar conflitos.",
    sombra: "orgulho, dureza, julgamento excessivo e autoritarismo.",
    missao: "usar poder e verdade com responsabilidade e equilíbrio.",
    campos: ["justiça", "trabalho", "liderança", "decisões", "verdade"]
  },
  Oxóssi: {
    nome: "Oxóssi",
    forca: "conhecimento, fartura, busca, estratégia e prosperidade.",
    luz: "inteligência, foco, visão de oportunidade e capacidade de encontrar caminhos.",
    sombra: "dispersão, isolamento, excesso de busca e dificuldade de permanecer.",
    missao: "buscar conhecimento e prosperidade com direção e propósito.",
    campos: ["prosperidade", "estudos", "trabalho", "oportunidades", "caminhos"]
  },
  Oxalá: {
    nome: "Oxalá",
    forca: "paz, clareza, sabedoria, equilíbrio e elevação.",
    luz: "serenidade, maturidade, liderança tranquila e consciência.",
    sombra: "rigidez, lentidão, excesso de cobrança e dificuldade de flexibilizar.",
    missao: "construir paz e direção sem perder firmeza.",
    campos: ["paz", "espiritualidade", "família", "decisões", "sabedoria"]
  },
  Iansã: {
    nome: "Iansã",
    forca: "movimento, ventos, transformação, coragem e mudança.",
    luz: "rapidez, adaptação, força emocional e capacidade de romper estagnações.",
    sombra: "impulsividade, instabilidade, pressa e explosões emocionais.",
    missao: "mudar com coragem sem perder direção.",
    campos: ["mudança", "amor", "trabalho", "espiritualidade", "decisões"]
  },
  Iemanjá: {
    nome: "Iemanjá",
    forca: "maternidade, proteção, família, acolhimento e profundidade emocional.",
    luz: "cuidado, intuição, proteção, sensibilidade e força familiar.",
    sombra: "apego, excesso de proteção, carência e dificuldade de soltar.",
    missao: "cuidar sem aprisionar e acolher sem se anular.",
    campos: ["família", "amor", "proteção", "emoções", "casa"]
  },
  Nanã: {
    nome: "Nanã",
    forca: "ancestralidade, maturidade, tempo, memória e sabedoria antiga.",
    luz: "paciência, prudência, profundidade e respeito aos ciclos.",
    sombra: "rigidez, tristeza antiga, apego ao passado e lentidão excessiva.",
    missao: "transformar experiência em sabedoria e maturidade.",
    campos: ["ancestralidade", "família", "espiritualidade", "cura", "ciclos"]
  },
  Obaluaiê: {
    nome: "Obaluaiê",
    forca: "cura, transformação, recolhimento, resistência e renovação.",
    luz: "superação, profundidade, disciplina e capacidade de renascer.",
    sombra: "isolamento, medo, sofrimento prolongado e fechamento emocional.",
    missao: "transformar dor em aprendizado e força.",
    campos: ["cura", "proteção", "espiritualidade", "transformação", "limpeza"]
  },
  Oxumarê: {
    nome: "Oxumarê",
    forca: "movimento, renovação, ciclos, continuidade e transformação.",
    luz: "adaptação, prosperidade, flexibilidade e capacidade de recomeçar.",
    sombra: "instabilidade, oscilação e dificuldade de manter direção.",
    missao: "aceitar mudanças sem perder identidade.",
    campos: ["mudança", "prosperidade", "trabalho", "ciclos", "transformação"]
  },
  Obá: {
    nome: "Obá",
    forca: "resistência, estratégia, lealdade e força interior.",
    luz: "coragem, firmeza, disciplina e capacidade de suportar provas.",
    sombra: "ciúme, dureza, teimosia e sofrimento afetivo.",
    missao: "usar força sem se prender a disputas ou dor.",
    campos: ["amor", "força", "trabalho", "superação", "decisões"]
  }
};

const ODU_TO_ORIXAS: Record<number, string[]> = {
  1: ["Exu"],
  2: ["Ibeji", "Ogum"],
  3: ["Ogum", "Obaluaiê"],
  4: ["Iemanjá"],
  5: ["Oxum"],
  6: ["Xangô", "Oxóssi"],
  7: ["Obaluaiê", "Oxumarê"],
  8: ["Oxalá"],
  9: ["Iansã", "Iemanjá"],
  10: ["Oxalá", "Nanã"],
  11: ["Iansã", "Exu"],
  12: ["Xangô"],
  13: ["Nanã", "Obaluaiê"],
  14: ["Oxumarê"],
  15: ["Obá"],
  16: ["Oxalá"]
};

function normalize(text: string): string {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function detectTheme(question: string): string {
  const t = normalize(question);

  if (t.includes("amor") || t.includes("relacionamento") || t.includes("ex")) return "amor";
  if (t.includes("dinheiro") || t.includes("trabalho") || t.includes("emprego")) return "trabalho";
  if (t.includes("familia") || t.includes("filho") || t.includes("casa")) return "família";
  if (t.includes("justica") || t.includes("processo") || t.includes("verdade")) return "justiça";
  if (t.includes("espiritual") || t.includes("guia") || t.includes("protecao")) return "espiritualidade";

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

export function buildPabloOrixas(input: PabloOrixasInput) {
  const now = input.consultationDate || new Date();
  const theme = detectTheme(input.question || "");

  const namesFromOdu =
    input.regentOduNumber && ODU_TO_ORIXAS[input.regentOduNumber]
      ? ODU_TO_ORIXAS[input.regentOduNumber]
      : [];

  const declaredNames = input.regentOrixa
    ? input.regentOrixa
        .split(/[\/,&]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const allNames = [...new Set([...declaredNames, ...namesFromOdu])];

  const profiles = allNames
    .map((name) => {
      const found = Object.values(PABLO_ORIXAS).find(
        (profile) => normalize(profile.nome) === normalize(name)
      );

      return found || null;
    })
    .filter((item): item is PabloOrixaProfile => Boolean(item));

  return {
    consultationMoment: consultationMoment(now),

    natalBase: {
      regentOduNumber: input.regentOduNumber || 0,
      regentOduName: input.regentOduName || "",
      declaredRegentOrixa: input.regentOrixa || "",
      spiritualElement: input.spiritualElement || "",
      associatedOrixas: profiles,
    },

    consultation: {
      theme,
      question: input.question || "",
    },
  };
}

export function formatPabloOrixas(
  result: ReturnType<typeof buildPabloOrixas>
): string {
  const profiles = result.natalBase.associatedOrixas.length
    ? result.natalBase.associatedOrixas
        .map(
          (profile) => `
ORIXÁ: ${profile.nome}
Força: ${profile.forca}
Luz: ${profile.luz}
Sombra: ${profile.sombra}
Missão: ${profile.missao}
Campos: ${profile.campos.join(", ")}
`.trim()
        )
        .join("\n\n")
    : "Nenhum perfil de Orixá foi associado com segurança aos dados recebidos.";

  return `
ORIXÁS — BASE DO CIGANO PABLO

MOMENTO DA CONSULTA:
${result.consultationMoment}

ODÙ REGENTE:
${result.natalBase.regentOduNumber || "não informado"} — ${result.natalBase.regentOduName || "não informado"}

ELEMENTO ESPIRITUAL:
${result.natalBase.spiritualElement || "não informado"}

ORIXÁS ASSOCIADOS À BASE:
${profiles}

TEMA DA CONSULTA:
${result.consultation.theme}
`.trim();
}
