import { useState, useEffect } from "react";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, ChevronLeft, Zap, Crown, LogOut, User, MessageCircle } from "lucide-react";

import ChatSection from "./components/ChatSection";
import CharacterAvatar from "./components/CharacterAvatar";
import UserPanel from "./components/UserPanel";
import SpiritualButtons from "./components/SpiritualButtons";
import AuthModal from "./components/AuthModal";
import CreditPackagesModal from "./components/CreditPackagesModal";
import FreeLimitModal from "./components/FreeLimitModal";
import LegalPagesModal, { LegalPageType } from "./components/LegalPages";
import { SpiritualUser } from "./types/spiritual";

export default function App() {
  const [user, setUser] = useState<SpiritualUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [showFreeLimit, setShowFreeLimit] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: LegalPageType }>({
    isOpen: false,
    type: "privacy",
  });
  const [paymentNotification, setPaymentNotification] = useState<{
    type: "loading" | "success" | "pending" | "error";
    message: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [currentAdvice, setCurrentAdvice] = useState<string>(
    "O universo ainda possui mensagens ocultas para você. Busque o saber através das ferramentas sagradas."
  );

  const [uid, setUid] = useState<string | null>(null);









  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    const paymentParam = urlParams.get("payment");
    const refParam = urlParams.get("ref");
    const paymentIdParam =
      urlParams.get("payment_id") || urlParams.get("collection_id");

    if (paymentParam) {
      window.history.replaceState({}, document.title, window.location.pathname);

      if (paymentParam === "failure") {
        setPaymentNotification({
          type: "error",
          message:
            "O pagamento não foi concluído ou foi cancelado no Mercado Pago.",
        });
        setTimeout(() => setPaymentNotification(null), 8000);
      } else {
        setPaymentNotification({
          type: "loading",
          message: "Confirmando status do seu pagamento com o Mercado Pago...",
        });

        // P1-57: Validate status with authenticated backend
        (async () => {
          try {
            const token = await auth.currentUser?.getIdToken();
            const query = new URLSearchParams();
            if (refParam) query.set("ref", refParam);
            if (paymentIdParam) query.set("paymentId", paymentIdParam);

            const res = await fetch(`/api/payments/status?${query.toString()}`, {
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });

            const data = await res.json();
            if (res.ok && data.approved) {
              setPaymentNotification({
                type: "success",
                message:
                  "Pagamento aprovado com sucesso! Seus créditos espirituais foram liberados.",
              });
            } else if (res.ok && data.status === "pending") {
              setPaymentNotification({
                type: "pending",
                message:
                  "Pagamento em análise pelo Mercado Pago. Seus créditos serão liberados em instantes.",
              });
            } else {
              setPaymentNotification({
                type: "pending",
                message:
                  "Recebemos o retorno do Mercado Pago. O saldo será atualizado assim que compensado.",
              });
            }
          } catch {
            setPaymentNotification({
              type: "pending",
              message: "Processando liberação de créditos...",
            });
          }
          setTimeout(() => setPaymentNotification(null), 10000);
        })();
      }
    }

    const path = window.location.pathname.toLowerCase();
    if (path.includes("privacidade")) {
      setLegalModal({ isOpen: true, type: "privacy" });
    } else if (path.includes("termos")) {
      setLegalModal({ isOpen: true, type: "terms" });
    } else if (path.includes("cookies")) {
      setLegalModal({ isOpen: true, type: "cookies" });
    } else if (path.includes("contato")) {
      setLegalModal({ isOpen: true, type: "contact" });
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUid(authUser?.uid || null);

      if (!authUser) {
        setUser(null);
        setLoading(false);
        setShowAuth(true);
      }
    });

    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 15000);

    return () => {
      unsubscribeAuth();
      clearTimeout(loadingTimeout);
    };
  }, []);

  useEffect(() => {
    if (!uid) return;

    const userRef = doc(db, "users", uid);

    const unsubDoc = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data() as SpiritualUser;

          setUser(userData);

          if (!userData.birthDate || !userData.displayName) {
            setShowAuth(true);
          }
        } else {
          setUser(null);
          setShowAuth(true);
        }

        setLoading(false);
      },
      (error) => {
        setLoading(false);

        if (auth.currentUser) {
          handleFirestoreError(error, OperationType.GET, `users/${uid}`);
        }
      }
    );

    return () => unsubDoc();
  }, [uid]);

  const handleUseCredit = async (amount: number = 1) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    if (!user.birthDate || !user.displayName) {
      setShowAuth(true);
      throw new Error("Dados de nascimento essenciais ausentes");
    }

    if ((user.credits || 0) < amount) {
      setShowPackages(true);
      throw new Error("Créditos insuficientes");
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
        <span className="text-[10px] text-amber-500/50 uppercase tracking-[0.4em] font-black animate-pulse">
          Sintonizando Frequências
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen w-full bg-transparent text-white relative overflow-x-hidden lg:overflow-hidden flex flex-col font-sans select-none border-0 overflow-y-auto">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
  <img
    src="/image/Magia Das Crenças Fundo.png"
    alt=""
    className="absolute inset-0 w-full h-full object-cover"
  />
</div>
      <header className="relative z-40 px-4 py-4 lg:px-8 lg:py-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/5 backdrop-blur-xl bg-black/40 sticky top-0 shrink-0">
        <div className="flex items-center gap-3 lg:gap-6 min-h-[40px] lg:min-h-[64px] w-full sm:w-auto">
          {activeTab !== "home" && (
            <button
              onClick={() => setActiveTab("home")}
              className="p-3 lg:px-8 lg:py-4 rounded-xl lg:rounded-full border-2 border-amber-500 bg-black/60 text-amber-100 hover:bg-amber-500 hover:text-black transition-all flex items-center gap-2 lg:gap-4 backdrop-blur-3xl shadow-[0_0_30px_rgba(245,158,11,0.3)] group transform hover:scale-105"
            >
              <ChevronLeft size={20} strokeWidth={4} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs lg:text-xl font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] font-serif hidden xs:block">
                Início
              </span>
            </button>
          )}

          <div className="flex items-center gap-3 lg:gap-4 flex-1 sm:flex-none">
            <div className="w-8 h-8 lg:w-12 lg:h-12 border-2 border-amber-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] shrink-0">
              <Sparkles className="w-4 h-4 lg:w-6 lg:h-6 text-amber-500 animate-pulse" />
            </div>
            <h1 className="text-lg lg:text-3xl font-serif tracking-[0.1em] lg:tracking-[0.2em] text-amber-50 uppercase gold-glow truncate cursor-default">
              Magia das Crenças
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 lg:gap-8 w-full sm:w-auto justify-between sm:justify-end">
          {user ? (
            <div className="flex items-center gap-4 lg:gap-6 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex flex-col items-end">
                <span className="text-[7px] lg:text-[10px] uppercase tracking-widest text-amber-500 font-bold italic">
                  Energia Vital
                </span>
                <span className="text-xs lg:text-lg font-mono text-amber-200">
                  {user.credits || 0} CR
                </span>
              </div>

              <div className="flex gap-2 lg:gap-4 items-center">
                <button
                  onClick={() => setShowPackages(true)}
                  className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-black px-5 py-2.5 lg:px-8 lg:py-3 rounded-xl lg:rounded-2xl text-[10px] lg:text-sm font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(245,158,11,0.4)] flex items-center gap-2 group border border-white/20 animate-pulse hover:animate-none"
                >
                  <Crown size={14} className="group-hover:rotate-12 transition-transform" />
                  <span className="hidden xs:block">Evoluir Plano</span>
                  <span className="xs:hidden">PLANOS</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-red-400"
                  title="Sair"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="bg-white/5 border border-white/10 px-4 py-2 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center gap-2 lg:gap-3 group whitespace-nowrap"
            >
              <User size={16} className="text-amber-500" />
              Conectar Conta
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 p-4 lg:p-6 min-h-0 overflow-y-auto lg:overflow-hidden">
        {activeTab === "home" ? (
          <>
            <div className="order-2 lg:order-1 lg:col-span-4 xl:col-span-3 h-[500px] lg:h-full min-h-0">
              <ChatSection
                user={user}
                onCreditUse={handleUseCredit}
                onNewAdvice={(advice) => setCurrentAdvice(advice)}
              />
            </div>

            <div className="order-1 lg:order-2 lg:col-span-4 xl:col-span-6 flex items-center justify-center py-4 lg:py-0 min-h-0">
              <CharacterAvatar />
            </div>

            <div className="order-3 lg:col-span-4 xl:col-span-3 h-auto lg:h-full min-h-0 mb-20 lg:mb-0">
              <UserPanel
                user={user}
                onSelectConsultation={setActiveTab}
                onEditProfile={() => setShowAuth(true)}
                advice={user?.lastAdvice || currentAdvice}
              />
            </div>
          </>
        ) : (
          <div className="col-span-full h-full flex flex-col lg:flex-row gap-6 overflow-y-auto lg:overflow-hidden mb-20 lg:mb-0">
            <div className="flex-1 min-h-[500px] lg:h-full min-w-0 bg-black/40 rounded-[32px] border border-white/5">
              <ChatSection
                user={user}
                onCreditUse={(amt) => handleUseCredit(amt)}
                initialMessage={`Cigano Pablo, por favor, realize uma leitura de **${activeTab}** para mim agora.`}
                onNewAdvice={(advice) => setCurrentAdvice(advice)}
                key={activeTab}
              />
            </div>

            <div className="w-full lg:w-[350px] shrink-0 bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 p-6 lg:p-8 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden h-fit lg:h-full">
              <div
  className="absolute inset-0 opacity-10 pointer-events-none bg-cover bg-center"
  style={{ backgroundImage: "url('/image/Magia Das Crenças Fundo.png')" }}
></div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 lg:w-24 lg:h-24 rounded-full border border-amber-500/20 flex items-center justify-center text-amber-500 bg-amber-500/5 shadow-[0_0_40px_rgba(245,158,11,0.1)]"
              >
                <Sparkles size={32} />
              </motion.div>

              <h2 className="text-2xl lg:text-3xl font-serif italic text-white uppercase tracking-widest">
                {activeTab}
              </h2>

              <p className="text-white/50 text-xs lg:text-sm leading-relaxed italic font-serif max-w-[280px]">
                "O véu entre os mundos se torna tênue. Concentre-se em sua pergunta enquanto os símbolos sagrados se revelam."
              </p>

              <div className="flex flex-col gap-3 w-full pt-6 max-w-[240px]">
                <div className="px-4 py-2 bg-black/20 rounded-xl text-[9px] uppercase tracking-widest text-amber-500/60 border border-white/5">
                  Conexão Estabelecida
                </div>
                <div className="px-4 py-2 bg-black/20 rounded-xl text-[9px] uppercase tracking-widest text-amber-500/60 border border-white/5">
                  Sintonizando Vibrações
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 lg:relative z-40 w-full lg:px-8 lg:py-3 border-t border-white/5 bg-black/70 backdrop-blur-xl shrink-0 h-36 lg:h-auto overflow-hidden pb-8 lg:pb-3 flex flex-col items-center gap-2">
        <SpiritualButtons onSelect={setActiveTab} />
        <div className="hidden lg:flex flex-wrap items-center justify-center gap-4 text-[10px] text-white/40 pt-1">
          <span>© 2026 Magia das Crenças</span>
          <span>•</span>
          <button onClick={() => setLegalModal({ isOpen: true, type: "privacy" })} className="hover:text-amber-400 underline decoration-white/20 transition-colors">Privacidade (LGPD)</button>
          <span>•</span>
          <button onClick={() => setLegalModal({ isOpen: true, type: "terms" })} className="hover:text-amber-400 underline decoration-white/20 transition-colors">Termos de Uso</button>
          <span>•</span>
          <button onClick={() => setLegalModal({ isOpen: true, type: "cookies" })} className="hover:text-amber-400 underline decoration-white/20 transition-colors">Cookies</button>
          <span>•</span>
          <button onClick={() => setLegalModal({ isOpen: true, type: "contact" })} className="hover:text-amber-400 underline decoration-white/20 transition-colors">Contato</button>
          {user && (
            <>
              <span>•</span>
              <button onClick={() => setLegalModal({ isOpen: true, type: "deletion" })} className="text-rose-400/70 hover:text-rose-400 underline decoration-rose-500/20 transition-colors">Excluir Conta</button>
            </>
          )}
        </div>
      </footer>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />

      <CreditPackagesModal
        isOpen={showPackages}
        onClose={() => setShowPackages(false)}
        userId={user?.uid}
      />

      <FreeLimitModal
        isOpen={showFreeLimit}
        onClose={() => setShowFreeLimit(false)}
        onPurchaseCredits={() => {
          setShowFreeLimit(false);
          setShowPackages(true);
        }}
      />

      <LegalPagesModal
        isOpen={legalModal.isOpen}
        type={legalModal.type}
        onClose={() => setLegalModal((prev) => ({ ...prev, isOpen: false }))}
        onAccountDeleted={() => {
          setUser(null);
          setShowAuth(true);
        }}
      />








      <button
  type="button"
  onClick={() => setShowSupportModal(true)}
  className="fixed bottom-36 right-6 z-[60] bg-emerald-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-110 transition-all group lg:bottom-12"
  title="Suporte Pablo"
>
  <MessageCircle size={24} fill="currentColor" className="text-white" />
  <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-emerald-500/30">
    Suporte Pablo
  </span>
</button>







{showSupportModal && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
  >
    <div className="w-full max-w-sm rounded-3xl border border-amber-500/30 bg-zinc-950 p-5 shadow-[0_0_35px_rgba(245,158,11,0.25)]">
      <h2 className="mb-5 text-center text-lg font-black text-amber-400 tracking-widest">
        SUPORTE PABLO
      </h2>

      <button
        type="button"
        onClick={() =>
          window.open(
            "https://chat.whatsapp.com/JqXdWPrCVxz1NC9dXyMdso?s=cl&p=a&ilr=2&amv=1",
            "_blank",
            "noopener,noreferrer"
          )
        }
        className="mb-4 w-full rounded-2xl bg-green-600 py-4 font-bold text-white"
      >
        🟢 Entrar no WhatsApp
      </button>

      <button
        type="button"
        onClick={() =>
          window.open(
            "https://t.me/+EOUhr0Xa2_00NDQ5",
            "_blank",
            "noopener,noreferrer"
          )
        }
        className="mb-4 w-full rounded-2xl bg-sky-600 py-4 font-bold text-white"
      >
        🔵 Entrar no Telegram
      </button>

      <button
        type="button"
        onClick={() => setShowSupportModal(false)}
        className="w-full rounded-2xl bg-red-700 py-3 font-bold text-white"
      >
        Fechar
      </button>
    </div>
  </motion.div>
)}

      <AnimatePresence>
        {paymentNotification && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={`fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border-2 backdrop-blur-xl max-w-md text-xs font-bold ${
              paymentNotification.type === "success"
                ? "bg-emerald-500 text-black border-emerald-400/50"
                : paymentNotification.type === "error"
                ? "bg-rose-900 text-white border-rose-500/50"
                : "bg-amber-500 text-black border-amber-400/50"
            }`}
          >
            <div className="w-10 h-10 bg-black/20 rounded-2xl flex items-center justify-center shrink-0">
              <Zap size={20} fill="currentColor" />
            </div>

            <div className="flex-1">
              <p>{paymentNotification.message}</p>
            </div>

            <button
              onClick={() => setPaymentNotification(null)}
              className="p-1 hover:bg-black/10 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .spinner-slow { animation: spin 20s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}