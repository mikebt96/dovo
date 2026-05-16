import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getShoppingFor, totalCost } from "@/lib/data/shopping";
import CheckList from "@/app/components/CheckList";

export default async function SuperPage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile: profileParam } = await params;
  const profile = getProfile(profileParam);
  if (!profile) notFound();

  const items = getShoppingFor(profile.id);
  const myItems = items.filter((i) => i.user === profile.id);
  const sharedItems = items.filter((i) => i.user === "shared");
  const total = totalCost(items);
  const myTotal = totalCost(myItems);

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = `${item.store}__${item.category}`;
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  const checkItems = items.map((it) => ({
    id: it.id,
    primary: (
      <div>
        <p className="font-bold text-sm leading-tight">
          {it.name}
          {it.user !== "shared" && (
            <span
              className="ml-2 mono text-[9px] uppercase tracking-widest"
              style={{ color: profile.color }}
            >
              · solo {it.user === profile.id ? "tuyo" : it.user}
            </span>
          )}
        </p>
        {it.subtitle && (
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            {it.subtitle}
          </p>
        )}
      </div>
    ),
    meta: (
      <div className="text-right">
        <p
          className="mono text-[10px]"
          style={{ color: "var(--color-accent)" }}
        >
          {it.qty}
        </p>
        <p className="mono text-[10px] text-[var(--color-muted)]">
          ~${it.priceMxn}
        </p>
      </div>
    ),
  }));

  return (
    <div className="space-y-6">
      <header>
        <p className="mono text-[10px] text-[var(--color-muted)] mb-1">
          Lista de súper
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Tu compra de la semana
        </h1>
        <p className="text-sm text-[var(--color-muted)] max-w-xl">
          Mostrando tus productos específicos + los compartidos con{" "}
          {profile.partnerId === "mike" ? "Mike" : "Andy"}. Marca cada uno al
          echarlo al carrito.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <StatBox
          label="Total semana"
          value={`$${total}`}
          color="var(--color-accent)"
        />
        <StatBox
          label="Tuyo específico"
          value={`${myItems.length} items`}
          color={profile.color}
        />
        <StatBox
          label="Compartido"
          value={`${sharedItems.length} items`}
          color="var(--color-muted)"
        />
      </section>

      <section className="card overflow-hidden">
        <header className="px-5 py-4 border-b border-[var(--color-border)]">
          <p className="mono text-[10px] text-[var(--color-accent)] uppercase tracking-widest mb-1">
            Todo en orden de pasillo
          </p>
          <h2 className="font-extrabold text-lg">
            {items.length} productos
          </h2>
        </header>
        <CheckList
          storageKey={`super-${profile.id}`}
          items={checkItems}
          accent={profile.color}
        />
      </section>

      <p className="mono text-[10px] text-[var(--color-dim)] text-center">
        Cada marca se guarda en este navegador. Sincroniza a la nube en Fase 2.
      </p>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card p-3">
      <p className="mono text-[10px] text-[var(--color-muted)]">{label}</p>
      <p
        className="font-extrabold text-lg tracking-tight mt-1"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}
