import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Heart, DollarSign, Activity, Briefcase, Users, Home } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { Message, SpiritualUser } from "../types/spiritual";
import { ai, PABLO_SYSTEM_INSTRUCTION } from "../lib/gemini";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ChatSectionProps {
  user: SpiritualUser | null;
  onCreditUse: (amount: number) => void;
  onNewAdvice?: (advice: string) => void;
  initialMessage?: string;
}

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
  
  // Use a ref to track if we've already triggered the initial message to avoid loops
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (initialMessage && !triggeredRef.current) {
        triggeredRef.current = true;
        handleSendMessage(initialMessage);
    }
  }, [initialMessage]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'model' && messages.length > 1) {
        // Scroll to the start of the response so the user can read from the beginning
        lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Normal scroll to bottom for user messages or first message
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    if (!user) {
        setMessages(prev => [...prev, { role: 'model', content: "Por favor, identifique-se no painel ao lado para que possamos ler seu destino.", timestamp: Date.now() }]);
        return;
    }
    if (user.credits <= 0) {
        setMessages(prev => [...prev, { role: 'model', content: "Suas energias se esgotaram. Adquira um novo pacote espiritual para continuarmos nossa jornada.", timestamp: Date.now() }]);
        return;
    }

    const userMessage: Message = { role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Calculate dynamic cost
    let amount = 1;
    const lowerText = text.toLowerCase();
    if (lowerText.includes("tarot")) amount = 3;
    else if (lowerText.includes("mapa astral")) amount = 5;
    else if (lowerText.includes("búzios")) amount = 4;
    else if (lowerText.includes("ifá")) amount = 4;
    else if (lowerText.includes("odu")) amount = 2;

    onCreditUse(amount); 

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const chat = ai.chats.create({
        model: "gemini-1.5-flash",
        config: {
          systemInstruction: PABLO_SYSTEM_INSTRUCTION + `\n
          DADOS DO CONSULTE:
          - Nome: ${user.displayName}
          - Signo: ${user.sign || 'Não identificado'}
          - Plano: ${user.plan}
          - Nível Espiritual: ${user.spiritualLevel || 1}
          - Créditos Atuais: ${user.credits}
          
          MEMÓRIA PESSOAL:
          Lembre-se de detalhes de conversas anteriores se houver. Trate o usuário pelo nome. Sua voz deve ser mística, acolhedora e sábia.`,
        },
        history
      });

      const result = await chat.sendMessage({ message: text });
      const modelContent = result.text;
      
      const modelMessage: Message = { role: 'model', content: modelContent, timestamp: Date.now() };
      setMessages(prev => [...prev, modelMessage]);

      // Provide advice summary for the user panel
      if (onNewAdvice) {
        // Find a paragraph that looks like a direct advice or spiritual recommendation
        const paragraphs = modelContent.split('\n').filter(p => p.trim().length > 30);
        
        // Strategy: Look for terms like "aconselho", " Pablo diz", "espiritual", "caminho"
        const adviceKeywords = ["aconselho", "pablo", "espiritual", "caminho", "destino", "luz", "alma"];
        const adviceParagraph = paragraphs.find(p => 
          adviceKeywords.some(key => p.toLowerCase().includes(key))
        ) || paragraphs[paragraphs.length - 1] || modelContent;
        
        let adviceSnippet = adviceParagraph.replace(/[*#]/g, ''); // Clean markdown
        
        // Limit and clean up
        if (adviceSnippet.length > 500) {
            adviceSnippet = adviceSnippet.substring(0, 497) + "...";
        }
        
        onNewAdvice(adviceSnippet);
      }

      // Fire-and-forget sync to Firebase, won't crash if it fails (common for guests)
      try {
        if (user && user.uid && !user.uid.startsWith('guest')) {
          addDoc(collection(db, `users/${user.uid}/consultations`), {
            messages: [...messages, userMessage, modelMessage],
            timestamp: serverTimestamp(),
            type: 'general'
          }).catch(e => console.warn("Firebase sync background error:", e));
        }
      } catch (e) {
        // Silently ignore sync errors
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "As energias oscilaram... Pablo está recompondo o círculo. Por favor, tente perguntar novamente.", 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Search Header */}
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

      {/* Messages Area */}
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
        {/* Extra space at the bottom to ensure nothing is cut off */}
        <div className="h-20" />
        <div ref={messagesEndRef} />
      </div>

      {/* Input & Suggestions */}
      <div className="p-4 border-t border-white/10 bg-black/40">
        <div className="flex gap-2.5 overflow-x-auto pb-5 pt-1 scrollbar-none px-1">
          {QUICK_SUGGESTIONS.map((s) => (
            <motion.button
              whileHover={{ scale: 1.1, y: -4 }}
              whileTap={{ scale: 0.9 }}
              key={s.label}
              onClick={() => handleSendMessage(s.label)}
              className={`px-6 py-3.5 rounded-2xl bg-gradient-to-br ${s.gradient} ${s.border} border-2 hover:border-white transition-all whitespace-nowrap text-[12px] uppercase tracking-[0.25em] font-black group relative overflow-hidden flex items-center gap-3 ${s.glow} hover:brightness-150 active:brightness-90`}
            >
              {/* Inner Light Effect */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 blur-sm group-hover:bg-white/30 transition-colors" />
              <div className={`absolute inset-0 bg-white/10 opacity-40 group-hover:opacity-60 transition-opacity`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              
              {/* Icon and Text */}
              <span className={`${s.color} drop-shadow-[0_0_12px_currentColor] relative z-10 brightness-125 group-hover:scale-110 transition-transform`}>
                {s.icon}
              </span>
              <span className="text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-black italic">
                {s.label}
              </span>

              {/* Animated Shine */}
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
