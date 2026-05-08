export type SpiritualUser = {
  uid: string;
  displayName: string;
  email: string;
  credits: number;
  birthDate?: string;
  birthTime?: string;
  sign?: string;
  lastFreeAccess?: string;
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
  isVip?: boolean;
};

export const SPIRITUAL_PACKAGES: CreditPackage[] = [
  {
    id: 'package_spiritual',
    name: 'PACOTE ESPIRITUAL',
    price: 19.90,
    credits: 10,
    description: '3 consultas completas + 5 perguntas rápidas'
  },
  {
    id: 'package_premium',
    name: 'PACOTE PREMIUM',
    price: 99.90,
    credits: 50,
    description: '10 consultas + 20 perguntas + mapa astral resumido'
  },
  {
    id: 'package_vip',
    name: 'ORÁCULO VIP',
    price: 150.00,
    credits: 200,
    description: '30 consultas + 100 perguntas + mapa astral completo + efeitos VIP',
    isVip: true
  }
];
