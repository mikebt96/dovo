import { escape, shell, buttonHtml } from "./_shared";

type Resultado =
  | "ambos_cumplieron"
  | "uno_fallo"
  | "ambos_fallaron"
  | "sin_resolver";

function headline(
  resultado: Resultado,
  userCumplio: boolean | null,
): { headline: string; sub: string } {
  switch (resultado) {
    case "ambos_cumplieron":
      return {
        headline: "los dos cumplieron",
        sub: "denle gusto a la recompensa.",
      };
    case "ambos_fallaron":
      return {
        headline: "ninguno cumplió",
        sub: "los dos pagan el castigo.",
      };
    case "uno_fallo":
      if (userCumplio) {
        return {
          headline: "tú cumpliste",
          sub: "te toca la recompensa. el otro paga el castigo.",
        };
      }
      return {
        headline: "el otro cumplió",
        sub: "tú fallaste — te toca el castigo.",
      };
    case "sin_resolver":
      return {
        headline: "quedó sin resolver",
        sub: "hubo disputas. arréglenlo afuera de la app.",
      };
  }
}

export function closedEmail(params: {
  to_email: string;
  goal: string;
  trato_url: string;
  resultado: Resultado;
  user_cumplio: boolean | null;
}) {
  const { headline: title, sub } = headline(params.resultado, params.user_cumplio);

  const subject = `trato cerrado · ${title}`;

  const text = `tu trato cerró.

el trato: ${params.goal}
resultado: ${title}
${sub}

ver el resultado completo y la racha:
${params.trato_url}`;

  const bodyHtml = `
<p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6e6358;margin:0 0 8px;">trato cerrado</p>
<h1 style="font-family:'Syne',system-ui,sans-serif;font-size:32px;margin:0 0 8px;font-weight:600;">${escape(title)}</h1>
<p style="font-size:14px;color:#6e6358;margin:0 0 24px;line-height:1.5;">${escape(sub)}</p>

<div style="border-left:3px solid #0a0a0a;padding:12px 16px;margin:24px 0;background:#ffffff;">
<p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6e6358;margin:0 0 6px;">el trato</p>
<p style="font-family:'Syne',system-ui,sans-serif;font-size:18px;margin:0;">${escape(params.goal)}</p>
</div>

<div style="margin:32px 0;">
${buttonHtml(params.trato_url, "ver la racha completa")}
</div>

<p style="font-size:13px;color:#6e6358;line-height:1.5;margin:24px 0 0;">
recuerda: la recompensa y el castigo se ejecutan afuera de la app. dovo solo registra el resultado.
</p>
`;

  return {
    subject,
    html: shell({
      preheader: `${title} · ${params.goal}`,
      bodyHtml,
    }),
    text,
  };
}
