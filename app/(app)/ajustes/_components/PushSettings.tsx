"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  getVapidPublicKey,
  removePushSubscription,
  saveNotificationPrefs,
  savePushSubscription,
  type NotificationPrefs,
} from "@/lib/actions/push";

// Ajustes de notificaciones (F8). El permiso del browser se pide SOLO tras gesto del
// usuario (botón), nunca on-load (roadmap: prompt contextual, no intrusivo). Estados:
//  · unsupported  → mensaje (iOS Safari sin A2HS, browsers viejos)
//  · off          → botón "activar avisos"
//  · on           → toggles de prefs + desactivar
// Fail-soft: sin VAPID_PUBLIC_KEY en el server, muestra "próximamente".
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type Estado = "loading" | "unsupported" | "soon" | "off" | "on";

export default function PushSettings({ initialPrefs }: { initialPrefs: NotificationPrefs }) {
  const t = useTranslations("ajustes");
  const [estado, setEstado] = useState<Estado>("loading");
  const [prefs, setPrefs] = useState(initialPrefs);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setEstado("unsupported");
        return;
      }
      const vapid = await getVapidPublicKey();
      if (!vapid) {
        setEstado("soon");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        setEstado(sub && Notification.permission === "granted" ? "on" : "off");
      } catch {
        setEstado("unsupported");
      }
    })();
  }, []);

  function enable() {
    setErr(null);
    startTransition(async () => {
      try {
        const vapid = await getVapidPublicKey();
        if (!vapid) {
          setEstado("soon");
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setErr(t("pushDenied"));
          return;
        }
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
        });
        const json = sub.toJSON();
        const res = await savePushSubscription({
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        });
        if (!res.ok) {
          setErr(res.error);
          return;
        }
        setEstado("on");
      } catch (e) {
        setErr(e instanceof Error ? e.message : t("pushError"));
      }
    });
  }

  function disable() {
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await removePushSubscription(sub.endpoint);
          await sub.unsubscribe();
        }
        setEstado("off");
      } catch {
        setEstado("off");
      }
    });
  }

  function togglePref(key: keyof NotificationPrefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    startTransition(async () => {
      const res = await saveNotificationPrefs(next);
      if (!res.ok) setErr(res.error);
    });
  }

  if (estado === "loading") {
    return <p className="text-xs mono uppercase tracking-wider opacity-40">…</p>;
  }
  if (estado === "unsupported") {
    return <p className="text-sm opacity-60 max-w-md leading-relaxed">{t("pushUnsupported")}</p>;
  }
  if (estado === "soon") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-[10px] mono uppercase tracking-[0.16em] opacity-50">
        🔔 {t("pushSoon")}
      </span>
    );
  }

  return (
    <div>
      {estado === "off" ? (
        <div>
          <p className="text-sm opacity-60 mb-4 max-w-md leading-relaxed">{t("pushPitch")}</p>
          <button
            type="button"
            onClick={enable}
            disabled={pending}
            className="bg-ink text-papel px-6 py-3 rounded-full display font-semibold lowercase hover:bg-signal hover:text-white transition-colors disabled:opacity-60"
          >
            {pending ? "…" : t("pushEnable")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {(
            [
              ["racha_riesgo", "pushPrefRacha"],
              ["checkin_companero", "pushPrefCheckin"],
              ["reto", "pushPrefReto"],
              ["recompensa", "pushPrefRecompensa"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => togglePref(key)}
              aria-pressed={prefs[key]}
              className="flex w-full items-center justify-between gap-4 rounded-xl border border-ink/10 px-4 py-3 text-left hover:border-signal/40 transition-colors"
            >
              <span className="text-sm">{t(label)}</span>
              <span
                className={`shrink-0 h-5 w-9 rounded-full transition-colors relative ${
                  prefs[key] ? "bg-signal" : "bg-ink/15"
                }`}
              >
                <span
                  className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                  style={{ transform: prefs[key] ? "translateX(16px)" : undefined }}
                />
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={disable}
            disabled={pending}
            className="text-[11px] mono uppercase tracking-[0.14em] underline decoration-signal/40 underline-offset-4 opacity-60 hover:opacity-100"
          >
            {t("pushDisable")}
          </button>
        </div>
      )}
      {err && (
        <p className="text-xs mono uppercase tracking-wider text-red-600/80 mt-3">{err}</p>
      )}
    </div>
  );
}
