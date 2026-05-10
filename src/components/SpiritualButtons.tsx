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
  { label: "Tarot", icon: <Hand size={28} />, color: "text-amber-400", glow: "group-hover:shadow-[0_0_45px_rgba(245,158,11,1)]", bg: "group-hover:bg-amber-500", border: "border-amber-500" },
  { label: "Búzios", icon: <Dices size={28} />, color: "text-emerald-400", glow: "group-hover:shadow-[0_0_45px_rgba(16,185,129,1)]", bg: "group-hover:bg-emerald-500", border: "border-emerald-500" },
  { label: "Ifá", icon: <Eye size={28} />, color: "text-cyan-400", glow: "group-hover:shadow-[0_0_45px_rgba(6,182,212,1)]", bg: "group-hover:bg-cyan-500", border: "border-cyan-500" },
  { label: "Odu", icon: <Compass size={28} />, color: "text-purple-400", glow: "group-hover:shadow-[0_0_45px_rgba(168,85,247,1)]", bg: "group-hover:bg-purple-500", border: "border-purple-500" },
  { label: "Orixás", icon: <ShieldCheck size={28} />, color: "text-rose-400", glow: "group-hover:shadow-[0_0_45px_rgba(244,63,94,1)]", bg: "group-hover:bg-rose-500", border: "border-rose-500" },
  { label: "Numerologia", icon: <Binary size={28} />, color: "text-blue-400", glow: "group-hover:shadow-[0_0_45px_rgba(59,130,246,1)]", bg: "group-hover:bg-blue-500", border: "border-blue-500" },
  { label: "Mapa Astral", icon: <MapIcon size={28} />, color: "text-pink-400", glow: "group-hover:shadow-[0_0_45px_rgba(236,72,153,1)]", bg: "group-hover:bg-pink-500", border: "border-pink-500" },
  { label: "Anjo Guardião", icon: <Search size={28} />, color: "text-yellow-400", glow: "group-hover:shadow-[0_0_45px_rgba(234,179,8,1)]", bg: "group-hover:bg-yellow-500", border: "border-yellow-500" },
];

interface SpiritualButtonsProps {
  onSelect: (tab: string) => void;
}

export default function SpiritualButtons({ onSelect }: SpiritualButtonsProps) {
    return (
        <div className="flex justify-start lg:justify-center items-center gap-2 lg:gap-4 w-full h-full lg:h-auto overflow-x-auto scrollbar-none pb-4 lg:pb-0">
            <div className="hidden 2xl:block h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <div className="flex gap-4 sm:gap-6 lg:gap-8 py-2 sm:py-6 items-center px-4 sm:px-12 lg:px-20 min-w-max">
                {SPIRITUAL_TOOLS.map((tool) => (
                    <motion.button
                        key={tool.label}
                        onClick={() => onSelect(tool.label)}
                        whileHover={{ scale: 1.1, y: -10 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex flex-col items-center group min-w-[70px] sm:min-w-[85px] lg:min-w-[110px] relative shrink-0"
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
