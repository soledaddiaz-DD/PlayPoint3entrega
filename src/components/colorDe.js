const COLORES = ["#0d152c", "#ff2d60", "#4a90d9", "#9b59b6", "#f6c90e", "#2bb673"];

/** Color fijo para cada persona, así su círculo siempre se ve igual. */
export function colorDe(texto = "") {
  let h = 0;
  for (const ch of texto) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORES[h % COLORES.length];
}
