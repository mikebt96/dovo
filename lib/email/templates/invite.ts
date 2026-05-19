import { escape, shell, buttonHtml } from "./_shared";

export function inviteEmail(params: {
  partner_email: string;
  creator_name: string;
  goal: string;
  invite_url: string;
}) {
  const subject = `${params.creator_name} te invitó a un trato`;

  const text = `${params.creator_name} te invitó a un trato en dovo.

el trato: ${params.goal}

para aceptar:
${params.invite_url}

dovo es una herramienta para hacer tratos entre dos personas: cada uno marca si cumplió, al final ven quién falló y se aplican la recompensa o el castigo que acordaron. nada de custodia de dinero — eso lo arreglan ustedes afuera.

el link expira en 7 días.`;

  const bodyHtml = `
<p style="font-size:15px;line-height:1.5;margin:0 0 16px;">
<strong>${escape(params.creator_name)}</strong> te invitó a un trato en dovo.
</p>

<div style="border-left:3px solid #0a0a0a;padding:12px 16px;margin:24px 0;background:#ffffff;">
<p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6e6358;margin:0 0 6px;">el trato</p>
<p style="font-family:'Syne',system-ui,sans-serif;font-size:18px;margin:0;">${escape(params.goal)}</p>
</div>

<div style="margin:32px 0;">
${buttonHtml(params.invite_url, "ver el trato y aceptar")}
</div>

<p style="font-size:13px;color:#6e6358;line-height:1.5;margin:24px 0 0;">
dovo es para hacer tratos entre dos personas: cada quien marca si cumplió, al final ven quién falló y se aplican la recompensa o el castigo que acordaron. la lana no la toca dovo — eso se arregla afuera.
</p>

<p style="font-size:12px;color:#6e6358;margin:24px 0 0;">
el link expira en 7 días.
</p>
`;

  return {
    subject,
    html: shell({
      preheader: `${params.creator_name} te invitó: ${params.goal}`,
      bodyHtml,
    }),
    text,
  };
}
