import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-01-27" as any })
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe Checkout Endpoint
  app.post("/api/create-checkout-session", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const { priceId = "price_premium_access", userId, credits = 50 } = req.body;
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: "Energia Vital - Plano Pro",
                description: `Recarga de ${credits} créditos de Energia Vital com Cigano Pablo.`,
                images: ["https://portalvipbrasil.com.br/wp-content/uploads/2026/05/ChatGPT-Image-7-de-mai.-de-2026-18_15_54.png"],
              },
              unit_amount: 4990, // R$ 49,90
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&payment=success`,
        cancel_url: `${baseUrl}/?payment=cancel`,
        metadata: {
          userId,
          credits: String(credits),
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe Error:", error);
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
