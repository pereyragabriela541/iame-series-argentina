export function normalizeDniKey(dni: string): string {
  return String(dni || "").replace(/\D/g, "");
}

export function dniLast4(dni: string): string {
  const digits = normalizeDniKey(dni);
  return digits ? digits.slice(-4) : "";
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function parseHoraMinutos(horaStr: string) {
  const [h, m] = String(horaStr || "09:00").split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

export function formatHora(totalMinutos: number): string {
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export interface TurnosConfig {
  round_key: string;
  evento_nombre: string;
  activo: boolean;
  dias: string[];
  hora_inicio: string;
  hora_fin: string;
  minutos_por_turno: number;
  cupo_por_turno: number;
  ubicacion: string | null;
  instrucciones: string | null;
}

export interface TurnoSlot {
  slotId: string;
  round_key: string;
  fecha: string;
  hora: string;
  horaFin: string;
  cupoMax: number;
  reservados: number;
  disponible: boolean;
}

export function buildSlotsFromConfig(config: TurnosConfig): Omit<TurnoSlot, "disponible">[] {
  if (!config.activo || !config.dias?.length) return [];

  const minutos = config.minutos_por_turno || 7;
  const { h: hStart, m: mStart } = parseHoraMinutos(config.hora_inicio);
  const { h: hEnd, m: mEnd } = parseHoraMinutos(config.hora_fin);
  const startMin = hStart * 60 + mStart;
  const endMin = hEnd * 60 + mEnd;
  const cupoMax = config.cupo_por_turno || 1;

  const slots: Omit<TurnoSlot, "disponible">[] = [];

  for (const fecha of config.dias) {
    for (let t = startMin; t + minutos <= endMin; t += minutos) {
      const hora = formatHora(t);
      const horaFin = formatHora(t + minutos);
      const slotId = `${config.round_key}_${fecha}_${hora.replace(":", "")}`;
      slots.push({
        slotId,
        round_key: config.round_key,
        fecha,
        hora,
        horaFin,
        cupoMax,
        reservados: 0,
      });
    }
  }

  return slots;
}

export function mergeSlotAvailability(
  theoretical: Omit<TurnoSlot, "disponible">[],
  occupied: { slot_id: string; reservados: number; cupo_max: number }[]
): TurnoSlot[] {
  const map = Object.fromEntries(occupied.map((s) => [s.slot_id, s]));

  return theoretical.map((slot) => {
    const occ = map[slot.slotId];
    const reservados = occ?.reservados ?? slot.reservados;
    const cupoMax = occ?.cupo_max ?? slot.cupoMax;
    return {
      ...slot,
      reservados,
      cupoMax,
      disponible: reservados < cupoMax,
    };
  });
}

export function groupSlotsByFecha(slots: TurnoSlot[]): Record<string, TurnoSlot[]> {
  const grouped: Record<string, TurnoSlot[]> = {};
  for (const slot of slots) {
    if (!grouped[slot.fecha]) grouped[slot.fecha] = [];
    grouped[slot.fecha].push(slot);
  }
  for (const fecha of Object.keys(grouped)) {
    grouped[fecha].sort((a, b) => a.hora.localeCompare(b.hora));
  }
  return grouped;
}

export function formatFechaLarga(fechaISO: string): string {
  const [y, mo, d] = fechaISO.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function generateCodigoReserva(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "IAME-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
