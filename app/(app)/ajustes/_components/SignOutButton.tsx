"use client";

import { useTransition } from "react";
import { signOut } from "@/lib/actions/profile";

export default function SignOutButton() {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      onClick={() => start(() => signOut())}
      disabled={pending}
      className="w-full border border-ink py-3 syne lowercase disabled:opacity-50 hover:bg-ink hover:text-papel transition-colors"
    >
      {pending ? "saliendo…" : "cerrar sesión"}
    </button>
  );
}
