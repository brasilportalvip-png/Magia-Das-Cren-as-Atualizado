export interface PabloIntentEmotionInput {
  question?: string;
  consultationDate?: Date;
}

export interface PabloEmotionalPattern {
  key: string;
  light: string;
  shadow: string;
  guidance: string;
}

export interface PabloIntentProfile {
  category: string;
  subtype: string;
  intensity: "baixa" | "media" | "alta";
  needsOtherPersonData: boolean;
  involvesOtherPerson: boolean;
  themes: string[];
  emotions: string[];
  signals: string[];
  responseDirection: string;
}

function normalize(text: string): string {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const EMOTIONAL_PATTERNS = [
  {
    key: "orgulho",
    terms: ["orgulho", "orgulhoso", "orgulhosa", "nao vou atras"],
    light: "força própria, dignidade e capacidade de não se humilhar.",
    shadow: "dificuldade de ceder, pedir ajuda ou reconhecer erro.",
    guidance: "ter postura não é endurecer o coração.",
  },
  {
    key: "teimosia",
    terms: ["teimosia", "teimoso", "teimosa", "insisto", "nao largo"],
    light: "persistência, firmeza e resistência.",
    shadow: "insistir em caminho que já mostrou desgaste.",
    guidance: "persistência abre caminho; teimosia repete dor.",
  },
  {
    key: "procrastinacao",
    terms: ["procrastino", "deixo para depois", "adiando", "enrolo"],
    light: "capacidade de pensar antes de agir.",
    shadow: "medo escondido de começar ou de errar.",
    guidance: "comece pequeno, mas comece.",
  },
  {
    key: "ansiedade",
    terms: ["ansiedade", "ansioso", "ansiosa", "aflito", "aflita", "desespero"],
    light: "sensibilidade para perceber movimentos antes dos outros.",
    shadow: "sofrer antes da hora e imaginar perdas que ainda não aconteceram.",
    guidance: "não entregue sua paz para um futuro que ainda não chegou.",
  },
  {
    key: "medo",
    terms: ["medo", "receio", "tenho medo", "inseguro", "insegura"],
    light: "instinto de proteção e prudência.",
    shadow: "paralisação, fuga e fechamento dos caminhos.",
    guidance: "medo pode avisar, mas não deve mandar.",
  },
  {
    key: "dependencia emocional",
    terms: ["nao vivo sem", "dependo", "preciso dele", "preciso dela"],
    light: "capacidade de amar profundamente.",
    shadow: "colocar outra pessoa acima da própria dignidade.",
    guidance: "amor não exige que você se abandone.",
  },
  {
    key: "carencia",
    terms: ["carente", "carencia", "sozinho", "sozinha", "ninguem me ama"],
    light: "necessidade verdadeira de afeto e acolhimento.",
    shadow: "aceitar pouco por medo de ficar só.",
    guidance: "não aceite migalha como se fosse banquete.",
  },
  {
    key: "impulsividade",
    terms: ["impulso", "impulsivo", "impulsiva", "faco sem pensar"],
    light: "coragem de agir e romper bloqueios.",
    shadow: "agir no calor da emoção e depois colher arrependimento.",
    guidance: "antes de agir, veja se é força ou descontrole.",
  },
  {
    key: "baixa autoestima",
    terms: ["nao sou suficiente", "sem valor", "me sinto menor"],
    light: "humildade e sensibilidade.",
    shadow: "se diminuir e permitir que outros ditem seu valor.",
    guidance: "reconheça o próprio valor antes de entregar seu poder aos outros.",
  },
  {
    key: "vitimismo",
    terms: ["tudo comigo", "so sofro", "ninguem me ajuda"],
    light: "dor real pedindo acolhimento.",
    shadow: "ficar preso na dor e perder a força de reagir.",
    guidance: "acolha sua dor, mas não faça dela sua morada.",
  },
  {
    key: "necessidade de controle",
    terms: ["controlar", "controle", "preciso saber tudo", "quero mandar"],
    light: "organização, proteção e busca por segurança.",
    shadow: "sufocar pessoas, caminhos e oportunidades.",
    guidance: "controle demais fecha até porta que estava aberta.",
  },
  {
    key: "ciume",
    terms: ["ciume", "ciumento", "ciumenta"],
    light: "desejo de proteger o vínculo.",
    shadow: "medo de perder, comparação e desconfiança.",
    guidance: "ciúme não prova amor; muitas vezes revela insegurança.",
  },
  {
    key: "perfeccionismo",
    terms: ["perfeccionismo", "perfeito", "nunca esta bom"],
    light: "cuidado, zelo e vontade de fazer bem feito.",
    shadow: "cobrança pesada, atraso e medo de errar.",
    guidance: "feito com verdade vale mais que perfeito nunca terminado.",
  },
  {
    key: "resistencia a mudanca",
    terms: ["nao consigo mudar", "dificuldade de mudar", "tenho medo de mudar"],
    light: "busca por segurança e estabilidade.",
    shadow: "ficar preso em ciclo velho por medo do novo.",
    guidance: "mudança assusta, mas permanecer onde dói também cobra preço.",
  },
  {
    key: "inseguranca",
    terms: ["inseguranca", "inseguro", "insegura"],
    light: "cuidado antes de decidir.",
    shadow: "duvidar de si mesmo e entregar poder aos outros.",
    guidance: "quando você duvida demais de si, qualquer pessoa te confunde.",
  },
  {
    key: "dificuldade de perdoar",
    terms: ["nao perdoo", "magoa", "ressentimento"],
    light: "memória de dor que tenta proteger você.",
    shadow: "carregar peso antigo e continuar preso a quem feriu.",
    guidance: "perdoar não é aceitar abuso; é parar de carregar o veneno.",
  },
];

function includesAny(text: string, list: string[]): boolean {
  return list.some((item) => text.includes(normalize(item)));
}

function findTerms(text: string, list: string[]): string[] {
  return list.filter((item) => text.includes(normalize(item)));
}

function detectEmotionalPattern(question: string) {
  const text = normalize(question);

  const detected = EMOTIONAL_PATTERNS.filter((pattern) =>
    pattern.terms.some((term) => text.includes(normalize(term)))
  );

  const primary: PabloEmotionalPattern =
    detected[0] || {
      key: "emocao oculta nao explicita",
      light: "existe uma emoção por trás da pergunta que ainda não foi dita com clareza.",
      shadow: "a pessoa pode estar perguntando uma coisa enquanto sente outra.",
      guidance: "observe o que a pergunta esconde, não apenas o que ela mostra.",
    };

  return {
    detected: detected.map((item) => ({
      key: item.key,
      light: item.light,
      shadow: item.shadow,
      guidance: item.guidance,
    })),
    primary,
  };
}

function classifyIntent(question: string): PabloIntentProfile {
  const text = normalize(question);

  const generalLove = includesAny(text, [
    "minha vida amorosa", "vida amorosa", "sorte no amor", "amor para mim",
    "caminhos no amor", "campo amoroso", "futuro amoroso",
    "vou encontrar alguem", "vou encontrar um amor", "meu amor vai chegar"
  ]);

  const otherPersonSignal = includesAny(text, [
    "ele", "ela", "meu ex", "minha ex", "meu namorado", "minha namorada",
    "meu marido", "minha esposa", "meu ficante", "minha ficante",
    "essa pessoa", "a pessoa", "fulano", "fulana"
  ]);

  const otherPersonIntent = includesAny(text, [
    "me ama", "gosta de mim", "sente minha falta", "pensa em mim",
    "vai voltar", "vai me procurar", "vai mandar mensagem",
    "ainda sente algo", "ainda tem sentimento", "tem outra pessoa",
    "me trai", "me traiu", "tem futuro", "quer ficar comigo",
    "quer compromisso", "sumiu de mim", "se afastou", "me esqueceu",
    "sente saudade"
  ]);

  const namedRelation =
    /\b(com|de|da|do|sobre|entre eu e|eu e)\s+[a-z]{2,}/i.test(text);

  const involvesOtherPerson =
    !generalLove && (otherPersonSignal || otherPersonIntent || namedRelation);

  const reconciliation = includesAny(text, [
    "volta", "vai voltar", "retorno", "reconciliacao",
    "reconciliar", "reatar", "segunda chance", "voltar comigo"
  ]);

  const betrayal = includesAny(text, [
    "traicao", "traiu", "me trai", "tem outra", "tem outro",
    "esta com outra", "esta com outro", "mentira", "esconde algo"
  ]);

  const work = includesAny(text, [
    "trabalho", "emprego", "carreira", "profissao", "empresa",
    "negocio", "servico", "cliente", "vender", "vendas", "projeto"
  ]);

  const money = includesAny(text, [
    "dinheiro", "prosperidade", "financeiro", "divida",
    "riqueza", "abundancia", "lucro", "faturamento", "renda"
  ]);

  const spiritual = includesAny(text, [
    "energia", "demanda", "inveja", "protecao", "macumba",
    "olho gordo", "caminho fechado", "descarrego",
    "espiritual", "carregado", "peso espiritual"
  ]);

  const family = includesAny(text, [
    "familia", "filho", "filha", "mae", "pai",
    "irmao", "irma", "casa", "lar"
  ]);

  const emotional = includesAny(text, [
    "triste", "ansiedade", "medo", "dor", "sofrendo",
    "cansado", "cansada", "perdido", "perdida",
    "angustia", "choro", "desespero"
  ]);

  const destiny = includesAny(text, [
    "destino", "caminho", "caminhos", "futuro",
    "rumo", "direcao", "o que vem", "o que me espera"
  ]);

  const themes: string[] = [];

  if (generalLove) themes.push("vida amorosa geral");
  if (involvesOtherPerson) themes.push("outra pessoa");
  if (reconciliation) themes.push("reconciliação ou retorno");
  if (betrayal) themes.push("traição ou desconfiança");
  if (work) themes.push("trabalho e carreira");
  if (money) themes.push("dinheiro e prosperidade");
  if (spiritual) themes.push("proteção espiritual");
  if (family) themes.push("família");
  if (emotional) themes.push("dor emocional");
  if (destiny) themes.push("destino e caminhos");

  const emotions = findTerms(text, [
    "saudade", "medo", "dor", "ciume", "raiva",
    "ansiedade", "desespero", "tristeza", "angustia",
    "inseguranca", "carencia"
  ]);

  const signals = findTerms(text, [
    "sumiu", "se afastou", "silencio", "bloqueou",
    "nao responde", "mudou comigo", "frio",
    "distante", "confuso", "confusa", "travado",
    "fechado", "parado"
  ]);

  let category = "geral";
  let subtype = "pergunta_comum";
  let responseDirection =
    "Identifique o caminho principal, o alerta e a direção mais útil para a pergunta.";

  if (involvesOtherPerson && reconciliation) {
    category = "amor";
    subtype = "reconciliacao";
    responseDirection =
      "Cruze desejo, saudade, orgulho, silêncio, movimento e risco de ilusão. Use dados da outra pessoa quando disponíveis.";
  } else if (involvesOtherPerson && betrayal) {
    category = "amor";
    subtype = "traicao_desconfianca";
    responseDirection =
      "Cruze comportamento, ocultação, insegurança e dinâmica emocional sem tratar suspeita como fato comprovado.";
  } else if (involvesOtherPerson) {
    category = "amor";
    subtype = "outra_pessoa";
    responseDirection =
      "Use os dados da outra pessoa quando disponíveis e cruze com a base natal do consulente.";
  } else if (generalLove) {
    category = "amor";
    subtype = "vida_amorosa_geral";
    responseDirection =
      "Leia o campo amoroso geral do consulente sem exigir dados de outra pessoa.";
  } else if (money) {
    category = "prosperidade";
    subtype = "dinheiro";
    responseDirection =
      "Cruze bloqueios, oportunidades, postura financeira e caminhos de prosperidade.";
  } else if (work) {
    category = "trabalho";
    subtype = "carreira";
    responseDirection =
      "Cruze esforço, oportunidade, estratégia, movimento e direção profissional.";
  } else if (spiritual) {
    category = "espiritualidade";
    subtype = "protecao_energia";
    responseDirection =
      "Leia proteção, peso espiritual, caminhos e influência do contexto sem alarmismo.";
  } else if (family) {
    category = "familia";
    subtype = "familia";
    responseDirection =
      "Leia vínculos familiares, limites, proteção e equilíbrio emocional.";
  } else if (emotional) {
    category = "emocional";
    subtype = "dor_emocional";
    responseDirection =
      "Acolha a dor, identifique padrões emocionais e dê direção prática sem substituir atendimento profissional.";
  } else if (destiny) {
    category = "destino";
    subtype = "caminhos";
    responseDirection =
      "Cruze tendências, escolhas, caminhos abertos ou travados e próximos passos.";
  }

  const intensity =
    emotional ||
    emotions.length >= 2 ||
    signals.length >= 2 ||
    includesAny(text, ["urgente", "desespero", "nao aguento", "preciso saber"])
      ? "alta"
      : themes.length >= 2
        ? "media"
        : "baixa";

  return {
    category,
    subtype,
    intensity,
    needsOtherPersonData:
      subtype === "outra_pessoa" ||
      subtype === "reconciliacao" ||
      subtype === "traicao_desconfianca",
    involvesOtherPerson,
    themes,
    emotions,
    signals,
    responseDirection,
  };
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

export function buildPabloIntentEmotion(input: PabloIntentEmotionInput) {
  const question = input.question || "";
  const now = input.consultationDate || new Date();

  return {
    consultationMoment: consultationMoment(now),
    question,
    intent: classifyIntent(question),
    emotional: detectEmotionalPattern(question),
  };
}

export function formatPabloIntentEmotion(
  result: ReturnType<typeof buildPabloIntentEmotion>
): string {
  const detected = result.emotional.detected.length
    ? result.emotional.detected.map((item) => item.key).join(", ")
    : "nenhum padrão explícito";

  return `
MOTOR DE INTENÇÃO E LEITURA EMOCIONAL — CIGANO PABLO

MOMENTO DA CONSULTA:
${result.consultationMoment}

PERGUNTA:
${result.question || "não informada"}

INTENÇÃO:
Categoria: ${result.intent.category}
Subtipo: ${result.intent.subtype}
Intensidade: ${result.intent.intensity}
Envolve outra pessoa: ${result.intent.involvesOtherPerson ? "sim" : "não"}
Precisa de dados da outra pessoa: ${result.intent.needsOtherPersonData ? "sim" : "não"}

TEMAS:
${result.intent.themes.length ? result.intent.themes.join(", ") : "geral"}

EMOÇÕES EXPLÍCITAS:
${result.intent.emotions.length ? result.intent.emotions.join(", ") : "nenhuma"}

SINAIS DA SITUAÇÃO:
${result.intent.signals.length ? result.intent.signals.join(", ") : "nenhum"}

PADRÕES EMOCIONAIS:
${detected}

PADRÃO PRINCIPAL:
${result.emotional.primary.key}

LUZ:
${result.emotional.primary.light}

SOMBRA:
${result.emotional.primary.shadow}

DIREÇÃO:
${result.emotional.primary.guidance}

ORIENTAÇÃO DE RESPOSTA:
${result.intent.responseDirection}
`.trim();
}
