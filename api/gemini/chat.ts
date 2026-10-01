import consultHandler from "../consult";

// Backward-compatible alias routing to the secured consult engine
export default async function handler(req: any, res: any) {
  return consultHandler(req, res);
}
