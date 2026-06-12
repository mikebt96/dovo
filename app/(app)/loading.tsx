// Skeleton editorial mientras las páginas server-render sus datos (force-dynamic).
// Sin spinners genéricos: bloques que respiran, on-brand.
export default function Loading() {
  return (
    <main className="min-h-svh px-6 py-10 bg-papel text-ink max-w-2xl lg:max-w-5xl mx-auto motion-safe:animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="h-7 w-20 bg-papel-dark rounded" />
        <div className="h-4 w-40 bg-papel-dark rounded" />
      </div>
      <div className="h-24 bg-papel-dark rounded-lg mb-8" />
      <div className="lg:grid lg:grid-cols-2 lg:gap-10">
        <div className="space-y-3 mb-8 lg:mb-0">
          <div className="h-16 bg-papel-dark rounded-lg" />
          <div className="h-16 bg-papel-dark rounded-lg" />
          <div className="h-16 bg-papel-dark rounded-lg" />
        </div>
        <div className="space-y-3">
          <div className="h-16 bg-papel-dark rounded-lg" />
          <div className="h-16 bg-papel-dark rounded-lg" />
        </div>
      </div>
    </main>
  );
}
