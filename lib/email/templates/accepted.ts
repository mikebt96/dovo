import { escape, shell, buttonHtml } from "./_shared";

export function acceptedEmail(params: {
  partner_email: string;
  goal: string;
  trato_url: string;
}) {
  const subject = `${params.partner_email} aceptó el trato`;

  const text = `${params.partner_email} aceptó tu trato en dovo.

el trato: ${params.goal}

el trato ya está activo. abre la app para hacer tu primer check-in:
${params.trato_url}`;

  const bodyHtml = `
<p style="font-size:15px;line-height:1.5;margin:0 0 16px;">
<strong>${escape(params.partner_email)}</strong> aceptó tu trato. ya está corriendo.
</p>

<div style="border-left:3px solid #0a0a0a;padding:12px 16px;margin:24px 0;background:#ffffff;">
<p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6e6358;margin:0 0 6px;">el trato</p>
<p style="font-family:'Syne',system-ui,sans-serif;font-size:18px;margin:0;">${escape(params.goal)}</p>
</div>

<div style="margin:32px 0;">
${buttonHtml(params.trato_url, "ir al trato y hacer check-in")}
</div>

<p style="font-size:13px;color:#6e6358;line-height:1.5;margin:24px 0 0;">
desde hoy cada quien marca si cumplió. al final del período se calcula quién pagó la apuesta.
</p>
`;

  return {
    subject,
    html: shell({
      preheader: `${params.partner_email} aceptó el trato — ya está corriendo`,
      bodyHtml,
    }),
    text,
  };
}
