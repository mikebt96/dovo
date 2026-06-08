// Riel de progreso del onboarding (2 pasos). Premium pero discreto: dos segmentos,
// el actual/completado en signal, el pendiente en track. Acompaña al eyebrow "paso n de 2".
export default function OnboardingProgress({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex w-full items-center gap-2" aria-hidden>
      <span className="h-1 flex-1 rounded-full bg-signal" />
      <span
        className={`h-1 flex-1 rounded-full transition-colors ${
          step >= 2 ? "bg-signal" : "bg-papel-dark"
        }`}
      />
    </div>
  );
}
