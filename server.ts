import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import admin from "firebase-admin";

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

  // PagBank Checkout Route
  app.post("/api/payments/create", async (req, res) => {
    try {
      const { packageId, amount, credits, packageName, userEmail, userName, userId } = req.body;
      
      const email = process.env.PAGBANK_EMAIL;
      const token = process.env.PAGBANK_TOKEN;

      if (!email || !token) {
        throw new Error("PAGBANK_CREDENTIALS_MISSING");
      }

      // In a real production environment, you would call the PagSeguro/PagBank API here
      // Example of the POST request to PagSeguro for a Checkout Session:
      // URL: https://ws.pagseguro.uol.com.br/v2/checkout (Production)
      
      console.log(`[PagBank] Creating checkout for ${userEmail} - Package: ${packageName}`);
      
      // For the sake of this implementation and since we are in a dev environment,
      // we will simulate the success response with a mock checkout URL 
      // but the structure is ready to be connected to the real endpoint.
      
      // To implement real PagSeguro XML/JSON checkout, you would use axios here.
      
      const mockCheckoutUrl = `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=DEMO_CODE_${Date.now()}`;
      
      res.json({ 
        checkoutUrl: mockCheckoutUrl,
        message: "Redirecionando para o PagBank..." 
      });

    } catch (error: any) {
      console.error("[PagBank] Error:", error);
      res.status(500).json({ error: "Erro ao processar pagamento com PagBank." });
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
