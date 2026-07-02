import Link from "next/link";
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
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-white">
              {BRAND.name}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Organizado por {organizer} · Temporada {year}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-wider text-neutral-400">
            <Link href="/reglamentos" className="hover:text-iame-red">
              Reglamentos
            </Link>
            <Link href="/inscripcion" className="hover:text-iame-red">
              Inscripción
            </Link>
            <a
              href={`mailto:${BRAND.email}`}
              className="hover:text-iame-red"
            >
              Contacto
            </a>
          </div>
        </div>
        <p className="mt-8 text-center text-[10px] text-neutral-600">
          © {year} BS Proyect. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
