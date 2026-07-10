export type PodiumPlace = 1 | 2 | 3;

export interface PodiumBadgeStyle {
  background: string;
  color: string;
  boxShadow: string;
  shine: string;
}

/** Gradientes metálicos con reflejo central (dorado, plateado, cobre). */
export const PODIUM_METAL: Record<
  PodiumPlace,
  {
    colors: readonly string[];
    locations: readonly number[];
    text: string;
    glow: string;
    shine: string;
  }
> = {
  1: {
    colors: ["#3d2606", "#8b6914", "#d4a017", "#fff8c8", "#ffd54f", "#b8860b", "#4a2f08"],
    locations: [0, 0.2, 0.38, 0.5, 0.58, 0.78, 1],
    text: "#1a1000",
    glow: "#ffd54f",
    shine: "linear-gradient(105deg, transparent 28%, rgba(255,255,255,0.65) 48%, transparent 68%)",
  },
  2: {
    colors: ["#2a3140", "#4b5568", "#8b95a8", "#e8ecf2", "#ffffff", "#9aa3b2", "#2d3342"],
    locations: [0, 0.15, 0.32, 0.46, 0.52, 0.72, 1],
    text: "#111827",
    glow: "#d1d5db",
    shine: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.8) 50%, transparent 70%)",
  },
  3: {
    colors: ["#3d1808", "#6b3010", "#a0522d", "#f0d0b0", "#f5c896", "#b87333", "#3d1a08"],
    locations: [0, 0.16, 0.34, 0.48, 0.56, 0.76, 1],
    text: "#2a1205",
    glow: "#cd7f32",
    shine: "linear-gradient(105deg, transparent 30%, rgba(255,235,210,0.7) 50%, transparent 70%)",
  },
};

export function getPodiumBadgeStyle(position: number | null): PodiumBadgeStyle | null {
  if (position !== 1 && position !== 2 && position !== 3) return null;

  const metal = PODIUM_METAL[position];
  const stops = metal.colors
    .map((color, i) => `${color} ${Math.round(metal.locations[i] * 100)}%`)
    .join(", ");

  return {
    background: `linear-gradient(155deg, ${stops})`,
    color: metal.text,
    boxShadow:
      position === 1
        ? "0 0 14px rgba(255,200,50,0.5), inset 0 2px 3px rgba(255,255,220,0.55), inset 0 -2px 4px rgba(60,35,5,0.45)"
        : position === 2
          ? "0 0 12px rgba(200,210,230,0.45), inset 0 2px 3px rgba(255,255,255,0.75), inset 0 -2px 4px rgba(40,48,65,0.4)"
          : "0 0 12px rgba(205,127,50,0.45), inset 0 2px 3px rgba(255,220,190,0.5), inset 0 -2px 4px rgba(50,20,5,0.45)",
    shine: metal.shine,
  };
}
