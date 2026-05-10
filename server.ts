import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (e) {
    console.warn("Firebase Admin fallback: applicationDefault failed. Ensure credentials are set.");
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // PagBank Checkout Route - Simulation for now to avoid broken redirects
  app.post("/api/payments/create", async (req, res) => {
    try {
      const { packageId, amount, credits, packageName, userEmail, userName, userId } = req.body;
      
      // If we have credentials, we could do real API calls, but for testing
      // we'll use a simulation that actually rewards the credits to the user.
      
      const email = process.env.VITE_PAGBANK_EMAIL;
      const token = process.env.PAGBANK_TOKEN;

      console.log(`[PagBank] Iniciando requisição para ${userEmail || userId}`);
      
      // Para o ambiente de desenvolvimento, geramos um caminho que simula o sucesso.
      const mockCheckoutPath = `/api/payments/mock-success?userId=${userId}&credits=${credits}&packageId=${packageId}&amount=${amount}`;
      
      res.json({ 
        checkoutUrl: mockCheckoutPath,
        message: "Redirecionando para o portal de pagamento..." 
      });

    } catch (error: any) {
      console.error("[PagBank] Error:", error);
      res.status(500).json({ error: "Erro ao processar pagamento com PagBank." });
    }
  });

  // Mock Success Route - THIS GRANTS CREDITS FOR TESTING
  app.get("/api/payments/mock-success", async (req, res) => {
    const { userId, credits, packageId, amount } = req.query;
    
    if (!userId || !credits) {
      return res.status(400).send("Dados inválidos");
    }

    try {
      // Importante: Usar o ID do banco de dados configurado explicitamente
      const db = getFirestore("ai-studio-d1105614-3639-456a-86a6-874590479208");
      
      const userRef = db.collection("users").doc(userId as string);
      const creditsToAdd = parseInt(credits as string);
      const amountValue = parseFloat(amount as string || "0");

      console.log(`[PAGAMENTO] Processando ${creditsToAdd} créditos para o usuário ${userId}`);

      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (userDoc.exists) {
          const currentCredits = userDoc.data()?.credits || 0;
          transaction.update(userRef, {
            credits: currentCredits + creditsToAdd,
            plan: 'pro',
            lastPurchaseAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Se o documento não existe, cria um novo
          transaction.set(userRef, {
            uid: userId,
            credits: creditsToAdd,
            plan: 'pro',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastPurchaseAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        // Registrar transação
        const transRef = userRef.collection("transactions").doc();
        transaction.set(transRef, {
          amount: amountValue,
          credits: creditsToAdd,
          type: 'purchase',
          package: packageId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'completed',
          provider: 'pagbank_simulated'
        });
      });

      console.log(`[PAGAMENTO] Sucesso para ${userId}`);
      // Redirecionar de volta para o app com parâmetro de sucesso
      res.redirect(`/?payment=success&credits=${credits}`);
    } catch (error: any) {
      console.error("Mock Credit Error Full:", error);
      res.status(500).send(`Erro ao processar seus créditos ritualísticos: ${error.message || 'Erro desconhecido'}`);
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
