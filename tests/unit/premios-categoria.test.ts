import { describe, it, expect } from "vitest";
import {
  clasificarPremio,
  normalizarPremio,
  CATEGORIAS_PREMIO,
  LABEL_CATEGORIA,
} from "@/lib/analytics/premios";

describe("clasificarPremio", () => {
  it("clasifica los premios típicos del catálogo", () => {
    expect(clasificarPremio("ir al cine")).toBe("cine");
    expect(clasificarPremio("cena en nuestro restaurante favorito")).toBe("comida");
    expect(clasificarPremio("escapada de fin de semana")).toBe("viaje");
    expect(clasificarPremio("boletos para el concierto")).toBe("experiencia");
    expect(clasificarPremio("masaje en pareja")).toBe("spa-descanso");
    expect(clasificarPremio("tenis nuevos")).toBe("compras");
  });

  it("normaliza acentos y mayúsculas", () => {
    expect(clasificarPremio("Maratón de PELÍCULAS")).toBe("cine");
    expect(clasificarPremio("CAFÉ y postre")).toBe("cafe-postre");
  });

  it("respeta fronteras de palabra (espalda ⊅ spa, docena ⊅ cena)", () => {
    // "espalda" contiene "spa" como subcadena — NO debe clasificar spa-descanso
    expect(clasificarPremio("crema para la espalda")).toBe("otro");
    // "docena" contiene "cena" — debe ganar "donas" (cafe-postre), no comida
    expect(clasificarPremio("una docena de donas")).toBe("cafe-postre");
  });

  it("encuentra la palabra real aunque antes haya una ocurrencia incrustada", () => {
    // bug cazado por la revisión adversarial: solo se evaluaba la PRIMERA
    // ocurrencia — "cena" dentro de "docena" ocultaba la "cena" real
    expect(clasificarPremio("una docena de rosas y cena romántica")).toBe("comida");
    expect(clasificarPremio("crema para la espalda y día de spa")).toBe("spa-descanso");
  });

  it("la ñ es letra propia: doña no es dona, cabaña sí matchea", () => {
    // bug cazado: NFD + strip convertía "doña" → "dona" (cafe-postre)
    expect(normalizarPremio("doña")).toBe("doña");
    expect(clasificarPremio("cena en casa de doña Lupe")).toBe("comida");
    expect(clasificarPremio("tamales de doña Mari")).toBe("comida");
    expect(clasificarPremio("escapada a la cabaña")).toBe("viaje");
  });

  it("la prioridad del catálogo decide en textos mixtos", () => {
    // cine va antes que comida en el orden de categorías
    expect(clasificarPremio("ir al cine y cenar tacos")).toBe("cine");
    // viaje va antes que comida
    expect(clasificarPremio("desayuno en la playa")).toBe("viaje");
  });

  it("texto vacío o sin match → otro", () => {
    expect(clasificarPremio("")).toBe("otro");
    expect(clasificarPremio("   ")).toBe("otro");
    expect(clasificarPremio("xyzzy plugh")).toBe("otro");
  });

  it("toda categoría del catálogo tiene label (incluida otro)", () => {
    for (const c of CATEGORIAS_PREMIO) {
      expect(LABEL_CATEGORIA[c.key]).toBeTruthy();
    }
    expect(LABEL_CATEGORIA.otro).toBeTruthy();
  });

  it("keywords del catálogo ya están normalizadas (forma canónica del clasificador)", () => {
    for (const c of CATEGORIAS_PREMIO) {
      for (const kw of c.keywords) {
        expect(normalizarPremio(kw)).toBe(kw);
      }
    }
  });
});
