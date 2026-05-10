import { SpiritualUser } from "../types/spiritual";

export function getZodiacSign(dateStr: string): string {
  if (!dateStr) return "Místico";
  const date = new Date(dateStr);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquário";
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Peixes";
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Áries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Touro";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gêmeos";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Câncer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leão";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgem";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Escorpião";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagitário";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricórnio";
  return "Místico";
}

/**
 * Cálculos Numerológicos Pitagóricos
 * Soma dos dígitos da data de nascimento até reduzir a um único dígito (ou mestre 11, 22)
 */
export function calculateLifePath(dateStr: string): number {
  if (!dateStr) return 0;
  const digits = dateStr.replace(/[^0-9]/g, '');
  let sum = digits.split('').reduce((acc, d) => acc + parseInt(d), 0);
  
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
  }
  return sum;
}

/**
 * Cálculo de Odu de Nascimento (Tradição Numerológica Brasileira/Afro)
 * Baseado na soma da data de nascimento reduzida ao intervalo 1-16
 */
export function calculateRegentOdu(dateStr: string): { number: number, name: string, orixa: string, description: string } {
  if (!dateStr) return { number: 0, name: "Desconhecido", orixa: "Místico", description: "" };
  const date = new Date(dateStr);
  const d = date.getUTCDate();
  const m = date.getUTCMonth() + 1;
  const y = date.getUTCFullYear();
  
  let sum = d + m + y;
  while (sum > 16) {
    sum = sum.toString().split('').reduce((acc, curr) => acc + parseInt(curr), 0);
  }
  
  const odus: { [key: number]: { name: string, orixa: string, desc: string } } = {
    1: { name: "Okaran", orixa: "Exu", desc: "Início, dualidade e caminhos abertos." },
    2: { name: "Eji-Okô", orixa: "Ibeji / Ogum", desc: "Dualidade, incerteza e busca por equilíbrio." },
    3: { name: "Eta-Ogundá", orixa: "Ogum / Obaluaiê", desc: "Luta, esforço e superação de obstáculos." },
    4: { name: "Irosun", orixa: "Iemanjá / Eguns", desc: "Calma aparente, perigos ocultos e ancestralidade." },
    5: { name: "Oxé", orixa: "Oxum / Logun Edé", desc: "Brilho, vaidade, riqueza e feitiços." },
    6: { name: "Obará", orixa: "Xangô / Oxóssi", desc: "Prosperidade, fartura e justiça plena." },
    7: { name: "Odi", orixa: "Omolu / Oxumarê", desc: "Finalização, mistérios e renovação." },
    8: { name: "Ejioníle", orixa: "Oxalá", desc: "Paz, pureza, liderança e sabedoria." },
    9: { name: "Ossá", orixa: "Iansã / Iemanjá", desc: "Mudanças repentinas, ventos e intuição." },
    10: { name: "Ofun", orixa: "Oxalá / Nanã", desc: "Mistério, quietude e segredos da criação." },
    11: { name: "Owarin", orixa: "Iansã / Exu", desc: "Agitação, movimento e presságios." },
    12: { name: "Ejilaxeborá", orixa: "Xangô", desc: "Justiça divina, equilíbrio e autoridade." },
    13: { name: "Ejilobon", orixa: "Nanã / Obaluaiê", desc: "Maturidade, introspecção e sabedoria antiga." },
    14: { name: "Iká", orixa: "Oxumarê / Ossain", desc: "Flexibilidade, cura e proteção espiritual." },
    15: { name: "Ogbeogundá", orixa: "Obá / Ewá", desc: "Inteligência, estratégia e resistência." },
    16: { name: "Alafiá", orixa: "Orunmilá / Oxalá", desc: "Sucesso, luz plena e caminhos iluminados." }
  };
  
  const data = odus[sum] || { name: "Místico", orixa: "Desconhecido", desc: "Caminho oculto." };
  return { number: sum, name: data.name, orixa: data.orixa, description: data.desc };
}

export function getSpiritualElement(sign: string): string {
  const elements: { [key: string]: string } = {
    "Áries": "Fogo", "Leão": "Fogo", "Sagitário": "Fogo",
    "Touro": "Terra", "Virgem": "Terra", "Capricórnio": "Terra",
    "Gêmeos": "Ar", "Libra": "Ar", "Aquário": "Ar",
    "Câncer": "Água", "Escorpião": "Água", "Peixes": "Água"
  };
  return elements[sign] || "Éter";
}

export function getWeekDay(dateStr: string): string {
  if (!dateStr) return "";
  const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  return days[new Date(dateStr).getUTCDay()];
}

/**
 * Numerologia do Nome (Pitagórica)
 * Baseada no Nome de Solteiro/Nascimento
 */
export function calculateNameNumber(name: string): number {
  if (!name) return 0;
  const map: { [key: string]: number } = {
    'a': 1, 'j': 1, 's': 1,
    'b': 2, 'k': 2, 't': 2,
    'c': 3, 'l': 3, 'u': 3,
    'd': 4, 'm': 4, 'v': 4,
    'e': 5, 'n': 5, 'w': 5,
    'f': 6, 'o': 6, 'x': 6,
    'g': 7, 'p': 7, 'y': 7,
    'h': 8, 'q': 8, 'z': 8,
    'i': 9, 'r': 9
  };
  
  const cleanName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, '');
  let sum = cleanName.split('').reduce((acc, char) => acc + (map[char] || 0), 0);
  
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
  }
  return sum;
}

export function getGuardianAngel(dateStr: string): string {
  if (!dateStr) return "Serafim";
  const num = calculateLifePath(dateStr);
  const angels = [
    "Metatron", "Jofiel", "Samuel", "Gabriel", 
    "Rafael", "Uriel", "Cassiel", "Miguel", "Haniel", "Raziel"
  ];
  return angels[num % angels.length];
}

export function getPlanetaryHour(timeStr: string): string {
  if (!timeStr) return "Desconhecido";
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = (hours * 60) + minutes;
  const planets = ["Saturno", "Júpiter", "Marte", "Sol", "Vênus", "Mercúrio", "Lua"];
  const index = Math.floor((totalMinutes / 120) % 7);
  return planets[index];
}
