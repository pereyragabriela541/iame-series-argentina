"use client";

import { useState } from "react";
import InscriptionTurnoSection from "@/components/InscriptionTurnoSection";
import {
  findRoundLabel,
  type InscriptionCategoryOption,
  type InscriptionRoundOption,
  isUuid,
} from "@/lib/inscription-data";

interface InscriptionFormProps {
  rounds: InscriptionRoundOption[];
  categories: InscriptionCategoryOption[];
  enabled: boolean;
}

interface ConfirmedRegistration {
  registrationId: string;
  roundKey: string;
  roundLabel: string;
  dni: string;
  email: string;
  fullName: string;
}

const PRIVACY_TEXT =
  "Autorizo a IAME Series Argentina (BS Proyecta) al tratamiento de mis datos personales con fines deportivos e informativos.";

export default function InscriptionForm({
  rounds,
  categories,
  enabled,
}: InscriptionFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState<ConfirmedRegistration | null>(null);

  if (!enabled) {
    return (
      <p className="border border-neutral-800 bg-neutral-900/50 px-4 py-8 text-center text-sm text-neutral-500">
        Las inscripciones no están habilitadas en este momento.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const fd = new FormData(e.currentTarget);
    const roundValue = String(fd.get("round_id") ?? "").trim();
    const categorySlug = String(fd.get("category_slug") ?? "").trim();
    const categoryLabel =
      categories.find((c) => c.value === categorySlug)?.label ?? categorySlug;
    const roundLabel = findRoundLabel(roundValue, rounds);
    const roundOption = rounds.find((r) => r.value === roundValue);
    const roundKey = roundValue;
    const roundIdUuid = roundOption?.roundId ?? (isUuid(roundValue) ? roundValue : null);

    const body = {
      round_key: roundKey,
      round_id_uuid: roundIdUuid,
      round_label: roundLabel,
      category_slug: categorySlug,
      category_label: categoryLabel,
      full_name: String(fd.get("full_name") ?? "").trim(),
      dni: String(fd.get("dni") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      birth_date: fd.get("birth_date") || null,
      kart_number: String(fd.get("kart_number") ?? "").trim(),
      team: String(fd.get("team") ?? "").trim(),
      city: String(fd.get("city") ?? "").trim(),
      privacy_consent: fd.get("privacy_consent") === "on",
    };

    const res = await fetch("/api/inscripcion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.alreadyRegistered && data.registrationId) {
        setConfirmed({
          registrationId: data.registrationId,
          roundKey,
          roundLabel,
          dni: body.dni,
          email: body.email,
          fullName: body.full_name,
        });
      }
      setStatus("error");
      setMessage(data.error ?? "Error al inscribirse");
      return;
    }

    setStatus("ok");
    setMessage(
      data.emailSkipped
        ? "Inscripción guardada. El email no pudo enviarse (configuración SMTP)."
        : `${data.message ?? "Inscripción registrada."} Si no lo ves en unos minutos, revisá la carpeta de spam o correo no deseado.`
    );
    setConfirmed({
      registrationId: data.registrationId,
      roundKey,
      roundLabel,
      dni: body.dni,
      email: body.email,
      fullName: body.full_name,
    });
  }

  const inputClass =
    "w-full border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-iame-navy focus:outline-none";

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 border border-neutral-800 bg-neutral-900/30 p-6"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-iame-red">
          Paso 1 — Inscripción
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Fecha
            </label>
            <select name="round_id" className={inputClass} required defaultValue="">
              <option value="" disabled>
                Seleccionar fecha
              </option>
              {rounds.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Categoría
            </label>
            <select name="category_slug" className={inputClass} required defaultValue="">
              <option value="" disabled>
                Seleccionar categoría
              </option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Número de kart
            </label>
            <input
              name="kart_number"
              className={inputClass}
              inputMode="numeric"
              placeholder="Ej: 206"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Nombre completo
            </label>
            <input name="full_name" className={inputClass} required />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              DNI
            </label>
            <input name="dni" className={inputClass} required />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Email
            </label>
            <input name="email" type="email" className={inputClass} required />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Teléfono
            </label>
            <input name="phone" className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Fecha de nacimiento
            </label>
            <input name="birth_date" type="date" className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Equipo / Escudería
            </label>
            <input name="team" className={inputClass} />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Ciudad
            </label>
            <input name="city" className={inputClass} />
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-start gap-3 text-xs text-neutral-400">
              <input
                name="privacy_consent"
                type="checkbox"
                required
                className="mt-1 accent-iame-red"
              />
              <span>{PRIVACY_TEXT}</span>
            </label>
          </div>
        </div>

        {message && (
          <p className={`text-sm ${status === "ok" ? "text-green-400" : "text-iame-red"}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-iame-red px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-iame-red/90 disabled:opacity-50 sm:w-auto"
        >
          {status === "loading" ? "Enviando..." : "Enviar inscripción"}
        </button>
      </form>

      {confirmed && <InscriptionTurnoSection registration={confirmed} />}
    </div>
  );
}
