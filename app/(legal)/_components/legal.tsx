// Componentes presentacionales compartidos entre /privacidad y /terminos.
// Mantienen tipografía consistente con el resto del sistema de marca dovo.

export function LegalTitle({
  title,
  version,
  date,
  draft = true,
}: {
  title: string;
  version: string;
  date: string;
  draft?: boolean;
}) {
  return (
    <header className="mb-10">
      <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
        {draft ? "borrador en revisión" : "vigente"}
      </p>
      <h1 className="syne text-4xl lowercase mb-3">{title}</h1>
      <p className="text-xs mono opacity-60">
        versión {version} · actualizado {date}
      </p>
    </header>
  );
}

export function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 pb-2">
      <h2 className="syne text-xl lowercase mb-4 border-t border-ink/30 pt-6">
        <span className="opacity-50 mr-2">{n}.</span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <aside className="border-l-2 border-amber-400 pl-4 py-2 mb-10 text-sm opacity-80">
      {children}
    </aside>
  );
}

export function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-2 pl-5 list-disc marker:opacity-50">{children}</ul>;
}

export function Footer() {
  return (
    <footer className="mt-16 pt-6 border-t border-ink/20 text-xs opacity-60">
      <p>
        Borrador 0.1. Sujeto a revisión por abogado de privacidad antes del
        soft launch. No publicar como definitivo sin esa revisión.
      </p>
    </footer>
  );
}
