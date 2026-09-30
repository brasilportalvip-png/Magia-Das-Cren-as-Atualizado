export interface PabloLoveComparisonInput {
  seekerName: string;
  seekerBirthDate: string;
  otherName: string;
  otherBirthDate: string;
  question?: string;
  consultationDate?: Date;
}

export type PabloLoveLevel = "baixo" | "médio" | "alto";

export type PabloLoveComparisonResult = {
  consultationMoment: string;
  input: PabloLoveComparisonInput;
  numbers: {
    seekerNameNumber: number;
    otherNameNumber: number;
    seekerBirthNumber: number;
    otherBirthNumber: number;
  };
  indices: {
    compatibility: { value: number; level: PabloLoveLevel };
    attraction: { value: number; level: PabloLoveLevel };
    conflict: { value: number; level: PabloLoveLevel };
    movement: { value: number; level: PabloLoveLevel };
    destinyBond: number;
    hiddenEmotion: number;
    futureTrend: { value: number; level: PabloLoveLevel };
    prideBlock: { value: number; level: PabloLoveLevel };
    communication: { value: number; level: PabloLoveLevel };
    stability: { value: number; level: PabloLoveLevel };
  };
};

const MASTER_NUMBERS = [11, 22, 33];

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

function cleanName(name: string): string {
  return String(name || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, "");
}

function reduceNumber(n: number): number {
  n = Math.abs(Number(n) || 0);

  while (n > 9 && !MASTER_NUMBERS.includes(n)) {
    n = String(n)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }

  return n;
}

function nameNumber(name: string): number {
  const total = cleanName(name)
    .split("")
    .reduce((sum, letter) => sum + (PYTHAGOREAN_MAP[letter] || 0), 0);

  return reduceNumber(total);
}

function birthNumber(date: string): number {
  const digits = String(date || "").replace(/\D/g, "");

  if (!digits) return 0;

  const total = digits
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);

  return reduceNumber(total);
}

function level(value: number): PabloLoveLevel {
  if (value >= 8 || MASTER_NUMBERS.includes(value)) return "alto";
  if (value >= 5) return "médio";
  return "baixo";
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

export function buildPabloLoveComparison(
  input: PabloLoveComparisonInput
): PabloLoveComparisonResult {
  const now = input.consultationDate || new Date();

  const seekerNameNumber = nameNumber(input.seekerName);
  const otherNameNumber = nameNumber(input.otherName);

  const seekerBirthNumber = birthNumber(input.seekerBirthDate);
  const otherBirthNumber = birthNumber(input.otherBirthDate);

  const compatibility = reduceNumber(
    seekerNameNumber +
      otherNameNumber +
      seekerBirthNumber +
      otherBirthNumber
  );

  const attraction = reduceNumber(
    Math.abs(seekerNameNumber - otherNameNumber) +
      seekerBirthNumber +
      otherBirthNumber
  );

  const conflict = reduceNumber(
    Math.abs(seekerBirthNumber - otherBirthNumber) +
      Math.abs(seekerNameNumber - otherNameNumber)
  );

  const movement = reduceNumber(
    Math.abs(compatibility + attraction - conflict)
  );

  const destinyBond = reduceNumber(
    seekerNameNumber + otherBirthNumber
  );

  const hiddenEmotion = reduceNumber(
    otherNameNumber + seekerBirthNumber
  );

  const futureTrend = reduceNumber(
    compatibility + movement + destinyBond
  );

  const prideBlock = reduceNumber(
    conflict + otherNameNumber
  );

  const communication = reduceNumber(
    seekerNameNumber + otherNameNumber
  );

  const stability = reduceNumber(
    seekerBirthNumber + otherBirthNumber + destinyBond
  );

  return {
    consultationMoment: consultationMoment(now),

    input,

    numbers: {
      seekerNameNumber,
      otherNameNumber,
      seekerBirthNumber,
      otherBirthNumber,
    },

    indices: {
      compatibility: {
        value: compatibility,
        level: level(compatibility),
      },
      attraction: {
        value: attraction,
        level: level(attraction),
      },
      conflict: {
        value: conflict,
        level: level(conflict),
      },
      movement: {
        value: movement,
        level: level(movement),
      },
      destinyBond,
      hiddenEmotion,
      futureTrend: {
        value: futureTrend,
        level: level(futureTrend),
      },
      prideBlock: {
        value: prideBlock,
        level: level(prideBlock),
      },
      communication: {
        value: communication,
        level: level(communication),
      },
      stability: {
        value: stability,
        level: level(stability),
      },
    },
  };
}

export function formatPabloLoveComparison(
  result: PabloLoveComparisonResult
): string {
  return `
COMPARAÇÃO AMOROSA SUPREMA — CIGANO PABLO

MOMENTO DA CONSULTA:
${result.consultationMoment}

CONSULENTE:
Nome: ${result.input.seekerName}
Nascimento: ${result.input.seekerBirthDate}

OUTRA PESSOA:
Nome: ${result.input.otherName}
Nascimento: ${result.input.otherBirthDate}

PERGUNTA:
${result.input.question || "não informada"}

BASE NUMÉRICA:
Número do consulente: ${result.numbers.seekerNameNumber}
Número da outra pessoa: ${result.numbers.otherNameNumber}
Caminho do consulente: ${result.numbers.seekerBirthNumber}
Caminho da outra pessoa: ${result.numbers.otherBirthNumber}

ÍNDICES DA RELAÇÃO:
Compatibilidade: ${result.indices.compatibility.value} — ${result.indices.compatibility.level}
Atração: ${result.indices.attraction.value} — ${result.indices.attraction.level}
Conflito: ${result.indices.conflict.value} — ${result.indices.conflict.level}
Movimento/Aproximação: ${result.indices.movement.value} — ${result.indices.movement.level}
Laço de destino: ${result.indices.destinyBond}
Emoção oculta: ${result.indices.hiddenEmotion}
Tendência futura: ${result.indices.futureTrend.value} — ${result.indices.futureTrend.level}
Orgulho/Bloqueio: ${result.indices.prideBlock.value} — ${result.indices.prideBlock.level}
Comunicação: ${result.indices.communication.value} — ${result.indices.communication.level}
Estabilidade: ${result.indices.stability.value} — ${result.indices.stability.level}
`.trim();
}
