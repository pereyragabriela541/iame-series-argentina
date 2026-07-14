export const BRAND = {
  name: "IAME Series Argentina",
  organizer: "BS Proyect",
  email: "iameseriesarg@gmail.com",
  colors: {
    navy: "#004A99",
    red: "#E30613",
    silver: "#A7A9AC",
    sky: "#75BEE9",
    carbon: "#0a0a0a",
    white: "#ffffff",
  },
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/noticias", label: "Noticias" },
  { href: "/campeonato", label: "Campeonato" },
  { href: "/calendario", label: "Calendario" },
  { href: "/resultados", label: "Resultados" },
  { href: "/inscripcion", label: "Inscripción" },
  { href: "/tiempos", label: "Tiempos en Vivo" },
  { href: "/transmision", label: "Transmisión" },
  { href: "/cronograma", label: "Cronograma" },
  { href: "/reglamentos", label: "Reglamentos" },
  { href: "/formularios", label: "Formularios" },
  { href: "/imagenes", label: "Imágenes" },
  { href: "/videos", label: "Videos" },
  { href: "/alertas", label: "Alertas" },
] as const;

export const LEGAL_LINKS = [
  { href: "/privacidad", label: "Privacidad" },
  { href: "/terminos", label: "Términos" },
] as const;
