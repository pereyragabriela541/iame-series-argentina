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
  name: string;
  circuit: string | null;
  location: string | null;
  city: string | null;
  event_date: string | null;
  event_date_iso: string | null;
  flyer_url: string | null;
  map_url: string | null;
  map_pdf_url: string | null;
  status: "upcoming" | "live" | "finished";
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
  sort_order: number;
}

export interface MediaVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  round_id: string | null;
  sort_order: number;
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
  theme?: {
    navy?: string;
    red?: string;
    silver?: string;
    sky?: string;
  };
}
