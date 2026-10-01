import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import webhookHandler, { verifyWebhookSignature } from "../api/payments/webhook";

function createMockReqRes(options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
}) {
  const req = {
    method: options.method || "POST",
    headers: options.headers || {},
    body: options.body || {},
    query: options.query || {},
    socket: { remoteAddress: "127.0.0.1" },
  };

  let statusCode = 200;
  let responseData: any = null;

  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      responseData = data;
      return res;
    },
    getStatus: () => statusCode,
    getData: () => responseData,
  };

  return { req, res };
}

describe("Mercado Pago Webhook Security Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it("P0-7: rejeita com fail-closed se MERCADO_PAGO_WEBHOOK_SECRET ausente em produção", () => {
    process.env.NODE_ENV = "production";
    delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    delete process.env.ALLOW_INSECURE_WEBHOOK_DEV;

    const req = {
      headers: {
        "x-signature": "ts=123,v1=abc",
        "x-request-id": "req-1",
      },
    };

    const result = verifyWebhookSignature(req);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("secret_not_configured");
  });

  it("P0-8 & P0-9: rejeita assinatura se timestamp estiver expirado (> 5 min)", () => {
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = "test_secret_123";
    const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 6.6 minutes ago

    const req = {
      headers: {
        "x-signature": `ts=${oldTimestamp},v1=somehash`,
        "x-request-id": "req-1",
      },
      query: { "data.id": "12345" },
    };

    const result = verifyWebhookSignature(req);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("timestamp_expired");
  });

  it("P0-8: rejeita assinatura com HMAC incorreto", () => {
    const secret = "test_secret_123";
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = secret;
    const now = Math.floor(Date.now() / 1000);

    const req = {
      headers: {
        "x-signature": `ts=${now},v1=0000000000000000000000000000000000000000000000000000000000000000`,
        "x-request-id": "req-1",
      },
      query: { "data.id": "12345" },
    };

    const result = verifyWebhookSignature(req);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("signature_mismatch");
  });

  it("P0-8 & P0-9: valida com sucesso quando HMAC e timestamp são corretos", () => {
    const secret = "test_secret_123";
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = secret;
    const now = Math.floor(Date.now() / 1000);
    const dataId = "987654";
    const xRequestId = "uuid-req-456";

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${now};`;
    const validHmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

    const req = {
      headers: {
        "x-signature": `ts=${now},v1=${validHmac}`,
        "x-request-id": xRequestId,
      },
      query: { "data.id": dataId },
    };

    const result = verifyWebhookSignature(req);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("P0-14: handler responde com HTTP 401 se assinatura for inválida", async () => {
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = "secret_key";
    const { req, res } = createMockReqRes({
      method: "POST",
      headers: {
        "x-signature": "ts=100,v1=invalid",
        "x-request-id": "123",
      },
    });

    await webhookHandler(req, res);
    expect(res.getStatus()).toBe(401);
  });
});
