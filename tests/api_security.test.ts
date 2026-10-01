import { describe, it, expect, vi } from "vitest";
import consultHandler from "../api/consult";
import registerCheckHandler from "../api/security/register-check";
import paymentCreateHandler from "../api/payments/create";
import paymentStatusHandler from "../api/payments/status";

import accountDeleteHandler from "../api/account/delete";
import accountDeleteHistoryHandler from "../api/account/delete-history";

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

describe("API Security & Authentication Tests", () => {
  it("rejeita /api/consult sem token com HTTP 401", async () => {
    const { req, res } = createMockReqRes({
      method: "POST",
      body: { message: "Consulta sem token" },
    });

    await consultHandler(req, res);
    expect(res.getStatus()).toBe(401);
    expect(res.getData().success).toBe(false);
  });

  it("rejeita /api/consult com método inválido (GET) com HTTP 405", async () => {
    const { req, res } = createMockReqRes({
      method: "GET",
    });

    await consultHandler(req, res);
    expect(res.getStatus()).toBe(405);
  });

  it("rejeita /api/payments/create sem token com HTTP 401", async () => {
    const { req, res } = createMockReqRes({
      method: "POST",
      body: { packageId: "gold" },
    });

    await paymentCreateHandler(req, res);
    expect(res.getStatus()).toBe(401);
    expect(res.getData().success).toBe(false);
  });

  it("rejeita /api/payments/status sem token com HTTP 401", async () => {
    const { req, res } = createMockReqRes({
      method: "GET",
      query: { paymentId: "12345" },
    });

    await paymentStatusHandler(req, res);
    expect(res.getStatus()).toBe(401);
  });

  it("rejeita /api/security/register-check sem token com HTTP 401", async () => {
    const { req, res } = createMockReqRes({
      method: "POST",
      body: { deviceId: "dev_123" },
    });

    await registerCheckHandler(req, res);
    expect(res.getStatus()).toBe(401);
  });

  it("rejeita /api/account/delete sem token com HTTP 401", async () => {
    const { req, res } = createMockReqRes({
      method: "POST",
    });

    await accountDeleteHandler(req, res);
    expect(res.getStatus()).toBe(401);
  });

  it("rejeita /api/account/delete-history sem token com HTTP 401", async () => {
    const { req, res } = createMockReqRes({
      method: "POST",
    });

    await accountDeleteHistoryHandler(req, res);
    expect(res.getStatus()).toBe(401);
  });
});
