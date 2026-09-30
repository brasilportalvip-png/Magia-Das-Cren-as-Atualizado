export interface PabloNumerologyInput {
  fullName: string;
  birthDate: string;
  birthTime?: string;
  question?: string;
  consultationDate?: Date;
}

export interface PabloNumberMeaning {
  numero: number;
  luz: string;
  sombra: string;
  missao: string;
}

const MASTER_NUMBERS = [11, 22, 33, 44];

function normalize(text: string): string {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cleanName(name: string): string {
  return String(name || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, "");
}

function reduceNumber(n: number): number {
  while (n > 9 && !MASTER_NUMBERS.includes(n)) {
    n = String(n)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }

  return n;
}

function sumDigits(text: string): number {
  return String(text || "")
    .replace(/\D/g, "")
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);
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

  const digits = raw.replace(/\D/g, "");

  if (digits.length >= 8) {
    return {
      day: Number(digits.slice(0, 2)),
      month: Number(digits.slice(2, 4)),
      year: Number(digits.slice(4, 8)),
    };
  }

  return { day: 0, month: 0, year: 0 };
}

const PYTHAGOREAN_MAP: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

const VOWELS = ["A", "E", "I", "O", "U"];

function nameValue(name: string, filter?: "vogais" | "consoantes"): number {
  const cleaned = cleanName(name);
  let total = 0;

  for (const letter of cleaned) {
    const isVowel = VOWELS.includes(letter);

    if (filter === "vogais" && !isVowel) continue;
    if (filter === "consoantes" && isVowel) continue;

    total += PYTHAGOREAN_MAP[letter] || 0;
  }

  return reduceNumber(total);
}

function lifePath(date: string): number {
  return reduceNumber(sumDigits(date));
}

function expression(name: string): number {
  return nameValue(name);
}

function soul(name: string): number {
  return nameValue(name, "vogais");
}

function personality(name: string): number {
  return nameValue(name, "consoantes");
}

function destiny(name: string, date: string): number {
  return reduceNumber(expression(name) + lifePath(date));
}

function maturity(name: string, date: string): number {
  return reduceNumber(expression(name) + lifePath(date));
}

function personalYear(date: string, now: Date): number {
  const { day, month } = parseBirthDate(date);
  const year = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
    }).format(now)
  );

  return reduceNumber(sumDigits(`${day}${month}${year}`));
}

function personalMonth(date: string, now: Date): number {
  const month = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      month: "numeric",
    }).format(now)
  );

  return reduceNumber(personalYear(date, now) + month);
}

function personalDay(date: string, now: Date): number {
  const day = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      day: "numeric",
    }).format(now)
  );

  return reduceNumber(personalMonth(date, now) + day);
}

function pinnacles(date: string) {
  const { day, month, year } = parseBirthDate(date);

  const d = reduceNumber(day);
  const m = reduceNumber(month);
  const y = reduceNumber(sumDigits(String(year)));

  const first = reduceNumber(d + m);
  const second = reduceNumber(d + y);
  const third = reduceNumber(first + second);
  const fourth = reduceNumber(m + y);

  return { first, second, third, fourth };
}

function challenges(date: string) {
  const { day, month, year } = parseBirthDate(date);

  const d = reduceNumber(day);
  const m = reduceNumber(month);
  const y = reduceNumber(sumDigits(String(year)));

  const first = Math.abs(d - m);
  const second = Math.abs(d - y);
  const third = Math.abs(first - second);
  const fourth = Math.abs(m - y);

  return { first, second, third, fourth };
}

function karmicLessons(name: string): number[] {
  const present = new Set<number>();

  for (const letter of cleanName(name)) {
    const value = PYTHAGOREAN_MAP[letter];
    if (value) present.add(value);
  }

  const missing: number[] = [];

  for (let i = 1; i <= 9; i++) {
    if (!present.has(i)) missing.push(i);
  }

  return missing;
}

function karmicDebts(name: string, date: string): number[] {
  const raw = [
    sumDigits(date),
    cleanName(name)
      .split("")
      .reduce((sum, letter) => sum + (PYTHAGOREAN_MAP[letter] || 0), 0),
  ];

  return [13, 14, 16, 19].filter((debt) => raw.includes(debt));
}

function hiddenNumber(name: string): number {
  const cleaned = cleanName(name);

  const total = cleaned
    .split("")
    .reduce((sum, letter, index) => sum + letter.charCodeAt(0) + index + 1, 0);

  return reduceNumber(total);
}

function meaning(number: number): PabloNumberMeaning {
  const table: Record<number, PabloNumberMeaning> = {
    1: {
      numero: 1,
      luz: "liderança, coragem, iniciativa e força para começar caminhos.",
      sombra: "orgulho, impaciência, autoritarismo e dificuldade de ouvir.",
      missao: "aprender a liderar sem esmagar ninguém.",
    },
    2: {
      numero: 2,
      luz: "sensibilidade, parceria, intuição e capacidade de unir pessoas.",
      sombra: "dependência emocional, medo de conflito e excesso de carência.",
      missao: "aprender a amar sem se abandonar.",
    },
    3: {
      numero: 3,
      luz: "comunicação, encanto, criatividade e alegria espiritual.",
      sombra: "dispersão, vaidade, exagero e dificuldade de terminar o que começa.",
      missao: "usar a palavra com verdade, beleza e responsabilidade.",
    },
    4: {
      numero: 4,
      luz: "disciplina, construção, trabalho, firmeza e responsabilidade.",
      sombra: "teimosia, rigidez, excesso de controle e medo de mudar.",
      missao: "construir base forte sem virar prisioneiro da própria dureza.",
    },
    5: {
      numero: 5,
      luz: "movimento, liberdade, magnetismo, mudança e adaptação.",
      sombra: "instabilidade, impulsividade, fuga e dificuldade de compromisso.",
      missao: "aprender liberdade com consciência.",
    },
    6: {
      numero: 6,
      luz: "amor, família, cuidado, beleza, proteção e responsabilidade afetiva.",
      sombra: "culpa, cobrança, apego, ciúme e excesso de sacrifício.",
      missao: "cuidar sem carregar o mundo nas costas.",
    },
    7: {
      numero: 7,
      luz: "espiritualidade, sabedoria, análise, silêncio e profundidade.",
      sombra: "isolamento, desconfiança, frieza emocional e excesso de dúvida.",
      missao: "transformar solidão em sabedoria e fé.",
    },
    8: {
      numero: 8,
      luz: "poder, prosperidade, liderança, ambição e força material.",
      sombra: "controle, orgulho, dureza, cobrança e medo de perder poder.",
      missao: "usar poder com justiça, equilíbrio e consciência.",
    },
    9: {
      numero: 9,
      luz: "compaixão, encerramento de ciclos, cura emocional e visão espiritual.",
      sombra: "drama, apego ao passado, vitimismo e dificuldade de soltar.",
      missao: "aprender a encerrar ciclos sem perder a fé.",
    },
    11: {
      numero: 11,
      luz: "intuição elevada, mediunidade, inspiração e visão espiritual.",
      sombra: "ansiedade, excesso de sensibilidade, medo e confusão interna.",
      missao: "ser canal de luz sem se perder na própria intensidade.",
    },
    22: {
      numero: 22,
      luz: "grande construção, missão coletiva, poder de realização e liderança espiritual.",
      sombra: "peso excessivo, cobrança interna, medo de falhar e rigidez.",
      missao: "construir algo grande com humildade e firmeza.",
    },
    33: {
      numero: 33,
      luz: "amor espiritual, cura, serviço, cuidado e proteção elevada.",
      sombra: "sacrifício exagerado, culpa, dependência de salvar os outros.",
      missao: "servir com amor sem se destruir pelos outros.",
    },
    44: {
      numero: 44,
      luz: "força espiritual rara, comando, proteção, construção poderosa e disciplina superior.",
      sombra: "pressão extrema, controle, dureza, isolamento e cobrança pesada.",
      missao: "usar força e autoridade para abrir caminhos verdadeiros.",
    },
  };

  return table[number] || table[reduceNumber(number)] || table[9];
}

function detectEmotions(question: string): string[] {
  const text = normalize(question);
  const found: string[] = [];

  const patterns: Record<string, string[]> = {
    orgulho: ["orgulho", "orgulhoso", "orgulhosa", "nao vou atras"],
    teimosia: ["teimosia", "teimoso", "teimosa", "insisto", "insistir"],
    procrastinacao: ["procrastino", "deixo para depois", "enrolo", "adiando"],
    ansiedade: ["ansiedade", "ansioso", "ansiosa", "aflito", "aflita", "desespero"],
    medo: ["medo", "receio", "inseguro", "insegura", "tenho medo"],
    dependenciaEmocional: ["nao vivo sem", "dependo", "preciso dele", "preciso dela"],
    carencia: ["carencia", "carente", "sozinho", "sozinha", "ninguem me ama"],
    impulsividade: ["impulso", "impulsivo", "impulsiva", "faco sem pensar"],
    baixaAutoestima: ["nao sou suficiente", "me sinto menor", "sem valor"],
    vitimismo: ["tudo comigo", "ninguem me ajuda", "so sofro"],
    controle: ["controlar", "controle", "quero mandar", "preciso saber tudo"],
    ciume: ["ciume", "ciumento", "ciumenta"],
    perfeccionismo: ["perfeito", "perfeccionismo", "nunca esta bom"],
    resistenciaMudanca: ["nao consigo mudar", "tenho dificuldade de mudar"],
    inseguranca: ["inseguranca", "inseguro", "insegura"],
    dificuldadePerdoar: ["nao perdoo", "magoa", "ressentimento"],
  };

  for (const [emotion, terms] of Object.entries(patterns)) {
    if (terms.some((term) => text.includes(normalize(term)))) {
      found.push(emotion);
    }
  }

  return found;
}

function spiritualMission(path: number, soulNumber: number): number {
  return reduceNumber(path + soulNumber);
}

function hiddenTrend(hidden: number, personalityNumber: number): number {
  return reduceNumber(hidden + personalityNumber);
}

function spiritualStrength(path: number, expressionNumber: number, soulNumber: number): number {
  return reduceNumber(path + expressionNumber + soulNumber);
}

function financialPotential(expressionNumber: number, path: number, year: number): string {
  const base = reduceNumber(expressionNumber + path + year);

  if ([8, 22, 44].includes(base)) {
    return "muito alto, com forte energia de construção, dinheiro e liderança.";
  }

  if ([1, 4].includes(base)) {
    return "alto, mas depende de disciplina, foco e atitude.";
  }

  if ([3, 5].includes(base)) {
    return "bom, ligado a comunicação, movimento, vendas e criatividade.";
  }

  if ([2, 6].includes(base)) {
    return "moderado, cresce com parcerias, cuidado e estabilidade.";
  }

  return "espiritualizado, melhora quando a pessoa une propósito, sabedoria e estratégia.";
}

function lovePotential(soulNumber: number, personalityNumber: number, path: number): string {
  const base = reduceNumber(soulNumber + personalityNumber + path);

  if ([2, 6, 33].includes(base)) {
    return "forte, afetivo e profundo, mas precisa evitar dependência emocional.";
  }

  if ([5, 3].includes(base)) {
    return "magnético e intenso, mas precisa de liberdade e maturidade.";
  }

  if ([8, 1].includes(base)) {
    return "forte, dominante e seletivo, mas precisa controlar orgulho e dureza.";
  }

  if ([7, 11].includes(base)) {
    return "espiritual e profundo, mas pode ter dificuldade de se abrir.";
  }

  return "sensível, cármico e transformador, pedindo cura de padrões antigos.";
}

function selfSabotage(params: {
  expressionNumber: number;
  soulNumber: number;
  personalityNumber: number;
  karmicLessons: number[];
  karmicDebts: number[];
  emotions: string[];
}): string {
  const points: string[] = [];

  if ([1, 8, 44].includes(params.expressionNumber) || params.emotions.includes("orgulho")) {
    points.push("orgulho e necessidade de controlar tudo");
  }

  if (params.personalityNumber === 4 || params.emotions.includes("teimosia")) {
    points.push("teimosia e resistência para mudar");
  }

  if ([2, 6].includes(params.soulNumber) || params.emotions.includes("dependenciaEmocional")) {
    points.push("dependência emocional e medo de perder afeto");
  }

  if (params.emotions.includes("ansiedade") || params.emotions.includes("medo")) {
    points.push("ansiedade, medo e antecipação de sofrimento");
  }

  if (params.karmicLessons.includes(4)) {
    points.push("falta de disciplina ou dificuldade de manter constância");
  }

  if (params.karmicLessons.includes(6)) {
    points.push("desequilíbrio em amor, família ou responsabilidade afetiva");
  }

  if (params.karmicDebts.includes(13)) {
    points.push("prova de disciplina, esforço e responsabilidade");
  }

  if (params.karmicDebts.includes(14)) {
    points.push("prova de liberdade, excessos e instabilidade");
  }

  if (params.karmicDebts.includes(16)) {
    points.push("prova de orgulho, queda de ilusão e amadurecimento espiritual");
  }

  if (params.karmicDebts.includes(19)) {
    points.push("prova de ego, independência e humildade");
  }

  return points.length
    ? points.join("; ")
    : "auto sabotagem ligada a dúvidas internas, medo de agir e dificuldade de confiar no próprio caminho";
}

function favorableColor(number: number): string {
  const colors: Record<number, string> = {
    1: "vermelho",
    2: "branco",
    3: "amarelo",
    4: "marrom",
    5: "azul",
    6: "rosa",
    7: "violeta",
    8: "dourado",
    9: "roxo",
    11: "prata",
    22: "dourado escuro",
    33: "rosa claro",
    44: "preto com dourado",
  };

  return colors[number] || colors[reduceNumber(number)] || "dourado";
}

function favorableDay(number: number): string {
  const days: Record<number, string> = {
    1: "domingo",
    2: "segunda-feira",
    3: "quinta-feira",
    4: "sábado",
    5: "quarta-feira",
    6: "sexta-feira",
    7: "segunda-feira",
    8: "sábado",
    9: "terça-feira",
    11: "segunda-feira",
    22: "sábado",
    33: "sexta-feira",
    44: "sábado",
  };

  return days[number] || days[reduceNumber(number)] || "sexta-feira";
}

function spiritualElement(number: number): string {
  const elements: Record<number, string> = {
    1: "fogo",
    2: "água",
    3: "ar",
    4: "terra",
    5: "vento",
    6: "água doce",
    7: "éter espiritual",
    8: "terra e fogo",
    9: "água profunda",
    11: "luz espiritual",
    22: "terra sagrada",
    33: "água de cura",
    44: "fogo de proteção e terra firme",
  };

  return elements[number] || elements[reduceNumber(number)] || "fogo espiritual";
}

export function buildPabloNumerology(input: PabloNumerologyInput) {
  const fullName = input.fullName || "";
  const birthDate = input.birthDate || "";
  const question = input.question || "";
  const consultationDate = input.consultationDate || new Date();

  const lifePathNumber = lifePath(birthDate);
  const expressionNumber = expression(fullName);
  const soulNumber = soul(fullName);
  const personalityNumber = personality(fullName);
  const destinyNumber = destiny(fullName, birthDate);
  const maturityNumber = maturity(fullName, birthDate);

  const personalYearNumber = personalYear(birthDate, consultationDate);
  const personalMonthNumber = personalMonth(birthDate, consultationDate);
  const personalDayNumber = personalDay(birthDate, consultationDate);

  const pinnacleNumbers = pinnacles(birthDate);
  const challengeNumbers = challenges(birthDate);

  const karmicLessonNumbers = karmicLessons(fullName);
  const karmicDebtNumbers = karmicDebts(fullName, birthDate);

  const hidden = hiddenNumber(fullName);
  const mission = spiritualMission(lifePathNumber, soulNumber);
  const hiddenTendency = hiddenTrend(hidden, personalityNumber);
  const strength = spiritualStrength(lifePathNumber, expressionNumber, soulNumber);

  const emotions = detectEmotions(question);

  const sabotage = selfSabotage({
    expressionNumber,
    soulNumber,
    personalityNumber,
    karmicLessons: karmicLessonNumbers,
    karmicDebts: karmicDebtNumbers,
    emotions,
  });

  const finance = financialPotential(
    expressionNumber,
    lifePathNumber,
    personalYearNumber
  );

  const love = lovePotential(
    soulNumber,
    personalityNumber,
    lifePathNumber
  );

  const consultationMoment = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(consultationDate);

  return {
    consultationMoment,
    input: {
      fullName,
      birthDate,
      birthTime: input.birthTime || "",
      question,
    },
    natalBase: {
      lifePath: lifePathNumber,
      expression: expressionNumber,
      soul: soulNumber,
      personality: personalityNumber,
      destiny: destinyNumber,
      maturity: maturityNumber,
      hiddenNumber: hidden,
      spiritualMission: mission,
      hiddenTendency,
      spiritualStrength: strength,
    },
    currentCycles: {
      personalYear: personalYearNumber,
      personalMonth: personalMonthNumber,
      personalDay: personalDayNumber,
    },
    pinnacles: pinnacleNumbers,
    challenges: challengeNumbers,
    karma: {
      lessons: karmicLessonNumbers,
      debts: karmicDebtNumbers,
    },
    humanReading: {
      detectedEmotions: emotions,
      selfSabotage: sabotage,
      financialPotential: finance,
      lovePotential: love,
    },
    favorable: {
      color: favorableColor(strength),
      day: favorableDay(strength),
      number: strength,
      element: spiritualElement(strength),
    },
    meanings: {
      lifePath: meaning(lifePathNumber),
      expression: meaning(expressionNumber),
      soul: meaning(soulNumber),
      personality: meaning(personalityNumber),
      destiny: meaning(destinyNumber),
      maturity: meaning(maturityNumber),
      spiritualMission: meaning(mission),
      hiddenTendency: meaning(hiddenTendency),
      spiritualStrength: meaning(strength),
    },
  };
}

export function formatPabloNumerology(result: ReturnType<typeof buildPabloNumerology>): string {
  return `
NUMEROLOGIA SUPREMA DO CIGANO PABLO

MOMENTO DA CONSULTA:
${result.consultationMoment}

BASE NATAL:
Caminho de Vida: ${result.natalBase.lifePath}
Expressão: ${result.natalBase.expression}
Alma: ${result.natalBase.soul}
Personalidade: ${result.natalBase.personality}
Destino: ${result.natalBase.destiny}
Maturidade: ${result.natalBase.maturity}
Número Oculto: ${result.natalBase.hiddenNumber}
Missão Espiritual: ${result.natalBase.spiritualMission}
Tendência Oculta: ${result.natalBase.hiddenTendency}
Força Espiritual: ${result.natalBase.spiritualStrength}

CICLOS ATUAIS:
Ano Pessoal: ${result.currentCycles.personalYear}
Mês Pessoal: ${result.currentCycles.personalMonth}
Dia Pessoal: ${result.currentCycles.personalDay}

PINÁCULOS:
${result.pinnacles.first}, ${result.pinnacles.second}, ${result.pinnacles.third}, ${result.pinnacles.fourth}

DESAFIOS:
${result.challenges.first}, ${result.challenges.second}, ${result.challenges.third}, ${result.challenges.fourth}

LIÇÕES KÁRMICAS:
${result.karma.lessons.length ? result.karma.lessons.join(", ") : "nenhuma ausência dominante"}

DÍVIDAS KÁRMICAS:
${result.karma.debts.length ? result.karma.debts.join(", ") : "nenhuma dívida kármica principal detectada"}

EMOÇÕES DETECTADAS:
${result.humanReading.detectedEmotions.length ? result.humanReading.detectedEmotions.join(", ") : "nenhuma emoção explícita detectada"}

AUTO SABOTAGEM:
${result.humanReading.selfSabotage}

POTENCIAL FINANCEIRO:
${result.humanReading.financialPotential}

POTENCIAL AMOROSO:
${result.humanReading.lovePotential}

FAVORÁVEIS:
Cor: ${result.favorable.color}
Dia: ${result.favorable.day}
Número: ${result.favorable.number}
Elemento: ${result.favorable.element}
`.trim();
}
