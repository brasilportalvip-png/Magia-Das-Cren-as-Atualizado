import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Mail, Lock, LogIn, UserPlus, 
  ArrowRight, Sparkles, AlertCircle, Globe 
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          displayName: result.user.displayName || 'Buscador',
          email: result.user.email,
          photoURL: result.user.photoURL,
          credits: 0,
          plan: 'free',
          freeQueriesUsed: 0,
          spiritualLevel: 1,
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else if (mode === 'register') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          displayName: name || 'Buscador',
          email: email,
          credits: 0,
          plan: 'free',
          freeQueriesUsed: 0,
          spiritualLevel: 1,
          createdAt: new Date().toISOString()
        });
        onClose();
      } else {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('O sopro do destino enviou um link de recuperação para seu e-mail.');
      }
    } catch (err: any) {
      setError(err.message === 'Firebase: Error (auth/user-not-found).' ? 'Conta não encontrada.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0a0a0c] border border-amber-500/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)]"
      >
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-serif italic text-amber-100 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={20} />
              {mode === 'login' && 'Portal de Acesso'}
              {mode === 'register' && 'Novo Despertar'}
              {mode === 'forgot' && 'Recordar Caminho'}
            </h2>
            <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all text-white font-medium group"
          >
            <Globe className="text-blue-400 group-hover:scale-110 transition-transform" />
            Entrar com Google
          </button>

          <div className="flex items-center gap-4 text-white/20">
            <div className="h-px flex-1 bg-white/10"></div>
            <span className="text-[10px] uppercase tracking-widest font-black">ou e-mail</span>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/70 font-bold ml-1">Nome de Registro</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all font-serif italic"
                    placeholder="Como devemos lhe chamar?"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/70 font-bold ml-1">E-mail Sagrado</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all"
                  placeholder="seu@destino.com"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/70 font-bold ml-1">Chave Espiritual</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs text-center">
                <Sparkles size={14} />
                {successMsg}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-700 text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Conectar Alma' : mode === 'register' ? 'Criar Destino' : 'Enviar Link'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="flex flex-col items-center gap-4 pt-4 border-t border-white/5">
            {mode === 'login' ? (
              <>
                <button onClick={() => setMode('register')} className="text-xs text-white/40 hover:text-amber-500 transition-colors uppercase tracking-widest font-black">
                  Ainda não despertou? <span className="text-amber-400">Criar conta</span>
                </button>
                <button onClick={() => setMode('forgot')} className="text-xs text-white/40 hover:text-white transition-colors italic">
                  Esqueci minha chave espiritual
                </button>
              </>
            ) : (
              <button onClick={() => setMode('login')} className="text-xs text-white/40 hover:text-amber-500 transition-colors uppercase tracking-widest font-black">
                Já possui acesso? <span className="text-amber-400">Entrar</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
