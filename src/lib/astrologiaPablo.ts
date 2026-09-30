export interface PabloAstrologyInput {
  fullName: string;
  birthDate: string;
  birthTime?: string;
  city?: string;
  question?: string;
  consultationDate?: Date;
}

type SignProfile = {
  elemento: string;
  planeta: string;
  luz: string;
  sombra: string;
  missao: string;
};

function normalize(text: string): string {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseBirthDate(date: string) {
  const raw = String(date || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    return { day, month, year };
  }

  const parts = raw.split(/[\/\-]/).map(Number);

  if (parts.length >= 3) {
    return {
      day: parts[0] || 0,
      month: parts[1] || 0,
      year: parts[2] || 0,
    };
  }

  return { day: 0, month: 0, year: 0 };
}

function sumDigits(text: string): number {
  return String(text || "")
    .replace(/\D/g, "")
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);
}

function reduceNumber(n: number): number {
  while (n > 9 && ![11, 22, 33, 44].includes(n)) {
    n = String(n)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }

  return n;
}

export function calculatePabloSunSign(date: string): string {
  const { day, month } = parseBirthDate(date);

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Áries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Touro";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gêmeos";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Câncer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leão";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgem";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Escorpião";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagitário";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricórnio";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquário";

  return "Peixes";
}

export const PABLO_SIGN_PROFILES: Record<string, SignProfile> = {
  Áries: {
    elemento: "Fogo",
    planeta: "Marte",
    luz: "coragem, atitude, força de início e impulso para vencer.",
    sombra: "impaciência, explosão emocional, orgulho e dificuldade de esperar.",
    missao: "aprender a agir com coragem sem destruir o que ainda está nascendo.",
  },
  Touro: {
    elemento: "Terra",
    planeta: "Vênus",
    luz: "firmeza, sensualidade, estabilidade, paciência e força de construção.",
    sombra: "teimosia, apego, medo de perder segurança e resistência à mudança.",
    missao: "aprender a construir sem ficar preso ao medo de mudar.",
  },
  Gêmeos: {
    elemento: "Ar",
    planeta: "Mercúrio",
    luz: "comunicação, inteligência, movimento mental e facilidade de adaptação.",
    sombra: "ansiedade, dispersão, indecisão e excesso de pensamento.",
    missao: "usar a palavra com clareza e não se perder em dúvidas.",
  },
  Câncer: {
    elemento: "Água",
    planeta: "Lua",
    luz: "intuição, proteção, memória, cuidado e força emocional.",
    sombra: "apego ao passado, carência, medo de abandono e excesso de defesa.",
    missao: "aprender a amar sem viver preso à dor antiga.",
  },
  Leão: {
    elemento: "Fogo",
    planeta: "Sol",
    luz: "brilho, liderança, magnetismo, nobreza e poder de presença.",
    sombra: "orgulho, vaidade, necessidade de atenção e dificuldade de aceitar crítica.",
    missao: "brilhar com verdade sem precisar dominar todos ao redor.",
  },
  Virgem: {
    elemento: "Terra",
    planeta: "Mercúrio",
    luz: "organização, análise, trabalho, cuidado e inteligência prática.",
    sombra: "crítica excessiva, perfeccionismo, cobrança e medo de errar.",
    missao: "servir com sabedoria sem se maltratar pela busca da perfeição.",
  },
  Libra: {
    elemento: "Ar",
    planeta: "Vênus",
    luz: "harmonia, beleza, diplomacia, parceria e senso de justiça.",
    sombra: "indecisão, dependência de aprovação e medo de confronto.",
    missao: "buscar equilíbrio sem se anular para agradar os outros.",
  },
  Escorpião: {
    elemento: "Água",
    planeta: "Plutão e Marte",
    luz: "profundidade, magnetismo, força espiritual, transformação e percepção oculta.",
    sombra: "controle, ciúme, intensidade destrutiva, desconfiança e rancor.",
    missao: "transformar dor em poder espiritual e não em prisão emocional.",
  },
  Sagitário: {
    elemento: "Fogo",
    planeta: "Júpiter",
    luz: "fé, expansão, liberdade, visão espiritual e coragem de seguir caminhos novos.",
    sombra: "exagero, fuga, impulsividade e dificuldade de compromisso.",
    missao: "usar a liberdade com propósito e responsabilidade.",
  },
  Capricórnio: {
    elemento: "Terra",
    planeta: "Saturno",
    luz: "disciplina, maturidade, responsabilidade, estratégia e força de realização.",
    sombra: "frieza, dureza, medo de fracassar e excesso de cobrança.",
    missao: "construir autoridade sem endurecer o coração.",
  },
  Aquário: {
    elemento: "Ar",
    planeta: "Urano e Saturno",
    luz: "originalidade, visão de futuro, independência e pensamento livre.",
    sombra: "distanciamento emocional, rebeldia, frieza e dificuldade com vínculos.",
    missao: "ser livre sem se desligar das pessoas que importam.",
  },
  Peixes: {
    elemento: "Água",
    planeta: "Netuno e Júpiter",
    luz: "sensibilidade, mediunidade, compaixão, sonho e conexão espiritual.",
    sombra: "fuga, ilusão, vitimismo, confusão emocional e absorção de energias.",
    missao: "transformar sensibilidade em fé, proteção e clareza.",
  },
};

function lunarEnergy(date: string, time?: string): string {
  const base = reduceNumber(sumDigits(`${date}${time || ""}`));

  const energies: Record<number, string> = {
    1: "Lua de início emocional e coragem para recomeçar.",
    2: "Lua de sensibilidade, apego e necessidade de acolhimento.",
    3: "Lua de fala, expressão, encanto e comunicação afetiva.",
    4: "Lua de proteção, fechamento emocional e busca por segurança.",
    5: "Lua de movimento, desejo de liberdade e instabilidade emocional.",
    6: "Lua de amor, família, cuidado e responsabilidade afetiva.",
    7: "Lua espiritual, silenciosa, intuitiva e profunda.",
    8: "Lua de controle emocional, poder interno e cobrança.",
    9: "Lua de encerramento, saudade, cura e limpeza emocional.",
    11: "Lua mediúnica, muito sensível, intuitiva e espiritual.",
    22: "Lua de construção emocional, proteção e responsabilidade pesada.",
    33: "Lua de cura, amor espiritual e cuidado elevado.",
    44: "Lua de força, defesa espiritual e grande proteção.",
  };

  return energies[base] || energies[reduceNumber(base)] || energies[9];
}

function venusEnergy(sign: string, question: string): string {
  const text = normalize(question);
  const base = PABLO_SIGN_PROFILES[sign];

  if (
    text.includes("amor") ||
    text.includes("relacionamento") ||
    text.includes("ex")
  ) {
    return `Vênus atua com força no campo afetivo: ${base.luz} A sombra pode trazer ${base.sombra}`;
  }

  return `Vênus mostra magnetismo, atração, beleza pessoal e forma de se relacionar. Neste mapa, ela toca ${base.elemento}, trazendo ${base.luz}`;
}

function marsEnergy(sign: string): string {
  const base = PABLO_SIGN_PROFILES[sign];

  return `Marte mostra a forma de agir, lutar e reagir. A energia dominante traz ${base.luz} Na sombra, pode aparecer ${base.sombra}`;
}

function saturnEnergy(sign: string): string {
  const base = PABLO_SIGN_PROFILES[sign];

  return `Saturno mostra cobrança, amadurecimento e prova espiritual. A lição principal é: ${base.missao}`;
}

function detectTheme(question: string): string {
  const text = normalize(question);

  if (
    text.includes("amor") ||
    text.includes("ex") ||
    text.includes("relacionamento")
  ) return "amor";

  if (
    text.includes("dinheiro") ||
    text.includes("trabalho") ||
    text.includes("emprego")
  ) return "prosperidade";

  if (
    text.includes("espiritual") ||
    text.includes("guia") ||
    text.includes("entidade")
  ) return "espiritualidade";

  if (
    text.includes("familia") ||
    text.includes("filho") ||
    text.includes("casa")
  ) return "família";

  return "geral";
}

function interpretElement(element: string): string {
  const table: Record<string, string> = {
    Fogo: "energia de atitude, coragem, impulso, paixão e abertura de caminho.",
    Terra: "energia de construção, firmeza, trabalho, realidade e estabilidade.",
    Ar: "energia de pensamento, comunicação, ideias, movimento mental e escolhas.",
    Água: "energia emocional, espiritual, intuitiva, sensível e profunda.",
  };

  return table[element] || "energia espiritual sensível e intuitiva.";
}

function currentConsultationMoment(date: Date): string {
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

export function buildPabloAstrology(input: PabloAstrologyInput) {
  const sign = calculatePabloSunSign(input.birthDate);
  const base = PABLO_SIGN_PROFILES[sign];
  const theme = detectTheme(input.question || "");
  const consultationDate = input.consultationDate || new Date();

  const ascendantStatus =
    input.birthTime && input.city
      ? "dados de hora e cidade presentes; o ascendente exige cálculo astronômico por coordenadas para precisão total"
      : "não calculado com segurança por falta de hora e/ou cidade";

  return {
    consultationMoment: currentConsultationMoment(consultationDate),

    input: {
      fullName: input.fullName || "",
      birthDate: input.birthDate || "",
      birthTime: input.birthTime || "",
      city: input.city || "",
      question: input.question || "",
    },

    natalBase: {
      sunSign: sign,
      dominantElement: base.elemento,
      rulingPlanet: base.planeta,
      light: base.luz,
      shadow: base.sombra,
      mission: base.missao,
      lunarEnergy: lunarEnergy(input.birthDate, input.birthTime),
      venusEnergy: venusEnergy(sign, input.question || ""),
      marsEnergy: marsEnergy(sign),
      saturnEnergy: saturnEnergy(sign),
      ascendantStatus,
    },

    currentReading: {
      theme,
      elementInterpretation: interpretElement(base.elemento),
    },
  };
}

export function formatPabloAstrology(
  result: ReturnType<typeof buildPabloAstrology>
): string {
  return `
ASTROLOGIA SUPREMA DO CIGANO PABLO

MOMENTO DA CONSULTA:
${result.consultationMoment}

BASE NATAL:
Signo Solar: ${result.natalBase.sunSign}
Elemento dominante: ${result.natalBase.dominantElement}
Planeta regente: ${result.natalBase.rulingPlanet}

Luz:
${result.natalBase.light}

Sombra:
${result.natalBase.shadow}

Missão:
${result.natalBase.mission}

Lua energética:
${result.natalBase.lunarEnergy}

Vênus:
${result.natalBase.venusEnergy}

Marte:
${result.natalBase.marsEnergy}

Saturno:
${result.natalBase.saturnEnergy}

ASCENDENTE:
${result.natalBase.ascendantStatus}

TEMA DA CONSULTA:
${result.currentReading.theme}

ELEMENTO DOMINANTE:
${result.currentReading.elementInterpretation}
`.trim();
}
