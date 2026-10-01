import express from "express";
import path from "path";
import dotenv from "dotenv";
import consultHandler from "./api/consult";
import geminiChatHandler from "./api/gemini/chat";
import registerCheckHandler from "./api/security/register-check";
import paymentCreateHandler from "./api/payments/create";
import paymentWebhookHandler from "./api/payments/webhook";
import paymentStatusHandler from "./api/payments/status";
import accountDeleteHandler from "./api/account/delete";
import accountDeleteHistoryHandler from "./api/account/delete-history";
import healthHandler from "./api/health";

dotenv.config();

const app = express();

// ======================================================
// SECURITY HEADERS (OWASP)
// ======================================================
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com"
    : "'self' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com";

  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://*.firebaseio.com https://*.googleapis.com https://api.mercadopago.com wss:; frame-ancestors 'self' https://*.run.app https://magiadascrencasmax.vercel.app https://www.magiadascrencas.com.br;`
  );
  next();
});

app.use(express.json({ limit: "1mb" }));

// ======================================================
// API ROUTES (SHARED WITH VERCEL SERVERLESS)
// ======================================================
app.all("/api/consult", consultHandler);
app.all("/api/gemini/chat", geminiChatHandler);
app.all("/api/security/register-check", registerCheckHandler);
app.all("/api/payments/create", paymentCreateHandler);
app.all("/api/payments/webhook", paymentWebhookHandler);
app.all("/api/payments/status", paymentStatusHandler);
app.all("/api/payments/status/:paymentId", (req, res) => {
  req.query = req.query || {};
  req.query.paymentId = req.params.paymentId;
  return paymentStatusHandler(req, res);
});
app.all("/api/account/delete", accountDeleteHandler);
app.all("/api/account/delete-history", accountDeleteHistoryHandler);
app.all("/api/health", healthHandler);

// ======================================================
// FRONTEND SERVING & DEV SERVER
// ======================================================
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Magia das Crenças] Servidor ativo em http://0.0.0.0:${PORT}`);
  });
}

startServer();

export default app;
