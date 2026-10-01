import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

const PROJECT_ID = "magia-crencas-emulator-test";
const RULES_PATH = path.resolve(__dirname, "../firestore.rules");

describe("Firestore Rules - Real Emulator Unit Testing", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    const rules = fs.readFileSync(RULES_PATH, "utf8");

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host: "127.0.0.1",
        port: 8080,
      },
    });

    
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  // A. Usuário não autenticado
  describe("A. Usuário Não Autenticado", () => {
    it("não pode ler users/{uid}", async () => {
      
      const unauth = testEnv.unauthenticatedContext();
      const ref = doc(unauth.firestore(), "users/user_123");
      await assertFails(getDoc(ref));
    });

    it("não pode gravar users/{uid}", async () => {
      
      const unauth = testEnv.unauthenticatedContext();
      const ref = doc(unauth.firestore(), "users/user_123");
      await assertFails(
        setDoc(ref, {
          uid: "user_123",
          displayName: "Invasor",
        })
      );
    });
  });

  // B. Usuário autenticado A
  describe("B. Usuário Autenticado A", () => {
    it("lê o próprio documento", async () => {
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "users/user_A"), {
          uid: "user_A",
          displayName: "Maria",
          credits: 7,
          plan: "free",
        });
      });

      const userA = testEnv.authenticatedContext("user_A");
      const ref = doc(userA.firestore(), "users/user_A");
      await assertSucceeds(getDoc(ref));
    });

    it("não lê documento de outro usuário (user_B)", async () => {
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "users/user_B"), {
          uid: "user_B",
          displayName: "João",
        });
      });

      const userA = testEnv.authenticatedContext("user_A");
      const ref = doc(userA.firestore(), "users/user_B");
      await assertFails(getDoc(ref));
    });

    it("não lista a coleção users", async () => {
      
      const userA = testEnv.authenticatedContext("user_A");
      const col = collection(userA.firestore(), "users");
      await assertFails(getDocs(col));
    });

    it("não altera credits", async () => {
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "users/user_A"), {
          uid: "user_A",
          displayName: "Maria",
          credits: 7,
          plan: "free",
        });
      });

      const userA = testEnv.authenticatedContext("user_A");
      const ref = doc(userA.firestore(), "users/user_A");
      await assertFails(updateDoc(ref, { credits: 100 }));
    });

    it("não altera plan", async () => {
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "users/user_A"), {
          uid: "user_A",
          displayName: "Maria",
          credits: 7,
          plan: "free",
        });
      });

      const userA = testEnv.authenticatedContext("user_A");
      const ref = doc(userA.firestore(), "users/user_A");
      await assertFails(updateDoc(ref, { plan: "gold" }));
    });

    it("não altera fraudReasons ou promotionalCreditsBlocked", async () => {
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "users/user_A"), {
          uid: "user_A",
          displayName: "Maria",
        });
      });

      const userA = testEnv.authenticatedContext("user_A");
      const ref = doc(userA.firestore(), "users/user_A");
      await assertFails(updateDoc(ref, { fraudReasons: [] }));
      await assertFails(updateDoc(ref, { promotionalCreditsBlocked: false }));
    });

    it("não grava subcoleções sensíveis (credit_logs, consultations, transactions)", async () => {
      
      const userA = testEnv.authenticatedContext("user_A");

      const creditLogRef = doc(userA.firestore(), "users/user_A/credit_logs/log_1");
      await assertFails(setDoc(creditLogRef, { amount: 50 }));

      const consultRef = doc(userA.firestore(), "users/user_A/consultations/c_1");
      await assertFails(setDoc(consultRef, { message: "teste" }));

      const txRef = doc(userA.firestore(), "users/user_A/transactions/t_1");
      await assertFails(setDoc(txRef, { amount: 49 }));
    });

    it("não apaga users/{uid} diretamente", async () => {
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "users/user_A"), {
          uid: "user_A",
          displayName: "Maria",
        });
      });

      const userA = testEnv.authenticatedContext("user_A");
      const ref = doc(userA.firestore(), "users/user_A");
      await assertFails(deleteDoc(ref));
    });
  });

  // C. Criação
  describe("C. Criação de Usuário", () => {
    it("permite perfil com apenas campos explicitamente permitidos", async () => {
      
      const userNew = testEnv.authenticatedContext("user_new");
      const ref = doc(userNew.firestore(), "users/user_new");
      await assertSucceeds(
        setDoc(ref, {
          uid: "user_new",
          displayName: "Nova Alma",
          email: "nova@example.com",
          birthDate: "1995-10-12",
          birthTime: "10:00",
          sign: "Libra",
          createdAt: "2026-10-01T00:00:00.000Z",
          updatedAt: "2026-10-01T00:00:00.000Z",
        })
      );
    });

    it("rejeita criação contendo credits", async () => {
      
      const userNew = testEnv.authenticatedContext("user_new");
      const ref = doc(userNew.firestore(), "users/user_new");
      await assertFails(
        setDoc(ref, {
          uid: "user_new",
          displayName: "Nova Alma",
          credits: 7,
        })
      );
    });

    it("rejeita criação contendo plan", async () => {
      
      const userNew = testEnv.authenticatedContext("user_new");
      const ref = doc(userNew.firestore(), "users/user_new");
      await assertFails(
        setDoc(ref, {
          uid: "user_new",
          displayName: "Nova Alma",
          plan: "free",
        })
      );
    });

    it("rejeita criação contendo promotionalCreditsBlocked ou fraudReasons", async () => {
      
      const userNew = testEnv.authenticatedContext("user_new");
      const ref = doc(userNew.firestore(), "users/user_new");
      await assertFails(
        setDoc(ref, {
          uid: "user_new",
          displayName: "Nova Alma",
          promotionalCreditsBlocked: false,
        })
      );
    });

    it("rejeita criação contendo campos administrativos desconhecidos", async () => {
      
      const userNew = testEnv.authenticatedContext("user_new");
      const ref = doc(userNew.firestore(), "users/user_new");
      await assertFails(
        setDoc(ref, {
          uid: "user_new",
          displayName: "Nova Alma",
          admin: true,
          role: "admin",
        })
      );
    });
  });

  // D. Atualização
  describe("D. Atualização de Perfil (Whitelist)", () => {
    it("permite atualizar displayName e birthDate/birthTime", async () => {
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "users/user_A"), {
          uid: "user_A",
          displayName: "Nome Velho",
          birthDate: "1990-01-01",
          birthTime: "12:00",
          sign: "Capricórnio",
          updatedAt: "2026-01-01T00:00:00.000Z",
        });
      });

      const userA = testEnv.authenticatedContext("user_A");
      const ref = doc(userA.firestore(), "users/user_A");
      await assertSucceeds(
        updateDoc(ref, {
          displayName: "Nome Novo",
          birthDate: "1990-02-02",
          birthTime: "14:00",
          updatedAt: "2026-10-01T00:00:00.000Z",
        })
      );
    });

    it("rejeita qualquer campo fora da whitelist", async () => {
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "users/user_A"), {
          uid: "user_A",
          displayName: "Maria",
        });
      });

      const userA = testEnv.authenticatedContext("user_A");
      const ref = doc(userA.firestore(), "users/user_A");
      await assertFails(
        updateDoc(ref, {
          vipAccess: true,
        })
      );
    });
  });

  // E. Admin
  describe("E. Custom Claims de Administrador", () => {
    it("admin autenticado pode ler documentos de qualquer usuário", async () => {
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "users/target_user"), {
          uid: "target_user",
          displayName: "Consulente",
        });
      });

      const adminCtx = testEnv.authenticatedContext("admin_user", {
        admin: true,
      });
      const ref = doc(adminCtx.firestore(), "users/target_user");
      await assertSucceeds(getDoc(ref));
    });
  });
});
