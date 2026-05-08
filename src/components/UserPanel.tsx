import { motion } from "motion/react";
import { 
  User, Sparkles, Hand, Dices, Eye, Compass, 
  ShieldCheck, Binary, Asterisk, Moon, MapIcon, 
  Search, ChevronRight
} from "lucide-react";
import { SpiritualUser } from "../types/spiritual";

interface UserPanelProps {
  user: SpiritualUser | null;
  advice?: string;
  onSelectConsultation?: (tool: string) => void;
}

const MENU_CONSULTAS = [
  { label: "Tarot", icon: <Hand size={16} />, color: "text-amber-400", glow: "shadow-[0_0_15px_rgba(245,158,11,0.4)]", gradient: "from-amber-600/30 to-amber-900/40", border: "border-amber-500/50" },
  { label: "Búzios", icon: <Dices size={16} />, color: "text-emerald-400", glow: "shadow-[0_0_15px_rgba(16,185,129,0.4)]", gradient: "from-emerald-600/30 to-emerald-900/40", border: "border-emerald-500/50" },
  { label: "Ifá", icon: <Eye size={16} />, color: "text-cyan-400", glow: "shadow-[0_0_15px_rgba(6,182,212,0.4)]", gradient: "from-cyan-600/30 to-cyan-900/40", border: "border-cyan-500/50" },
  { label: "Odu", icon: <Compass size={16} />, color: "text-purple-400", glow: "shadow-[0_0_15px_rgba(168,85,247,0.4)]", gradient: "from-purple-600/30 to-purple-900/40", border: "border-purple-500/50" },
  { label: "Orixás", icon: <ShieldCheck size={16} />, color: "text-rose-400", glow: "shadow-[0_0_15px_rgba(244,63,94,0.4)]", gradient: "from-rose-600/30 to-rose-900/40", border: "border-rose-500/50" },
  { label: "Numerologia", icon: <Binary size={16} />, color: "text-blue-400", glow: "shadow-[0_0_15px_rgba(59,130,246,0.4)]", gradient: "from-blue-600/30 to-blue-900/40", border: "border-blue-500/50" },
  { label: "Cabala", icon: <Asterisk size={16} />, color: "text-lime-400", glow: "shadow-[0_0_15px_rgba(163,230,53,0.4)]", gradient: "from-lime-600/30 to-lime-900/40", border: "border-lime-500/50" },
  { label: "Cabala Numérica", icon: <Binary size={16} />, color: "text-teal-400", glow: "shadow-[0_0_15px_rgba(20,184,166,0.4)]", gradient: "from-teal-600/30 to-teal-900/40", border: "border-teal-500/50" },
  { label: "Horóscopo", icon: <Moon size={16} />, color: "text-indigo-400", glow: "shadow-[0_0_15px_rgba(99,102,241,0.4)]", gradient: "from-indigo-600/30 to-indigo-900/40", border: "border-indigo-500/50" },
  { label: "Mapa Astral", icon: <MapIcon size={16} />, color: "text-pink-400", glow: "shadow-[0_0_15px_rgba(236,72,153,0.4)]", gradient: "from-pink-600/30 to-pink-900/40", border: "border-pink-500/50" },
  { label: "Horário Planetário", icon: <Moon size={16} />, color: "text-sky-400", glow: "shadow-[0_0_15px_rgba(14,165,233,0.4)]", gradient: "from-sky-600/30 to-sky-900/40", border: "border-sky-500/50" },
  { label: "Anjo Guardião", icon: <Search size={16} />, color: "text-yellow-400", glow: "shadow-[0_0_15px_rgba(234,179,8,0.4)]", gradient: "from-yellow-600/30 to-yellow-900/40", border: "border-yellow-500/50" },
  { label: "Daimon Guardião", icon: <ShieldCheck size={16} />, color: "text-orange-400", glow: "shadow-[0_0_15px_rgba(249,115,22,0.4)]", gradient: "from-orange-600/30 to-orange-900/40", border: "border-orange-500/50" },
];

export default function UserPanel({ user, onSelectConsultation }: UserPanelProps) {
  if (!user) {
    return (
      <div className="h-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <User size={40} />
        </div>
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.3em] text-amber-500 font-bold mb-4">Portal do Buscador</h3>
          <p className="text-xs text-white/50 italic leading-relaxed">"O portal está fechado para os curiosos. Identifique-se para revelar sua essência."</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col p-5 space-y-6 overflow-hidden shadow-2xl">
      <h3 className="text-[10px] uppercase tracking-[0.3em] text-amber-500 font-bold text-center">Portal do Buscador</h3>
      
      <div className="flex-1 flex flex-col min-h-0 space-y-6">
        {/* User Info Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] text-white/50 uppercase tracking-tighter">Buscador</span>
            <span className="text-xs font-serif italic text-amber-100">{user.displayName}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex flex-col">
              <p className="text-[8px] uppercase tracking-widest text-amber-500/70 mb-0.5">Signo</p>
              <p className="text-[11px] font-serif truncate">{user.sign || "Calcular..."}</p>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex flex-col">
              <p className="text-[8px] uppercase tracking-widest text-amber-500/70 mb-0.5">Orixá</p>
              <p className="text-[11px] font-serif">Ogum ⚙️</p>
            </div>
          </div>
        </div>

        {/* Dynamic Menu List */}
        <div className="flex-1 flex flex-col min-h-0">
          <p className="text-[10px] text-amber-500 uppercase tracking-[0.2em] mb-4 font-black gold-glow flex items-center justify-center gap-2 flex-shrink-0 bg-black/20 py-2 rounded-lg border border-amber-500/20">
            <Sparkles size={10} /> Menu de Consultas
          </p>
          
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-visible space-y-2.5">
            {MENU_CONSULTAS.map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ x: 5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectConsultation?.(item.label)}
                className={`w-full p-3 rounded-xl bg-gradient-to-r ${item.gradient} border border-white/10 hover:border-white/30 flex items-center justify-between group transition-all ${item.glow}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`${item.color} drop-shadow-[0_0_8px_currentColor] brightness-125`}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.15em] text-white/90 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                </div>
                <ChevronRight size={14} className="text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-gold/20 transition-all group">
      <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-tighter mb-1">
        <span className="text-gold/40 group-hover:text-gold transition-colors">{icon}</span>
        {label}
      </div>
      <div className="text-xs font-bold text-white/90 truncate">{value}</div>
    </div>
  );
}

function ProtectionItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-gold/5 transition-all">
        <div className="flex items-center gap-3">
            <div className="text-gold/40">{icon}</div>
            <div className="text-[11px] text-white/50">{label}</div>
        </div>
        <div className="text-[11px] font-bold text-gold uppercase tracking-wider">{value}</div>
      </div>
    );
}
