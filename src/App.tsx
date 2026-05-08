import { useState, useEffect } from "react";
import { auth, db } from "./lib/firebase";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, ChevronLeft, UserCircle, Zap, Crown, Loader2, LogOut, User } from "lucide-react";

import ChatSection from "./components/ChatSection";
import CharacterAvatar from "./components/CharacterAvatar";
import UserPanel from "./components/UserPanel";
import SpiritualButtons from "./components/SpiritualButtons";
import AudioControls from "./components/AudioControls";
import AuthModal from "./components/AuthModal";
import CreditPackagesModal from "./components/CreditPackagesModal";
import FreeLimitModal from "./components/FreeLimitModal";
import { SpiritualUser } from "./types/spiritual";
import { getZodiacSign } from "./lib/spiritualUtils";

export default function App() {
  const [user, setUser] = useState<SpiritualUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [showFreeLimit, setShowFreeLimit] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [currentAdvice, setCurrentAdvice] = useState<string>("O universo ainda possui mensagens ocultas para você. Busque o saber através das ferramentas sagradas.");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Listen to user data in Firestore
        const userRef = doc(db, "users", authUser.uid);
        
        const unsubDoc = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setUser(snapshot.data() as SpiritualUser);
          } else {
            // Initialize user if not found (fallback)
            const newUser: SpiritualUser = {
              uid: authUser.uid,
              displayName: authUser.displayName || "Buscador",
              email: authUser.email || "",
              photoURL: authUser.photoURL || undefined,
              credits: 0,
              plan: "free",
              freeQueriesUsed: 0,
              createdAt: new Date().toISOString()
            };
            setDoc(userRef, newUser);
          }
        });
        
        setLoading(false);
        return () => unsubDoc();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleUseCredit = async (amount: number = 1) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    
    // Logic for FREE users
    if (user.plan === 'free') {
      if (user.freeQueriesUsed >= 1) {
        setShowFreeLimit(true);
        throw new Error("Ciclo gratuito atingido");
      }
      await setDoc(userRef, { 
        freeQueriesUsed: (user.freeQueriesUsed || 0) + 1,
        lastFreeQueryAt: new Date().toISOString() 
      }, { merge: true });
    } else {
      // Logic for PRO users
      if (user.credits < amount) {
        setShowPackages(true);
        throw new Error("Créditos insuficientes");
      }
      await setDoc(userRef, { 
        credits: Math.max(0, user.credits - amount) 
      }, { merge: true });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center space-y-4">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-amber-500"
        >
          <Sparkles size={48} />
        </motion.div>
        <span className="text-[10px] text-amber-500/50 uppercase tracking-[0.4em] font-black animate-pulse">Sintonizando Frequências</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[#050505] text-white relative overflow-x-hidden lg:overflow-hidden flex flex-col font-sans select-none border-0">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-900/10 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-900/10 blur-[150px] rounded-full" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_100%)]" />
      </div>

      <header className="relative z-20 px-4 py-4 lg:px-8 lg:py-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/5 backdrop-blur-xl bg-black/40">
         <div className="flex items-center gap-4 lg:gap-6 min-h-[48px] lg:min-h-[64px] w-full sm:w-auto">
            {activeTab !== "home" && (
                <button 
                    onClick={() => setActiveTab("home")}
                    className="px-4 py-2 lg:px-6 lg:py-3 rounded-2xl border-2 border-amber-500 text-amber-100 hover:bg-amber-500 hover:text-black transition-all flex items-center gap-2 lg:gap-3 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] group"
                >
                    <ChevronLeft size={20} strokeWidth={4} />
                    <span className="text-sm lg:text-lg font-black uppercase tracking-[0.2em] italic">Voltar</span>
                </button>
            )}
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="w-8 h-8 lg:w-12 lg:h-12 border-2 border-amber-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                <Sparkles className="w-4 h-4 lg:w-6 lg:h-6 text-amber-500 animate-pulse" />
              </div>
              <h1 className="text-xl lg:text-3xl font-serif tracking-[0.1em] lg:tracking-[0.2em] text-amber-50 uppercase gold-glow truncate cursor-default">Magia das Crenças</h1>
            </div>
         </div>

         <div className="flex items-center gap-4 lg:gap-8 w-full sm:w-auto justify-between sm:justify-end">
            {user ? (
                <div className="flex items-center gap-4 lg:gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] lg:text-[10px] uppercase tracking-widest text-amber-500 font-bold italic">Energia Vital</span>
                        <span className="text-sm lg:text-lg font-mono text-amber-200">
                           {user.plan === 'free' ? `${user.freeQueriesUsed}/1 Free` : `${user.credits} CR`}
                        </span>
                    </div>
                    <div className="flex gap-2 lg:gap-4 items-center">
                       <button 
                          onClick={() => setShowPackages(true)}
                          className="bg-gradient-to-r from-amber-600 to-amber-400 text-black px-3 py-2 lg:px-6 lg:py-2.5 rounded-2xl text-[10px] lg:text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center gap-2 group"
                       >
                          <Crown size={12} className="group-hover:rotate-12 transition-transform" />
                          <span>Adquirir PRO</span>
                       </button>
                       <button 
                          onClick={handleLogout}
                          className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-red-400"
                          title="Sair"
                       >
                          <LogOut size={18} />
                       </button>
                    </div>
                </div>
            ) : (
                <button 
                  onClick={() => setShowAuth(true)}
                  className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center gap-3 group"
                >
                  <User size={16} className="text-amber-500" />
                  Conectar Minha Alma
                </button>
            )}
         </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col lg:grid xl:grid-cols-[1fr_400px_350px] gap-6 p-4 lg:p-6 h-full overflow-hidden">
        {activeTab === "home" ? (
            <>
                <div className="order-2 lg:order-1 h-full min-h-0 xl:col-span-1">
                  <ChatSection 
                    user={user} 
                    onCreditUse={handleUseCredit} 
                    onNewAdvice={setCurrentAdvice}
                  />
                </div>

                <div className="order-1 lg:order-2 flex items-center justify-center py-4 lg:py-0 min-h-0">
                  <CharacterAvatar />
                </div>

                <div className="order-3 h-full min-h-0">
                  <UserPanel 
                    user={user} 
                    onSelectConsultation={setActiveTab} 
                  />
                </div>
            </>
        ) : (
            <div className="col-span-full h-full flex flex-col lg:flex-row gap-6 overflow-hidden">
                <div className="flex-1 h-full min-h-0 bg-black/40 rounded-[32px] border border-white/5">
                    <ChatSection 
                        user={user} 
                        onCreditUse={(amt) => handleUseCredit(amt)} 
                        initialMessage={`Cigano Pablo, por favor, realize uma leitura de **${activeTab}** para mim agora.`}
                        onNewAdvice={setCurrentAdvice}
                        key={activeTab}
                    />
                </div>
                <div className="w-full lg:w-[400px] bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 p-8 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://portalvipbrasil.com.br/wp-content/uploads/2026/05/bg-pattern.png')] bg-repeat"></div>
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 rounded-full border border-amber-500/20 flex items-center justify-center text-amber-500 bg-amber-500/5 shadow-[0_0_40px_rgba(245,158,11,0.1)]"
                    >
                        <Sparkles size={40} />
                    </motion.div>
                    <h2 className="text-3xl font-serif italic text-white uppercase tracking-widest">{activeTab}</h2>
                    <p className="text-white/50 text-sm leading-relaxed italic font-serif">
                      "O véu entre os mundos se torna tênue. Concentre-se em sua pergunta enquanto os símbolos sagrados se revelam."
                    </p>
                    <div className="flex flex-col gap-3 w-full pt-6">
                        <div className="px-4 py-2 bg-black/20 rounded-xl text-[10px] uppercase tracking-widest text-amber-500/60 border border-white/5">Conexão Estabelecida</div>
                        <div className="px-4 py-2 bg-black/20 rounded-xl text-[10px] uppercase tracking-widest text-amber-500/60 border border-white/5">Sintonizando Vibrações</div>
                    </div>
                </div>
            </div>
        )}
      </main>

      <footer className="relative z-20 w-full px-4 py-4 lg:px-8 lg:py-6 border-t border-white/5 bg-black/60 backdrop-blur-xl shrink-0">
        <SpiritualButtons onSelect={setActiveTab} />
      </footer>

      <AudioControls />

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <CreditPackagesModal isOpen={showPackages} onClose={() => setShowPackages(false)} userId={user?.uid} />
      <FreeLimitModal isOpen={showFreeLimit} onClose={() => setShowFreeLimit(false)} onPurchaseCredits={() => { setShowFreeLimit(false); setShowPackages(true); }} />

      <style>{`
        .spinner-slow { animation: spin 20s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
