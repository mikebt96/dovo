export type ProfileId = "mike" | "andy";
export type DayKey = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";

export interface Profile {
  id: ProfileId;
  displayName: string;
  color: string;
  baselineKcal: number;
  baselineProteinG: number;
}

export interface Meal {
  id: string;                     // 'lun-mk-1'
  day: DayKey;
  user: ProfileId;
  slot: number;                   // 1-4
  time: string;                   // '7:00 AM'
  slotName: string;               // 'Desayuno' | 'Comida' | 'Post-gym' | 'Cena'
  name: string;
  ingredients: string;
  prepInstructions?: string;
  kcal: number;
  proteinG: number;
}

export interface ExerciseSet {
  reps: number;
  weightKg?: number;
  rpe?: number;
}

export interface Exercise {
  id: string;                     // 'e-lun-2'
  day: DayKey;
  order: number;
  name: string;
  description: string;
  sets: number;
  repsRange: string;              // '10-12'
  isCircuit?: boolean;
  isSuperset?: boolean;
  starred?: boolean;
  starredFor?: ProfileId;         // ⭐ glúteo Andy, etc.
  weightMike?: string;
  weightAndy?: string;
}

export interface DayPlan {
  key: DayKey;
  label: string;                  // 'Lunes'
  focus: string;
  hasTraining: boolean;
  trainingTogether: boolean;      // false on Mar/Jue/Sab (Mike solo, Andy ballet)
  trainingTitle?: string;
  trainingDuration?: string;
  warmup?: string;
  cardio?: string;
  notes?: string;
}

export interface ShoppingItem {
  id: string;
  user: ProfileId | "shared";
  category: string;               // "Proteínas base" | "Lácteos" | "Frutas y verduras" | …
  name: string;
  subtitle?: string;
  qty: string;
  priceMxn: number;               // fallback estimado; el precio real viene de price_snapshots
  productId?: string;             // FK al catálogo canónico (`products.id`)
}

// ---------- DIETARY PREFERENCES (per profile) ----------
export type DietaryTag =
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "keto"
  | "paleo"
  | "no-gluten"
  | "no-dairy"
  | "no-eggs";

export interface DietaryProfile {
  postalCode?: string;
  dietaryTags: DietaryTag[];
  allergens: string[];
  dislikedIngredients: string[];
  likedIngredients: string[];
  dislikedTextures: string[];
  maxMealKcal?: number;
  notesForAi?: string;
}

export interface NotificationSettings {
  phoneE164?: string;             // E.164 con o sin '+'; el cliente WA normaliza
  whatsappOptIn: boolean;
}

// ---------- PRICE SCRAPING ----------
export type StoreId = "walmart" | "soriana" | "chedraui" | "sumesa";

export interface CanonicalProduct {
  id: string;
  canonicalName: string;
  category: string;
  unit: "piezas" | "g" | "ml" | "L";
  unitQty: number;
  tags: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  containsDairy: boolean;
  containsEggs: boolean;
  containsGluten: boolean;
}

export interface PriceSnapshot {
  productId: string;
  storeId: StoreId;
  postalCode?: string;
  priceMxn: number;
  pricePerUnit?: number;
  inStock: boolean;
  promoLabel?: string;
  sourceUrl?: string;
  scrapedAt: string;
}

export interface BestPriceResult {
  productId: string;
  bestStore: StoreId;
  bestPriceMxn: number;
  savingsVsWorst: number;          // diferencia entre el más caro y el más barato
  allPrices: PriceSnapshot[];
}

// ---------- AI MEAL REPLAN ----------
export interface MealChange {
  originalId: string;
  newName: string;
  newIngredients: string;
  newPrepInstructions?: string;
  reason: string;                  // por qué la AI cambió esta meal
}

export interface PrepTask {
  id: string;
  user: ProfileId | "shared";
  order: number;
  title: string;
  duration: string;
  content: string;
}

export interface RewardSeed {
  name: string;
  description?: string;
  category: "ropa" | "cine" | "gym_gear" | "suplementos" | "experiencia" | "custom";
  costCoins: number;
  requiresBoth: boolean;
}

export interface PenaltySeed {
  name: string;
  description?: string;
  category: "domestico" | "convivencia" | "economico" | "disciplina";
  severity: 1 | 2 | 3;
}
