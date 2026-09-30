import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Heart, DollarSign, Activity, Briefcase, Home } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { Message, SpiritualUser } from "../types/spiritual";
import {
  buildPabloOracleEngine,
  type PabloOracleSessionState,
} from "../lib/oraculosPablo";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ChatSectionProps {
  user: SpiritualUser | null;
  onCreditUse: (amount: number) => Promise<void>;
  onNewAdvice?: (advice: string) => void;
  initialMessage?: string;
}

const CHAT_SESSION_KEY = "magia_crencas_chat_session";
const CHAT_SESSION_OPEN_KEY = "magia_crencas_chat_open";

const QUICK_SUGGESTIONS = [
  { label: "Amor", icon: <Heart size={16} fill="currentColor" />, color: "text-rose-400", glow: "shadow-[0_0_20px_rgba(244,63,94,0.6)]", gradient: "from-rose-500 to-rose-700", border: "border-rose-400/60" },
  { label: "Dinheiro", icon: <DollarSign size={16} />, color: "text-emerald-400", glow: "shadow-[0_0_20px_rgba(16,185,129,0.6)]", gradient: "from-emerald-500 to-emerald-700", border: "border-emerald-400/60" },
  { label: "Saúde", icon: <Activity size={16} />, color: "text-cyan-400", glow: "shadow-[0_0_20px_rgba(6,182,212,0.6)]", gradient: "from-cyan-500 to-cyan-700", border: "border-cyan-400/60" },
  { label: "Trabalho", icon: <Briefcase size={16} fill="currentColor" />, color: "text-amber-400", glow: "shadow-[0_0_20px_rgba(245,158,11,0.6)]", gradient: "from-amber-500 to-amber-700", border: "border-amber-400/60" },
  { label: "Espiritual", icon: <Sparkles size={16} fill="currentColor" />, color: "text-purple-400", glow: "shadow-[0_0_20px_rgba(168,85,247,0.6)]", gradient: "from-purple-500 to-purple-700", border: "border-purple-400/60" },
  { label: "Família", icon: <Home size={16} fill="currentColor" />, color: "text-orange-400", glow: "shadow-[0_0_20px_rgba(249,115,22,0.6)]", gradient: "from-orange-500 to-orange-700", border: "border-orange-400/60" },
];

export default function ChatSection({ user, onCreditUse, onNewAdvice, initialMessage }: ChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Salve, alma querida. Eu sou o Cigano Pablo. O que as estrelas e as cartas reservam para o seu caminho hoje?",
      timestamp: Date.now()
    }
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [oracleSession, setOracleSession] =
    useState<PabloOracleSessionState | null>(null);

  useEffect(() => {
    try {
      const isOpenSession = sessionStorage.getItem(CHAT_SESSION_OPEN_KEY);
      const savedSession = sessionStorage.getItem(CHAT_SESSION_KEY);

      if (isOpenSession && savedSession) {
        const parsed = JSON.parse(savedSession);

        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages);
        }

        if (typeof parsed.input === "string") {
          setInput(parsed.input);
        }

        if (parsed.oracleSession) {
          setOracleSession(parsed.oracleSession);
        }
      } else {
        sessionStorage.removeItem(CHAT_SESSION_KEY);
        sessionStorage.setItem(CHAT_SESSION_OPEN_KEY, "true");
      }
    } catch (error) {
      console.error("Erro ao restaurar sessão do Magia das Crenças:", error);
      sessionStorage.removeItem(CHAT_SESSION_KEY);
      sessionStorage.setItem(CHAT_SESSION_OPEN_KEY, "true");
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHAT_SESSION_KEY,
        JSON.stringify({
          messages,
          input,
          oracleSession
        })
      );
    } catch (error) {
      console.error("Erro ao salvar sessão do Magia das Crenças:", error);
    }
  }, [messages, input, oracleSession]);

  const triggeredRef = useRef(false);

  useEffect(() => {
    if (initialMessage && !triggeredRef.current && messages.length <= 1) {
      triggeredRef.current = true;
      handleSendMessage(initialMessage);
    }
  }, [initialMessage, messages.length]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'model' && messages.length > 1) {
        lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    if (!user) {
      setMessages(prev => [...prev, {
        role: 'model',
        content: "Por favor, identifique-se no painel ao lado para que possamos ler seu destino.",
        timestamp: Date.now()
      }]);
      return;
    }

    const lowerText = text.toLowerCase();
    const isTarotConsultation = lowerText.includes("tarot");

   const isLoveQuestion =
  lowerText.includes("amor") ||
  lowerText.includes("relacionamento") ||
  lowerText.includes("ex") ||
  lowerText.includes("ela") ||
  lowerText.includes("ele") ||
  lowerText.includes("gosta de mim") ||
  lowerText.includes("me ama") ||
  lowerText.includes("trai") ||
  lowerText.includes("saudade") ||
  lowerText.includes("paixão") ||
  lowerText.includes("paixao") ||
  lowerText.includes("volta") ||
  lowerText.includes("ficante") ||
  lowerText.includes("casamento") ||
  lowerText.includes("namoro") ||
  oracleSession?.activeOracle === "comparacao_amorosa";

    const hasBirthDate =
      /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(text) ||
      /\bnascid[ao]\b/i.test(text);

    const hasOtherPersonName =
      /\bcom\s+[a-záàâãéêíóôõúç]+/i.test(text) ||
      /\bde\s+[a-záàâãéêíóôõúç]+/i.test(text) ||
      /\bnome\s+[a-záàâãéêíóôõúç]+/i.test(text);

    

const isSpecificLoveQuestion =
  /\b(ex|meu ex|minha ex|ele|ela|namorado|namorada|marido|esposa|ficante|amante|rival|trai|traição|traicao|volta|voltar|retorno|reconciliação|reconciliacao|saudade|sente algo|sentimento|gosta de mim|me ama|pensa em mim|vai me procurar|me procura|outra pessoa|alguém|alguem)\b/i.test(text) ||
  hasOtherPersonName;

const hasNameWithBirthDate =
  /\b[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+){1,5}\s+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(text);

if (
  isLoveQuestion &&
  isSpecificLoveQuestion &&
  ((!hasOtherPersonName && !hasNameWithBirthDate) || !hasBirthDate)
) {



 setMessages(prev => [
        ...prev,
        {
          role: "user",
          content: text,
          timestamp: Date.now()
        },
        {
          role: "model",
          content:
            "Eu, cigano Pablo vou ajudar a decifrar o enigma de sua vida. Atente-se a essa leitura.\n\nPara analisar esse caminho com seriedade, me mande o nome completo de solteiro da pessoa, a data de nascimento completa e, se souber, o horário de nascimento.\n\nSem esses sinais, eu posso observar tendências, mas não posso comparar os dois destinos com firmeza.",
          timestamp: Date.now()
        }
      ]);

      setInput("");
      return;
    }

    let amount = 1;

    if (isTarotConsultation) amount = 3;
    else if (lowerText.includes("mapa astral")) amount = 5;
    else if (lowerText.includes("búzios") || lowerText.includes("buzios")) amount = 4;
    else if (lowerText.includes("ifá")) amount = 4;
    else if (lowerText.includes("odu")) amount = 2;
    else if (lowerText.includes("orixás") || lowerText.includes("orixas")) amount = 4;
    else if (lowerText.includes("numerologia")) amount = 2;
    else if (lowerText.includes("anjo guardião") || lowerText.includes("anjo guardiao")) amount = 2;
    else if (lowerText.includes("cabala")) amount = 2;
    else if (lowerText.includes("daimon")) amount = 2;
    else if (lowerText.includes("amor")) amount = 2;
    else if (lowerText.includes("dinheiro")) amount = 2;
    else if (lowerText.includes("saúde")) amount = 2;
    else if (lowerText.includes("trabalho")) amount = 2;
    else if (lowerText.includes("espiritual")) amount = 2;
    else if (lowerText.includes("família")) amount = 2;

    if ((user.credits || 0) < amount) {
      setMessages(prev => [...prev, {
        role: 'model',
        content: "Suas energias atuais são insuficientes para esta consulta profunda. Pablo sugere que você recarregue sua Energia Vital.",
        timestamp: Date.now()
      }]);
      return;
    }

    const userMessage: Message = { role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      await onCreditUse(amount);

      const conversationHistory = [];
      let lastRole = null;

      for (let i = 0; i < messages.length; i++) {
        const m = messages[i];
        if (i === 0 && m.role === 'model') continue;

        const currentRole = m.role === 'user' ? 'user' : 'model';
        if (currentRole !== lastRole) {
          conversationHistory.push({
            role: currentRole,
            parts: [{ text: m.content }]
          });
          lastRole = currentRole;
        }
      }


const birthDateMatch = text.match(
  /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/
);

const textWithoutBirthDate = birthDateMatch
  ? text.replace(birthDateMatch[0], "").trim()
  : text.trim();

const otherNameMatch =
  text.match(/\bcom\s+([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+){0,4})/i) ||
  text.match(/\bnome\s+([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+){0,4})/i);

const fallbackOtherName =
  birthDateMatch &&
  /^[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+){1,5}$/.test(textWithoutBirthDate)
    ? textWithoutBirthDate
    : null;

const otherPerson =
  birthDateMatch && (otherNameMatch || fallbackOtherName)
    ? {
        name: otherNameMatch
          ? otherNameMatch[1].trim()
          : fallbackOtherName!,
        birthDate: birthDateMatch[1],
      }
    : null;



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
  otherPerson,
  session: oracleSession,
});

      setOracleSession(oracleEngine.nextSession);

      const currentMessageContext =
        oracleEngine.detectedOracle !== "geral" ||
        oracleEngine.nextSession.activeOracle
          ? `
PERGUNTA DO CONSULENTE:
${text}

A leitura possui CONTEXTO ORACULAR ESTRUTURADO enviado separadamente.
Use esse contexto como fonte dos cálculos e da abertura ativa.
Não invente cartas, quedas ou Odùs fora do resultado fornecido.
`
          : text;

      const contents = [
        ...conversationHistory,
        { role: 'user', parts: [{ text: currentMessageContext }] }
      ];

      const { generateSpiritualResponse } = await import("../services/geminiService");

      const oracleContext = {
        oracle: oracleEngine.detectedOracle,
        originalQuestion: text,
        formattedContext: oracleEngine.formattedContext,
        natalBase: oracleEngine.natalBase,
        consultation: oracleEngine.consultation,
        opening: oracleEngine.activeOpening,
        session: oracleEngine.nextSession,
      };

      const modelContent = await generateSpiritualResponse(
        contents,
        user,
        amount,
        oracleContext
      );

      const modelMessage: Message = { role: 'model', content: modelContent, timestamp: Date.now() };
      setMessages(prev => [...prev, modelMessage]);

      if (onNewAdvice) {
        const paragraphs = modelContent.split('\n').filter(p => p.trim().length > 30);
        const adviceKeywords = ["aconselho", "pablo", "espiritual", "caminho", "destino", "luz", "alma"];
        const adviceParagraph = paragraphs.find(p =>
          adviceKeywords.some(key => p.toLowerCase().includes(key))
        ) || paragraphs[paragraphs.length - 1] || modelContent;

        let adviceSnippet = adviceParagraph.replace(/[*#]/g, '');

        if (adviceSnippet.length > 500) {
          adviceSnippet = adviceSnippet.substring(0, 497) + "...";
        }

        onNewAdvice(adviceSnippet);
      }

      if (user && user.uid && !user.uid.startsWith('guest')) {
        try {
          await addDoc(collection(db, `users/${user.uid}/consultations`), {
            messages: [...messages, userMessage, modelMessage],
            timestamp: serverTimestamp(),
            type: 'general'
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/consultations`);
        }
      }

    } catch (error: any) {
      console.error("Chat error:", error);

      let errorMessage = "As energias oscilaram... Pablo está recompondo o círculo. Por favor, tente perguntar novamente.";

      if (error instanceof Error) {
        if (error.message.includes("Ciclo gratuito atingido")) {
          errorMessage = "Suas energias gratuitas para este ciclo se esgotaram. Pablo convida você a desequilibrar a balança com um de nossos pacotes espirituais.";
        } else if (error.message.includes("Créditos insuficientes")) {
          errorMessage = "Suas energias atuais são insuficientes para esta consulta profunda. Pablo sugere que você recarregue sua Energia Vital.";
        } else if (error.message.includes("Dados de nascimento essenciais ausentes")) {
          errorMessage = "Preciso de sua data e hora de nascimento para realizar os cálculos sagrados corretamente.";
        } else {
          errorMessage = error.message.length < 150 ? error.message : errorMessage;
        }
      }

      setMessages(prev => [...prev, {
        role: 'model',
        content: errorMessage,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-500 font-black gold-glow">Oráculo Digital</p>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30"></div>
          </div>
        </div>
        <div className="relative group">
          <input
            type="text"
            placeholder="Buscar saber oculto..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs italic placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all group-focus-within:bg-white/10 shadow-inner"
          />
          <Sparkles className="absolute right-4 top-2.5 text-amber-500/40 group-focus-within:text-amber-500 transition-colors" size={16} />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 scrollbar-visible"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              ref={idx === messages.length - 1 ? lastMessageRef : null}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[92%] sm:max-w-[85%] p-4 lg:p-5 rounded-2xl border ${
                msg.role === 'user'
                  ? 'bg-white/10 text-white rounded-br-none border-white/20'
                  : 'bg-black/60 text-amber-50/90 rounded-bl-none border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.08)]'
              }`}>
                {msg.role === 'model' && (
                  <div className="text-[10px] uppercase tracking-widest text-amber-500/60 mb-2 font-bold flex items-center gap-2">
                    <Sparkles size={10} /> Cigano Pablo
                  </div>
                )}
                <div className="prose prose-invert max-w-none leading-relaxed font-serif text-[14px] lg:text-[15px]">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-black/40 p-3 rounded-xl border border-amber-500/10 flex gap-1 animate-pulse">
              <div className="w-1 h-1 bg-amber-500/40 rounded-full animate-bounce [animation-delay:0s]" />
              <div className="w-1 h-1 bg-amber-500/40 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-amber-500/40 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div className="h-20" />
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10 bg-black/40">
        <div className="flex gap-2 lg:gap-2.5 overflow-x-auto pb-4 pt-1 scrollbar-none px-4 lg:px-6">
          {QUICK_SUGGESTIONS.map((s) => (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              key={s.label}
              onClick={() => handleSendMessage(s.label)}
              className={`px-4 py-2.5 lg:px-6 lg:py-3.5 rounded-xl lg:rounded-2xl bg-gradient-to-br ${s.gradient} ${s.border} border-2 hover:border-white transition-all whitespace-nowrap text-[10px] lg:text-[12px] uppercase tracking-[0.25em] font-black group relative overflow-hidden flex items-center gap-2 lg:gap-3 ${s.glow} hover:brightness-150 active:brightness-90 shrink-0`}
            >
              <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 blur-sm group-hover:bg-white/30 transition-colors" />
              <div className="absolute inset-0 bg-white/10 opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

              <span className={`${s.color} drop-shadow-[0_0_12px_currentColor] relative z-10 brightness-125 group-hover:scale-110 transition-transform`}>
                {s.icon}
              </span>
              <span className="text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-black italic">
                {s.label}
              </span>

              <div className="absolute -inset-full h-full w-1/2 z-20 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-40 group-hover:animate-shine" />
            </motion.button>
          ))}
        </div>

        <div className="bg-black/40 rounded-xl p-3 border border-white/10 flex items-center gap-3 group focus-within:border-amber-500/40 transition-all">
          <span className="text-amber-500/30 group-focus-within:text-amber-500 group-focus-within:gold-glow transition-all">◈</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(input);
              }
            }}
            placeholder="Pergunte ao Cigano Pablo..."
            className="flex-1 bg-transparent border-none text-sm focus:ring-0 placeholder:text-white/20 italic text-white resize-none h-auto min-h-[24px] max-h-32 pt-0.5 scrollbar-none"
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="text-amber-500/50 hover:text-amber-500 disabled:opacity-30 transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
