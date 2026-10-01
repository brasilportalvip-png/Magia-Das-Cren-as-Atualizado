import { describe, it, expect } from "vitest";

// Replicates and validates the exact CEL logic implemented in firestore.rules
const ALLOWED_PROFILE_KEYS = new Set([
  "uid",
  "displayName",
  "email",
  "birthDate",
  "birthTime",
  "sign",
  "lifePathNumber",
  "spiritualElement",
  "guardianAngel",
  "regentOdu",
  "nameNumber",
  "deviceId",
  "createdAt",
  "updatedAt",
]);

const ALLOWED_UPDATE_KEYS = new Set([
  "displayName",
  "birthDate",
  "birthTime",
  "sign",
  "lifePathNumber",
  "spiritualElement",
  "guardianAngel",
  "regentOdu",
  "nameNumber",
  "updatedAt",
]);

function canClientCreateProfile(data: Record<string, any>, authUid: string): boolean {
  if (data.uid !== authUid) return false;
  // Has only allowed profile keys
  for (const k of Object.keys(data)) {
    if (!ALLOWED_PROFILE_KEYS.has(k)) return false;
  }
  // P0-1: Client can NEVER send credits or plan
  if ("credits" in data) return false;
  if ("plan" in data) return false;
  if ("promotionalCreditsBlocked" in data) return false;
  if ("fraudReasons" in data) return false;
  if ("role" in data) return false;
  if ("isAdmin" in data) return false;
  if ("admin" in data) return false;
  return true;
}

function canClientUpdateProfile(diffKeys: string[]): boolean {
  // P0-2: Strict whitelist - hasOnly allowed keys
  if (diffKeys.length === 0) return true;
  return diffKeys.every((k) => ALLOWED_UPDATE_KEYS.has(k));
}

function canClientDelete(): boolean {
  // P0-3: allow delete: if false
  return false;
}

describe("Firestore Rules Logic Unit Tests", () => {
  describe("P0-1: User Profile Create", () => {
    it("permite criação de perfil com dados básicos permitidos", () => {
      const allowed = canClientCreateProfile(
        {
          uid: "user-123",
          displayName: "Maria",
          email: "maria@example.com",
          birthDate: "1990-05-15",
          birthTime: "14:30",
          sign: "Touro",
          createdAt: "2026-10-01T00:00:00.000Z",
          updatedAt: "2026-10-01T00:00:00.000Z",
        },
        "user-123"
      );
      expect(allowed).toBe(true);
    });

    it("bloqueia criação se o cliente tentar enviar credits: 7 (Bypass Antifraude)", () => {
      const allowed = canClientCreateProfile(
        {
          uid: "user-123",
          displayName: "Hacker",
          credits: 7,
        },
        "user-123"
      );
      expect(allowed).toBe(false);
    });

    it("bloqueia criação se o cliente tentar definir plan: gold", () => {
      const allowed = canClientCreateProfile(
        {
          uid: "user-123",
          displayName: "Hacker",
          plan: "gold",
        },
        "user-123"
      );
      expect(allowed).toBe(false);
    });

    it("bloqueia criação com chaves desconhecidas ou administrativas", () => {
      const allowed = canClientCreateProfile(
        {
          uid: "user-123",
          displayName: "Hacker",
          admin: true,
        },
        "user-123"
      );
      expect(allowed).toBe(false);
    });
  });

  describe("P0-2: User Profile Update (Whitelist)", () => {
    it("permite atualização de campos permitidos (displayName, birthDate, etc.)", () => {
      expect(canClientUpdateProfile(["displayName", "updatedAt"])).toBe(true);
      expect(canClientUpdateProfile(["birthDate", "birthTime", "sign"])).toBe(true);
    });

    it("bloqueia atualização se tentar alterar credits", () => {
      expect(canClientUpdateProfile(["credits"])).toBe(false);
      expect(canClientUpdateProfile(["displayName", "credits"])).toBe(false);
    });

    it("bloqueia atualização se tentar alterar plan", () => {
      expect(canClientUpdateProfile(["plan"])).toBe(false);
    });

    it("bloqueia atualização se tentar alterar promotionalCreditsBlocked ou fraudReasons", () => {
      expect(canClientUpdateProfile(["promotionalCreditsBlocked"])).toBe(false);
      expect(canClientUpdateProfile(["fraudReasons"])).toBe(false);
    });

    it("bloqueia atualização de qualquer campo fora da whitelist (ex: bonus, role, vip)", () => {
      expect(canClientUpdateProfile(["bonusCredits"])).toBe(false);
      expect(canClientUpdateProfile(["role"])).toBe(false);
      expect(canClientUpdateProfile(["isVip"])).toBe(false);
    });
  });

  describe("P0-3: User Profile Delete", () => {
    it("bloqueia exclusão direta no Firestore pelo cliente", () => {
      expect(canClientDelete()).toBe(false);
    });
  });
});
