import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Zap, Shield, Crown, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SPIRITUAL_PACKAGES, CreditPackage } from '../types/spiritual';

interface CreditPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export default function CreditPackagesModal({ isOpen, onClose, userId }: CreditPackagesModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async (pkg: CreditPackage) => {
    if (!userId && pkg.id !== 'free') return;
    
    if (pkg.checkoutUrl) {
      setLoading(pkg.id);
      // Redirect directly to Mercado Pago
      window.open(pkg.checkoutUrl, '_blank');
      setLoading(null);
      return;
    }

    if (pkg.id === 'free') {
      onClose();
      return;
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-5xl bg-[#050505] border border-white/5 rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(245,158,11,0.1)] flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
          <div>
            <h2 className="text-3xl font-serif italic text-white flex items-center gap-3">
              <Zap className="text-amber-500 fill-amber-500" size={24} />
              Eleve sua Energia Vital
            </h2>
            <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-black">
              Escolha seu portal de abundância espiritual
            </p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-visible">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SPIRITUAL_PACKAGES.map((pkg) => (
              <motion.div
                key={pkg.id}
                whileHover={{ y: -10 }}
                className={`relative group p-8 rounded-[32px] border-2 border-white/5 hover:border-white/20 transition-all flex flex-col h-full bg-gradient-to-b from-white/5 to-transparent ${pkg.glow}`}
              >
                {pkg.id === 'gold' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-amber-500/20">
                    <Crown size={12} fill="currentColor" /> Recomendado
                  </div>
                )}

                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pkg.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl`}>
                   {pkg.id === 'free' && <Zap size={32} fill="currentColor" />}
                   {pkg.id === 'silver' && <Crown size={32} fill="currentColor" />}
                   {pkg.id === 'gold' && <Sparkles size={32} fill="currentColor" />}
                </div>

                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-1 italic">{pkg.name}</h3>
                <p className="text-white/40 text-xs mb-6 font-medium leading-relaxed">{pkg.description}</p>

                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-4xl font-serif italic text-white">R$ {pkg.price.toFixed(2).replace('.', ',')}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Pagamento único</span>
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center gap-2 text-white/70">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-sm font-bold">{pkg.credits} Créditos Espirituais</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    <CheckCircle2 size={16} className="text-white/20" />
                    <span className="text-xs">Consultas Avançadas</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    <CheckCircle2 size={16} className="text-white/20" />
                    <span className="text-xs">Histórico Astral</span>
                  </div>
                  {pkg.id === 'gold' && (
                    <div className="flex items-center gap-2 text-amber-400">
                      <Sparkles size={16} className="animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider">Acesso Prioritário Pablo</span>
                    </div>
                  )}
                </div>

                <button
                  disabled={loading !== null}
                  onClick={() => handlePurchase(pkg)}
                  className={`w-full py-5 rounded-2xl text-black font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 relative overflow-hidden group/btn ${
                    pkg.id === 'gold' ? 'bg-amber-500 scale-105 shadow-xl shadow-amber-500/20' : 
                    pkg.id === 'free' ? 'bg-emerald-500' : 'bg-white'
                  }`}
                >
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 skew-x-12" />
                  {loading === pkg.id ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      {pkg.id === 'free' ? 'Continuar Gratuitamente' : 'Ativar Agora'}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-white/5 border border-white/10 rounded-3xl text-center space-y-4">
             <p className="text-white/60 text-xs font-medium italic">
               "Ao investir em sua energia vital, você abre os canais da abundância e clareza para seu destino."
             </p>
             <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black">
               Pagamento seguro via Mercado Pago • Processamento instantâneo
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
