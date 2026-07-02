-- Sistema de inscripción + turnos + emails (estilo CAK)
-- Ejecutar en Supabase → SQL Editor

-- Campos extra en registrations
alter table registrations
  add column if not exists round_key text,
  add column if not exists dni_key text,
  add column if not exists privacy_consent boolean default false,
  add column if not exists privacy_consent_text text,
  add column if not exists email_confirmacion_enviada_at timestamptz,
  add column if not exists email_organizacion_notificada_at timestamptz,
  add column if not exists origen text default 'web';

create unique index if not exists idx_registrations_round_dni
  on registrations (round_key, dni_key)
  where round_key is not null and dni_key is not null;

-- Config de turnos por fecha
create table if not exists turnos_config (
  round_key text primary key,
  round_id uuid references rounds(id) on delete set null,
  evento_nombre text not null,
  activo boolean not null default true,
  dias date[] not null default '{}',
  hora_inicio text not null default '10:00',
  hora_fin text not null default '18:00',
  minutos_por_turno int not null default 7,
  cupo_por_turno int not null default 1,
  ubicacion text,
  instrucciones text,
  updated_at timestamptz not null default now()
);

-- Cupos por slot
create table if not exists turnos_slots (
  slot_id text primary key,
  round_key text not null references turnos_config(round_key) on delete cascade,
  fecha date not null,
  hora text not null,
  hora_fin text not null,
  reservados int not null default 0,
  cupo_max int not null default 1,
  updated_at timestamptz not null default now()
);

create index if not exists idx_turnos_slots_round on turnos_slots(round_key, fecha);

-- Reservas de turno (una por piloto por fecha)
create table if not exists reservas_turnos (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references registrations(id) on delete set null,
  round_key text not null,
  dni_key text not null,
  slot_id text not null references turnos_slots(slot_id),
  codigo text not null unique,
  fecha date not null,
  hora text not null,
  hora_fin text not null,
  ubicacion text,
  instrucciones text,
  full_name text,
  email text,
  phone text,
  kart_number text,
  category_slug text,
  estado text not null default 'confirmada',
  origen text default 'web',
  privacy_consent boolean default true,
  created_at timestamptz not null default now(),
  unique (round_key, dni_key)
);

alter table turnos_config enable row level security;
alter table turnos_slots enable row level security;
alter table reservas_turnos enable row level security;

create policy "public_read_turnos_config" on turnos_config for select using (activo = true);
create policy "public_read_turnos_slots" on turnos_slots for select using (true);

-- Reserva: solo el servidor (service role) inserta vía API

-- Función atómica para reservar turno
create or replace function reservar_turno_iame(
  p_round_key text,
  p_dni_key text,
  p_slot_id text,
  p_codigo text,
  p_registration_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_kart_number text,
  p_category_slug text,
  p_ubicacion text,
  p_instrucciones text
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_slot turnos_slots%rowtype;
  v_existing reservas_turnos%rowtype;
begin
  select * into v_existing from reservas_turnos
  where round_key = p_round_key and dni_key = p_dni_key;

  if found then
    raise exception 'ALREADY_RESERVED' using errcode = 'P0001';
  end if;

  select * into v_slot from turnos_slots where slot_id = p_slot_id for update;

  if not found then
    insert into turnos_slots (slot_id, round_key, fecha, hora, hora_fin, reservados, cupo_max)
    select p_slot_id, p_round_key, tc.dias[1], '10:00', '10:07', 0, tc.cupo_por_turno
    from turnos_config tc where tc.round_key = p_round_key
    returning * into v_slot;

    if not found then
      raise exception 'SLOT_NOT_FOUND' using errcode = 'P0002';
    end if;
  end if;

  if v_slot.reservados >= v_slot.cupo_max then
    raise exception 'SLOT_FULL' using errcode = 'P0003';
  end if;

  update turnos_slots set reservados = reservados + 1, updated_at = now()
  where slot_id = p_slot_id;

  insert into reservas_turnos (
    registration_id, round_key, dni_key, slot_id, codigo,
    fecha, hora, hora_fin, ubicacion, instrucciones,
    full_name, email, phone, kart_number, category_slug
  ) values (
    p_registration_id, p_round_key, p_dni_key, p_slot_id, p_codigo,
    v_slot.fecha, v_slot.hora, v_slot.hora_fin, p_ubicacion, p_instrucciones,
    p_full_name, p_email, p_phone, p_kart_number, p_category_slug
  );

  return jsonb_build_object(
    'codigo', p_codigo,
    'slot_id', p_slot_id,
    'fecha', v_slot.fecha,
    'hora', v_slot.hora,
    'hora_fin', v_slot.hora_fin
  );
end;
$$;

-- Config de ejemplo para Fecha 1
insert into turnos_config (
  round_key, evento_nombre, activo, dias,
  hora_inicio, hora_fin, minutos_por_turno, cupo_por_turno,
  ubicacion, instrucciones
) values (
  'fecha-1',
  'Fecha 1 — Kartódromo de BS AS',
  true,
  array['2026-02-27'::date, '2026-02-28'::date],
  '10:00', '18:00', 7, 1,
  'Administración del kartódromo',
  'Presentate 10 minutos antes de tu turno con DNI y comprobante de inscripción.'
) on conflict (round_key) do update set
  activo = excluded.activo,
  dias = excluded.dias,
  hora_inicio = excluded.hora_inicio,
  hora_fin = excluded.hora_fin,
  ubicacion = excluded.ubicacion,
  instrucciones = excluded.instrucciones;

-- Generar slots para fecha-1 (viernes y sábado previo a la carrera)
do $$
declare
  cfg turnos_config%rowtype;
  d date;
  t int;
  start_min int;
  end_min int;
  mins int;
  h text;
  h_fin text;
  sid text;
begin
  select * into cfg from turnos_config where round_key = 'fecha-1';
  if not found then return; end if;

  mins := cfg.minutos_por_turno;
  start_min := (split_part(cfg.hora_inicio, ':', 1)::int * 60) + split_part(cfg.hora_inicio, ':', 2)::int;
  end_min := (split_part(cfg.hora_fin, ':', 1)::int * 60) + split_part(cfg.hora_fin, ':', 2)::int;

  foreach d in array cfg.dias loop
    t := start_min;
    while t + mins <= end_min loop
      h := lpad((t / 60)::text, 2, '0') || ':' || lpad((t % 60)::text, 2, '0');
      h_fin := lpad(((t + mins) / 60)::text, 2, '0') || ':' || lpad(((t + mins) % 60)::text, 2, '0');
      sid := cfg.round_key || '_' || d::text || '_' || replace(h, ':', '');
      insert into turnos_slots (slot_id, round_key, fecha, hora, hora_fin, reservados, cupo_max)
      values (sid, cfg.round_key, d, h, h_fin, 0, cfg.cupo_por_turno)
      on conflict (slot_id) do nothing;
      t := t + mins;
    end loop;
  end loop;
end $$;

update app_config set value = jsonb_set(
  coalesce(value, '{}'::jsonb),
  '{inscripcion_habilitada}',
  'true'::jsonb
) where key = 'temporada';
