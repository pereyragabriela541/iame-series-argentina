"use client";

import { useCallback, useEffect, useState } from "react";
import TurnoTicket from "@/components/TurnoTicket";
import { formatFechaLarga, type TurnoSlot } from "@/lib/turnos-utils";

interface ConfirmedRegistration {
  registrationId: string;
  roundKey: string;
  roundLabel: string;
  dni: string;
  email: string;
  fullName: string;
}

interface InscriptionTurnoSectionProps {
  registration: ConfirmedRegistration;
}

export default function InscriptionTurnoSection({
  registration,
}: InscriptionTurnoSectionProps) {
  const [loading, setLoading] = useState(true);
  const [activo, setActivo] = useState(false);
  const [eventoNombre, setEventoNombre] = useState("");
  const [ubicacion, setUbicacion] = useState<string | null>(null);
  const [instrucciones, setInstrucciones] = useState<string | null>(null);
  const [byFecha, setByFecha] = useState<Record<string, TurnoSlot[]>>({});
  const [selectedFecha, setSelectedFecha] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TurnoSlot | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [resendMessage, setResendMessage] = useState("");
  const [ticket, setTicket] = useState<{
    codigo: string;
    fecha: string;
    hora: string;
    horaFin: string;
  } | null>(null);

  const loadTurnos = useCallback(async () => {
    setLoading(true);
    try {
      const reservaRes = await fetch(
        `/api/turnos/reservar?round_key=${encodeURIComponent(registration.roundKey)}&dni=${encodeURIComponent(registration.dni)}`
      );
      const reservaData = await reservaRes.json();
      if (reservaData.reserva) {
        setTicket({
          codigo: reservaData.reserva.codigo,
          fecha: reservaData.reserva.fecha,
          hora: reservaData.reserva.hora,
          horaFin: reservaData.reserva.hora_fin,
        });
        setUbicacion(reservaData.reserva.ubicacion);
        setInstrucciones(reservaData.reserva.instrucciones);
        setLoading(false);
        return;
      }

      const res = await fetch(
        `/api/turnos?round_key=${encodeURIComponent(registration.roundKey)}`
      );
      const data = await res.json();

      if (data.activo && data.config) {
        setActivo(true);
        setEventoNombre(data.config.evento_nombre);
        setUbicacion(data.config.ubicacion);
        setInstrucciones(data.config.instrucciones);
        setByFecha(data.byFecha ?? {});
        const fechas = Object.keys(data.byFecha ?? {});
        if (fechas.length) setSelectedFecha(fechas[0]);
      } else {
        setActivo(false);
      }
    } catch {
      setMessage("No se pudieron cargar los turnos.");
    } finally {
      setLoading(false);
    }
  }, [registration.dni, registration.roundKey]);

  useEffect(() => {
    loadTurnos();
  }, [loadTurnos]);

  async function confirmarTurno() {
    if (!selectedSlot) return;
    setStatus("loading");
    setMessage("");

    const res = await fetch("/api/turnos/reservar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        round_key: registration.roundKey,
        dni: registration.dni,
        slot_id: selectedSlot.slotId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "Error al reservar");
      return;
    }

    setTicket({
      codigo: data.codigo,
      fecha: data.fecha,
      hora: data.hora,
      horaFin: data.hora_fin,
    });
    setUbicacion(data.ubicacion ?? ubicacion);
    setInstrucciones(data.instrucciones ?? instrucciones);
    setStatus("ok");
  }

  async function reenviarEmail() {
    setResendStatus("loading");
    setResendMessage("");
    const res = await fetch("/api/inscripcion/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dni: registration.dni,
        email: registration.email,
        round_key: registration.roundKey,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResendStatus("error");
      setResendMessage(data.error ?? data.message ?? "No se pudo reenviar el email");
      return;
    }
    setResendStatus("ok");
    setResendMessage(data.message ?? "Email reenviado. Revisá también la carpeta de spam.");
  }

  if (loading) {
    return (
      <p className="text-sm text-neutral-500">Cargando turnos de administración...</p>
    );
  }

  if (ticket) {
    return (
      <TurnoTicket
        codigo={ticket.codigo}
        fecha={ticket.fecha}
        hora={ticket.hora}
        horaFin={ticket.horaFin}
        ubicacion={ubicacion}
        instrucciones={instrucciones}
        eventoNombre={eventoNombre}
      />
    );
  }

  if (!activo) {
    return (
      <p className="border border-neutral-800 bg-neutral-900/50 px-4 py-6 text-sm text-neutral-500">
        Los turnos de administración para esta fecha aún no están publicados.
        La organización los habilitará próximamente en Supabase (tabla{" "}
        <code className="text-iame-sky">turnos_config</code>).
      </p>
    );
  }

  const fechas = Object.keys(byFecha);
  const slotsDelDia = byFecha[selectedFecha] ?? [];

  return (
    <div className="space-y-4 border border-iame-navy/40 bg-iame-navy/10 p-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-iame-sky">
          Paso 2 — Turno en administración
        </p>
        <h3 className="text-lg font-bold uppercase text-white">{eventoNombre}</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Elegí día y horario para la verificación de documentación.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          ¿No te llegó el email de confirmación? Revisá spam o correo no deseado
          {registration.email.includes("@live.") ||
          registration.email.includes("@hotmail.") ||
          registration.email.includes("@outlook.")
            ? " (común en Outlook/Live)"
            : ""}
          .
        </p>
        <button
          type="button"
          onClick={reenviarEmail}
          disabled={resendStatus === "loading"}
          className="mt-2 text-xs font-semibold text-iame-sky underline-offset-2 hover:underline disabled:opacity-50"
        >
          {resendStatus === "loading" ? "Reenviando..." : "Reenviar email de confirmación"}
        </button>
        {resendMessage && (
          <p
            className={`mt-1 text-xs ${resendStatus === "ok" ? "text-green-400" : "text-iame-red"}`}
          >
            {resendMessage}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {fechas.map((fecha) => {
          const libres = (byFecha[fecha] ?? []).filter((s) => s.disponible).length;
          return (
            <button
              key={fecha}
              type="button"
              onClick={() => {
                setSelectedFecha(fecha);
                setSelectedSlot(null);
              }}
              className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider ${
                selectedFecha === fecha
                  ? "bg-iame-red text-white"
                  : "border border-neutral-700 text-neutral-400 hover:text-white"
              }`}
            >
              {formatFechaLarga(fecha)} ({libres})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {slotsDelDia.map((slot) => (
          <button
            key={slot.slotId}
            type="button"
            disabled={!slot.disponible}
            onClick={() => setSelectedSlot(slot)}
            className={`px-2 py-2 font-mono text-xs ${
              selectedSlot?.slotId === slot.slotId
                ? "bg-iame-red text-white"
                : slot.disponible
                  ? "border border-neutral-700 text-white hover:border-iame-sky"
                  : "border border-neutral-800 text-neutral-600 line-through"
            }`}
          >
            {slot.hora}
          </button>
        ))}
      </div>

      {message && (
        <p className={`text-sm ${status === "error" ? "text-iame-red" : "text-green-400"}`}>
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={confirmarTurno}
        disabled={!selectedSlot || status === "loading"}
        className="bg-iame-navy px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-iame-navy/80 disabled:opacity-50"
      >
        {status === "loading" ? "Reservando..." : "Confirmar turno"}
      </button>
    </div>
  );
}
