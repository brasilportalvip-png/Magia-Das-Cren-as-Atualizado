export type SpiritualUser = {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  credits: number;
  plan: 'free' | 'pro';
  freeQueriesUsed: number;
  freeRefillsCount?: number;
  lastFreeRefillAt?: string;
  lastFreeQueryAt?: string;
  birthDate?: string;
  birthTime?: string;
  sign?: string;
  lifePathNumber?: number;
  nameNumber?: number;
  regentOdu?: { number: number, name: string, orixa: string, description: string };
  guardianAngel?: string;
  planetaryHour?: string;
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
    id: 'standard',
    name: 'ESSÊNCIA ESPIRITUAL',
    price: 19.90,
    credits: 70,
    description: 'Um despertar profundo com o Cigano Pablo.',
    color: 'from-amber-400 to-amber-700',
    glow: 'shadow-amber-500/20'
  },
  {
    id: 'master',
    name: 'MESTRIA DO ORÁCULO',
    price: 80.00,
    credits: 150,
    description: 'Acesso total e ilimitado à sabedoria ancestral.',
    color: 'from-amber-300 to-yellow-600',
    glow: 'shadow-yellow-500/40'
  }
];
