import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import Stripe from "stripe";
import admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (e) {
    console.warn("Firebase Admin fallback: applicationDefault failed. Ensure credentials are set.");
    // Fallback: This might fail in local dev without service account, but will work in Cloud Run
    // with proper service account attached.
  }
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-01-27" as any })
  : null;

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Stripe Webhook - MUST BE BEFORE express.json()
  app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !sig || !endpointSecret) {
      console.error("Webhook configuration missing components");
      return res.status(400).send("Webhook config error");
    }

    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const { userId, credits } = session.metadata;
        
        console.log(`FULFILLING: User ${userId} -> ${credits} credits.`);
        
        if (userId && credits) {
          const db = admin.firestore();
          const userRef = db.collection("users").doc(userId);
          
          await db.runTransaction(async (transaction) => {
             const userDoc = await transaction.get(userRef);
             if (userDoc.exists) {
                const currentCredits = userDoc.data()?.credits || 0;
                transaction.update(userRef, {
                   credits: currentCredits + parseInt(credits),
                   plan: 'pro',
                   lastPurchaseAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                // Log transaction
                const transRef = userRef.collection("transactions").doc();
                transaction.set(transRef, {
                   amount: session.amount_total / 100,
                   credits: parseInt(credits),
                   type: 'purchase',
                   package: session.metadata.packageId,
                   timestamp: admin.firestore.FieldValue.serverTimestamp(),
                   stripeSessionId: session.id
                });
             }
          });
          console.log(`SUCCESS: Credits added to ${userId}`);
        }
      }
      
      res.json({ received: true });
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  app.use(express.json());

  // Gemini Chat Route
  app.post("/api/chat", async (req, res) => {
    if (!genAI) {
      return res.status(500).json({ error: "Gemini API key not configured on server" });
    }

    try {
      const { contents, systemInstruction } = req.body;
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction
      });

      const result = await model.generateContent({ contents });
      const response = await result.response;
      const text = response.text();

      res.json({ text });
    } catch (error: any) {
      console.error("Gemini Server Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe Checkout Endpoint with Packages
  app.post("/api/create-checkout-session", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    try {
      const { userId, packageId } = req.body;
      const appUrl = process.env.VITE_APP_URL || `http://localhost:${PORT}`;
      
      const packages: any = {
        bronze: { name: "PACOTE BRONZE", amount: 1990, credits: 20 },
        silver: { name: "PACOTE PRATA", amount: 4990, credits: 70 },
        gold: { name: "PACOTE OURO", amount: 9700, credits: 150 },
      };

      const p = packages[packageId] || packages.bronze;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "brl",
            product_data: {
              name: `${p.name} - Magia Das Crenças`,
              description: `Recarga de ${p.credits} créditos de Energia Vital.`,
            },
            unit_amount: p.amount,
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: `${appUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}?payment=cancel`,
        metadata: { userId, credits: String(p.credits), packageId },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
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
