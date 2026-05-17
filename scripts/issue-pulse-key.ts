// Emite un JWT firmado con el secret de Supabase local, con role pulse_writer.
// Uso: tsx scripts/issue-pulse-key.ts
import { createHmac } from "node:crypto";

const SECRET = process.env.SUPABASE_LOCAL_JWT_SECRET;
if (!SECRET) {
  console.error("Set SUPABASE_LOCAL_JWT_SECRET (de `supabase status`)");
  process.exit(1);
}

const header = { alg: "HS256", typ: "JWT" };
const payload = {
  role: "pulse_writer",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
};

const b64 = (obj: unknown) =>
  Buffer.from(JSON.stringify(obj)).toString("base64url");

const data = `${b64(header)}.${b64(payload)}`;
const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
console.log(`${data}.${sig}`);
