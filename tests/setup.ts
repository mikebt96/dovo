import "@testing-library/jest-dom/vitest";
import { beforeAll } from "vitest";

beforeAll(() => {
  // Carga vars de entorno de test desde .env.test.local si existe
  // Las vars de Supabase local quedan inyectadas por `supabase start`
});
