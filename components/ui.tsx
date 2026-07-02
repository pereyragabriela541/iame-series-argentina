export function DbSetupBanner() {
  return (
    <div className="mb-6 border border-iame-sky/40 bg-iame-navy/20 px-4 py-4">
      <p className="text-sm font-semibold text-iame-sky">
        Base de datos pendiente de configuración
      </p>
      <p className="mt-1 text-xs text-neutral-400">
        Ejecutá el script SQL en Supabase → SQL Editor para crear las tablas y datos iniciales.
      </p>
      <p className="mt-2 font-mono text-[10px] text-neutral-500">
        supabase/schema.sql
      </p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="border border-neutral-800 bg-neutral-900/50 px-4 py-8 text-center text-sm text-neutral-500">
      {message}
    </p>
  );
}

export function PdfLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 border border-neutral-800 bg-neutral-900/40 px-4 py-3 text-sm transition hover:border-iame-red"
    >
      <span className="flex h-8 w-8 items-center justify-center bg-iame-red/20 text-[10px] font-bold text-iame-red">
        PDF
      </span>
      <span className="font-semibold uppercase tracking-wide text-white">{label}</span>
    </a>
  );
}
