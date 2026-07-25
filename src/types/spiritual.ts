export type SpiritualUser = {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  credits: number;
  plan: 'free' | 'silver' | 'gold';
  deviceId?: string;
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

/* Controle de créditos promocionais */
promotionalCreditsBlocked?: boolean;

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
  checkoutUrl?: string;
};

export const SPIRITUAL_PACKAGES: CreditPackage[] = [
  {
    id: 'free',
    name: 'PLANO FREE',
    price: 0,
    credits: 7,
    description: '7 créditos de boas vinda para iniciar sua jornada.',
    color: 'from-emerald-400 to-teal-600',
    glow: 'shadow-emerald-500/20'
  },
  {
  id: 'silver',
  name: 'PLANO PRATA',
  price: 49.00,
  credits: 50,
  description: '50 créditos para consultas profundas e orientação regular.',
  color: 'from-slate-300 to-slate-500',
  glow: 'shadow-slate-500/20',
  checkoutUrl: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=INSERT_PRATA_PREFERENCE_ID_HERE'
},
{
  id: 'gold',
  name: 'PLANO OURO',
  price: 120.00,
  credits: 125,
  description: '125 créditos e maior conexão espiritual com melhor valor.',
  color: 'from-amber-300 to-yellow-600',
  glow: 'shadow-yellow-500/40',
  checkoutUrl: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=INSERT_OURO_PREFERENCE_ID_HERE'
}
];
