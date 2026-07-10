import type { Standing } from "@/lib/types";

interface StandingsTableProps {
  standings: Standing[];
  showSessions?: boolean;
  emptyMessage?: string;
}

function PositionBadge({ position }: { position: number | null }) {
  const pos = position ?? "—";
  const podiumClass =
    position === 1
      ? "bg-gradient-to-br from-[#FFF4C2] via-[#FFD700] to-[#9A7B0A] text-[#1a1200] shadow-[0_0_14px_rgba(255,215,0,0.55),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(120,90,10,0.35)] ring-1 ring-[#FFE566]/70"
      : position === 2
        ? "bg-gradient-to-br from-[#FFFFFF] via-[#D1D5DB] to-[#4B5563] text-[#111827] shadow-[0_0_12px_rgba(209,213,219,0.5),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(75,85,99,0.3)] ring-1 ring-white/60"
        : position === 3
          ? "bg-gradient-to-br from-[#F5D0A8] via-[#CD7F32] to-[#6B3A12] text-white shadow-[0_0_12px_rgba(205,127,50,0.5),inset_0_1px_0_rgba(255,230,200,0.45),inset_0_-1px_0_rgba(80,40,10,0.4)] ring-1 ring-[#E8A96A]/65"
          : "border border-neutral-700 text-neutral-300";

  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center font-mono text-sm font-bold ${podiumClass}`}
    >
      {pos}
    </span>
  );
}

export default function StandingsTable({
  standings,
  showSessions = true,
  emptyMessage = "Sin posiciones cargadas para esta categoría todavía.",
}: StandingsTableProps) {
  if (!standings.length) {
    return (
      <p className="border border-neutral-800 bg-neutral-900/50 px-4 py-8 text-center text-sm text-neutral-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-neutral-800">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-neutral-800 bg-iame-navy/30">
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Pos
            </th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              #
            </th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Piloto
            </th>
            <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Pts
            </th>
            {showSessions && (
              <>
                <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  Clas
                </th>
                <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  M1
                </th>
                <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  M2
                </th>
                <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  SH
                </th>
                <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  Final
                </th>
              </>
            )}
            <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Vic
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((p, i) => (
            <tr
              key={p.id}
              className={`border-b border-neutral-800/60 hover:bg-neutral-900/60 ${
                i % 2 === 0 ? "bg-neutral-950" : "bg-neutral-950/50"
              }`}
            >
              <td className="px-3 py-2">
                <PositionBadge position={p.position} />
              </td>
              <td className="px-3 py-2 font-mono text-sm font-bold text-white">
                {p.pilot_number}
              </td>
              <td className="px-3 py-2">
                <span className="text-sm font-semibold uppercase tracking-wide text-white">
                  {p.pilot_name}
                </span>
                {p.nationality && (
                  <span className="ml-2 text-[10px] text-neutral-500">
                    {p.nationality}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-right font-mono text-sm font-bold text-iame-red">
                {p.points}
              </td>
              {showSessions && (
                <>
                  <td className="px-2 py-2 text-center font-mono text-xs text-neutral-400">
                    {p.clasif ?? 0}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-xs text-neutral-400">
                    {p.m1 ?? 0}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-xs text-neutral-400">
                    {p.m2 ?? 0}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-xs text-neutral-400">
                    {p.sh ?? 0}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-xs text-neutral-400">
                    {p.final_pts ?? 0}
                  </td>
                </>
              )}
              <td className="px-3 py-2 text-center font-mono text-xs text-neutral-300">
                {p.wins}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
