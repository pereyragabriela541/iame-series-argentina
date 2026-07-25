"use client";

import { useState } from "react";
import InscriptionPhotoField from "@/components/InscriptionPhotoField";

interface InscriptionDuoPhotosEditorProps {
  registrationId: string;
  /** Código de turno requerido para guardar cambios. */
  codigo: string;
  initialTitularUrl?: string | null;
  initialInvitadoUrl?: string | null;
}

export default function InscriptionDuoPhotosEditor({
  registrationId,
  codigo,
  initialTitularUrl = null,
  initialInvitadoUrl = null,
}: InscriptionDuoPhotosEditorProps) {
  const [titularUrl, setTitularUrl] = useState(initialTitularUrl);
  const [invitadoUrl, setInvitadoUrl] = useState(initialInvitadoUrl);
  const [titularFile, setTitularFile] = useState<File | null>(null);
  const [invitadoFile, setInvitadoFile] = useState<File | null>(null);
  const [removeTitular, setRemoveTitular] = useState(false);
  const [removeInvitado, setRemoveInvitado] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const dirty =
    Boolean(titularFile) ||
    Boolean(invitadoFile) ||
    removeTitular ||
    removeInvitado;

  async function savePhotos() {
    if (!dirty || !codigo) return;
    setStatus("loading");
    setMessage("");

    const fd = new FormData();
    fd.set("registration_id", registrationId);
    fd.set("codigo", codigo);
    if (titularFile) fd.set("photo_titular", titularFile);
    if (invitadoFile) fd.set("photo_invitado", invitadoFile);
    if (removeTitular && !titularFile) fd.set("remove_photo_titular", "1");
    if (removeInvitado && !invitadoFile) fd.set("remove_photo_invitado", "1");

    const res = await fetch("/api/inscripcion/fotos", {
      method: "PATCH",
      body: fd,
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "No se pudieron actualizar las fotos");
      return;
    }

    setTitularUrl(data.photoTitularUrl);
    setInvitadoUrl(data.photoInvitadoUrl);
    setTitularFile(null);
    setInvitadoFile(null);
    setRemoveTitular(false);
    setRemoveInvitado(false);
    setStatus("ok");
    setMessage(
      data.showInDuos
        ? "Fotos actualizadas. El dúo se muestra en Noticias."
        : "Fotos actualizadas. Si falta alguna, el dúo no aparece en Noticias.",
    );
  }

  return (
    <div className="space-y-4 border border-neutral-800 bg-neutral-900/30 p-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-iame-sky">
          Editar fotos del dúo
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Autorizado con código <span className="font-mono text-white">{codigo}</span>.
          Podés cambiar o quitar fotos. Si falta alguna, el dúo no se publica en
          Noticias.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InscriptionPhotoField
          key={`titular-${titularUrl ?? "empty"}-${removeTitular}`}
          name="photo_titular"
          label="Foto del titular"
          initialUrl={removeTitular ? null : titularUrl}
          onFileChange={(file) => {
            setTitularFile(file);
            if (file) setRemoveTitular(false);
          }}
          onRemoveExisting={() => {
            setRemoveTitular(true);
            setTitularFile(null);
          }}
          disabled={status === "loading"}
        />
        <InscriptionPhotoField
          key={`invitado-${invitadoUrl ?? "empty"}-${removeInvitado}`}
          name="photo_invitado"
          label="Foto del invitado"
          initialUrl={removeInvitado ? null : invitadoUrl}
          onFileChange={(file) => {
            setInvitadoFile(file);
            if (file) setRemoveInvitado(false);
          }}
          onRemoveExisting={() => {
            setRemoveInvitado(true);
            setInvitadoFile(null);
          }}
          disabled={status === "loading"}
        />
      </div>

      {message ? (
        <p
          className={`text-sm ${status === "error" ? "text-iame-red" : "text-green-400"}`}
        >
          {message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={savePhotos}
        disabled={!dirty || status === "loading"}
        className="bg-iame-navy px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-iame-navy/80 disabled:opacity-50"
      >
        {status === "loading" ? "Guardando..." : "Guardar fotos"}
      </button>
    </div>
  );
}
