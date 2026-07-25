"use client";

import { useEffect, useId, useRef, useState } from "react";

interface InscriptionPhotoFieldProps {
  name: string;
  label: string;
  required?: boolean;
  /** URL ya guardada (modo edición post-inscripción). */
  initialUrl?: string | null;
  onFileChange?: (file: File | null) => void;
  onRemoveExisting?: () => void;
  disabled?: boolean;
}

export default function InscriptionPhotoField({
  name,
  label,
  required = false,
  initialUrl = null,
  onFileChange,
  onRemoveExisting,
  disabled = false,
}: InscriptionPhotoFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [existingUrl, setExistingUrl] = useState<string | null>(initialUrl);
  const [removedExisting, setRemovedExisting] = useState(false);

  useEffect(() => {
    setExistingUrl(initialUrl);
    setRemovedExisting(false);
  }, [initialUrl]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview || (!removedExisting ? existingUrl : null);
  const hasPhoto = Boolean(shown);

  function pickFile() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0] ?? null;
    setFile(next);
    if (next) setRemovedExisting(false);
    onFileChange?.(next);
  }

  function clearPhoto() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
    if (existingUrl && !removedExisting) {
      setRemovedExisting(true);
      onRemoveExisting?.();
    }
    onFileChange?.(null);
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500"
      >
        {label}
        {required ? " *" : ""}
      </label>

      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required={required && !hasPhoto}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
      />

      {shown ? (
        <div className="overflow-hidden border border-neutral-700 bg-neutral-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shown}
            alt={label}
            className="aspect-square w-full max-w-[220px] object-cover"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={pickFile}
          disabled={disabled}
          className="w-full border border-dashed border-neutral-700 bg-neutral-950/60 px-3 py-8 text-xs text-neutral-400 hover:border-iame-sky hover:text-white disabled:opacity-50"
        >
          Elegir foto (JPG, PNG o WebP)
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={pickFile}
          disabled={disabled}
          className="border border-neutral-700 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-300 hover:border-iame-sky hover:text-white disabled:opacity-50"
        >
          {hasPhoto ? "Cambiar foto" : "Subir foto"}
        </button>
        {hasPhoto ? (
          <button
            type="button"
            onClick={clearPhoto}
            disabled={disabled}
            className="border border-neutral-700 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-iame-red hover:border-iame-red disabled:opacity-50"
          >
            Quitar foto
          </button>
        ) : null}
      </div>

      {removedExisting && !file ? (
        <input type="hidden" name={`remove_${name}`} value="1" />
      ) : null}
    </div>
  );
}
