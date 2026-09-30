import express from "express";
import path from "path";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

dotenv.config();

const app = express();

const APP_URL =
  process.env.APP_URL || "https://www.magiadascrencas.com.br";

const FIRESTORE_DATABASE_ID = "cigano";

type Plan = "free" | "silver" | "gold";

app.use(express.json({ limit: "1mb" }));

// ======================================================
// FIREBASE ADMIN
// ======================================================

function initFirebaseAdmin() {
  if (admin.apps.length) return;

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    "gen-lang-client-0138178639";

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    return;
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  });
}

function getDb() {
  initFirebaseAdmin();

  return getFirestore(
    undefined,
    FIRESTORE_DATABASE_ID
  );
}

// ======================================================
// MERCADO PAGO
// ======================================================

const mp = new MercadoPagoConfig({
  accessToken:
    process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

// ======================================================
// UTILITÁRIOS
// ======================================================

function getClientIp(
  req: express.Request
): string {
  const forwarded =
    req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded
      .split(",")[0]
      .trim();
  }

  return (
    req.socket.remoteAddress ||
    "unknown"
  );
}

function normalizeText(
  value: string
): string {
  return String(value || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}

function getPlanByPackage(
  packageId: string
): Plan {
  const id =
    normalizeText(packageId);

  if (
    id === "gold" ||
    id === "ouro"
  ) {
    return "gold";
  }

  if (
    id === "silver" ||
    id === "prata"
  ) {
    return "silver";
  }

  return "silver";
}

// ======================================================
// SECURITY LOG
// ======================================================

async function securityLog(
  data: Record<string, any>
) {
  try {
    await getDb()
      .collection("security_logs")
      .add({
        ...data,
        createdAt:
          admin.firestore.FieldValue
            .serverTimestamp(),
      });
  } catch (error) {
    console.error(
      "[SECURITY_LOG_ERROR]",
      error
    );
  }
}

// ======================================================
// ANTIFRAUDE
// ======================================================

async function checkRegistrationFraud(
  params: {
    email?: string;
    deviceId?: string;
    browser?: string;
    sessionSign?: string;
    ip: string;
  }
) {
  const db = getDb();

  const email =
    normalizeText(
      params.email || ""
    );

  const deviceId =
    params.deviceId ||
    "dev_not_tracked";

  const browser =
    params.browser ||
    "unknown";

  const sessionSign =
    params.sessionSign ||
    "unknown";

  const ip = params.ip;

  const fraudReasons: string[] =
    [];

  if (
    !deviceId ||
    deviceId ===
      "dev_not_tracked"
  ) {
    fraudReasons.push(
      "missing_device_id"
    );
  }

  if (email) {
    const emailSnap =
      await db
        .collection("users")
        .where(
          "email",
          "==",
          email
        )
        .limit(1)
        .get();

    if (!emailSnap.empty) {
      fraudReasons.push(
        "email_already_used"
      );
    }
  }

  if (
    deviceId !==
    "dev_not_tracked"
  ) {
    const deviceSnap =
      await db
        .collection("users")
        .where(
          "deviceId",
          "==",
          deviceId
        )
        .limit(1)
        .get();

    if (!deviceSnap.empty) {
      fraudReasons.push(
        "device_already_used"
      );
    }
  }

  const ipUsersSnap =
    await db
      .collection("users")
      .where(
        "ip",
        "==",
        ip
      )
      .limit(10)
      .get();

  const ipLogsSnap =
    await db
      .collection(
        "security_logs"
      )
      .where(
        "ip",
        "==",
        ip
      )
      .limit(10)
      .get();

  if (
    !ipUsersSnap.empty ||
    !ipLogsSnap.empty
  ) {
    fraudReasons.push(
      "ip_already_used"
    );
  }

  const ipUsers =
    ipUsersSnap.docs.map(
      (doc) => doc.data()
    );

  const ipLogs =
    ipLogsSnap.docs.map(
      (doc) => doc.data()
    );

  const ipRecords = [
    ...ipUsers,
    ...ipLogs,
  ];

  if (
    ipRecords.some(
      (u: any) =>
        u.browser === browser
    )
  ) {
    fraudReasons.push(
      "same_ip_and_browser"
    );
  }

  if (
    ipRecords.some(
      (u: any) =>
        u.sessionSign ===
        sessionSign
    )
  ) {
    fraudReasons.push(
      "same_ip_and_session"
    );
  }

  if (
    ipRecords.length >= 1
  ) {
    fraudReasons.push(
      "too_many_recent_accounts_same_ip"
    );
  }

  return {
    promotionalCreditsBlocked:
      fraudReasons.length > 0,

    initialCredits:
      fraudReasons.length > 0
        ? 0
        : 7,

    fraudReasons: [
      ...new Set(
        fraudReasons
      ),
    ],
  };
}

// ======================================================
// LIBERAÇÃO DE CRÉDITOS
// ======================================================

async function grantCredits(
  params: {
    userId: string;
    credits: number;
    amount: number;
    packageId: string;
    paymentId: string;
    provider: string;
  }
) {
  const {
    userId,
    credits,
    amount,
    packageId,
    paymentId,
    provider,
  } = params;

  if (
    !userId ||
    !credits ||
    credits <= 0
  ) {
    throw new Error(
      "Dados inválidos para liberar créditos."
    );
  }

  const db = getDb();

  const plan =
    getPlanByPackage(
      packageId
    );

  const userRef =
    db
      .collection("users")
      .doc(userId);

  const paymentRef =
    db
      .collection(
        "payment_logs"
      )
      .doc(
        String(paymentId)
      );

  await db.runTransaction(
    async (transaction) => {
      const paymentSnap =
        await transaction.get(
          paymentRef
        );

      if (
        paymentSnap.exists &&
        paymentSnap.data()
          ?.status ===
          "credited"
      ) {
        return;
      }

      const userSnap =
        await transaction.get(
          userRef
        );

      const currentCredits =
        userSnap.exists
          ? userSnap.data()
              ?.credits || 0
          : 0;

      transaction.set(
        userRef,
        {
          uid: userId,

          credits:
            currentCredits +
            credits,

          plan,

          lastPurchaseAt:
            admin.firestore
              .FieldValue
              .serverTimestamp(),

          updatedAt:
            admin.firestore
              .FieldValue
              .serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      transaction.set(
        paymentRef,
        {
          userId,
          credits,
          amount,
          packageId,
          plan,
          paymentId,
          provider,

          status:
            "credited",

          createdAt:
            admin.firestore
              .FieldValue
              .serverTimestamp(),
        }
      );

      transaction.set(
        userRef
          .collection(
            "credit_logs"
          )
          .doc(),
        {
          type:
            "purchase",

          credits,
          amount,
          packageId,
          plan,
          paymentId,
          provider,

          status:
            "completed",

          createdAt:
            admin.firestore
              .FieldValue
              .serverTimestamp(),
        }
      );
    }
  );
}

// ======================================================
// HEALTH
// ======================================================

app.get(
  "/api/health",
  (_req, res) => {
    res.json({
      status: "ok",
      project: "Magia das Crenças",
      database: FIRESTORE_DATABASE_ID,
      gemini: {
        route: "/api/gemini/chat",
        source: "api/gemini/chat.ts",
        duplicatedInServer: false,
      },
    });
  }
);

// ======================================================
// REGISTRATION SECURITY
// ======================================================

app.post(
  "/api/security/register-check",
  async (req, res) => {
    try {
      const ip =
        getClientIp(req);

      const {
        email,
        deviceId,
        browser,
        sessionSign,
        uid,
      } = req.body;

      const result =
        await checkRegistrationFraud(
          {
            email,
            deviceId,
            browser,
            sessionSign,
            ip,
          }
        );

      await securityLog({
        type:
          "register_check",

        uid:
          uid || "",

        email:
          normalizeText(
            email || ""
          ),

        ip,

        deviceId:
          deviceId ||
          "dev_not_tracked",

        browser:
          browser ||
          "unknown",

        sessionSign:
          sessionSign ||
          "unknown",

        creditsGranted:
          result.initialCredits,

        promotionalCreditsBlocked:
          result.promotionalCreditsBlocked,

        fraudReasons:
          result.fraudReasons,
      });

      res.json({
        success: true,
        ip,
        ...result,
      });
    } catch (error: any) {
      console.error(
        "[REGISTER_CHECK_ERROR]",
        error
      );

      res.status(500).json({
        success: false,

        error:
          "Erro ao verificar segurança do cadastro.",
      });
    }
  }
);

// ======================================================
// CRIAÇÃO DE PAGAMENTO
// ======================================================

app.post(
  "/api/payments/create",
  async (req, res) => {
    try {
      const {
        packageId,
        userEmail,
        userName,
        userId,
      } = req.body;

      if (
        !userId ||
        !packageId
      ) {
        return res
          .status(400)
          .json({
            error:
              "Dados de pagamento incompletos.",
          });
      }

      if (
        !process.env
          .MERCADO_PAGO_ACCESS_TOKEN
      ) {
        return res
          .status(500)
          .json({
            error:
              "MERCADO_PAGO_ACCESS_TOKEN não configurado.",
          });
      }

      const plans:
        Record<string, any> =
        {
          silver: {
            packageId:
              "silver",

            title:
              "Plano Prata",

            amount: 49,

            credits: 50,
          },

          prata: {
            packageId:
              "silver",

            title:
              "Plano Prata",

            amount: 49,

            credits: 50,
          },

          gold: {
            packageId:
              "gold",

            title:
              "Plano Ouro",

            amount: 120,

            credits: 125,
          },

          ouro: {
            packageId:
              "gold",

            title:
              "Plano Ouro",

            amount: 120,

            credits: 125,
          },
        };

      const selected =
        plans[
          normalizeText(
            packageId
          )
        ];

      if (!selected) {
        return res
          .status(400)
          .json({
            error:
              "Plano inválido.",
          });
      }

      await securityLog({
        type:
          "payment_create_attempt",

        userId,

        userEmail:
          userEmail || "",

        packageId:
          selected.packageId,

        amount:
          selected.amount,

        credits:
          selected.credits,

        ip:
          getClientIp(req),

        userAgent:
          req.headers[
            "user-agent"
          ] || "unknown",
      });

      const preference =
        new Preference(mp);

      const result: any =
        await preference.create({
          body: {
            items: [
              {
                id:
                  selected.packageId,

                title:
                  selected.title,

                quantity: 1,

                currency_id:
                  "BRL",

                unit_price:
                  Number(
                    selected.amount
                  ),
              },
            ],

            payer: {
              email:
                userEmail ||
                undefined,

              name:
                userName ||
                undefined,
            },

            metadata: {
              userId,
              user_id:
                userId,

              packageId:
                selected.packageId,

              package_id:
                selected.packageId,

              credits:
                Number(
                  selected.credits
                ),

              amount:
                Number(
                  selected.amount
                ),

              project:
                "magia-das-crencas",
            },

            back_urls: {
              success:
                `${APP_URL}/?payment=success&credits=${selected.credits}`,

              failure:
                `${APP_URL}/?payment=failure`,

              pending:
                `${APP_URL}/?payment=pending`,
            },

            auto_return:
              "approved",

            notification_url:
              `${APP_URL}/api/payments/webhook`,
          },
        });

      return res.json({
        checkoutUrl:
          result.init_point ||
          result.sandbox_init_point,

        preferenceId:
          result.id,
      });
    } catch (error: any) {
      console.error(
        "[PAYMENT_CREATE_ERROR]",
        error
      );

      await securityLog({
        type:
          "payment_create_error",

        error:
          error.message ||
          String(error),

        ip:
          getClientIp(req),
      });

      return res
        .status(500)
        .json({
          error:
            "Erro ao criar pagamento.",

          details:
            error.message ||
            "Erro desconhecido.",
        });
    }
  }
);

// ======================================================
// MERCADO PAGO WEBHOOK
// ======================================================

app.post(
  "/api/payments/webhook",
  async (req, res) => {
    try {
      const paymentId =
        req.body?.data?.id ||
        req.body?.id ||
        req.query?.id ||
        req.query?.[
          "data.id"
        ];

      if (!paymentId) {
        return res
          .status(200)
          .json({
            received: true,
          });
      }

      const payment =
        new Payment(mp);

      const paymentData: any =
        await payment.get({
          id:
            String(paymentId),
        });

      const status =
        paymentData?.status;

      const metadata =
        paymentData?.metadata ||
        {};

      await getDb()
        .collection(
          "payment_webhooks"
        )
        .doc(
          String(paymentId)
        )
        .set(
          {
            paymentId:
              String(
                paymentId
              ),

            status,

            metadata,

            raw:
              paymentData,

            receivedAt:
              admin.firestore
                .FieldValue
                .serverTimestamp(),
          },
          {
            merge: true,
          }
        );

      if (
        status === "approved"
      ) {
        await grantCredits({
          userId:
            metadata.userId ||
            metadata.user_id,

          credits:
            Number(
              metadata.credits ||
              0
            ),

          amount:
            Number(
              metadata.amount ||
              paymentData
                .transaction_amount ||
              0
            ),

          packageId:
            metadata.packageId ||
            metadata.package_id ||
            "silver",

          paymentId:
            String(paymentId),

          provider:
            "mercadopago",
        });
      }

      return res
        .status(200)
        .json({
          received: true,
        });
    } catch (error: any) {
      console.error(
        "[PAYMENT_WEBHOOK_ERROR]",
        error
      );

      try {
        await getDb()
          .collection(
            "payment_errors"
          )
          .add({
            error:
              error.message ||
              String(error),

            body:
              req.body ||
              null,

            query:
              req.query ||
              null,

            createdAt:
              admin.firestore
                .FieldValue
                .serverTimestamp(),
          });
      } catch (
        logError
      ) {
        console.error(
          "[PAYMENT_ERROR_LOG_FAILED]",
          logError
        );
      }

      return res
        .status(200)
        .json({
          received: true,
        });
    }
  }
);

// ======================================================
// PAYMENT STATUS
// ======================================================

app.get(
  "/api/payments/status/:paymentId",
  async (req, res) => {
    try {
      const {
        paymentId,
      } = req.params;

      if (!paymentId) {
        return res
          .status(400)
          .json({
            success: false,

            error:
              "ID do pagamento não informado.",
          });
      }

      const payment =
        new Payment(mp);

      const paymentData: any =
        await payment.get({
          id:
            String(paymentId),
        });

      const status =
        paymentData?.status;

      const metadata =
        paymentData?.metadata ||
        {};

      if (
        status === "approved"
      ) {
        await grantCredits({
          userId:
            metadata.userId ||
            metadata.user_id,

          credits:
            Number(
              metadata.credits ||
              0
            ),

          amount:
            Number(
              metadata.amount ||
              paymentData
                .transaction_amount ||
              0
            ),

          packageId:
            metadata.packageId ||
            metadata.package_id ||
            "silver",

          paymentId:
            String(paymentId),

          provider:
            "mercadopago_status_check",
        });
      }

      return res.json({
        success: true,

        status,

        approved:
          status ===
          "approved",

        metadata,
      });
    } catch (error: any) {
      console.error(
        "[PAYMENT_STATUS_ERROR]",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          error:
            "Erro ao consultar pagamento.",
        });
    }
  }
);

// ======================================================
// MOCK DE PAGAMENTO
// SOMENTE DESENVOLVIMENTO
// ======================================================

app.get(
  "/api/payments/mock-success",
  async (req, res) => {
    if (
      process.env
        .NODE_ENV ===
      "production"
    ) {
      return res
        .status(403)
        .send(
          "Mock desativado em produção."
        );
    }

    try {
      const {
        userId,
        credits,
        packageId,
        amount,
      } = req.query;

      if (
        !userId ||
        !credits
      ) {
        return res
          .status(400)
          .send(
            "Dados inválidos."
          );
      }

      await grantCredits({
        userId:
          String(userId),

        credits:
          Number(credits),

        amount:
          Number(
            amount || 0
          ),

        packageId:
          String(
            packageId ||
            "silver"
          ),

        paymentId:
          `mock_${Date.now()}`,

        provider:
          "mercadopago_mock",
      });

      return res.redirect(
        `/?payment=success&credits=${credits}`
      );
    } catch (error: any) {
      console.error(
        "[MOCK_PAYMENT_ERROR]",
        error
      );

      return res
        .status(500)
        .send(
          error.message ||
          "Erro ao liberar créditos."
        );
    }
  }
);

// ======================================================
// FRONTEND ESTÁTICO
// ======================================================

const distPath =
  path.join(
    process.cwd(),
    "dist"
  );

app.use(
  express.static(
    distPath
  )
);

app.get(
  "*",
  (_req, res) => {
    res.sendFile(
      path.join(
        distPath,
        "index.html"
      )
    );
  }
);

export default app;