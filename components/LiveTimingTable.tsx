interface LiveTimingTableProps {
  pilots: PilotTiming[];
  sessionName?: string;
  lapCount?: number;
}

export interface PilotTiming {
  position: number;
  number: number;
  name: string;
  team: string;
  lastLap: string;
  bestLap: string;
  gap: string;
  sector1?: string;
  sector2?: string;
  sector3?: string;
  status?: "on_track" | "in_pit" | "out";
}

function PositionBadge({ position }: { position: number }) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center font-mono text-sm font-bold ${
        position === 1
          ? "bg-iame-red text-white"
          : position === 2
            ? "bg-neutral-200 text-neutral-950"
            : position === 3
              ? "bg-amber-700 text-white"
              : "border border-neutral-700 text-neutral-300"
      }`}
    >
      {position}
    </span>
  );
}

export default function LiveTimingTable({
  pilots,
  sessionName = "Sesión de Entrenamiento",
  lapCount,
}: LiveTimingTableProps) {
  return (
    <section className="w-full">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-neutral-800 pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-iame-red">
            Live Timing
          </p>
          <h2 className="text-lg font-bold uppercase tracking-wide text-white">
            {sessionName}
          </h2>
        </div>
        {lapCount !== undefined && (
          <div className="font-mono text-xs text-neutral-400">
            Vuelta <span className="text-white">{lapCount}</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto border border-neutral-800">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-800 bg-iame-navy/30">
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Pos</th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">#</th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Piloto</th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Equipo</th>
              <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Última</th>
              <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Mejor</th>
              <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Dif.</th>
            </tr>
          </thead>
          <tbody>
            {pilots.map((pilot, index) => (
              <tr
                key={`${pilot.number}-${pilot.name}`}
                className={`border-b border-neutral-800/60 hover:bg-neutral-900/60 ${
                  index % 2 === 0 ? "bg-neutral-950" : "bg-neutral-950/50"
                }`}
              >
                <td className="px-3 py-2"><PositionBadge position={pilot.position} /></td>
                <td className="px-3 py-2 font-mono text-sm font-bold text-white">{pilot.number}</td>
                <td className="px-3 py-2 text-sm font-semibold uppercase text-white">{pilot.name}</td>
                <td className="px-3 py-2 text-xs uppercase text-neutral-400">{pilot.team}</td>
                <td className="px-3 py-2 text-right font-mono text-sm text-white">{pilot.lastLap}</td>
                <td className="px-3 py-2 text-right font-mono text-sm text-iame-red">{pilot.bestLap}</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-neutral-400">{pilot.gap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
