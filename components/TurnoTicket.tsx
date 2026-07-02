"use client";

interface TurnoTicketProps {
  codigo: string;
  fecha: string;
  hora: string;
  horaFin: string;
  ubicacion?: string | null;
  instrucciones?: string | null;
  eventoNombre?: string;
}

export default function TurnoTicket({
  codigo,
  fecha,
  hora,
  horaFin,
  ubicacion,
  instrucciones,
  eventoNombre,
}: TurnoTicketProps) {
  const fechaFmt = new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="border-2 border-iame-red bg-neutral-900/80 p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-iame-red">
        Turno confirmado
      </p>
      <p className="mt-2 font-mono text-3xl font-bold tracking-widest text-white">
        {codigo}
      </p>
      {eventoNombre && (
        <p className="mt-3 text-sm font-bold uppercase text-white">{eventoNombre}</p>
      )}
      <div className="mt-4 space-y-1 text-sm text-neutral-300">
        <p>
          <span className="text-neutral-500">Día:</span> {fechaFmt}
        </p>
        <p>
          <span className="text-neutral-500">Horario:</span> {hora} — {horaFin}
        </p>
        {ubicacion && (
          <p>
            <span className="text-neutral-500">Ubicación:</span> {ubicacion}
          </p>
        )}
      </div>
      {instrucciones && (
        <p className="mt-4 border-l-2 border-iame-navy pl-3 text-xs text-neutral-400">
          {instrucciones}
        </p>
      )}
      <p className="mt-4 text-[10px] uppercase tracking-wider text-neutral-500">
        Guardá este código. Presentalo en administración.
      </p>
    </div>
  );
}
