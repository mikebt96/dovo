// Genera el par de VAPID keys para Web Push (F8). Self-served: sin cuenta de terceros.
//   node scripts/gen-vapid.mjs
// Pega la salida en Vercel → Environment Variables (Production) y redeploy.
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log("VAPID_SUBJECT=mailto:hola@dovofit.com");
