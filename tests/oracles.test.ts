import { describe, it, expect } from "vitest";
import { calculateConsultationCost } from "../api/_lib/ledger";
import { checkRateLimit } from "../api/_lib/rateLimit";
import {
  getZodiacSign,
  calculateLifePath,
  calculateRegentOdu,
  calculateNameNumber,
  getGuardianAngel,
} from "../src/lib/spiritualUtils";

describe("Oráculos & Spiritual Utils", () => {
  it("calcula corretamente signo zodíaco por data", () => {
    expect(getZodiacSign("1990-03-25")).toBe("Áries");
    expect(getZodiacSign("1992-07-15")).toBe("Câncer");
    expect(getZodiacSign("1985-12-25")).toBe("Capricórnio");
  });

  it("calcula caminho de vida (Life Path) numerológico", () => {
    // 1990-05-15: 1+9+9+0 + 5 + 1+5 = 19 + 5 + 6 = 30 -> 3+0 = 3
    const lp = calculateLifePath("1990-05-15");
    expect(typeof lp).toBe("number");
    expect(lp).toBeGreaterThanOrEqual(1);
    expect(lp).toBeLessThanOrEqual(9);
  });

  it("calcula número da alma pelo nome", () => {
    const num = calculateNameNumber("Maria Silva");
    expect(typeof num).toBe("number");
    expect(num).toBeGreaterThanOrEqual(1);
    expect(num).toBeLessThanOrEqual(9);
  });

  it("identifica Odù regente de nascimento", () => {
    const odu = calculateRegentOdu("1988-10-20");
    expect(odu).toBeDefined();
    expect(typeof odu.name).toBe("string");
    expect(odu.number).toBeGreaterThanOrEqual(1);
  });

  it("determina Anjo Guardião", () => {
    const angel = getGuardianAngel("1995-04-10");
    expect(typeof angel).toBe("string");
    expect(angel.length).toBeGreaterThan(2);
  });
});

describe("Ledger & Custos de Consulta", () => {
  it("determina custo de 3 para Tarot", () => {
    expect(calculateConsultationCost("Tirar 3 cartas", "tarot")).toBe(3);
    expect(calculateConsultationCost("Quero uma tiragem de tarot")).toBe(3);
  });

  it("determina custo de 5 para Mapa Astral", () => {
    expect(calculateConsultationCost("Meu mapa astral completo")).toBe(5);
  });

  it("determina custo de 4 para Búzios e Ifá", () => {
    expect(calculateConsultationCost("Jogo de búzios")).toBe(4);
    expect(calculateConsultationCost("Consulta de ifá")).toBe(4);
  });

  it("determina custo de 2 para Odù, Orixás, Numerologia e Anjo", () => {
    expect(calculateConsultationCost("Qual meu odu?")).toBe(2);
    expect(calculateConsultationCost("Quem é meu anjo guardião?")).toBe(2);
    expect(calculateConsultationCost("Numerologia do meu nome")).toBe(2);
  });

  it("determina custo de 2 para temas de Amor, Dinheiro, Trabalho", () => {
    expect(calculateConsultationCost("Ele ainda me ama?")).toBe(2);
    expect(calculateConsultationCost("Como vai meu dinheiro e trabalho?")).toBe(2);
  });

  it("determina custo padrão de 1 para perguntas gerais", () => {
    expect(calculateConsultationCost("Bom dia Cigano Pablo")).toBe(1);
  });
});

describe("Rate Limiter", () => {
  it("permite requisições dentro do limite", async () => {
    const id = "test_user_ok_" + Date.now();
    const res1 = await checkRateLimit(id, 5, 1000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(4);
  });

  it("bloqueia quando o limite é excedido", async () => {
    const id = "test_user_blocked_" + Date.now();
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(id, 3, 1000);
    }
    const res = await checkRateLimit(id, 3, 1000);
    expect(res.allowed).toBe(false);
    expect(res.remaining).toBe(0);
    expect(res.retryAfterSec).toBeDefined();
  });
});
