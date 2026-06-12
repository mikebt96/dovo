// Códigos estables de error de las server actions (F25·G22). Solo lo
// ENUMERABLE se codifica; lo no-enumerable (error.message de Supabase, los
// P0001 juguetones de los RPCs) viaja tal cual = status quo para usuarios es.
//
// Contrato de render (ApuestaSheet, AttackPanel, DuelScoreboard):
//   const msg = KNOWN_ERROR_CODES.has(err) ? t(`err.${err}`) : err;
// JAMÁS t() directo con clave desconocida — next-intl truena con
// MISSING_MESSAGE. Las claves viven en messages/{es,en}.json bajo el
// namespace que cada componente ya usa: apuesta.err.* y retos.err.*.
export const KNOWN_ERROR_CODES = new Set([
  // apuestas → apuesta.err.* (ApuestaSheet / ApuestaSaldarButton)
  "apuesta_campos",
  "apuesta_cerrada",
  "saldar_nada",
  "saldar_no_deudor",
  // retos · P0001 enumerables de core.cerrar_reto → retos.err.* (DuelScoreboard)
  "reto_no_existe",
  "reto_no_autorizado",
  "duelo_no_termina",
  // ataques · validaciones propias → retos.err.* (AttackPanel)
  "ataque_tipo_invalido",
  "ataque_no_enviado",
]);
