import { useState, useEffect } from "react";
import { db } from "./lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, ArrowLeft, ChevronLeft, UserCircle, Zap, Crown, Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

import ChatSection from "./components/ChatSection";
import CharacterAvatar from "./components/CharacterAvatar";
import UserPanel from "./components/UserPanel";
import SpiritualButtons from "./components/SpiritualButtons";
import AudioControls from "./components/AudioControls";
import { SpiritualUser } from "./types/spiritual";
import { getZodiacSign } from "./lib/spiritualUtils";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function App() {
  const [user, setUser] = useState<SpiritualUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [formData, setFormData] = useState({ displayName: '', birthDate: '', birthTime: '' });
  const [currentAdvice, setCurrentAdvice] = useState<string>("O universo ainda possui mensagens ocultas para você. Busque o saber através das ferramentas sagradas.");

  useEffect(() => {
    // Check for payment success
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    // Load guest profile from localStorage
    const savedUser = localStorage.getItem('spiritual_guest_profile');
    let currentUser: SpiritualUser | null = null;
    
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      
      // Temporary: Grant credits on return from success
      if (paymentStatus === 'success' && sessionId && currentUser) {
        currentUser.credits += 50;
        localStorage.setItem('spiritual_guest_profile', JSON.stringify(currentUser));
        window.history.replaceState({}, document.title, "/");
        alert("Graças ao Astral! Sua energia vital foi restaurada com 50 novos créditos.");
      }
      
      setUser(currentUser);
    } else {
      setShowOnboarding(true);
    }
    setLoading(false);
  }, []);

  const handleCheckout = async () => {
    if (!user) return;
    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar sessão de checkout");
      }

      const session = await response.json();
      
      if (session.url) {
        window.location.href = session.url;
      } else if (session.id) {
        const stripe = await stripePromise;
        if (stripe) {
          const { error } = await (stripe as any).redirectToCheckout({ sessionId: session.id });
          if (error) throw error;
        }
      } else {
        throw new Error("Sessão do Stripe inválida");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(error.message || "Houve uma oscilação na rede astral. Tente novamente em instantes.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    const sign = getZodiacSign(formData.birthDate);
    const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
    
    const userData: SpiritualUser = {
      uid: guestId,
      displayName: formData.displayName,
      email: 'guest@magia.com',
      birthDate: formData.birthDate,
      birthTime: formData.birthTime,
      sign,
      credits: 10, // Default for guests
      lastFreeAccess: new Date().toISOString()
    };

    // Save locally
    localStorage.setItem('spiritual_guest_profile', JSON.stringify(userData));
    setUser(userData);
    setShowOnboarding(false);

    // Optional: Sync to Firebase as a guest doc if needed
    try {
      await setDoc(doc(db, 'users', guestId), { ...userData, role: 'guest' });
    } catch (e) {
      console.warn("Firebase sync failed, continuing locally", e);
    }
  };

  const handleUseCredit = () => {
    if (!user) return;
    const updated = { ...user, credits: Math.max(0, user.credits - 1) };
    setUser(updated);
    localStorage.setItem('spiritual_guest_profile', JSON.stringify(updated));
  };

  const resetProfile = () => {
    localStorage.removeItem('spiritual_guest_profile');
    setUser(null);
    setShowOnboarding(true);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-premium-black flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-gold"
        >
          <Sparkles size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen w-full bg-premium-black text-white relative overflow-x-hidden lg:overflow-hidden flex flex-col font-sans lg:border-8 border-border-frame select-none">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-mystic-purple/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-900/10 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_100%)]" />
      </div>

      {/* Header / Nav */}
      <header className="relative z-20 px-4 py-4 lg:px-8 lg:py-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/5 backdrop-blur-sm bg-black/20">
         <div className="flex items-center gap-4 lg:gap-6 min-h-[48px] lg:min-h-[64px] w-full sm:w-auto">
            {activeTab !== "home" && (
                <button 
                    onClick={() => setActiveTab("home")}
                    className="px-4 py-2 lg:px-6 lg:py-3 rounded-2xl border-2 lg:border-4 border-amber-500 text-amber-100 hover:bg-amber-500 hover:text-black transition-all flex items-center gap-2 lg:gap-3 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] group overflow-hidden relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    <ChevronLeft size={20} strokeWidth={4} />
                    <span className="text-sm lg:text-lg font-black uppercase tracking-[0.2em] italic">Início</span>
                </button>
            )}
            <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
              <div className="w-8 h-8 lg:w-12 lg:h-12 flex-shrink-0 border-2 border-gold rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                <div className="w-2 h-2 lg:w-3 lg:h-3 bg-gold rounded-full shadow-[0_0_15px_#f59e0b] animate-pulse"></div>
              </div>
              <h1 className="text-xl lg:text-3xl font-serif tracking-[0.1em] lg:tracking-[0.2em] text-amber-50 uppercase gold-glow truncate">Magia das Crenças</h1>
            </div>
         </div>

         <div className="flex items-center gap-4 lg:gap-8 w-full sm:w-auto justify-between sm:justify-end">
            {user && (
                <div className="flex items-center gap-4 lg:gap-8">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] lg:text-[10px] uppercase tracking-widest text-amber-500/70 font-semibold italic">Energia Vital</span>
                        <span className="text-sm lg:text-lg font-mono text-amber-200">{user.credits} / 10</span>
                    </div>
                    <div className="flex gap-2 lg:gap-4 items-center">
                       <button 
                          disabled={checkoutLoading}
                          className="bg-gradient-to-r from-amber-600 to-amber-400 text-black px-3 py-1.5 lg:px-5 lg:py-2 rounded-full text-[10px] lg:text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2 group disabled:opacity-50"
                          onClick={handleCheckout}
                       >
                          {checkoutLoading ? <Loader2 size={12} className="animate-spin" /> : <Crown size={12} className="group-hover:rotate-12 transition-transform" />}
                          <span className="hidden xs:inline">Plano Pro</span>
                       </button>
                       <button 
                          onClick={resetProfile}
                          className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors text-amber-500/50"
                          title="Trocar Perfil"
                       >
                          <UserCircle size={16} />
                       </button>
                    </div>
                </div>
            )}
         </div>
      </header>

      {/* Main Layout */}
      <main className="relative z-10 flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_minmax(0,350px)] xl:grid-cols-[650px_1fr_300px] gap-6 p-4 lg:p-6 h-full overflow-y-auto lg:overflow-hidden bg-black/10">
        {activeTab === "home" ? (
            <>
                {/* Left: Chat - Main focus */}
                <div className="order-2 lg:order-1 h-[600px] lg:h-full min-h-0">
                  <ChatSection 
                    user={user} 
                    onCreditUse={handleUseCredit} 
                    onNewAdvice={(advice) => setCurrentAdvice(advice)}
                  />
                </div>

                {/* Center: Stage - Desktop only or top on mobile */}
                <div className="order-1 lg:order-2 flex items-center justify-center py-8 lg:py-0 min-h-0">
                  <CharacterAvatar />
                </div>

                {/* Right: User Panel - Bottom on mobile */}
                <div className="order-3 h-auto lg:h-full min-h-0">
                  <UserPanel user={user} advice={currentAdvice} onSelectConsultation={setActiveTab} />
                </div>
            </>
        ) : (
            <div className="col-span-full h-full flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
                <div className="w-full lg:w-[650px] xl:w-[850px] h-[600px] lg:h-full min-h-0 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <ChatSection 
                        user={user} 
                        onCreditUse={handleUseCredit} 
                        initialMessage={`Cigano Pablo, por favor, realize uma leitura de **${activeTab}** para mim agora.`}
                        onNewAdvice={(advice) => setCurrentAdvice(advice)}
                        key={activeTab} // Force re-mount for new reading context
                    />
                </div>
                <div className="flex-1 glass-panel rounded-3xl p-6 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden border-2 border-gold/20 min-h-[300px]">
                     <div className="absolute inset-0 opacity-5 pointer-events-none">
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Tetragrammaton_Pentagram.svg" 
                          className="w-full h-full object-contain invert"
                          alt=""
                        />
                     </div>
                    <div className="text-center space-y-4 lg:space-y-8 relative z-10">
                        <motion.div 
                          animate={{ rotateY: 360 }}
                          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                          className="w-16 h-16 lg:w-24 lg:h-24 rounded-full border-2 border-gold mx-auto flex items-center justify-center text-gold bg-gold/10 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                        >
                            <Sparkles className="w-8 h-8 lg:w-12 lg:h-12" />
                        </motion.div>
                        <h2 className="text-2xl lg:text-4xl font-serif italic text-gold gold-glow uppercase tracking-widest">{activeTab}</h2>
                        <p className="text-amber-100/60 max-w-xs lg:max-w-md text-xs lg:text-lg italic leading-relaxed font-serif">
                          "As energias se concentram. Pablo está desvendando o véu para você agora."
                        </p>
                        <div className="flex flex-col gap-2 items-center">
                             <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] lg:text-[10px] uppercase tracking-widest text-gold/60">Conectando ao Astral...</div>
                             <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] lg:text-[10px] uppercase tracking-widest text-gold/60 text-center">Sincronizando Destino...</div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>

      {/* Quick Oracles Footer */}
      <footer className="relative z-20 w-full px-4 py-4 lg:px-8 lg:py-6 border-t border-white/5 bg-black/40 backdrop-blur-md">
        <SpiritualButtons onSelect={setActiveTab} />
      </footer>

      {/* Audio Layer */}
      <AudioControls />

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="max-w-md w-full glass-panel p-8 rounded-3xl border border-gold/30 shadow-[0_0_100px_rgba(212,175,55,0.1)]"
            >
               <div className="text-center mb-8">
                  <Sparkles className="text-gold mx-auto mb-4" size={32} />
                  <h2 className="text-2xl font-serif text-gold italic">Bem-vindo à sua Jornada</h2>
                  <p className="text-sm text-white/50 mt-2">Para calibrar suas energias, Pablo precisa de algumas informações sagradas.</p>
               </div>

               <div className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-xs text-gold/60 uppercase tracking-widest px-1">Nome Completo</label>
                     <input 
                        value={formData.displayName}
                        onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold/40 transition-all" 
                        placeholder="Como você é conhecido na Terra?"
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-gold/60 uppercase tracking-widest px-1">Nascimento</label>
                        <input 
                           type="date"
                           value={formData.birthDate}
                           onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold/40 transition-all dark-calendar-inverse" 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gold/60 uppercase tracking-widest px-1">Hora (Opcional)</label>
                        <input 
                           type="time"
                           value={formData.birthTime}
                           onChange={(e) => setFormData({...formData, birthTime: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold/40 transition-all dark-calendar-inverse" 
                        />
                    </div>
                  </div>
               </div>

               <button 
                  onClick={handleCompleteOnboarding}
                  disabled={!formData.displayName || !formData.birthDate}
                  className="w-full py-4 bg-gold text-black font-bold rounded-2xl mt-8 hover:bg-white transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] disabled:opacity-50"
               >
                  DESPERTAR MINHA MAGIA
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .spinner-slow { animation: spin 20s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .dark-calendar-inverse::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}</style>
    </div>
  );
}
