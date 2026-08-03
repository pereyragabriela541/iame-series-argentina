-- Liberar un turno manualmente en Supabase
-- Reemplazá slot_id y round_key según corresponda.

-- Ejemplo: jueves 16/07 a las 11:00, Fecha 5
-- slot_id = fecha-5_2026-07-16_1100

begin;

delete from reservas_turnos
where slot_id = 'fecha-5_2026-07-16_1100'
  and round_key = 'fecha-5';

update turnos_slots
set reservados = 0, updated_at = now()
where slot_id = 'fecha-5_2026-07-16_1100';

commit;
