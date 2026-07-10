import { BRAND } from "@/lib/branding";

interface FooterProps {
  year?: number;
  organizer?: string;
}

export default function Footer({
  year = new Date().getFullYear(),
  organizer = BRAND.organizer,
}: FooterProps) {
  return (
    <footer className="mt-16 border-t border-neutral-800 bg-neutral-950">
      <div className="iame-gradient-bar" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-white">
              {BRAND.name}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Organizado por {organizer} · Temporada {year}
            </p>
          </div>
          <a
            href={`mailto:${BRAND.email}`}
            className="text-[9px] uppercase tracking-wider text-neutral-500 hover:text-neutral-300"
          >
            Contacto
          </a>
        </div>
        <p className="mt-8 text-center text-[10px] text-neutral-600">
          © {year} {organizer}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
