const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "https://www.bsproyect.com";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(
      (data as { error?: string }).error ?? "Error de API",
    ) as Error & { status: number; data: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export interface InscriptionPayload {
  round_key: string;
  round_id_uuid: string | null;
  round_label: string;
  category_slug: string;
  category_label: string;
  full_name: string;
  dni: string;
  email: string;
  phone: string;
  birth_date: string | null;
  kart_number: string;
  team: string;
  city: string;
  privacy_consent: boolean;
  guest_full_name?: string;
  guest_dni?: string;
  guest_birth_date?: string | null;
  photo_titular?: { uri: string; name: string; type: string } | null;
  photo_invitado?: { uri: string; name: string; type: string } | null;
}

export async function submitInscription(payload: InscriptionPayload) {
  const dual =
    Boolean(payload.photo_titular) ||
    Boolean(payload.photo_invitado) ||
    Boolean(payload.guest_full_name);

  if (dual) {
    const fd = new FormData();
    fd.append("round_key", payload.round_key);
    if (payload.round_id_uuid) fd.append("round_id_uuid", payload.round_id_uuid);
    fd.append("round_label", payload.round_label);
    fd.append("category_slug", payload.category_slug);
    fd.append("category_label", payload.category_label);
    fd.append("full_name", payload.full_name);
    fd.append("dni", payload.dni);
    fd.append("email", payload.email);
    fd.append("phone", payload.phone);
    fd.append("birth_date", payload.birth_date ?? "");
    fd.append("kart_number", payload.kart_number);
    fd.append("team", payload.team);
    fd.append("city", payload.city);
    fd.append("privacy_consent", payload.privacy_consent ? "true" : "");
    fd.append("guest_full_name", payload.guest_full_name ?? "");
    fd.append("guest_dni", payload.guest_dni ?? "");
    fd.append("guest_birth_date", payload.guest_birth_date ?? "");
    if (payload.photo_titular) {
      fd.append("photo_titular", payload.photo_titular as unknown as Blob);
    }
    if (payload.photo_invitado) {
      fd.append("photo_invitado", payload.photo_invitado as unknown as Blob);
    }
    return apiFetch<{ registrationId: string; emailSkipped?: boolean }>(
      "/api/inscripcion",
      { method: "POST", body: fd },
    );
  }

  return apiFetch<{ registrationId: string; emailSkipped?: boolean }>(
    "/api/inscripcion",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function fetchFecha6Duos() {
  return apiFetch<{ duos: import("./fecha6-duos").Fecha6Duo[] }>(
    "/api/duos/fecha-6",
  );
}

export async function fetchTurnos(roundKey: string) {
  return apiFetch<{
    activo: boolean;
    config?: { evento_nombre: string; ubicacion: string | null; instrucciones: string | null };
    byFecha?: Record<string, import("./turnos-utils").TurnoSlot[]>;
  }>(`/api/turnos?round_key=${encodeURIComponent(roundKey)}`);
}

export async function fetchReserva(roundKey: string, dni: string) {
  return apiFetch<{
    reserva?: {
      codigo: string;
      fecha: string;
      hora: string;
      hora_fin: string;
      ubicacion: string | null;
      instrucciones: string | null;
    };
  }>(
    `/api/turnos/reservar?round_key=${encodeURIComponent(roundKey)}&dni=${encodeURIComponent(dni)}`,
  );
}

export async function reservarTurno(roundKey: string, dni: string, slotId: string) {
  return apiFetch<{
    codigo: string;
    fecha: string;
    hora: string;
    hora_fin: string;
    ubicacion?: string | null;
    instrucciones?: string | null;
  }>("/api/turnos/reservar", {
    method: "POST",
    body: JSON.stringify({ round_key: roundKey, dni, slot_id: slotId }),
  });
}

/** Elimina la cuenta Auth + perfil/push/avatar (App Store 5.1.1(v)). */
export async function deleteAccount(accessToken: string) {
  return apiFetch<{ ok: boolean }>("/api/account/delete", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
