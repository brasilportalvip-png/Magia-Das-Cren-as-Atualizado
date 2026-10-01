export default function handler(_req: any, res: any) {
  return res.status(200).json({
    status: "ok",
    service: "magia-das-crencas",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
}
