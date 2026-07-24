-- Turnos de administración — Fecha 6 (carrera ~8 Ago Baradero; turnos 6-7 Ago)
-- Jueves 6 y viernes 7 de agosto, 11:00–17:00 cada 5 minutos (72/día = 144 total)
-- Ejecutar en Supabase → SQL Editor

update registrations r
set round_key = case
  when ro.round_number = 11 then 'final-iame'
  else 'fecha-' || ro.round_number
end
from rounds ro
where r.round_key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and ro.id::text = r.round_key;

-- Desactivar configs anteriores para que figure solo la fecha activa
update turnos_config set activo = false where round_key <> 'fecha-6';

insert into turnos_config (
  round_key, round_id, evento_nombre, activo, dias,
  hora_inicio, hora_fin, minutos_por_turno, cupo_por_turno,
  ubicacion, instrucciones
)
select
  'fecha-6',
  r.id,
  'Fecha 6 — Kartódromo Ramiro Tot, Baradero',
  true,
  array['2026-08-06'::date, '2026-08-07'::date],
  '11:00', '17:00', 5, 1,
  'Administración — Kartódromo Ramiro Tot, Baradero',
  'Presentate 10 minutos antes de tu turno con DNI y comprobante de inscripción. Fecha 6: titular + piloto invitado.'
from rounds r
where r.round_number = 6
on conflict (round_key) do update set
  round_id = excluded.round_id,
  evento_nombre = excluded.evento_nombre,
  activo = excluded.activo,
  dias = excluded.dias,
  hora_inicio = excluded.hora_inicio,
  hora_fin = excluded.hora_fin,
  minutos_por_turno = excluded.minutos_por_turno,
  cupo_por_turno = excluded.cupo_por_turno,
  ubicacion = excluded.ubicacion,
  instrucciones = excluded.instrucciones,
  updated_at = now();

delete from turnos_slots
where round_key = 'fecha-6' and reservados = 0;

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
  select * into cfg from turnos_config where round_key = 'fecha-6';
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
      on conflict (slot_id) do update set
        hora_fin = excluded.hora_fin,
        cupo_max = excluded.cupo_max,
        updated_at = now();
      t := t + mins;
    end loop;
  end loop;
end $$;

-- Verificación
select fecha, count(*) as turnos
from turnos_slots
where round_key = 'fecha-6'
group by fecha
order by fecha;
