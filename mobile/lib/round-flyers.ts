/** Textos de flyer promocional por número de fecha. */
export const ROUND_FLYER_BLURBS: Record<number, string> = {
  6: [
    "El Champion Cup 2026 suma un nuevo desafío.",
    "",
    "Llega el Gran Premio Nave Planes – Pilotos Invitados, un fin de semana donde la velocidad, la estrategia y el trabajo en equipo serán protagonistas.",
    "",
    "📍 Kartódromo Ramiro Tot – Baradero. 8 y 9 de agosto. Round 6.",
  ].join("\n"),
};

export function getRoundFlyerBlurb(roundNumber: number): string | null {
  return ROUND_FLYER_BLURBS[roundNumber] ?? null;
}
