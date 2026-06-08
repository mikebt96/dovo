"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  addWishlistItem,
  removeWishlistItem,
  type WishlistItem,
} from "@/lib/actions/rewards";

// Columna de wishlist de un miembro del dúo. La propia (isMe) permite agregar/quitar;
// la del partner es solo lectura (refuerza el "dúo" mostrando ambas lado a lado).
export default function WishlistColumn({
  nombre,
  isMe,
  items: initial,
}: {
  nombre: string;
  isMe: boolean;
  items: WishlistItem[];
}) {
  const t = useTranslations("recompensas");
  const [items, setItems] = useState<WishlistItem[]>(initial);
  const [val, setVal] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inicial = nombre.trim().charAt(0).toUpperCase() || "·";

  function add() {
    const titulo = val.trim();
    if (!titulo) return;
    setErr(null);
    start(async () => {
      const r = await addWishlistItem({ titulo });
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setItems((xs) => [...xs, { id: r.data.id, titulo, url: null }]);
      setVal("");
    });
  }

  function remove(id: string) {
    setItems((xs) => xs.filter((x) => x.id !== id));
    start(async () => {
      await removeWishlistItem(id);
    });
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <span className="grid place-items-center w-7 h-7 rounded-full bg-signal/12 text-signal display font-bold text-sm shrink-0">
          {inicial}
        </span>
        <span className="display font-semibold lowercase truncate">{nombre}</span>
      </div>

      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-ink/10 px-3 py-2 text-sm"
          >
            <span className="truncate">{it.titulo}</span>
            {isMe && (
              <button
                type="button"
                onClick={() => remove(it.id)}
                className="text-[10px] mono uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-signal transition-colors shrink-0"
              >
                {t("remove")}
              </button>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm opacity-50">{t("wishlistEmpty")}</li>
        )}
      </ul>

      {isMe && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
              placeholder={t("wishlistPlaceholder")}
              maxLength={80}
              className="flex-1 min-w-0 bg-transparent border-b border-ink/30 pb-1.5 text-sm focus:outline-none focus:border-signal"
            />
            <button
              type="button"
              onClick={add}
              disabled={pending}
              className="text-[11px] mono uppercase tracking-widest text-signal disabled:opacity-50 shrink-0"
            >
              {pending ? t("wishlistAdding") : t("wishlistAdd")}
            </button>
          </div>
          {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
        </div>
      )}
    </div>
  );
}
