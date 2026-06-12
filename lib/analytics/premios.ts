// ════════════════════════════════════════════════════════════════════
// INTELIGENCIA DE PREMIOS (mandato del founder 2026-06-12): los premios de
// LA APUESTA, agregados y anónimos, son el activo de negociación con marcas
// ("cuántos dúos van al cine" → descuento con la cadena de cines).
//
// Clasificador DETERMINISTA por palabras clave (mock-first, AI-ready): se
// clasifica AL LEER, nunca se persiste — mejorar el clasificador (o conectar
// IA con PREMIO_AI_LIVE en el futuro) recategoriza todo el histórico solo,
// sin migraciones. El texto individual jamás sale de aquí: solo la categoría.
// ════════════════════════════════════════════════════════════════════

export type CategoriaPremio =
  | "cine"
  | "viaje"
  | "experiencia"
  | "cafe-postre"
  | "comida"
  | "spa-descanso"
  | "tech-juegos"
  | "compras"
  | "hogar"
  | "otro";

// El ORDEN es la prioridad: la primera categoría que matchea gana
// ("ir al cine y cenar" → cine). Keywords ya normalizadas (minúsculas, sin
// acentos — la ñ se conserva: es letra propia); el match respeta fronteras
// de palabra en TODAS las ocurrencias para no caer en trampas tipo
// "espalda"⊃"spa" o "docena"⊃"cena".
export const CATEGORIAS_PREMIO: Array<{
  key: CategoriaPremio;
  label: string;
  keywords: string[];
}> = [
  {
    key: "cine",
    label: "cine y pelis",
    keywords: [
      "cine", "peli", "pelis", "pelicula", "peliculas", "imax",
      "cinepolis", "cinemex", "funcion", "estreno", "maraton de pelis",
      "netflix", "movie", "movies",
    ],
  },
  {
    key: "viaje",
    label: "viajes y escapadas",
    keywords: [
      "viaje", "viajar", "viajecito", "escapada", "fin de semana", "weekend",
      "playa", "pueblo magico", "hotel", "airbnb", "camping", "acampar",
      "roadtrip", "road trip", "vuelo", "cabaña", "trip",
    ],
  },
  {
    key: "experiencia",
    label: "experiencias y eventos",
    keywords: [
      "concierto", "boletos", "partido", "estadio", "museo", "teatro",
      "obra", "festival", "feria", "lucha libre", "luchas", "karaoke",
      "boliche", "escape room", "six flags", "go karts", "picnic",
      "parque de diversiones", "concert", "tickets",
    ],
  },
  {
    key: "cafe-postre",
    label: "café y postres",
    keywords: [
      "cafe", "cafecito", "postre", "postres", "helado", "helados", "nieve",
      "pastel", "pastelito", "dona", "donas", "churros", "waffles", "crepas",
      "boba", "matcha", "gelato", "frappe", "panaderia", "reposteria",
      "ice cream", "coffee", "dessert",
    ],
  },
  {
    key: "comida",
    label: "salir a comer",
    keywords: [
      "cena", "cenar", "cenita", "comer", "comida", "comidita", "restaurante",
      "restaurant", "tacos", "taquitos", "taquiza", "sushi", "pizza",
      "hamburguesa", "hamburguesas", "mariscos", "buffet", "brunch",
      "desayuno", "alitas", "ramen", "parrilla", "pozole", "antojitos",
      "tamales", "tamal", "dinner", "lunch",
    ],
  },
  {
    key: "spa-descanso",
    label: "spa y descanso",
    keywords: [
      "masaje", "masajes", "spa", "sauna", "facial", "manicure", "pedicure",
      "dormir tarde", "siesta", "dia libre", "descanso", "temazcal",
      "massage",
    ],
  },
  {
    key: "tech-juegos",
    label: "tech y juegos",
    keywords: [
      "audifonos", "gadget", "consola", "videojuego", "videojuegos",
      "juego de mesa", "switch", "playstation", "play 5", "xbox", "ipad",
      "tablet", "celular", "telefono", "smartwatch", "kindle", "dron",
      "lego", "bocina", "headphones",
    ],
  },
  {
    key: "compras",
    label: "ropa y compras",
    keywords: [
      "ropa", "tenis", "zapatos", "outfit", "bolsa", "vestido", "jersey",
      "gorra", "shopping", "compras", "sneakers", "maquillaje", "perfume",
      "joyeria", "reloj", "lentes", "mochila",
    ],
  },
  {
    key: "hogar",
    label: "hogar y plantas",
    keywords: [
      "planta", "plantas", "decoracion", "cobija", "velas", "cuadro",
      "maceta", "tapete", "cojines",
    ],
  },
];

export const LABEL_CATEGORIA: Record<CategoriaPremio, string> = Object.fromEntries(
  [...CATEGORIAS_PREMIO.map((c) => [c.key, c.label]), ["otro", "otros premios"]],
) as Record<CategoriaPremio, string>;

/** minúsculas + sin acentos — pero la ñ es letra propia del español:
 *  "Películas" → "peliculas", y "doña" NO colapsa a "dona" */
export function normalizarPremio(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    // strip de diacríticos EXCEPTO la virgulilla U+0303 (á→a, ü→u, ñ→ñ)
    .replace(/[\u0300-\u0302\u0304-\u036f]/g, "")
    .normalize("NFC");
}

/** match con frontera de palabra en TODAS las ocurrencias: "spa" NO matchea
 *  dentro de "espalda", pero "espalda y spa" SÍ encuentra el "spa" real */
function contienePalabra(texto: string, keyword: string): boolean {
  let idx = texto.indexOf(keyword);
  while (idx !== -1) {
    const antes = idx === 0 ? "" : texto[idx - 1];
    const despues = texto[idx + keyword.length] ?? "";
    if (!/[a-z0-9ñ]/.test(antes) && !/[a-z0-9ñ]/.test(despues)) return true;
    idx = texto.indexOf(keyword, idx + 1);
  }
  return false;
}

export function clasificarPremio(premioText: string): CategoriaPremio {
  const texto = normalizarPremio(premioText);
  if (!texto.trim()) return "otro";
  for (const cat of CATEGORIAS_PREMIO) {
    if (cat.keywords.some((kw) => contienePalabra(texto, kw))) return cat.key;
  }
  return "otro";
}
