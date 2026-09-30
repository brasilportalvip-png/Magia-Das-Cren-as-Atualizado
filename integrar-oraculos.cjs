const fs = require("fs");
const path = require("path");

const root = process.cwd();
const chatPath = path.join(root, "src", "components", "ChatSection.tsx");
const apiPath = path.join(root, "api", "gemini", "chat.ts");

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Arquivo não encontrado: ${file}`);
  }
  return fs.readFileSync(file, "utf8");
}

function writeBackup(file, content) {
  const backup = `${file}.backup-oraculos`;
  if (!fs.existsSync(backup)) {
    fs.writeFileSync(backup, content, "utf8");
  }
}

function replaceOrFail(content, search, replacement, label) {
  if (typeof search === "string") {
    if (!content.includes(search)) {
      throw new Error(`Não encontrei o trecho esperado: ${label}`);
    }
    return content.replace(search, replacement);
  }

  if (!search.test(content)) {
    throw new Error(`Não encontrei o trecho esperado: ${label}`);
  }

  return content.replace(search, replacement);
}

/* =========================================================
   CHATSECTION
   ========================================================= */
let chat = read(chatPath);
writeBackup(chatPath, chat);

// Remove import antigo direto do Tarot. O cérebro central assume o sorteio.
chat = chat.replace(
  /import\s+\{\s*drawPabloTarotCards,\s*formatPabloTarotCards\s*\}\s+from\s+"..\/lib\/tarotPablo";\s*\r?\n?/,
  ""
);

// Garante import do cérebro central.
if (!chat.includes('from "../lib/oraculosPablo"')) {
  const anchor = 'import { PABLO_SYSTEM_INSTRUCTION } from "../lib/gemini";';
  chat = replaceOrFail(
    chat,
    anchor,
    `${anchor}
import {
  buildPabloOracleEngine,
  type PabloOracleSessionState,
} from "../lib/oraculosPablo";`,
    "import do cérebro oracular"
  );
}

// Garante estado da sessão oracular.
if (!chat.includes("useState<PabloOracleSessionState | null>(null)")) {
  chat = replaceOrFail(
    chat,
    /const \[isLoading,\s*setIsLoading\]\s*=\s*useState\(false\);/,
    `const [isLoading, setIsLoading] = useState(false);

  const [oracleSession, setOracleSession] =
    useState<PabloOracleSessionState | null>(null);`,
    "estado oracleSession"
  );
}

// Restaura sessão oracular.
if (!chat.includes("setOracleSession(parsed.oracleSession)")) {
  chat = replaceOrFail(
    chat,
    /if \(typeof parsed\.input === "string"\) \{\s*setInput\(parsed\.input\);\s*\}/,
    `if (typeof parsed.input === "string") {
        setInput(parsed.input);
      }

      if (parsed.oracleSession) {
        setOracleSession(parsed.oracleSession);
      }`,
    "restauração oracleSession"
  );
}

// Salva sessão oracular junto do chat.
chat = chat.replace(
  /JSON\.stringify\(\{\s*messages,\s*input\s*\}\)/,
  `JSON.stringify({
        messages,
        input,
        oracleSession
      })`
);

chat = chat.replace(
  /\},\s*\[messages,\s*input\]\);/,
  `}, [messages, input, oracleSession]);`
);

// Melhora reconhecimento de custos sem remover regra existente.
chat = chat.replace(
  'else if (lowerText.includes("búzios")) amount = 4;',
  'else if (lowerText.includes("búzios") || lowerText.includes("buzios")) amount = 4;'
);
chat = chat.replace(
  'else if (lowerText.includes("orixás")) amount = 4;',
  'else if (lowerText.includes("orixás") || lowerText.includes("orixas")) amount = 4;'
);
chat = chat.replace(
  'else if (lowerText.includes("anjo guardião")) amount = 2;',
  'else if (lowerText.includes("anjo guardião") || lowerText.includes("anjo guardiao")) amount = 2;\n    else if (lowerText.includes("cabala")) amount = 2;\n    else if (lowerText.includes("daimon")) amount = 2;'
);

// Substitui o bloco antigo que sorteava Tarot diretamente.
// Vai do comentário "// Add current message to contents" até imediatamente antes de "const contents = [".
const integrationRegex =
  /\/\/ Add current message to contents[\s\S]*?(?=const contents = \[)/;

const integrationBlock = `// Monta o cérebro oracular central.
      // Ele preserva a mesma abertura de Tarot/Búzios/Odù durante follow-ups
      // e só cria uma nova abertura quando a sessão exige um novo jogo.
      const oracleEngine = buildPabloOracleEngine({
        message: text,
        user: {
          displayName: user.displayName,
          birthDate: user.birthDate,
          birthTime: user.birthTime,
          zodiacSign: user.sign,
          lifePathNumber: user.lifePathNumber,
          spiritualElement: user.spiritualElement,
          guardianAngel: user.guardianAngel,
          regentOdu: user.regentOdu,
        },
        session: oracleSession,
      });

      setOracleSession(oracleEngine.nextSession);

      const currentMessageContext =
        oracleEngine.detectedOracle !== "geral" ||
        oracleEngine.nextSession.activeOracle
          ? \`
PERGUNTA DO CONSULENTE:
\${text}

A leitura possui CONTEXTO ORACULAR ESTRUTURADO enviado separadamente.
Use esse contexto como fonte dos cálculos e da abertura ativa.
Não invente cartas, quedas ou Odùs fora do resultado fornecido.
\`
          : text;

`;

chat = replaceOrFail(
  chat,
  integrationRegex,
  integrationBlock,
  "integração central dentro de handleSendMessage"
);

// Faz contents usar o novo contexto atual.
chat = chat.replace(
  "{ role: 'user', parts: [{ text: tarotReadingContext }] }",
  "{ role: 'user', parts: [{ text: currentMessageContext }] }"
);

// Substitui oracleContext exclusivo do Tarot por contexto universal.
// Vai da declaração const oracleContext até o ; antes do generateSpiritualResponse.
const contextRegex =
  /const oracleContext\s*=\s*isTarotConsultation[\s\S]*?:\s*undefined;\s*/;

const contextBlock = `const oracleContext = {
        oracle: oracleEngine.detectedOracle,
        originalQuestion: text,
        formattedContext: oracleEngine.formattedContext,
        natalBase: oracleEngine.natalBase,
        consultation: oracleEngine.consultation,
        opening: oracleEngine.activeOpening,
        session: oracleEngine.nextSession,
      };

`;

if (contextRegex.test(chat)) {
  chat = chat.replace(contextRegex, contextBlock);
} else if (!chat.includes("formattedContext: oracleEngine.formattedContext")) {
  throw new Error("Não encontrei o oracleContext antigo do Tarot para substituir.");
}

fs.writeFileSync(chatPath, chat, "utf8");

/* =========================================================
   API GEMINI
   ========================================================= */
let api = read(apiPath);
writeBackup(apiPath, api);

// Troca suporte exclusivo do Tarot por suporte universal.
const oldOracleApiRegex =
  /if \(oracleContext\?\.oracle === "tarot"\) \{[\s\S]*?\n\}/;

const universalOracleApi = `if (oracleContext?.formattedContext) {
  prompt += \`

==================================================
CONTEXTO ORACULAR ESTRUTURADO — FONTE OBRIGATÓRIA
==================================================

\${oracleContext.formattedContext}

==================================================
REGRAS DE INTEGRIDADE DO ORÁCULO
==================================================

1. O software já executou os cálculos e/ou a abertura acima.
2. Você é o INTÉRPRETE do resultado; não substitua o resultado.
3. Não invente cartas, quedas de Búzios, Odùs ou números diferentes dos fornecidos.
4. Se existe uma abertura ativa, mantenha exatamente a mesma abertura nas perguntas de continuação.
5. Só considere uma nova abertura quando o contexto recebido trouxer um novo resultado/ID.
6. Nunca confunda Odù natal/regente com Odù de uma abertura de consulta.
7. A base natal permanece válida durante toda a interpretação.
8. Cruze BASE NATAL + MOMENTO REAL + INTENÇÃO/EMOÇÃO + ABERTURA ATIVA + PERGUNTA.
9. Não despeje o relatório técnico no consulente. Transforme os dados em uma consulta natural de Cigano Pablo.
10. Quando não houver abertura de jogo, use apenas os cálculos realmente presentes no contexto.
\`;
}`;

if (oldOracleApiRegex.test(api)) {
  api = api.replace(oldOracleApiRegex, universalOracleApi);
} else if (!api.includes("CONTEXTO ORACULAR ESTRUTURADO — FONTE OBRIGATÓRIA")) {
  throw new Error("Não encontrei o bloco antigo de oracleContext da API.");
}

// Otimiza 503: pula imediatamente para o próximo modelo.
// Substitui o bloco que começa em "lastError = error;" e contém o retry atual.
const retryRegex =
  /lastError = error;\s*\n\s*if \(attempt < 2\) \{[\s\S]*?\n\s*\}\s*\n\s*if \(index < uniqueModels\.length - 1\) \{[\s\S]*?\n\s*\}\s*/;

const retryBlock = `lastError = error;

      const status =
        error?.status ??
        error?.response?.status ??
        error?.error?.code;

      // 503 normalmente indica indisponibilidade/sobrecarga do modelo.
      // Não desperdiça uma segunda tentativa no mesmo modelo:
      // passa imediatamente ao próximo fallback configurado.
      if (Number(status) === 503) {
        console.warn(
          \`[GEMINI_FAST_FALLBACK] \${model} retornou 503. Pulando imediatamente para o próximo modelo.\`
        );
        break;
      }

      if (attempt < 2) {
        console.warn(
          \`[GEMINI_RETRY] \${model} falhou. Nova tentativa em 1 segundo.\`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );

        continue;
      }

      if (index < uniqueModels.length - 1) {
        console.warn(
          \`[GEMINI_FALLBACK] \${model} falhou. Tentando o próximo modelo.\`
        );
      }
`;

if (retryRegex.test(api)) {
  api = api.replace(retryRegex, retryBlock);
} else if (!api.includes("[GEMINI_FAST_FALLBACK]")) {
  throw new Error("Não encontrei o bloco de retry/fallback da API.");
}

fs.writeFileSync(apiPath, api, "utf8");

console.log("");
console.log("==============================================");
console.log("INTEGRAÇÃO ORACULAR CONCLUÍDA");
console.log("==============================================");
console.log("Alterados:");
console.log("- src/components/ChatSection.tsx");
console.log("- api/gemini/chat.ts");
console.log("");
console.log("Backups criados com extensão .backup-oraculos");
console.log("");
console.log("Agora execute:");
console.log("npm run build");
console.log("npm run lint");
console.log("==============================================");
