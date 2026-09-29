import { motion, AnimatePresence } from "motion/react";
import { 
  User, Sparkles, Hand, Dices, Eye, Compass, 
  ShieldCheck, Binary, Asterisk, Moon, MapIcon, 
  Search, ChevronRight, Zap, Crown, Info, Calendar,
  Edit2, Flame
} from "lucide-react";
import { SpiritualUser } from "../types/spiritual";
import { getWeekDay } from "../lib/spiritualUtils";

interface UserPanelProps {
  user: SpiritualUser | null;
  onSelectConsultation?: (tool: string) => void;
  onEditProfile?: () => void;
  advice?: string;
}

const MENU_CONSULTAS = [
  { label: "Tarot", icon: <Hand size={18} />, color: "text-amber-400", glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]", gradient: "from-amber-600/20 to-amber-900/30", border: "border-amber-500/30" },
  { label: "Búzios", icon: <Dices size={18} />, color: "text-emerald-400", glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]", gradient: "from-emerald-600/20 to-emerald-900/30", border: "border-emerald-500/30" },
  { label: "Ifá", icon: <Eye size={18} />, color: "text-cyan-400", glow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]", gradient: "from-cyan-600/20 to-cyan-900/30", border: "border-cyan-500/30" },
  { label: "Odu", icon: <Compass size={18} />, color: "text-purple-400", glow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]", gradient: "from-purple-600/20 to-purple-900/30", border: "border-purple-500/30" },
  { label: "Mapa Astral", icon: <MapIcon size={18} />, color: "text-pink-400", glow: "shadow-[0_0_20px_rgba(236,72,153,0.3)]", gradient: "from-pink-600/20 to-pink-900/30", border: "border-pink-500/30" },
  { label: "Orixás", icon: <ShieldCheck size={18} />, color: "text-rose-400", glow: "shadow-[0_0_20px_rgba(244,63,94,0.3)]", gradient: "from-rose-600/20 to-rose-900/30", border: "border-rose-500/30" },
  { label: "Numerologia", icon: <Binary size={18} />, color: "text-blue-400", glow: "shadow-[0_0_20_rgba(59,130,246,0.3)]", gradient: "from-blue-600/20 to-blue-900/30", border: "border-blue-500/30" },
  { label: "Anjo Guardião", icon: <Search size={18} />, color: "text-yellow-400", glow: "shadow-[0_0_20px_rgba(234,179,8,0.3)]", gradient: "from-yellow-600/20 to-yellow-900/30", border: "border-yellow-500/30" },
  { label: "Daimons", icon: <Flame size={18} />, color: "text-slate-400", glow: "shadow-[0_0_20px_rgba(148,163,184,0.3)]", gradient: "from-slate-600/20 to-slate-900/30", border: "border-slate-500/30" },
];

export default function UserPanel({ user, onSelectConsultation, onEditProfile, advice }: UserPanelProps) {
  if (!user) {
    return (
      <div className="h-full bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/10 p-8 flex flex-col items-center justify-center text-center space-y-8 shadow-2xl">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.1)]">
            <User size={48} />
          </div>
          <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-pulse" size={24} />
        </div>
        <div className="space-y-4">
          <h3 className="text-sm uppercase tracking-[0.4em] text-amber-500 font-black italic">Acesso Restrito</h3>
          <p className="text-white/40 text-sm italic leading-relaxed font-serif px-4">
            "Para que as energias possam ser direcionadas, a alma deve primeiro ser revelada."
          </p>
        </div>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">Conecte-se para continuar</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/10 flex flex-col p-6 space-y-6 overflow-hidden shadow-2xl">
      {/* Profile Header */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="relative">
         <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center overflow-hidden">
  <img
    src="/image/Magia Das Crenças Logo.png"
    alt="Cigano Pablo"
    className="w-full h-full object-cover"
  />
</div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-[#0a0a0c] rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-amber-500 font-black italic">
            {user.sign ? `${user.sign}` : 'Buscador das Estrelas'}
          </p>
          <h2 className="text-xl font-serif text-white truncate italic">{user.displayName}</h2>
          <button 
            onClick={onEditProfile}
            className="flex items-center gap-1.5 text-[9px] text-amber-500/50 hover:text-amber-500 transition-colors uppercase tracking-widest font-bold mt-1"
          >
            <Edit2 size={10} />
            Editar Perfil
          </button>
          {user.birthDate && (
            <div className="mt-2 space-y-1">
              <p className="text-[9px] text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={10} className="text-amber-500/50" />
                {getWeekDay(user.birthDate)}, {user.birthDate.split('-').reverse().join('/')} às {user.birthTime}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {user.regentOdu && (
                  <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] text-amber-500 font-bold uppercase tracking-wider">
                    Odu {user.regentOdu.number} ({user.regentOdu.orixa}): {user.regentOdu.name}
                  </span>
                )}
                {user.lifePathNumber && (
                  <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] text-blue-400 font-bold uppercase tracking-wider">
                    Destino {user.lifePathNumber}
                  </span>
                )}
                {user.nameNumber && (
                  <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-[8px] text-purple-400 font-bold uppercase tracking-wider">
                    Alma {user.nameNumber}
                  </span>
                )}
                {user.spiritualElement && (
                  <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] text-emerald-400 font-bold uppercase tracking-wider">
                    Elemento {user.spiritualElement}
                  </span>
                )}
                {user.guardianAngel && (
                  <span className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-[8px] text-yellow-400 font-bold uppercase tracking-wider">
                    Anjo {user.guardianAngel}
                  </span>
                )}
                {user.planetaryHour && (
                  <span className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-[8px] text-cyan-400 font-bold uppercase tracking-wider">
                    Hora de {user.planetaryHour}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 pr-1 scrollbar-visible">
        {/* Spiritual Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-1 hover:bg-white/10 transition-colors group">
            <span className="text-[8px] uppercase tracking-widest text-white/30 font-bold group-hover:text-amber-500 transition-colors">Plano Atual</span>
            <div className="flex items-center gap-2">
              <Crown className={user.plan !== 'free' ? 'text-amber-500' : 'text-white/20'} size={14} />
              <span className="text-xs font-black uppercase text-white/90">
                {user.plan === 'free' ? 'Gratuito' : user.plan === 'silver' ? 'Prata' : 'Ouro'}
              </span>
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-1 hover:bg-white/10 transition-colors group">
            <span className="text-[8px] uppercase tracking-widest text-white/30 font-bold group-hover:text-amber-500 transition-colors">Energia Viva</span>
            <div className="flex items-center gap-2">
              <Zap className="text-amber-500 fill-amber-500/20" size={14} />
              <span className="text-xs font-black text-white/90">
                {user.credits || 0} CR
              </span>
            </div>
          </div>
        </div>

        {/* Pablo's Advice - Highlighted Area */}
        <div className="relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-purple-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
           <div className="relative bg-black/40 border border-amber-500/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-black flex items-center gap-2 italic">
                  <Sparkles size={12} /> Conselho do Cigano
                </span>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_#f59e0b]" />
              </div>
              <p className="text-sm font-serif italic text-amber-50 leading-relaxed line-clamp-4">
                {advice || "\"As correntes do destino fluem em sua direção. Mantenha os olhos da alma abertos, pois a resposta que busca está no silêncio da sua respiração.\""}
              </p>
              <div className="w-full h-px bg-white/5" />
              <button 
                onClick={() => onSelectConsultation?.("Conselho")}
                className="w-full text-[10px] uppercase tracking-widest text-white/30 hover:text-white transition-colors flex items-center justify-center gap-2 group/btn"
              >
                Ver Reflexão Completa
                <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>

        {/* Consultation Menu - Bold List */}
        <div className="space-y-4">
          <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-black text-center mb-6">Explore o Oculto</h4>
          <div className="grid grid-cols-1 gap-2.5">
            {MENU_CONSULTAS.map((item) => (
              <motion.button
                key={item.label}
                whileHover={{ x: 8 }}
                onClick={() => onSelectConsultation?.(item.label)}
                className={`w-full p-4 rounded-2xl bg-gradient-to-r ${item.gradient} border ${item.border} hover:border-white/40 flex items-center justify-between group transition-all ${item.glow}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`${item.color} drop-shadow-[0_0_10px_currentColor] brightness-125 transition-transform group-hover:scale-110`}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-white/80 group-hover:text-white group-hover:italic transition-all">
                    {item.label}
                  </span>
                </div>
                <ChevronRight size={16} className="text-white/10 group-hover:text-white transition-all" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-2 text-[9px] text-white/20 uppercase font-bold tracking-widest">
           <ShieldCheck size={12} /> Proteção Ativa
         </div>
         <div className="text-[9px] text-white/20 uppercase font-black italic">v2.0 Astral</div>
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
