import Link from "next/link";
import { formatRoundEventDates, getRoundBadge } from "@/lib/calendar-dates";
import type { Round } from "@/lib/types";

interface RoundCardProps {
  round: Round;
}

const statusStyles = {
  upcoming: "border-iame-sky/40 text-iame-sky",
  live: "border-iame-red text-iame-red",
  finished: "border-neutral-600 text-neutral-400",
};

const statusLabels = {
  upcoming: "Próxima",
  live: "En Vivo",
  finished: "Finalizada",
};

export default function RoundCard({ round }: RoundCardProps) {
  const badge = getRoundBadge(round.round_number);

  return (
    <Link
      href={`/calendario/${round.id}`}
      className="group block border border-neutral-800 bg-neutral-900/40 transition hover:border-iame-navy hover:bg-neutral-900"
    >
      <div className="flex items-stretch">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center bg-iame-navy/40 font-mono">
          {badge.caption ? (
            <span className="text-[10px] uppercase text-neutral-400">{badge.caption}</span>
          ) : null}
          <span className={`font-bold text-white ${badge.label === "Final" ? "text-sm uppercase tracking-wide" : "text-xl"}`}>
            {badge.label}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white group-hover:text-iame-sky">
              {round.name}
            </h3>
            <span
              className={`shrink-0 border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${statusStyles[round.status]}`}
            >
              {statusLabels[round.status]}
            </span>
          </div>
          {round.circuit && (
            <p className="text-xs text-neutral-400">{round.circuit}</p>
          )}
          <p className="font-mono text-[10px] text-neutral-500">
            {formatRoundEventDates(round)}
          </p>
        </div>
      </div>
    </Link>
  );
}
