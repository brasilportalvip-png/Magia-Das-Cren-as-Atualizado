export type SpiritualUser = {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  credits: number;
  plan: 'free' | 'pro';
  freeQueriesUsed: number;
  lastFreeQueryAt?: string;
  birthDate?: string;
  birthTime?: string;
  sign?: string;
  lifePathNumber?: number;
  nameNumber?: number;
  regentOdu?: { number: number, name: string };
  spiritualElement?: string;
  spiritualLevel?: number;
  lastAdvice?: string;
  createdAt: string;
};

export type Message = {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
};

export type CreditPackage = {
  id: string;
  name: string;
  price: number;
  credits: number;
  description: string;
  color: string;
  glow: string;
};

export const SPIRITUAL_PACKAGES: CreditPackage[] = [
  {
    id: 'bronze',
    name: 'PACOTE BRONZE',
    price: 19.90,
    credits: 20,
    description: 'Ideal para consultas rápidas e pontuais.',
    color: 'from-orange-400 to-amber-700',
    glow: 'shadow-orange-500/20'
  },
  {
    id: 'silver',
    name: 'PACOTE PRATA',
    price: 49.90,
    credits: 70,
    description: 'Equilíbrio perfeito para seu autoconhecimento.',
    color: 'from-slate-300 to-slate-500',
    glow: 'shadow-slate-400/20'
  },
  {
    id: 'gold',
    name: 'PACOTE OURO',
    price: 97.00,
    credits: 150,
    description: 'Acesso total e profundo à sabedoria do Cigano.',
    color: 'from-amber-300 to-yellow-600',
    glow: 'shadow-yellow-500/40'
  }
];
