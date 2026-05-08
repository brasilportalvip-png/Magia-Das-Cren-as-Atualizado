import { motion } from "motion/react";
import { 
  Dices, 
  Asterisk, 
  Hand, 
  Binary, 
  Gem, 
  Compass, 
  Map as MapIcon, 
  Search, 
  Moon, 
  ShieldCheck, 
  Eye, 
  Menu 
} from "lucide-react";

const SPIRITUAL_TOOLS = [
  { label: "Tarot", icon: <Hand size={24} />, color: "text-amber-400", glow: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.8)]", bg: "group-hover:bg-amber-500", border: "border-amber-500/50" },
  { label: "Búzios", icon: <Dices size={24} />, color: "text-emerald-400", glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.8)]", bg: "group-hover:bg-emerald-500", border: "border-emerald-500/50" },
  { label: "Ifá", icon: <Eye size={24} />, color: "text-cyan-400", glow: "group-hover:shadow-[0_0_30px_rgba(6,182,212,0.8)]", bg: "group-hover:bg-cyan-500", border: "border-cyan-500/50" },
  { label: "Odu", icon: <Compass size={24} />, color: "text-purple-400", glow: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.8)]", bg: "group-hover:bg-purple-500", border: "border-purple-500/50" },
  { label: "Orixás", icon: <ShieldCheck size={24} />, color: "text-rose-400", glow: "group-hover:shadow-[0_0_30px_rgba(244,63,94,0.8)]", bg: "group-hover:bg-rose-500", border: "border-rose-500/50" },
  { label: "Numerologia", icon: <Binary size={24} />, color: "text-blue-400", glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.8)]", bg: "group-hover:bg-blue-500", border: "border-blue-500/50" },
  { label: "Cabala", icon: <Asterisk size={24} />, color: "text-lime-400", glow: "group-hover:shadow-[0_0_30px_rgba(163,230,53,0.8)]", bg: "group-hover:bg-lime-500", border: "border-lime-500/50" },
  { label: "Cabala Numérica", icon: <Binary size={24} />, color: "text-teal-400", glow: "group-hover:shadow-[0_0_30px_rgba(20,184,166,0.8)]", bg: "group-hover:bg-teal-500", border: "border-teal-500/50" },
  { label: "Horóscopo", icon: <Moon size={24} />, color: "text-indigo-400", glow: "group-hover:shadow-[0_0_30px_rgba(99,102,241,0.8)]", bg: "group-hover:bg-indigo-500", border: "border-indigo-500/50" },
  { label: "Mapa Astral", icon: <MapIcon size={24} />, color: "text-pink-400", glow: "group-hover:shadow-[0_0_30px_rgba(236,72,153,0.8)]", bg: "group-hover:bg-pink-500", border: "border-pink-500/50" },
  { label: "Horário Planetário", icon: <Moon size={24} />, color: "text-sky-400", glow: "group-hover:shadow-[0_0_30px_rgba(14,165,233,0.8)]", bg: "group-hover:bg-sky-500", border: "border-sky-500/50" },
  { label: "Anjo Guardião", icon: <Search size={24} />, color: "text-yellow-400", glow: "group-hover:shadow-[0_0_30px_rgba(234,179,8,0.8)]", bg: "group-hover:bg-yellow-500", border: "border-yellow-500/50" },
  { label: "Daimon Guardião", icon: <ShieldCheck size={24} />, color: "text-orange-400", glow: "group-hover:shadow-[0_0_30px_rgba(249,115,22,0.8)]", bg: "group-hover:bg-orange-500", border: "border-orange-500/50" },
];

interface SpiritualButtonsProps {
  onSelect: (tab: string) => void;
}

export default function SpiritualButtons({ onSelect }: SpiritualButtonsProps) {
    return (
        <div className="flex justify-center items-center gap-2 lg:gap-4 w-full h-full">
            <div className="hidden sm:block h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <div className="flex gap-6 lg:gap-8 overflow-x-auto scrollbar-none px-6 lg:px-12 py-4 w-full sm:w-auto items-center">
                {SPIRITUAL_TOOLS.map((tool) => (
                    <motion.button
                        key={tool.label}
                        onClick={() => onSelect(tool.label)}
                        whileHover={{ scale: 1.3, y: -15 }}
                        whileTap={{ scale: 0.85 }}
                        className="flex flex-col items-center group min-w-[85px] lg:min-w-[120px] relative"
                    >
                        {/* Aura Glow */}
                        <div className={`absolute inset-0 blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 rounded-full ${tool.color} bg-current`} />
                        
                        <div className={`w-14 h-14 lg:w-20 lg:h-20 rounded-2xl bg-black/90 border-2 ${tool.border} flex items-center justify-center text-2xl lg:text-3xl transition-all duration-300 ${tool.glow} group-hover:border-white ${tool.bg} ${tool.color} group-hover:text-black shadow-2xl relative overflow-hidden ring-4 ring-transparent group-hover:ring-white/10`}>
                            {/* Inner Shine */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="relative z-10 drop-shadow-[0_0_12px_currentColor] group-hover:brightness-125">
                                {tool.icon}
                            </div>
                            
                            {/* Animated Shine Sweep */}
                            <div className="absolute -inset-full h-full w-1/2 z-20 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-60 group-hover:animate-shine pointer-events-none" />
                        </div>
                        
                        <span className={`text-[10px] lg:text-[12px] mt-4 lg:mt-5 text-white/70 group-hover:text-white uppercase tracking-[0.2em] lg:tracking-[0.3em] transition-all duration-300 font-black text-center leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] italic`}>
                            {tool.label}
                        </span>
                    </motion.button>
                ))}
            </div>
            <div className="hidden sm:block h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>
    );
}
