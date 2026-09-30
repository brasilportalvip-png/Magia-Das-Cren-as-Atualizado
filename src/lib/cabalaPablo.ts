export interface PabloCabalaInput {
  fullName: string;
  birthDate: string;
  question?: string;
  consultationDate?: Date;
}

export type PabloSephirah = {
  nome: string;
  traducao: string;
  luz: string;
  sombra: string;
  missao: string;
};

export const PABLO_ANGELS = [
  "Vehuiah", "Jeliel", "Sitael", "Elemiah", "Mahasiah", "Lelahel",
  "Achaiah", "Cahetel", "Haziel", "Aladiah", "Lauviah", "Hahaiah",
  "Mebahel", "Hariel", "Hekamiah", "Caliel", "Leuviah", "Pahaliah",
  "Nelchael", "Ieiaiel", "Melahel", "Haheuiah", "Nith-Haiah", "Haaiah"
];

export const PABLO_SEPHIROT: PabloSephirah[] = [
  { nome: "Kether", traducao: "Coroa", luz: "conexão espiritual elevada, comando interno e chamado de alma.", sombra: "orgulho espiritual, isolamento e dificuldade de aceitar orientação.", missao: "usar a força espiritual com humildade e direção." },
  { nome: "Chokmah", traducao: "Sabedoria", luz: "visão ampla, inspiração, intuição e força criadora.", sombra: "impulso sem planejamento e excesso de confiança.", missao: "transformar inspiração em atitude com consciência." },
  { nome: "Binah", traducao: "Entendimento", luz: "maturidade, limite, responsabilidade e sabedoria profunda.", sombra: "rigidez, tristeza escondida e cobrança excessiva.", missao: "amadurecer sem endurecer o coração." },
  { nome: "Chesed", traducao: "Misericórdia", luz: "generosidade, expansão, proteção e abertura de caminhos.", sombra: "exagero, promessa demais e falta de limite.", missao: "ajudar sem se perder nem alimentar abuso." },
  { nome: "Geburah", traducao: "Força", luz: "corte, justiça, coragem, defesa espiritual e firmeza.", sombra: "dureza, raiva, julgamento pesado e briga desnecessária.", missao: "usar a força para proteger, não para ferir." },
  { nome: "Tiphereth", traducao: "Beleza", luz: "equilíbrio, coração, brilho, cura e harmonia espiritual.", sombra: "vaidade, necessidade de aprovação e medo de rejeição.", missao: "brilhar com verdade sem depender do olhar dos outros." },
  { nome: "Netzach", traducao: "Vitória", luz: "amor, desejo, conquista, magnetismo e força afetiva.", sombra: "ciúme, apego, disputa e dependência emocional.", missao: "vencer no amor sem perder a própria dignidade." },
  { nome: "Hod", traducao: "Glória", luz: "comunicação, inteligência, estratégia e clareza mental.", sombra: "mentira, confusão, ansiedade e palavra usada sem firmeza.", missao: "usar a palavra para abrir caminhos, não para criar nós." },
  { nome: "Yesod", traducao: "Fundamento", luz: "sonhos, memória espiritual, intuição, mediunidade e base emocional.", sombra: "ilusão, medo, fantasia e prisão em lembranças antigas.", missao: "separar intuição verdadeira de medo emocional." },
  { nome: "Malkuth", traducao: "Reino", luz: "realização, corpo, dinheiro, trabalho, casa e manifestação concreta.", sombra: "apego material, medo da escassez e prisão na rotina.", missao: "trazer espiritualidade para a vida prática." }
];

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

function sumText(text: string): number {
  return String(text || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function indexFor(value: number, size: number): number {
  return Math.abs(value) % size;
}

function detectTheme(question: string): string {
  const text = normalize(question);

  if (text.includes("amor") || text.includes("ex") || text.includes("relacionamento")) return "amor";
  if (text.includes("dinheiro") || text.includes("trabalho") || text.includes("prosperidade")) return "prosperidade";
  if (text.includes("espiritual") || text.includes("guia") || text.includes("entidade")) return "espiritualidade";
  if (text.includes("familia") || text.includes("filho") || text.includes("casa")) return "família";
  if (text.includes("justica") || text.includes("processo") || text.includes("verdade")) return "justiça";

  return "geral";
}

function correctionFor(sephirah: PabloSephirah, theme: string): string {
  if (theme === "amor") {
    return `No amor, a correção passa por ${sephirah.missao}`;
  }

  if (theme === "prosperidade") {
    return "Na prosperidade, a correção passa por colocar ordem, limite e atitude prática onde existe dispersão.";
  }

  if (theme === "espiritualidade") {
    return "Na espiritualidade, a correção passa por fortalecer fé, disciplina e escuta dos sinais sem fantasia.";
  }

  if (theme === "justiça") {
    return "Na justiça, a correção passa por verdade, equilíbrio, responsabilidade e firmeza nas próprias escolhas.";
  }

  return `A correção principal passa por ${sephirah.missao}`;
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

export function buildPabloCabala(input: PabloCabalaInput) {
  const fullName = input.fullName || "";
  const birthDate = input.birthDate || "";
  const question = input.question || "";
  const now = input.consultationDate || new Date();

  const theme = detectTheme(question);

  const natalBase =
    sumText(cleanName(fullName)) +
    sumText(birthDate);

  const angel = PABLO_ANGELS[indexFor(natalBase, PABLO_ANGELS.length)];

  const sephirah = PABLO_SEPHIROT[
    indexFor(sumText(birthDate + cleanName(fullName)) + 9, PABLO_SEPHIROT.length)
  ];

  return {
    consultationMoment: consultationMoment(now),

    input: {
      fullName,
      birthDate,
      question,
    },

    natalBase: {
      guardianAngel: angel,
      dominantSephirah: sephirah,
    },

    consultation: {
      theme,
      spiritualCorrection: correctionFor(sephirah, theme),
    },
  };
}

export function formatPabloCabala(
  result: ReturnType<typeof buildPabloCabala>
): string {
  return `
CABALA SUPREMA DO CIGANO PABLO

MOMENTO DA CONSULTA:
${result.consultationMoment}

ANJO GUARDIÃO DA BASE:
${result.natalBase.guardianAngel}

SEPHIRAH DOMINANTE:
${result.natalBase.dominantSephirah.nome} — ${result.natalBase.dominantSephirah.traducao}

LUZ:
${result.natalBase.dominantSephirah.luz}

SOMBRA:
${result.natalBase.dominantSephirah.sombra}

MISSÃO:
${result.natalBase.dominantSephirah.missao}

TEMA DA CONSULTA:
${result.consultation.theme}

CORREÇÃO ESPIRITUAL:
${result.consultation.spiritualCorrection}
`.trim();
}
