// Stub mínimo de tipos Supabase.
//
// REGENERAR antes de prod con:
//   npm run db:types
//
// Esto requiere `supabase start` corriendo localmente (Docker integrado WSL).
// Mientras tanto, los clientes en lib/supabase/{client,server,middleware}.ts
// quedan tipados con un Database "abierto" — pierden auto-complete pero el
// build no rompe.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  core: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          nombre: string;
          pulse_opt_out: boolean;
          access_channel: "curated" | "fcfs";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nombre: string;
          pulse_opt_out?: boolean;
          access_channel: "curated" | "fcfs";
        };
        Update: Partial<Database["core"]["Tables"]["users"]["Insert"]>;
      };
      tratos: {
        Row: {
          id: string;
          creator_id: string;
          partner_id: string;
          goal: string;
          frecuencia: string;
          duracion_dias: number;
          recompensa_text: string;
          castigo_text: string;
          estado: "pendiente_aceptacion" | "activo" | "cerrado" | "disputado";
          resultado:
            | "ambos_cumplieron"
            | "uno_fallo"
            | "ambos_fallaron"
            | "sin_resolver"
            | null;
          sponsored_id: string | null;
          created_at: string;
          accepted_at: string | null;
          closed_at: string | null;
          updated_at: string;
        };
        Insert: Omit<
          Database["core"]["Tables"]["tratos"]["Row"],
          "id" | "estado" | "resultado" | "created_at" | "accepted_at" | "closed_at" | "updated_at"
        > & { estado?: Database["core"]["Tables"]["tratos"]["Row"]["estado"] };
        Update: Partial<Database["core"]["Tables"]["tratos"]["Insert"]>;
      };
      checkins: {
        Row: {
          id: string;
          trato_id: string;
          user_id: string;
          fecha: string;
          cumplido: boolean;
          nota: string | null;
          disputed_by: string | null;
          disputed_reason: string | null;
          disputed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["core"]["Tables"]["checkins"]["Row"], "id" | "created_at" | "disputed_by" | "disputed_reason" | "disputed_at"> & {
          disputed_by?: string | null;
          disputed_reason?: string | null;
          disputed_at?: string | null;
        };
        Update: Partial<Database["core"]["Tables"]["checkins"]["Insert"]>;
      };
      user_scores: {
        Row: {
          user_id: string;
          tratos_cerrados: number;
          tratos_cumplidos: number;
          score_publico: number;
          visibility: "hidden" | "duos_con_trato" | "publico";
          updated_at: string;
        };
        Insert: {
          user_id: string;
          visibility?: "hidden" | "duos_con_trato" | "publico";
        };
        Update: Partial<Database["core"]["Tables"]["user_scores"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
  pulse: {
    Tables: {
      eventos_agregados: {
        Row: {
          id: number;
          ingested_at: string;
          categoria: string;
          duracion_dias_bucket: string;
          tasa_cumplimiento_bucket: string;
          cohorte_edad: string;
          cohorte_ciudad: string;
          es_patrocinado: boolean;
          dow_creacion: number;
        };
        Insert: Omit<Database["pulse"]["Tables"]["eventos_agregados"]["Row"], "id" | "ingested_at">;
        Update: Partial<Database["pulse"]["Tables"]["eventos_agregados"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
