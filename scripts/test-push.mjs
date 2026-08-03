/**
 * Prueba de push: manda una notificación a todos los tokens registrados.
 * Uso: node scripts/test-push.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnv();

const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const secret = process.env.PUSH_WEBHOOK_SECRET || "iame-push-2026-bsproyect";

if (!base || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const url = `${base}/functions/v1/hyper-endpoint`;
const body = {
  title: "Prueba IAME Series",
  body: "Si ves esto, las notificaciones push funcionan 🏁",
};

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${serviceKey}`,
    "x-push-secret": secret,
  },
  body: JSON.stringify(body),
});

const text = await res.text();
console.log("status", res.status);
console.log(text);

if (!res.ok) process.exit(1);
