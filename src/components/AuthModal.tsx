import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Mail, Lock, UserPlus,
  ArrowRight, Sparkles, AlertCircle,
  Calendar, Clock, User, Eye, EyeOff
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  getZodiacSign,
  calculateLifePath,
  calculateRegentOdu,
  getSpiritualElement,
  calculateNameNumber,
  getGuardianAngel,
  getPlanetaryHour
} from '../lib/spiritualUtils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SecurityCheckResult {
  success: boolean;
  initialCredits: number;
  promotionalCreditsBlocked: boolean;
  fraudReasons: string[];
  ip?: string;
  error?: string;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'complete_profile'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [tempUid, setTempUid] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (isOpen && auth.currentUser) {
      setMode('complete_profile');

      const loadUser = async () => {
        const docRef = doc(db, 'users', auth.currentUser!.uid);
        const snp = await getDoc(docRef);

        if (snp.exists()) {
          const data = snp.data();
          setName(data.displayName || '');
          setBirthDate(data.birthDate || '');
          setBirthTime(data.birthTime || '');
        }
      };

      loadUser();
    }
  }, [isOpen]);

  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const getOrCreateDeviceId = () => {
    let deviceId = localStorage.getItem('spirit_device_id');

    if (!deviceId) {
      deviceId = generateUUID();
      localStorage.setItem('spirit_device_id', deviceId);
    }

    return deviceId;
  };

  const runSecurityCheck = async (params: {
    uid: string;
    email: string;
    deviceId: string;
  }): Promise<SecurityCheckResult> => {
    const response = await fetch('/api/security/register-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uid: params.uid,
        email: params.email,
        deviceId: params.deviceId,
        browser: navigator.userAgent,
        sessionSign: `${navigator.language}-${navigator.platform}-${screen.width}x${screen.height}`
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Falha na verificação de segurança.');
    }

    return {
  success: true,
  initialCredits: Number(data.initialCredits || 0),
  promotionalCreditsBlocked: Boolean(data.promotionalCreditsBlocked),
  fraudReasons: Array.isArray(data.fraudReasons) ? data.fraudReasons : [],
  ip: data.ip || ''
};
  };

  const checkProfileCompleteness = async (uid: string, defaultData: any) => {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      setTempUid(uid);
      setName(defaultData.displayName || '');
      setMode('complete_profile');
      return false;
    }

    const data = userDoc.data();

   if (!data.birthDate || !data.displayName) {
      setTempUid(uid);
      setName(data.displayName || '');
      setBirthDate(data.birthDate || '');
      setBirthTime(data.birthTime || '');
      setMode('complete_profile');
      return false;
    }

    return true;
  };

  const buildSpiritualData = () => {
  const sign = getZodiacSign(birthDate);
  const lifePathNumber = calculateLifePath(birthDate);
  const nameNumber = calculateNameNumber(name);
  const regentOdu = calculateRegentOdu(birthDate);
  const spiritualElement = getSpiritualElement(sign);
  const guardianAngel = getGuardianAngel(birthDate);
  const planetaryHour = birthTime ? getPlanetaryHour(birthTime) : "";

  return {
    sign,
    lifePathNumber,
    nameNumber,
    regentOdu,
    spiritualElement,
    guardianAngel,
    planetaryHour
  };
};

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const uid = tempUid || auth.currentUser?.uid;

    if (!uid) {
      setLoading(false);
      setError('Usuário não encontrado.');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : null;
      const deviceId = getOrCreateDeviceId();

      const spiritualData = buildSpiritualData();

      const updateData: any = {
        uid,
        displayName: name,
        email: auth.currentUser?.email || email,
        birthDate,
        birthTime,
        ...spiritualData,
        deviceId,
        updatedAt: new Date().toISOString()
      };

      if (!userData) {
        const securityData = await runSecurityCheck({
          uid,
          email: auth.currentUser?.email || email,
          deviceId
        });

        updateData.credits = securityData.initialCredits;
        updateData.promotionalCreditsBlocked = securityData.promotionalCreditsBlocked;
        updateData.fraudReasons = securityData.fraudReasons;
        updateData.plan = 'free';
        updateData.freeQueriesUsed = 0;
        updateData.freeRefillsCount = 0;
        updateData.spiritualLevel = 1;
        updateData.createdAt = new Date().toISOString();
      }

      await setDoc(userDocRef, updateData, { merge: true });

      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (mode === 'complete_profile') return handleCompleteProfile(e);

    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const isComplete = await checkProfileCompleteness(result.user.uid, {});

        if (isComplete) onClose();
      }

      if (mode === 'register') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const deviceId = getOrCreateDeviceId();

        const securityData = await runSecurityCheck({
          uid: result.user.uid,
          email,
          deviceId
        });

        const userDocRef = doc(db, 'users', result.user.uid);
        const spiritualData = buildSpiritualData();

        await setDoc(userDocRef, {
          uid: result.user.uid,
          displayName: name,
          email,
          birthDate,
          birthTime,
          ...spiritualData,
          credits: Number(securityData.initialCredits || 0),
promotionalCreditsBlocked: Boolean(securityData.promotionalCreditsBlocked),
fraudReasons: securityData.fraudReasons || [],
deviceId,
ip: securityData.ip || '',
ipControlledByBackend: true,
plan: 'free',
          freeQueriesUsed: 0,
          freeRefillsCount: 0,
          spiritualLevel: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        onClose();
      }

      if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('O sopro do destino enviou um link de recuperação para seu e-mail.');
      }
    } catch (err: any) {
      let message = 'Ocorreu um erro inesperado. Tente novamente.';

      const errorCode = err.code || '';

      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        message = 'E-mail ou senha incorretos.';
      } else if (errorCode === 'auth/email-already-in-use') {
        message = 'Este e-mail já está em uso.';
      } else if (errorCode === 'auth/weak-password') {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (errorCode === 'auth/operation-not-allowed') {
        message = 'O cadastro por e-mail ainda não foi ativado no painel do Firebase.';
      } else if (err.message && err.message.includes('auth/invalid-email')) {
        message = 'E-mail inválido.';
      } else if (err.message && err.message.startsWith('{')) {
        try {
          const parsed = JSON.parse(err.message);
          message = `Erro no banco de dados: ${parsed.error}`;
        } catch {
          message = err.message;
        }
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 overflow-y-auto bg-black/90">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-[#0a0a0c] border border-amber-500/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)] my-auto"
          >
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif italic text-amber-100 flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={20} />
                  {mode === 'login' && 'Portal de Acesso'}
                  {mode === 'register' && 'Novo Despertar'}
                  {mode === 'forgot' && 'Recordar Caminho'}
                  {mode === 'complete_profile' && 'Consagrar Perfil'}
                </h2>

                <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {mode === 'complete_profile' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                  <p className="text-amber-200 text-xs font-serif italic text-center">
                    "Para que Pablo possa ler os astros em seu favor, ele precisa conhecer o momento exato em que sua alma tocou a Terra."
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {(mode === 'register' || mode === 'complete_profile') && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/70 font-bold ml-1">
                        Nome de Solteiro / Nascimento
                      </label>

                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />

                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all font-serif italic"
                          placeholder="Conforme consta em seu registro original"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/70 font-bold ml-1">
                          Data de Nascimento
                        </label>

                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />

                          <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all cursor-text [color-scheme:dark]"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/70 font-bold ml-1">
                          Hora de Nascimento
                        </label>

                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />

                          <input
                            type="time"
                            value={birthTime}
                            onChange={(e) => setBirthTime(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all cursor-text [color-scheme:dark]"
                            
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {mode !== 'complete_profile' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/70 font-bold ml-1">
                      Seu e-mail
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>
                )}

                {mode !== 'forgot' && mode !== 'complete_profile' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/70 font-bold ml-1">
                      Sua senha
                    </label>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />

                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-all font-mono"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
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
                      {mode === 'login' && 'Entrar no Portal'}
                      {mode === 'register' && 'Iniciar Jornada'}
                      {mode === 'forgot' && 'Enviar Link'}
                      {mode === 'complete_profile' && (auth.currentUser ? 'Salvar Alterações' : 'Consagrar Dados')}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {mode !== 'complete_profile' && (
                <div className="flex flex-col items-center gap-4 pt-4 border-t border-white/5">
                  {mode === 'login' ? (
                    <>
                      <button
                        onClick={() => setMode('register')}
                        className="text-xs text-white/40 hover:text-amber-500 transition-colors uppercase tracking-widest font-black"
                      >
                        Ainda não despertou? <span className="text-amber-400">Criar conta</span>
                      </button>

                      <button
                        onClick={() => setMode('forgot')}
                        className="text-xs text-white/40 hover:text-white transition-colors italic"
                      >
                        Esqueci minha chave espiritual
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setMode('login')}
                      className="text-xs text-white/40 hover:text-amber-500 transition-colors uppercase tracking-widest font-black"
                    >
                      Já possui acesso? <span className="text-amber-400">Entrar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}