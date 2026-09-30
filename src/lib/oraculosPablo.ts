import {
  drawPabloTarotCards,
  formatPabloTarotCards,
} from "./tarotPablo";

import {
  drawPabloBuzios,
  formatPabloBuziosReading,
  type PabloBuziosReading,
} from "./buziosPablo";

import {
  calculatePabloNatalOdu,
  drawPabloOduConsultation,
  formatPabloOduConsultation,
  type PabloOduConsultation,
} from "./oduPablo";

import {
  buildPabloNumerology,
  formatPabloNumerology,
} from "./numerologiaPablo";

import {
  buildPabloAstrology,
  formatPabloAstrology,
} from "./astrologiaPablo";

import {
  buildPabloCabala,
  formatPabloCabala,
} from "./cabalaPablo";

import {
  buildPabloOrixas,
  formatPabloOrixas,
} from "./orixasPablo";

import {
  buildPabloGuardianAngel,
  formatPabloGuardianAngel,
} from "./anjoGuardiaoPablo";

import {
  buildPabloDaimon,
  formatPabloDaimon,
} from "./daimonsPablo";

import {
  buildPabloLoveComparison,
  formatPabloLoveComparison,
} from "./comparacaoAmorosaPablo";

import {
  buildPabloIntentEmotion,
  formatPabloIntentEmotion,
} from "./motorIntencaoEmocionalPablo";

export type PabloOracleName =
  | "tarot"
  | "buzios"
  | "odu"
  | "numerologia"
  | "astrologia"
  | "cabala"
  | "orixas"
  | "anjo_guardiao"
  | "daimons"
  | "comparacao_amorosa"
  | "geral";

export type PabloConsultationTheme =
  | "trabalho"
  | "dinheiro"
  | "familia"
  | "saude"
  | "justica"
  | "estudos"
  | "espiritualidade"
  | "amor"
  | "geral";

export interface PabloOracleUser {
  displayName?: string;
  birthName?: string;
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  city?: string;

  zodiacSign?: string;
  lifePathNumber?: number;
  spiritualElement?: string;
  guardianAngel?: string;

  regentOdu?: {
    number?: number;
    name?: string;
    orixa?: string;
    description?: string;
  };
}

export interface PabloOtherPerson {
  name: string;
  birthDate: string;
}

export interface PabloOracleSessionState {
  activeOracle?: PabloOracleName | null;
  tarotCards?: ReturnType<typeof drawPabloTarotCards> | null;
  buziosReading?: PabloBuziosReading | null;
  oduReading?: PabloOduConsultation | null;
  otherPerson?: PabloOtherPerson | null;
  awaitingLovePerson?: boolean;
  openedAt?: string | null;
}

export interface PabloOracleEngineInput {
  message: string;
  user: PabloOracleUser;
  otherPerson?: PabloOtherPerson | null;
  session?: PabloOracleSessionState | null;
  forceNewOpening?: boolean;
  consultationDate?: Date;
}

function normalize(text: string): string {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resolveFullName(user: PabloOracleUser): string {
  return (
    user.birthName ||
    user.fullName ||
    user.displayName ||
    ""
  );
}

function detectOracle(message: string): PabloOracleName {
  const t = normalize(message);

  if (t.includes("tarot") || t.includes("carta")) return "tarot";

  if (
    t.includes("buzios") ||
    t.includes("jogo de buzios") ||
    t.includes("jogar buzios")
  ) {
    return "buzios";
  }

  if (
    t.includes("odu") ||
    t.includes("ifa") ||
    t.includes("jogo de odu")
  ) {
    return "odu";
  }

  if (
    t.includes("numerologia") ||
    t.includes("numero pessoal") ||
    t.includes("caminho de vida")
  ) {
    return "numerologia";
  }

  if (
    t.includes("astrologia") ||
    t.includes("mapa astral") ||
    t.includes("signo")
  ) {
    return "astrologia";
  }

  if (
    t.includes("cabala") ||
    t.includes("sephirah") ||
    t.includes("sefira")
  ) {
    return "cabala";
  }

  if (
    t.includes("orixa") ||
    t.includes("orixas")
  ) {
    return "orixas";
  }

  if (
    t.includes("anjo guardiao") ||
    t.includes("meu anjo")
  ) {
    return "anjo_guardiao";
  }

 if (
  t.includes("daimon") ||
  t.includes("daimons")
) {
  return "daimons";
}

return "geral";
}

function detectConsultationTheme(message: string): PabloConsultationTheme {
  const t = normalize(message);

  if (
    t.includes("trabalho") ||
    t.includes("emprego") ||
    t.includes("carreira") ||
    t.includes("profissao") ||
    t.includes("profissional") ||
    t.includes("empresa") ||
    t.includes("negocio") ||
    t.includes("socio") ||
    t.includes("sociedade") ||
    t.includes("cliente") ||
    t.includes("chefe")
  ) {
    return "trabalho";
  }

  if (
    t.includes("dinheiro") ||
    t.includes("financeiro") ||
    t.includes("financas") ||
    t.includes("divida") ||
    t.includes("emprestimo") ||
    t.includes("pagamento") ||
    t.includes("salario") ||
    t.includes("investimento") ||
    t.includes("lucro") ||
    t.includes("renda")
  ) {
    return "dinheiro";
  }

  if (
    t.includes("familia") ||
    t.includes("filho") ||
    t.includes("filha") ||
    t.includes("mae") ||
    t.includes("pai") ||
    t.includes("irmao") ||
    t.includes("irma") ||
    t.includes("avo") ||
    t.includes("casa")
  ) {
    return "familia";
  }

  if (
    t.includes("saude") ||
    t.includes("doenca") ||
    t.includes("dor") ||
    t.includes("tratamento") ||
    t.includes("medico") ||
    t.includes("hospital") ||
    t.includes("exame")
  ) {
    return "saude";
  }

  if (
    t.includes("justica") ||
    t.includes("processo") ||
    t.includes("advogado") ||
    t.includes("tribunal") ||
    t.includes("juridico") ||
    t.includes("audiencia")
  ) {
    return "justica";
  }

  if (
    t.includes("estudo") ||
    t.includes("escola") ||
    t.includes("faculdade") ||
    t.includes("curso") ||
    t.includes("prova") ||
    t.includes("concurso")
  ) {
    return "estudos";
  }

  if (
    t.includes("espiritual") ||
    t.includes("protecao") ||
    t.includes("energia") ||
    t.includes("guia") ||
    t.includes("mediunidade") ||
    t.includes("limpeza espiritual")
  ) {
    return "espiritualidade";
  }

  if (
    t.includes("amor") ||
    t.includes("relacionamento") ||
    t.includes("namoro") ||
    t.includes("namorado") ||
    t.includes("namorada") ||
    t.includes("marido") ||
    t.includes("esposa") ||
    t.includes("ficante") ||
    t.includes("casamento") ||
    t.includes("reconciliacao") ||
    t.includes("paixao") ||
    t.includes("me ama") ||
    t.includes("gosta de mim") ||
    t.includes("sente algo por mim") ||
    t.includes("sentimento por mim") ||
    t.includes("voltar comigo") ||
    t.includes("quer voltar comigo") ||
    t.includes("traicao amorosa") ||
    t.includes("meu ex") ||
    t.includes("minha ex") ||
    t.includes("ex namorado") ||
    t.includes("ex namorada") ||
    t.includes("compatibilidade amorosa") ||
    t.includes("comparacao amorosa")
  ) {
    return "amor";
  }

  return "geral";
}

function isNewOpeningRequest(message: string): boolean {
  const t = normalize(message);

  return [
    "novo jogo",
    "nova abertura",
    "jogar novamente",
    "jogue novamente",
    "abrir de novo",
    "nova tiragem",
    "tirar de novo",
    "novo tarot",
    "novos buzios",
    "novo odu",
  ].some((term) => t.includes(term));
}

export function buildPabloOracleEngine(input: PabloOracleEngineInput) {
  const message = input.message || "";
  const user = input.user || {};
  const now = input.consultationDate || new Date();
  const fullName = resolveFullName(user);

  const intentEmotion = buildPabloIntentEmotion({
  question: message,
  consultationDate: now,
});

const detectedTheme = detectConsultationTheme(message);

  const consultationTheme: PabloConsultationTheme =
    detectedTheme === "geral" &&
    (
      input.session?.activeOracle === "comparacao_amorosa" ||
      input.session?.awaitingLovePerson === true
    )
      ? "amor"
      : detectedTheme;

  const explicitOracle = detectOracle(message);

  let detectedOracle = explicitOracle;

  if (
    explicitOracle === "geral" &&
    input.session?.activeOracle &&
    !(
      input.session.activeOracle === "comparacao_amorosa" &&
      consultationTheme !== "amor"
    )
  ) {
    detectedOracle = input.session.activeOracle;
  }

  const newOpening =
    Boolean(input.forceNewOpening) ||
    isNewOpeningRequest(message);

  const natalOdu = calculatePabloNatalOdu(
    fullName,
    user.birthDate || ""
  );

  const numerology = buildPabloNumerology({
    fullName,
    birthDate: user.birthDate || "",
    birthTime: user.birthTime || "",
    question: message,
    consultationDate: now,
  });

  const astrology = buildPabloAstrology({
    fullName,
    birthDate: user.birthDate || "",
    birthTime: user.birthTime || "",
    city: user.birthPlace || user.city || "",
    question: message,
    consultationDate: now,
  });

  const cabala = buildPabloCabala({
    fullName,
    birthDate: user.birthDate || "",
    question: message,
    consultationDate: now,
  });

  const orixas = buildPabloOrixas({
    regentOduNumber:
      user.regentOdu?.number || natalOdu.numero,
    regentOduName:
      user.regentOdu?.name || natalOdu.nome,
    regentOrixa:
      user.regentOdu?.orixa || natalOdu.orixas?.join(" / ") || "",
    spiritualElement:
      user.spiritualElement || "",
    question: message,
    consultationDate: now,
  });

  const guardianAngel = buildPabloGuardianAngel({
    birthDate: user.birthDate || "",
    birthTime: user.birthTime || "",
    question: message,
    consultationDate: now,
  });

  const daimon = buildPabloDaimon({
    birthDate: user.birthDate || "",
    birthTime: user.birthTime || "",
    question: message,
    consultationDate: now,
  });

  let tarotCards =
    input.session?.tarotCards || null;

  let buziosReading =
    input.session?.buziosReading || null;

  let oduReading =
    input.session?.oduReading || null;

  if (
    detectedOracle === "tarot" &&
    (!tarotCards || newOpening || input.session?.activeOracle !== "tarot")
  ) {
    tarotCards = drawPabloTarotCards(3);
  }

  if (
    detectedOracle === "buzios" &&
    (!buziosReading || newOpening || input.session?.activeOracle !== "buzios")
  ) {
    buziosReading = drawPabloBuzios();
  }

  if (
    detectedOracle === "odu" &&
    (!oduReading || newOpening || input.session?.activeOracle !== "odu")
  ) {
    oduReading = drawPabloOduConsultation();
  }
  const activeOtherPerson =
    consultationTheme === "amor"
      ? input.otherPerson || input.session?.otherPerson || null
      : null;

const loveComparison =
    consultationTheme === "amor" &&
    activeOtherPerson?.name &&
    activeOtherPerson?.birthDate
      ? buildPabloLoveComparison({
          seekerName: fullName,
          seekerBirthDate: user.birthDate || "",
          otherName: activeOtherPerson.name,
          otherBirthDate: activeOtherPerson.birthDate,
          question: message,
          consultationDate: now,
        })
      : null;

  const baseSections = [
    formatPabloIntentEmotion(intentEmotion),
    formatPabloNumerology(numerology),
    formatPabloAstrology(astrology),
    formatPabloCabala(cabala),
    formatPabloOrixas(orixas),
    formatPabloGuardianAngel(guardianAngel),
    formatPabloDaimon(daimon),
  ];

  const oracleSections: string[] = [];

  if (detectedOracle === "tarot" && tarotCards) {
    oracleSections.push(
      `TAROT — ABERTURA ATIVA\n\n${formatPabloTarotCards(tarotCards)}`
    );
  }

  if (detectedOracle === "buzios" && buziosReading) {
    oracleSections.push(
      `BÚZIOS — ABERTURA ATIVA\n\n${formatPabloBuziosReading(buziosReading)}`
    );
  }

  if (detectedOracle === "odu" && oduReading) {
    oracleSections.push(
      `ODÙ — ABERTURA ATIVA\n\n${formatPabloOduConsultation(oduReading)}`
    );
  }

  if (loveComparison) {
    oracleSections.push(
      formatPabloLoveComparison(loveComparison)
    );
  }

  return {
    detectedOracle,
    newOpening,

    natalBase: {
      fullName,
      birthDate: user.birthDate || "",
      birthTime: user.birthTime || "",
      birthPlace: user.birthPlace || user.city || "",
      natalOdu,
      numerology,
      astrology,
      cabala,
      orixas,
      guardianAngel,
      daimon,
    },

    consultation: {
  message,
  theme: consultationTheme,
  intentEmotion,
  loveComparison,
},

    activeOpening: {
      tarotCards,
      buziosReading,
      oduReading,
    },

   nextSession: (() => {
      const nextActiveOracle: PabloOracleName | null =
        loveComparison
          ? "comparacao_amorosa"
          : explicitOracle !== "geral"
            ? explicitOracle
            : consultationTheme !== "amor" &&
              input.session?.activeOracle === "comparacao_amorosa"
              ? null
              : input.session?.activeOracle || null;

      return {
        activeOracle: nextActiveOracle,
        tarotCards,
        buziosReading,
        oduReading,
        otherPerson:
          consultationTheme === "amor"
            ? activeOtherPerson
            : null,
        awaitingLovePerson:
          consultationTheme === "amor" &&
          !activeOtherPerson &&
          input.session?.awaitingLovePerson === true,
        openedAt:
          newOpening ||
          (!input.session?.openedAt &&
            detectedOracle !== "geral")
            ? now.toISOString()
            : input.session?.openedAt || null,
      } satisfies PabloOracleSessionState;
    })(),

    formattedContext: [
      "CÉREBRO ORACULAR DO CIGANO PABLO",
      "",
      "BASE FIXA + MOMENTO + INTENÇÃO + ABERTURA REAL",
      "",
      `TEMA IDENTIFICADO: ${consultationTheme}`,
      "",
      ...baseSections,
      ...oracleSections,
    ].join("\n\n"),
  };
}

export default buildPabloOracleEngine;
