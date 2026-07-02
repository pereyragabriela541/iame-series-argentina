"use client";

import { useState } from "react";
import type { Category } from "@/lib/types";
import StandingsTable from "./StandingsTable";
import type { Standing } from "@/lib/types";

interface CampeonatoClientProps {
  categories: Category[];
  standingsByCategory: Record<string, Standing[]>;
}

export default function CampeonatoClient({
  categories,
  standingsByCategory,
}: CampeonatoClientProps) {
  const [active, setActive] = useState(categories[0]?.id ?? "");

  const standings = standingsByCategory[active] ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActive(cat.id)}
            className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wide transition sm:text-xs ${
              active === cat.id
                ? "bg-iame-navy text-white"
                : "border border-neutral-800 text-neutral-400 hover:text-white"
            }`}
            style={
              active === cat.id && cat.color
                ? { backgroundColor: cat.color }
                : undefined
            }
          >
            {cat.name}
          </button>
        ))}
      </div>
      <StandingsTable standings={standings} showSessions={false} />
    </div>
  );
}
