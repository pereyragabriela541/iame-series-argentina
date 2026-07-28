import type { Fecha6Duo } from "@/lib/fecha6-duos";
import { groupFecha6DuosByCategory } from "@/lib/fecha6-duos";

function DuoCard({ duo }: { duo: Fecha6Duo }) {
  return (
    <article className="overflow-hidden border border-neutral-800 bg-neutral-900/40">
      <div className="grid grid-cols-2 gap-px bg-neutral-800">
        <div className="bg-neutral-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={duo.photoTitularUrl}
            alt={duo.titularName}
            className="aspect-square w-full object-cover"
          />
          <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Titular
          </p>
          <p className="px-2 pb-3 text-sm font-bold uppercase text-white">
            {duo.titularName}
          </p>
        </div>
        <div className="bg-neutral-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={duo.photoInvitadoUrl}
            alt={duo.guestName}
            className="aspect-square w-full object-cover"
          />
          <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Invitado
          </p>
          <p className="px-2 pb-3 text-sm font-bold uppercase text-white">
            {duo.guestName}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-neutral-800 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-iame-sky">
          {duo.categoryLabel || "Fecha 6"}
        </p>
        {duo.kartNumber ? (
          <p className="text-xs font-bold text-white">#{duo.kartNumber}</p>
        ) : null}
      </div>
    </article>
  );
}

export default function Fecha6DuosGrid({ duos }: { duos: Fecha6Duo[] }) {
  if (!duos.length) {
    return (
      <p className="border border-neutral-800 bg-neutral-900/40 px-4 py-8 text-center text-sm text-neutral-500">
        Todavía no hay dúos publicados. Cuando se inscriban con fotos, aparecen
        acá.
      </p>
    );
  }

  const groups = groupFecha6DuosByCategory(duos);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.categorySlug + group.categoryLabel} className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              {group.categoryLabel}
            </h3>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              {group.duos.length}{" "}
              {group.duos.length === 1 ? "dúo" : "dúos"}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.duos.map((duo) => (
              <DuoCard key={duo.id} duo={duo} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
