// HTML escape para variables dinámicas del user (goal, partner_email, etc).
// Previene HTML injection si alguien pone "<script>" en el texto del trato.
export function escape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Wrapper HTML común para todos los emails. Inline CSS, sin webfonts pesados
// (Syne se intenta cargar pero hay fallback a system sans). Max-width 600px.
export function shell({
  preheader,
  bodyHtml,
}: {
  preheader: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>dovo</title>
</head>
<body style="margin:0;padding:0;background:#f5f1ea;font-family:system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif;color:#0a0a0a;font-weight:300;">
<div style="display:none;font-size:1px;color:#f5f1ea;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escape(preheader)}</div>
<div style="max-width:560px;margin:0 auto;padding:48px 24px;">
<div style="font-family:'Syne',system-ui,sans-serif;font-size:28px;letter-spacing:-0.02em;margin-bottom:48px;">dovo</div>
${bodyHtml}
<hr style="border:none;border-top:1px solid #cdc5b5;margin:48px 0 16px;" />
<p style="font-size:11px;color:#6e6358;text-transform:uppercase;letter-spacing:0.1em;margin:0;">
dovo · tratos entre dos · <a href="https://dovo.vercel.app/ajustes" style="color:#6e6358;text-decoration:underline;">ajustes</a>
</p>
</div>
</body>
</html>`;
}

export function buttonHtml(href: string, label: string): string {
  return `<a href="${escape(href)}" style="display:inline-block;background:#0a0a0a;color:#f5f1ea;padding:14px 24px;text-decoration:none;font-family:'Syne',system-ui,sans-serif;font-size:14px;letter-spacing:0.02em;">${escape(label)}</a>`;
}
