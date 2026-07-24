"use client";

import Link from "next/link";
import { useState } from "react";
import InscriptionTurnoSection from "@/components/InscriptionTurnoSection";
import {
  findRoundLabel,
  isDualPilotRound,
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

const PRIVACY_TEXT = (
  <>
    Autorizo a IAME Series Argentina (BS Proyect) al tratamiento de mis datos personales
    conforme a la{" "}
    <Link href="/privacidad" className="text-iame-sky hover:underline">
      política de privacidad
    </Link>{" "}
    y los{" "}
    <Link href="/terminos" className="text-iame-sky hover:underline">
      términos y condiciones
    </Link>
    .
  </>
);

export default function InscriptionForm({
  rounds,
  categories,
  enabled,
}: InscriptionFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState<ConfirmedRegistration | null>(null);
  const [selectedRound, setSelectedRound] = useState("");
  const dualPilot = isDualPilotRound(selectedRound);

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

    const form = e.currentTarget;
    const fd = new FormData(form);
    const roundValue = String(fd.get("round_id") ?? "").trim();
    const categorySlug = String(fd.get("category_slug") ?? "").trim();
    const categoryLabel =
      categories.find((c) => c.value === categorySlug)?.label ?? categorySlug;
    const roundLabel = findRoundLabel(roundValue, rounds);
    const roundOption = rounds.find((r) => r.value === roundValue);
    const roundKey = roundValue;
    const roundIdUuid = roundOption?.roundId ?? (isUuid(roundValue) ? roundValue : null);
    const isDual = isDualPilotRound(roundKey);

    const fullName = String(fd.get("full_name") ?? "").trim();
    const dni = String(fd.get("dni") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();

    let res: Response;
    if (isDual) {
      const payload = new FormData();
      payload.set("round_key", roundKey);
      if (roundIdUuid) payload.set("round_id_uuid", roundIdUuid);
      payload.set("round_label", roundLabel);
      payload.set("category_slug", categorySlug);
      payload.set("category_label", categoryLabel);
      payload.set("full_name", fullName);
      payload.set("dni", dni);
      payload.set("email", email);
      payload.set("phone", String(fd.get("phone") ?? "").trim());
      payload.set("birth_date", String(fd.get("birth_date") ?? ""));
      payload.set("kart_number", String(fd.get("kart_number") ?? "").trim());
      payload.set("team", String(fd.get("team") ?? "").trim());
      payload.set("city", String(fd.get("city") ?? "").trim());
      payload.set("privacy_consent", fd.get("privacy_consent") === "on" ? "true" : "");
      payload.set("guest_full_name", String(fd.get("guest_full_name") ?? "").trim());
      payload.set("guest_dni", String(fd.get("guest_dni") ?? "").trim());
      payload.set("guest_birth_date", String(fd.get("guest_birth_date") ?? ""));
      const photoTitular = fd.get("photo_titular");
      const photoInvitado = fd.get("photo_invitado");
      if (photoTitular instanceof File) payload.set("photo_titular", photoTitular);
      if (photoInvitado instanceof File) payload.set("photo_invitado", photoInvitado);

      res = await fetch("/api/inscripcion", { method: "POST", body: payload });
    } else {
      const body = {
        round_key: roundKey,
        round_id_uuid: roundIdUuid,
        round_label: roundLabel,
        category_slug: categorySlug,
        category_label: categoryLabel,
        full_name: fullName,
        dni,
        email,
        phone: String(fd.get("phone") ?? "").trim(),
        birth_date: fd.get("birth_date") || null,
        kart_number: String(fd.get("kart_number") ?? "").trim(),
        team: String(fd.get("team") ?? "").trim(),
        city: String(fd.get("city") ?? "").trim(),
        privacy_consent: fd.get("privacy_consent") === "on",
      };
      res = await fetch("/api/inscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    const data = await res.json();

    if (!res.ok) {
      if (data.alreadyRegistered && data.registrationId) {
        setConfirmed({
          registrationId: data.registrationId,
          roundKey,
          roundLabel,
          dni,
          email,
          fullName,
        });
      }
      setStatus("error");
      setMessage(data.error ?? "Error al inscribirse");
      return;
    }

    setStatus("ok");
    setMessage(
      data.emailSkipped
        ? "Inscripción guardada. El email no pudo enviarse (falta RESEND_API_KEY o EMAIL_SMTP_PASS)."
        : "Tu inscripción aún no está completa. Para confirmarla, debés reservar tu turno y finalizar el trámite de manera presencial."
    );
    setConfirmed({
      registrationId: data.registrationId,
      roundKey,
      roundLabel,
      dni,
      email,
      fullName,
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
            <select
              name="round_id"
              className={inputClass}
              required
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
            >
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

          {dualPilot ? (
            <div className="sm:col-span-2 border border-neutral-800 bg-neutral-950/60 px-4 py-3">
              <p className="text-xs leading-relaxed text-neutral-400">
                Fecha 6 es de dos pilotos (titular e invitado). Completá los datos
                de ambos y subí una foto de cada uno. Los dúos se publican en
                Noticias.
              </p>
            </div>
          ) : null}

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

          <div className="sm:col-span-2">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-iame-sky">
              {dualPilot ? "Piloto titular" : "Datos del piloto"}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              {dualPilot ? "Nombre completo del titular" : "Nombre completo"}
            </label>
            <input name="full_name" className={inputClass} required />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              {dualPilot ? "DNI del titular" : "DNI"}
            </label>
            <input name="dni" className={inputClass} required />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              {dualPilot ? "Fecha de nacimiento del titular" : "Fecha de nacimiento"}
            </label>
            <input
              name="birth_date"
              type="date"
              className={inputClass}
              required={dualPilot}
            />
          </div>

          {dualPilot ? (
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                Foto del titular
              </label>
              <input
                name="photo_titular"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                className="w-full text-sm text-neutral-300 file:mr-3 file:border-0 file:bg-iame-navy file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-white"
              />
            </div>
          ) : null}

          {dualPilot ? (
            <>
              <div className="sm:col-span-2">
                <p className="mb-2 mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-iame-sky">
                  Piloto invitado
                </p>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  Nombre completo del invitado
                </label>
                <input name="guest_full_name" className={inputClass} required />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  DNI del invitado
                </label>
                <input name="guest_dni" className={inputClass} required />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  Fecha de nacimiento del invitado
                </label>
                <input
                  name="guest_birth_date"
                  type="date"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  Foto del invitado
                </label>
                <input
                  name="photo_invitado"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  className="w-full text-sm text-neutral-300 file:mr-3 file:border-0 file:bg-iame-navy file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-white"
                />
              </div>
            </>
          ) : null}

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Email
            </label>
            <input name="email" type="email" className={inputClass} required />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              {dualPilot ? "Teléfono (solo titular)" : "Teléfono"}
            </label>
            <input name="phone" className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              {dualPilot ? "Equipo / Escudería (solo titular)" : "Equipo / Escudería"}
            </label>
            <input name="team" className={inputClass} />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              {dualPilot ? "Ciudad (solo titular)" : "Ciudad"}
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
