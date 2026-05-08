import React from 'react';
import { motion } from 'motion/react';
import { Lock, Sparkles, Zap, ArrowRight, X } from 'lucide-react';

interface FreeLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseCredits: () => void;
}

export default function FreeLimitModal({ isOpen, onClose, onPurchaseCredits }: FreeLimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-[#0a0a0c] border border-amber-500/30 rounded-[40px] p-10 text-center relative overflow-hidden shadow-[0_0_100px_rgba(245,158,11,0.2)]"
      >
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        
        <div className="mb-8 relative inline-block">
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center relative z-10 mx-auto border border-amber-500/20">
            <Lock className="text-amber-500 animate-pulse" size={40} />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-amber-500 blur-3xl opacity-20"
          />
        </div>

        <h2 className="text-3xl font-serif italic text-white mb-6">Seu ciclo espiritual gratuito terminou</h2>
        
        <p className="text-white/60 leading-relaxed mb-10 text-sm">
          "As energias básicas foram exauridas. Para mergulhar mais profundamente nos mistérios que cercam seu destino, é necessário equilibrar a troca energética."
        </p>

        <div className="space-y-4">
          <button
            onClick={onPurchaseCredits}
            className="w-full py-5 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:brightness-110 active:scale-95 transition-all text-[12px]"
          >
            <Zap className="fill-black" size={18} />
            Desbloquear Plano PRO
            <ArrowRight size={18} />
          </button>
          
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-black"
          >
            Ainda não estou pronto
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 border-t border-white/5 pt-8 text-white/20">
          <Sparkles size={14} />
          <span className="text-[10px] uppercase tracking-[0.3em] font-black italic">Sabedoria Ancestral</span>
          <Sparkles size={14} />
        </div>
      </motion.div>
    </div>
  );
}
