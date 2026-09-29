import express from "express";
import path from "path";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

const APP_URL =
  process.env.APP_URL || "https://www.magiadascrencas.com.br";

const FIRESTORE_DATABASE_ID = "cigano";

type Plan = "free" | "silver" | "gold";

app.use(express.json({ limit: "1mb" }));

// ======================================================
// FIREBASE ADMIN
// ======================================================

function initFirebaseAdmin() {
  if (admin.apps.length) return;

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    "gen-lang-client-0138178639";

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    return;
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  });
}

function getDb() {
  initFirebaseAdmin();

  return getFirestore(
    undefined,
    FIRESTORE_DATABASE_ID
  );
}

// ======================================================
// MERCADO PAGO
// ======================================================

const mp = new MercadoPagoConfig({
  accessToken:
    process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

// ======================================================
// GEMINI CLIENT
// ======================================================

let geminiClientCache: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClientCache) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (
      !apiKey ||
      apiKey === "MY_GEMINI_API_KEY"
    ) {
      throw new Error(
        "GEMINI_API_KEY não configurada."
      );
    }

    geminiClientCache = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "magia-das-crencas",
        },
      },
    });
  }

  return geminiClientCache;
}

// ======================================================
// GEMINI MODELS
// CONTROLADOS EXCLUSIVAMENTE PELA VERCEL
// ======================================================

function getGeminiModels(): string[] {
  const models = [
    process.env.GEMINI_PRIMARY_MODEL?.trim(),
    process.env.GEMINI_SECONDARY_MODEL?.trim(),
    process.env.GEMINI_LITE_MODEL?.trim(),
  ].filter(
    (model): model is string =>
      Boolean(model)
  );

  return [...new Set(models)];
}

const GEMINI_REQUEST_TIMEOUT_MS = 45_000;
const GEMINI_FALLBACK_DELAY_MS = 2_000;

function sleep(ms: number) {
  return new Promise<void>((resolve) =>
    setTimeout(resolve, ms)
  );
}

async function withTimeout<T>(
  request: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeoutId:
    | ReturnType<typeof setTimeout>
    | undefined;

  const timeoutPromise =
    new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            `Gemini excedeu o limite de ${
              timeoutMs / 1000
            } segundos.`
          )
        );
      }, timeoutMs);
    });

  try {
    return await Promise.race([
      request,
      timeoutPromise,
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

// ======================================================
// UTILITÁRIOS
// ======================================================

function getClientIp(
  req: express.Request
): string {
  const forwarded =
    req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded
      .split(",")[0]
      .trim();
  }

  return (
    req.socket.remoteAddress ||
    "unknown"
  );
}

function normalizeText(
  value: string
): string {
  return String(value || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}

function getPlanByPackage(
  packageId: string
): Plan {
  const id =
    normalizeText(packageId);

  if (
    id === "gold" ||
    id === "ouro"
  ) {
    return "gold";
  }

  if (
    id === "silver" ||
    id === "prata"
  ) {
    return "silver";
  }

  return "silver";
}

// ======================================================
// SECURITY LOG
// ======================================================

async function securityLog(
  data: Record<string, any>
) {
  try {
    await getDb()
      .collection("security_logs")
      .add({
        ...data,
        createdAt:
          admin.firestore.FieldValue
            .serverTimestamp(),
      });
  } catch (error) {
    console.error(
      "[SECURITY_LOG_ERROR]",
      error
    );
  }
}

// ======================================================
// ANTIFRAUDE
// ======================================================

async function checkRegistrationFraud(
  params: {
    email?: string;
    deviceId?: string;
    browser?: string;
    sessionSign?: string;
    ip: string;
  }
) {
  const db = getDb();

  const email =
    normalizeText(
      params.email || ""
    );

  const deviceId =
    params.deviceId ||
    "dev_not_tracked";

  const browser =
    params.browser ||
    "unknown";

  const sessionSign =
    params.sessionSign ||
    "unknown";

  const ip = params.ip;

  const fraudReasons: string[] =
    [];

  if (
    !deviceId ||
    deviceId ===
      "dev_not_tracked"
  ) {
    fraudReasons.push(
      "missing_device_id"
    );
  }

  if (email) {
    const emailSnap =
      await db
        .collection("users")
        .where(
          "email",
          "==",
          email
        )
        .limit(1)
        .get();

    if (!emailSnap.empty) {
      fraudReasons.push(
        "email_already_used"
      );
    }
  }

  if (
    deviceId !==
    "dev_not_tracked"
  ) {
    const deviceSnap =
      await db
        .collection("users")
        .where(
          "deviceId",
          "==",
          deviceId
        )
        .limit(1)
        .get();

    if (!deviceSnap.empty) {
      fraudReasons.push(
        "device_already_used"
      );
    }
  }

  const ipUsersSnap =
    await db
      .collection("users")
      .where(
        "ip",
        "==",
        ip
      )
      .limit(10)
      .get();

  const ipLogsSnap =
    await db
      .collection(
        "security_logs"
      )
      .where(
        "ip",
        "==",
        ip
      )
      .limit(10)
      .get();

  if (
    !ipUsersSnap.empty ||
    !ipLogsSnap.empty
  ) {
    fraudReasons.push(
      "ip_already_used"
    );
  }

  const ipUsers =
    ipUsersSnap.docs.map(
      (doc) => doc.data()
    );

  const ipLogs =
    ipLogsSnap.docs.map(
      (doc) => doc.data()
    );

  const ipRecords = [
    ...ipUsers,
    ...ipLogs,
  ];

  if (
    ipRecords.some(
      (u: any) =>
        u.browser === browser
    )
  ) {
    fraudReasons.push(
      "same_ip_and_browser"
    );
  }

  if (
    ipRecords.some(
      (u: any) =>
        u.sessionSign ===
        sessionSign
    )
  ) {
    fraudReasons.push(
      "same_ip_and_session"
    );
  }

  if (
    ipRecords.length >= 1
  ) {
    fraudReasons.push(
      "too_many_recent_accounts_same_ip"
    );
  }

  return {
    promotionalCreditsBlocked:
      fraudReasons.length > 0,

    initialCredits:
      fraudReasons.length > 0
        ? 0
        : 7,

    fraudReasons: [
      ...new Set(
        fraudReasons
      ),
    ],
  };
}

// ======================================================
// LIBERAÇÃO DE CRÉDITOS
// ======================================================

async function grantCredits(
  params: {
    userId: string;
    credits: number;
    amount: number;
    packageId: string;
    paymentId: string;
    provider: string;
  }
) {
  const {
    userId,
    credits,
    amount,
    packageId,
    paymentId,
    provider,
  } = params;

  if (
    !userId ||
    !credits ||
    credits <= 0
  ) {
    throw new Error(
      "Dados inválidos para liberar créditos."
    );
  }

  const db = getDb();

  const plan =
    getPlanByPackage(
      packageId
    );

  const userRef =
    db
      .collection("users")
      .doc(userId);

  const paymentRef =
    db
      .collection(
        "payment_logs"
      )
      .doc(
        String(paymentId)
      );

  await db.runTransaction(
    async (transaction) => {
      const paymentSnap =
        await transaction.get(
          paymentRef
        );

      if (
        paymentSnap.exists &&
        paymentSnap.data()
          ?.status ===
          "credited"
      ) {
        return;
      }

      const userSnap =
        await transaction.get(
          userRef
        );

      const currentCredits =
        userSnap.exists
          ? userSnap.data()
              ?.credits || 0
          : 0;

      transaction.set(
        userRef,
        {
          uid: userId,

          credits:
            currentCredits +
            credits,

          plan,

          lastPurchaseAt:
            admin.firestore
              .FieldValue
              .serverTimestamp(),

          updatedAt:
            admin.firestore
              .FieldValue
              .serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      transaction.set(
        paymentRef,
        {
          userId,
          credits,
          amount,
          packageId,
          plan,
          paymentId,
          provider,

          status:
            "credited",

          createdAt:
            admin.firestore
              .FieldValue
              .serverTimestamp(),
        }
      );

      transaction.set(
        userRef
          .collection(
            "credit_logs"
          )
          .doc(),
        {
          type:
            "purchase",

          credits,
          amount,
          packageId,
          plan,
          paymentId,
          provider,

          status:
            "completed",

          createdAt:
            admin.firestore
              .FieldValue
              .serverTimestamp(),
        }
      );
    }
  );
}

// ======================================================
// PROMPT CIGANO PABLO
// ======================================================

function buildPabloPrompt(
  message: string,
  user: any,
  oracleContext?: any
) {
  let prompt = `
Você é CIGANO PABLO, guia espiritual e oraculista principal do site MAGIA DAS CRENÇAS.

Sua função é interpretar a pergunta do consulente com profundidade, humanidade, simbolismo e coerência.

==================================================
IDENTIDADE DE CIGANO PABLO
==================================================

Você é Cigano Pablo.

Sua presença é:
- firme;
- sábia;
- acolhedora;
- observadora;
- intuitiva;
- direta;
- humana;
- magnética;
- espiritual sem exageros.

Você NÃO é Exu.
Você NÃO é Maria Padilha.
Você NÃO mistura personagens, frases ou identidade de outros sites.

Nunca diga que é uma inteligência artificial.
Nunca fale como atendente técnico.
Nunca responda de forma fria, mecânica ou genérica.

Fale naturalmente como Cigano Pablo se dirigindo diretamente ao consulente.

==================================================
REGRA FUNDAMENTAL
==================================================

Você interpreta símbolos, padrões, possibilidades e caminhos.

Não apresente uma previsão espiritual como fato científico ou certeza absoluta.

Evite afirmações como:

"isso certamente acontecerá"
"ele definitivamente voltará"
"ela está te traindo"
"você ficará rico"
"essa doença é espiritual"

Prefira:

"o caminho aponta..."
"a leitura sugere..."
"há sinais de..."
"a energia dessa situação mostra..."
"o cenário mais forte neste momento é..."
"existe tendência de..."

Você pode ser firme sem inventar certeza.

==================================================
DADOS DO CONSULENTE
==================================================

Nome:
${user?.displayName || user?.name || "Consulente"}

E-mail:
${user?.email || "não informado"}

Data de nascimento:
${user?.birthDate || "não informada"}

Hora de nascimento:
${user?.birthTime || "não informada"}

Signo:
${user?.sign || "não informado"}

Número da Alma:
${user?.nameNumber || "não calculado"}

Número de Destino:
${user?.lifePathNumber || "não calculado"}

Elemento espiritual:
${user?.spiritualElement || "não informado"}

Anjo guardião:
${user?.guardianAngel || "não informado"}

Odù regente:
${user?.regentOdu?.name || "não informado"}

Plano:
${user?.plan || "free"}

Créditos:
${user?.credits ?? "não informado"}

Use esses dados SOMENTE quando forem relevantes para a pergunta.

Nunca force signo, Odu, anjo, numerologia ou outro dado dentro da resposta apenas porque está disponível.

==================================================
PERGUNTA DO CONSULENTE
==================================================

${message}

==================================================
IDENTIFIQUE INTERNAMENTE O TIPO DE CONSULTA
==================================================

Antes de responder, determine internamente se a pergunta está relacionada a:

- amor;
- relacionamento;
- reconciliação;
- sentimentos;
- família;
- trabalho;
- dinheiro;
- prosperidade;
- decisões;
- caminhos;
- espiritualidade;
- proteção;
- autoconhecimento;
- Tarot;
- Búzios;
- Ifá;
- Odu;
- Orixás;
- Numerologia;
- Mapa Astral;
- Anjo Guardião;
- Daimons;
- outro assunto.

Não precisa informar essa classificação ao consulente.

Ela serve apenas para orientar sua leitura.

==================================================
TAROT
==================================================

Quando a consulta envolver Tarot:

Interprete somente as cartas realmente fornecidas pelo sistema.

Considere:
- significado individual;
- posição de cada carta;
- relação entre as cartas;
- bloqueios;
- oportunidades;
- tendência;
- conselho.

Nunca invente cartas que não foram fornecidas.

Se houver três cartas, interprete naturalmente como:
1. situação ou raiz;
2. desenvolvimento ou influência;
3. tendência ou conselho.

Não transforme a resposta em uma lista seca de significados.

Faça uma leitura integrada, humana e coerente.

==================================================
BÚZIOS
==================================================

Quando a consulta envolver Búzios:

Fale sobre:
- abertura ou fechamento de caminhos;
- forças favoráveis;
- obstáculos;
- equilíbrio;
- decisões;
- orientação espiritual.

Não invente queda específica de búzios se essa informação não tiver sido enviada pelo sistema.

Apresente a leitura como interpretação simbólica e espiritual.

==================================================
IFÁ E ODU
==================================================

Quando envolver Ifá ou Odu:

Considere:
- direção do caminho;
- comportamento;
- escolhas;
- equilíbrio;
- repetição de padrões;
- oportunidades;
- advertências.

Se um Odu específico for informado, interprete esse Odu.

Se nenhum Odu tiver sido informado, NÃO invente um.

==================================================
ORIXÁS
==================================================

Quando envolver Orixás:

Explique simbolicamente:
- força;
- arquétipo;
- qualidade;
- ensinamento;
- comportamento;
- caminho associado.

Não declare que determinado Orixá governa definitivamente uma pessoa sem informações suficientes.

==================================================
NUMEROLOGIA
==================================================

Quando envolver Numerologia:

Se houver números ou data suficientes, explique:
- vibração;
- tendências;
- potenciais;
- desafios;
- ciclos.

Não invente números que não possam ser derivados dos dados fornecidos.

==================================================
MAPA ASTRAL
==================================================

Quando envolver Mapa Astral:

Use somente informações realmente fornecidas.

Não invente:
- ascendente;
- lua;
- casas;
- aspectos;
- posições planetárias.

Se faltarem dados necessários, explique claramente que uma interpretação específica depende dessas informações.

==================================================
ANJO GUARDIÃO
==================================================

Quando envolver Anjo Guardião:

Trate a interpretação de maneira espiritual e simbólica.

Fale sobre:
- proteção;
- virtudes;
- reflexão;
- direcionamento;
- comportamento.

==================================================
DAIMONS
==================================================

Quando o tema envolver Daimons:

Trate como tradição simbólica, histórica, espiritual ou esotérica.

Não incentive:
- pactos perigosos;
- sacrifícios;
- automutilação;
- violência;
- atividades perigosas.

Priorize conhecimento, simbolismo e reflexão.

==================================================
AMOR E RELACIONAMENTOS
==================================================

Quando alguém perguntar:

"ele me ama?"
"ela vai voltar?"
"ele pensa em mim?"
"está me traindo?"
"vamos ficar juntos?"

Não dê respostas automáticas.

Analise:
- comportamento descrito;
- contexto;
- sinais contraditórios;
- emoções;
- comunicação;
- possibilidades.

Você pode falar em tendência, aproximação, distância, insegurança, desejo, bloqueio ou abertura.

Não invente pensamentos privados de outra pessoa como fato.

==================================================
DINHEIRO E TRABALHO
==================================================

Não prometa riqueza ou sucesso.

Analise:
- oportunidade;
- risco;
- disciplina;
- decisão;
- timing;
- organização;
- possíveis bloqueios.

Quando houver decisões financeiras importantes, incentive também análise prática.

==================================================
SAÚDE
==================================================

Você pode acolher emocionalmente e oferecer reflexão espiritual.

Não diagnostique doenças.

Não afirme que uma doença foi causada por:
- espírito;
- feitiço;
- entidade;
- maldição;
- inveja;
- energia espiritual.

Em situações de saúde importantes, incentive avaliação profissional.

==================================================
FORMA DA RESPOSTA
==================================================

Responda sempre em português do Brasil.

A resposta deve parecer uma CONSULTA, não um artigo.

Use linguagem natural.

Comece diretamente entrando na questão do consulente.

Evite começar todas as respostas exatamente da mesma maneira.

Não use excesso de títulos.

Não faça listas gigantes.

Não repita toda a pergunta.

Não explique como você produz a resposta.

Evite frases vazias.

==================================================
PROFUNDIDADE
==================================================

A resposta deve:
1. reconhecer o centro da dúvida;
2. interpretar o cenário;
3. revelar o principal ponto de tensão;
4. mostrar possibilidades;
5. apontar o que merece atenção;
6. terminar com orientação prática e espiritual.

Quando a pergunta permitir, explore também aquilo que o consulente talvez não esteja percebendo.

==================================================
PERSONALIDADE
==================================================

Cigano Pablo pode usar naturalmente expressões como:

"Veja bem..."
"Há algo importante aqui..."
"Preste atenção neste ponto..."
"O caminho mostra..."
"O que pesa nessa situação é..."
"Há movimento, mas também existe bloqueio..."
"Não entregue sua força à ansiedade..."

Não repita essas expressões mecanicamente.

==================================================
TAMANHO
==================================================

Pergunta simples:
resposta objetiva, porém significativa.

Pergunta emocional ou complexa:
resposta mais profunda.

Não alongue artificialmente uma resposta apenas para parecer espiritual.

==================================================
ENCERRAMENTO
==================================================

Finalize com um conselho direto e útil de Cigano Pablo.

O conselho deve estar relacionado especificamente à pergunta.

Não termine todas as respostas com a mesma frase.

Agora responda ao consulente como Cigano Pablo.
`;

  // ====================================================
  // CONTEXTO ESTRUTURADO DO TAROT
  // ====================================================

  if (
    oracleContext?.oracle ===
    "tarot"
  ) {
    prompt += `

==================================================
CONTEXTO ESTRUTURADO DO ORÁCULO
==================================================

ORÁCULO UTILIZADO:
Tarot

CARTAS SORTEADAS:
${
  oracleContext.formattedCards ||
  "Não informado"
}

PERGUNTA ORIGINAL:
${
  oracleContext.originalQuestion ||
  message
}

REGRA OBRIGATÓRIA:

Use as cartas acima como base principal da leitura.

Não invente outras cartas.

Não substitua as cartas sorteadas.

Não ignore a combinação apresentada.

Observe primeiro o conjunto das cartas antes de construir a resposta.

Interprete a combinação como uma leitura única, humana e coerente para a pergunta do consulente.

A interpretação chamada "Leitura verdadeira do Cigano Pablo" deve ter prioridade.

A referência clássica deve funcionar apenas como apoio complementar.

O consulente não está pedindo uma aula sobre Tarot.

Ele está buscando compreensão da própria situação.
`;
  }

  return prompt;
}

// ======================================================
// GERADOR GEMINI COM SISTEMA ANTIQUEDAS
// ======================================================

async function generatePabloResponse(
  message: string,
  user: any,
  systemInstruction?: string,
  oracleContext?: any
) {
  const ai =
    getGeminiClient();

  const models =
    getGeminiModels();

  if (!models.length) {
    throw new Error(
      "Nenhum modelo Gemini foi configurado nas variáveis da Vercel."
    );
  }

  const prompt =
    buildPabloPrompt(
      message,
      user,
      oracleContext
    );

  let lastError:
    unknown = null;

  for (
    let index = 0;
    index < models.length;
    index++
  ) {
    const model =
      models[index];

    const startedAt =
      Date.now();

    try {
      console.log(
        `[GEMINI] Tentando modelo ${model}.`
      );

      const request =
        ai.models.generateContent({
          model,

          contents:
            prompt,

          config: {
            systemInstruction:
              systemInstruction ||
              "Você é Cigano Pablo, guia espiritual e oraculista principal do site Magia das Crenças.",

            maxOutputTokens:
              3000,
          },
        });

      const response =
        await withTimeout(
          request,
          GEMINI_REQUEST_TIMEOUT_MS
        );

      const text =
        response.text?.trim();

      if (!text) {
        throw new Error(
          `O modelo ${model} retornou uma resposta vazia.`
        );
      }

      console.log(
        "[GEMINI_SUCCESS]",
        {
          model,
          durationMs:
            Date.now() -
            startedAt,
        }
      );

      return {
        text,
        model,
      };
    } catch (error) {
      lastError = error;

      console.error(
        "[GEMINI_ERROR]",
        {
          model,

          durationMs:
            Date.now() -
            startedAt,

          error:
            error instanceof Error
              ? error.message
              : String(error),
        }
      );

      const hasNextModel =
        index <
        models.length - 1;

      if (hasNextModel) {
        console.warn(
          `[GEMINI] ${model} falhou. Aguardando 2 segundos antes do próximo modelo.`
        );

        await sleep(
          GEMINI_FALLBACK_DELAY_MS
        );
      }
    }
  }

  console.error(
    "[GEMINI_ALL_MODELS_FAILED]",
    {
      error:
        lastError instanceof Error
          ? lastError.message
          : String(
              lastError ||
                "Erro desconhecido"
            ),
    }
  );

  throw new Error(
    "Os modelos da Gemini estão temporariamente indisponíveis. Tente novamente em alguns instantes."
  );
}

// ======================================================
// HEALTH
// ======================================================

app.get(
  "/api/health",
  (_req, res) => {
    const configuredModels =
      getGeminiModels();

    res.json({
      status: "ok",
      project:
        "Magia das Crenças",
      database:
        FIRESTORE_DATABASE_ID,

      gemini: {
        configured:
          configuredModels.length,
        primary:
          configuredModels[0] ||
          null,
        secondary:
          configuredModels[1] ||
          null,
        lite:
          configuredModels[2] ||
          null,
      },
    });
  }
);

// ======================================================
// REGISTRATION SECURITY
// ======================================================

app.post(
  "/api/security/register-check",
  async (req, res) => {
    try {
      const ip =
        getClientIp(req);

      const {
        email,
        deviceId,
        browser,
        sessionSign,
        uid,
      } = req.body;

      const result =
        await checkRegistrationFraud(
          {
            email,
            deviceId,
            browser,
            sessionSign,
            ip,
          }
        );

      await securityLog({
        type:
          "register_check",

        uid:
          uid || "",

        email:
          normalizeText(
            email || ""
          ),

        ip,

        deviceId:
          deviceId ||
          "dev_not_tracked",

        browser:
          browser ||
          "unknown",

        sessionSign:
          sessionSign ||
          "unknown",

        creditsGranted:
          result.initialCredits,

        promotionalCreditsBlocked:
          result.promotionalCreditsBlocked,

        fraudReasons:
          result.fraudReasons,
      });

      res.json({
        success: true,
        ip,
        ...result,
      });
    } catch (error: any) {
      console.error(
        "[REGISTER_CHECK_ERROR]",
        error
      );

      res.status(500).json({
        success: false,

        error:
          "Erro ao verificar segurança do cadastro.",
      });
    }
  }
);

// ======================================================
// GEMINI CHAT
// ======================================================
//
// IMPORTANTE:
//
// O frontend já realiza o débito de créditos antes
// de chamar esta rota.
//
// Portanto esta rota NÃO debita créditos novamente.
//
// Isso deixa o comportamento do server.ts igual ao
// api/gemini/chat.ts usado em produção e evita
// cobrança duplicada.
// ======================================================

app.post(
  "/api/gemini/chat",
  async (req, res) => {
    try {
      const {
        message,
        user,
        cost,
        systemInstruction,
        oracleContext,
      } = req.body || {};

      if (
        !message ||
        typeof message !==
          "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            error:
              "Mensagem inválida.",
          });
      }

      if (
        !user?.uid &&
        !user?.id
      ) {
        return res
          .status(401)
          .json({
            success: false,

            error:
              "Usuário não identificado.",
          });
      }

      const requestedCost =
        Number(cost || 1);

      const validCosts = [
        1,
        2,
        3,
        4,
        5,
      ];

      const creditCost =
        validCosts.includes(
          requestedCost
        )
          ? requestedCost
          : 1;

      const result =
        await generatePabloResponse(
          message,
          user,
          systemInstruction,
          oracleContext
        );

      return res.json({
        success: true,

        text:
          result.text,

        model:
          result.model,

        cost:
          creditCost,
      });
    } catch (error: any) {
      console.error(
        "[GEMINI_CHAT_ERROR]",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          error:
            error?.message ||
            "Erro ao consultar Cigano Pablo.",

          text:
            "As cartas silenciaram por um instante. Respire, firme sua pergunta e tente novamente.",
        });
    }
  }
);

// ======================================================
// CRIAÇÃO DE PAGAMENTO
// ======================================================

app.post(
  "/api/payments/create",
  async (req, res) => {
    try {
      const {
        packageId,
        userEmail,
        userName,
        userId,
      } = req.body;

      if (
        !userId ||
        !packageId
      ) {
        return res
          .status(400)
          .json({
            error:
              "Dados de pagamento incompletos.",
          });
      }

      if (
        !process.env
          .MERCADO_PAGO_ACCESS_TOKEN
      ) {
        return res
          .status(500)
          .json({
            error:
              "MERCADO_PAGO_ACCESS_TOKEN não configurado.",
          });
      }

      const plans:
        Record<string, any> =
        {
          silver: {
            packageId:
              "silver",

            title:
              "Plano Prata",

            amount: 49,

            credits: 50,
          },

          prata: {
            packageId:
              "silver",

            title:
              "Plano Prata",

            amount: 49,

            credits: 50,
          },

          gold: {
            packageId:
              "gold",

            title:
              "Plano Ouro",

            amount: 120,

            credits: 125,
          },

          ouro: {
            packageId:
              "gold",

            title:
              "Plano Ouro",

            amount: 120,

            credits: 125,
          },
        };

      const selected =
        plans[
          normalizeText(
            packageId
          )
        ];

      if (!selected) {
        return res
          .status(400)
          .json({
            error:
              "Plano inválido.",
          });
      }

      await securityLog({
        type:
          "payment_create_attempt",

        userId,

        userEmail:
          userEmail || "",

        packageId:
          selected.packageId,

        amount:
          selected.amount,

        credits:
          selected.credits,

        ip:
          getClientIp(req),

        userAgent:
          req.headers[
            "user-agent"
          ] || "unknown",
      });

      const preference =
        new Preference(mp);

      const result: any =
        await preference.create({
          body: {
            items: [
              {
                id:
                  selected.packageId,

                title:
                  selected.title,

                quantity: 1,

                currency_id:
                  "BRL",

                unit_price:
                  Number(
                    selected.amount
                  ),
              },
            ],

            payer: {
              email:
                userEmail ||
                undefined,

              name:
                userName ||
                undefined,
            },

            metadata: {
              userId,
              user_id:
                userId,

              packageId:
                selected.packageId,

              package_id:
                selected.packageId,

              credits:
                Number(
                  selected.credits
                ),

              amount:
                Number(
                  selected.amount
                ),

              project:
                "magia-das-crencas",
            },

            back_urls: {
              success:
                `${APP_URL}/?payment=success&credits=${selected.credits}`,

              failure:
                `${APP_URL}/?payment=failure`,

              pending:
                `${APP_URL}/?payment=pending`,
            },

            auto_return:
              "approved",

            notification_url:
              `${APP_URL}/api/payments/webhook`,
          },
        });

      return res.json({
        checkoutUrl:
          result.init_point ||
          result.sandbox_init_point,

        preferenceId:
          result.id,
      });
    } catch (error: any) {
      console.error(
        "[PAYMENT_CREATE_ERROR]",
        error
      );

      await securityLog({
        type:
          "payment_create_error",

        error:
          error.message ||
          String(error),

        ip:
          getClientIp(req),
      });

      return res
        .status(500)
        .json({
          error:
            "Erro ao criar pagamento.",

          details:
            error.message ||
            "Erro desconhecido.",
        });
    }
  }
);

// ======================================================
// MERCADO PAGO WEBHOOK
// ======================================================

app.post(
  "/api/payments/webhook",
  async (req, res) => {
    try {
      const paymentId =
        req.body?.data?.id ||
        req.body?.id ||
        req.query?.id ||
        req.query?.[
          "data.id"
        ];

      if (!paymentId) {
        return res
          .status(200)
          .json({
            received: true,
          });
      }

      const payment =
        new Payment(mp);

      const paymentData: any =
        await payment.get({
          id:
            String(paymentId),
        });

      const status =
        paymentData?.status;

      const metadata =
        paymentData?.metadata ||
        {};

      await getDb()
        .collection(
          "payment_webhooks"
        )
        .doc(
          String(paymentId)
        )
        .set(
          {
            paymentId:
              String(
                paymentId
              ),

            status,

            metadata,

            raw:
              paymentData,

            receivedAt:
              admin.firestore
                .FieldValue
                .serverTimestamp(),
          },
          {
            merge: true,
          }
        );

      if (
        status === "approved"
      ) {
        await grantCredits({
          userId:
            metadata.userId ||
            metadata.user_id,

          credits:
            Number(
              metadata.credits ||
              0
            ),

          amount:
            Number(
              metadata.amount ||
              paymentData
                .transaction_amount ||
              0
            ),

          packageId:
            metadata.packageId ||
            metadata.package_id ||
            "silver",

          paymentId:
            String(paymentId),

          provider:
            "mercadopago",
        });
      }

      return res
        .status(200)
        .json({
          received: true,
        });
    } catch (error: any) {
      console.error(
        "[PAYMENT_WEBHOOK_ERROR]",
        error
      );

      try {
        await getDb()
          .collection(
            "payment_errors"
          )
          .add({
            error:
              error.message ||
              String(error),

            body:
              req.body ||
              null,

            query:
              req.query ||
              null,

            createdAt:
              admin.firestore
                .FieldValue
                .serverTimestamp(),
          });
      } catch (
        logError
      ) {
        console.error(
          "[PAYMENT_ERROR_LOG_FAILED]",
          logError
        );
      }

      return res
        .status(200)
        .json({
          received: true,
        });
    }
  }
);

// ======================================================
// PAYMENT STATUS
// ======================================================

app.get(
  "/api/payments/status/:paymentId",
  async (req, res) => {
    try {
      const {
        paymentId,
      } = req.params;

      if (!paymentId) {
        return res
          .status(400)
          .json({
            success: false,

            error:
              "ID do pagamento não informado.",
          });
      }

      const payment =
        new Payment(mp);

      const paymentData: any =
        await payment.get({
          id:
            String(paymentId),
        });

      const status =
        paymentData?.status;

      const metadata =
        paymentData?.metadata ||
        {};

      if (
        status === "approved"
      ) {
        await grantCredits({
          userId:
            metadata.userId ||
            metadata.user_id,

          credits:
            Number(
              metadata.credits ||
              0
            ),

          amount:
            Number(
              metadata.amount ||
              paymentData
                .transaction_amount ||
              0
            ),

          packageId:
            metadata.packageId ||
            metadata.package_id ||
            "silver",

          paymentId:
            String(paymentId),

          provider:
            "mercadopago_status_check",
        });
      }

      return res.json({
        success: true,

        status,

        approved:
          status ===
          "approved",

        metadata,
      });
    } catch (error: any) {
      console.error(
        "[PAYMENT_STATUS_ERROR]",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          error:
            "Erro ao consultar pagamento.",
        });
    }
  }
);

// ======================================================
// MOCK DE PAGAMENTO
// SOMENTE DESENVOLVIMENTO
// ======================================================

app.get(
  "/api/payments/mock-success",
  async (req, res) => {
    if (
      process.env
        .NODE_ENV ===
      "production"
    ) {
      return res
        .status(403)
        .send(
          "Mock desativado em produção."
        );
    }

    try {
      const {
        userId,
        credits,
        packageId,
        amount,
      } = req.query;

      if (
        !userId ||
        !credits
      ) {
        return res
          .status(400)
          .send(
            "Dados inválidos."
          );
      }

      await grantCredits({
        userId:
          String(userId),

        credits:
          Number(credits),

        amount:
          Number(
            amount || 0
          ),

        packageId:
          String(
            packageId ||
            "silver"
          ),

        paymentId:
          `mock_${Date.now()}`,

        provider:
          "mercadopago_mock",
      });

      return res.redirect(
        `/?payment=success&credits=${credits}`
      );
    } catch (error: any) {
      console.error(
        "[MOCK_PAYMENT_ERROR]",
        error
      );

      return res
        .status(500)
        .send(
          error.message ||
          "Erro ao liberar créditos."
        );
    }
  }
);

// ======================================================
// FRONTEND ESTÁTICO
// ======================================================

const distPath =
  path.join(
    process.cwd(),
    "dist"
  );

app.use(
  express.static(
    distPath
  )
);

app.get(
  "*",
  (_req, res) => {
    res.sendFile(
      path.join(
        distPath,
        "index.html"
      )
    );
  }
);

export default app;