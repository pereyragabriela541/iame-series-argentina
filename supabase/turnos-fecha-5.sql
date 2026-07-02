-- Turnos de administración — Fecha 5 (carrera 18-19 Jul, turnos 16-17 Jul)
-- Ejecutar en Supabase → SQL Editor

-- Normalizar inscripciones que guardaron UUID en round_key
update registrations r
set round_key = case
  when ro.round_number = 11 then 'final-iame'
  else 'fecha-' || ro.round_number
end
from rounds ro
where r.round_key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and ro.id::text = r.round_key;

insert into turnos_config (
  round_key, round_id, evento_nombre, activo, dias,
  hora_inicio, hora_fin, minutos_por_turno, cupo_por_turno,
  ubicacion, instrucciones
)
select
  'fecha-5',
  r.id,
  'Fecha 5 — Kartódromo de BS AS',
  true,
  array['2026-07-16'::date, '2026-07-17'::date],
  '10:00', '18:00', 7, 1,
  'Administración del kartódromo — Kartódromo de BS AS',
  'Presentate 10 minutos antes de tu turno con DNI y comprobante de inscripción. Carrera: 18 y 19 de julio.'
from rounds r
where r.round_number = 5
on conflict (round_key) do update set
  round_id = excluded.round_id,
  evento_nombre = excluded.evento_nombre,
  activo = excluded.activo,
  dias = excluded.dias,
  hora_inicio = excluded.hora_inicio,
  hora_fin = excluded.hora_fin,
  ubicacion = excluded.ubicacion,
  instrucciones = excluded.instrucciones,
  updated_at = now();

-- Generar slots (16 y 17 de julio, cada 7 min de 10:00 a 18:00)
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
  select * into cfg from turnos_config where round_key = 'fecha-5';
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
