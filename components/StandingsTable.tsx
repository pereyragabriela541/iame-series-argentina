import type { Standing } from "@/lib/types";
import { getPodiumBadgeStyle } from "@/lib/podium-styles";

interface StandingsTableProps {
  standings: Standing[];
  showSessions?: boolean;
  emptyMessage?: string;
}

function PositionBadge({ position }: { position: number | null }) {
  const pos = position ?? "—";
  const metal = getPodiumBadgeStyle(position);

  if (!metal) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center border border-neutral-700 font-mono text-sm font-bold text-neutral-300">
        {pos}
      </span>
    );
  }

  return (
    <span
      className="relative inline-flex h-7 w-7 items-center justify-center overflow-hidden font-mono text-sm font-bold"
      style={{
        background: metal.background,
        color: metal.color,
        boxShadow: metal.boxShadow,
      }}
    >
      <span
        className="pointer-events-none absolute inset-0"
        style={{ background: metal.shine }}
      />
      <span className="relative z-10">{pos}</span>
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
            <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Pres
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
              <td className="px-3 py-2 text-center font-mono text-xs text-neutral-300">
                {p.presentismo ?? 0}
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
