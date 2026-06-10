// Tipos del meal plan (F5). UNA sola forma para sample y para IA: la UI no distingue
// la fuente salvo por el badge "plan base" (source='sample').

export type TipoComida = "desayuno" | "comida" | "cena" | "snack";

export type Comida = {
  tipo: TipoComida;
  nombre: string;
  descripcion: string;
  kcal: number;
  prot: number; // g
  carb: number; // g
  grasa: number; // g
};

export type DiaPlan = {
  dia: string; // lunes…domingo (clave i18n-neutral en es; la UI traduce con su propio mapa)
  comidas: Comida[];
};

export type PasilloSuper = {
  pasillo: string;
  items: string[];
};

export type MealPlanContent = {
  kcal_objetivo: number;
  macros: { prot: number; carb: number; grasa: number }; // g/día objetivo
  dias: DiaPlan[]; // 7, lunes→domingo
  lista_super: PasilloSuper[];
  nota?: string;
};

export type MealPlanRow = {
  id: string;
  week_start: string; // ISO date (lunes)
  source: "sample" | "ai";
  plan: MealPlanContent;
};

export type Restriccion =
  | "vegetariano"
  | "vegano"
  | "sin_gluten"
  | "sin_lactosa"
  | "sin_cerdo"
  | "sin_mariscos";

export const RESTRICCIONES: Restriccion[] = [
  "vegetariano",
  "vegano",
  "sin_gluten",
  "sin_lactosa",
  "sin_cerdo",
  "sin_mariscos",
];

export type NutritionProfile = {
  restricciones: Restriccion[];
  presupuesto: "bajo" | "medio" | "alto";
  comidas_por_dia: number;
  preferencias: string | null;
};

export type PerfilFisico = {
  peso_kg: number;
  altura_cm: number;
  edad: number;
  genero: string;
  nivel_actividad: "sedentario" | "ligero" | "moderado" | "activo" | "muy_activo";
  objetivo: "perder_grasa" | "ganar_musculo" | "mantener" | "mejorar_resistencia";
  bmr_calculado: number | null;
};
