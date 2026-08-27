export interface Season {
  id: string;
  year: number;
  name: string;
  is_active: boolean;
  regular_rounds: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  sort_order: number;
  color: string | null;
  is_active: boolean;
}

export interface Round {
  id: string;
  season_id: string;
  round_number: number;
  /** Clave de inscripción/turnos (ej. fecha-6, final-iame). Editable en Supabase. */
  round_key?: string | null;
  /** Si true, el formulario pide titular + invitado. */
  dual_pilot?: boolean;
  /** Texto extra en el mail de inscripción (opcional). */
  email_note?: string | null;
  name: string;
  circuit: string | null;
  location: string | null;
  city: string | null;
  event_date: string | null;
  event_date_iso: string | null;
  event_end_iso?: string | null;
  is_active?: boolean;
  registration_open?: boolean | null;
  transmission_url?: string | null;
  replay_url?: string | null;
  live_timing_url?: string | null;
  results_url?: string | null;
  slug?: string | null;
  flyer_url: string | null;
  /** Texto bajo el flyer (viene de Supabase; la app no lo hardcodea). */
  flyer_text: string | null;
  map_url: string | null;
  map_pdf_url: string | null;
  status: "upcoming" | "live" | "finished" | "cancelled";
  sort_order: number;
}

export interface RoundResult {
  id: string;
  round_id: string;
  category_id: string;
  label: string;
  pdf_url: string;
  sort_order: number;
  categories?: Category;
}

export interface Standing {
  id: string;
  season_id: string;
  category_id: string;
  pilot_number: string;
  pilot_name: string;
  nationality: string | null;
  points: number;
  position: number | null;
  wins: number;
  presentismo?: number | null;
  clasif: number | null;
  m1: number | null;
  m2: number | null;
  sh: number | null;
  final_pts: number | null;
}

export interface NewsArticle {
  id: string;
  slug: string | null;
  title: string;
  excerpt: string | null;
  body: string | null;
  category: string | null;
  image_url: string | null;
  is_published: boolean;
  list_in_feed?: boolean;
  show_inscription_cta?: boolean;
  show_duos_gallery?: boolean;
  gallery_round_key?: string | null;
  sort_order: number;
  published_at: string | null;
}

export interface Regulation {
  id: string;
  title: string;
  doc_type: string | null;
  pdf_url: string;
  sort_order: number;
}

export interface Schedule {
  id: string;
  title: string;
  round_id: string | null;
  pdf_url: string | null;
  items: unknown;
  sort_order: number;
}

export interface FormDoc {
  id: string;
  title: string;
  form_type: string | null;
  pdf_url: string;
  sort_order: number;
}

export interface MediaImage {
  id: string;
  title: string | null;
  image_url: string;
  round_id: string | null;
  section_key: string;
  sort_order: number;
  rounds?: Pick<Round, "round_number" | "name"> | null;
}

export interface MediaVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  round_id: string | null;
  sort_order: number;
  rounds?: Pick<Round, "round_number" | "name"> | null;
}

/** Textos editables de /imagenes y /videos (cabecera de página o bloque por fecha) */
export interface MediaSection {
  id: string;
  media_type: "images" | "videos";
  round_id: string | null;
  section_key: string;
  kicker: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  sort_order: number;
  is_published: boolean;
}

export interface Notification {
  id: string;
  title: string;
  body: string | null;
  published_at: string | null;
}

export interface AppConfig {
  temporada?: {
    year?: number;
    nombre?: string;
    organizador?: string;
    kicker?: string;
    tagline?: string;
    inscripcion_habilitada?: boolean;
  };
  contacto?: {
    email?: string;
    inscripciones_email?: string;
  };
  live?: {
    is_live?: boolean;
    timing_url?: string;
    speedhive_url?: string;
    mylaps_url?: string;
    round_label?: string;
  };
  transmision?: {
    titulo?: string;
    url?: string;
    descripcion?: string;
  };
  /** Textos bajo flyer por round_number ("6" → texto). Editable sin rebuild. */
  flyer_copy?: Record<string, string>;
  theme?: {
    navy?: string;
    red?: string;
    silver?: string;
    sky?: string;
  };
}
