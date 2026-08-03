-- Activa push automático al publicar una alerta (tabla notifications).
-- Ejecutar en Supabase → SQL Editor → Run
--
-- Antes:
-- 1) Desplegar la Edge Function send-push-notification
-- 2) En Edge Functions → Secrets, crear PUSH_WEBHOOK_SECRET
--    (el mismo valor que uses abajo en v_secret)

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_push_on_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text := 'https://ekhnxlliyblbslgragia.supabase.co/functions/v1/hyper-endpoint';
  -- MISMO valor que el secret PUSH_WEBHOOK_SECRET de la Edge Function
  v_secret text := 'iame-push-2026-bsproyect';
begin
  if new.is_published is distinct from true then
    return new;
  end if;

  -- Evitar reenvío si solo se actualiza otra columna y ya estaba publicada
  if tg_op = 'UPDATE'
     and old.is_published = true
     and old.title is not distinct from new.title
     and old.body is not distinct from new.body then
    return new;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', v_secret
    ),
    body := jsonb_build_object(
      'notification_id', new.id,
      'title', new.title,
      'body', coalesce(new.body, '')
    )
  );

  return new;
end;
$$;

drop trigger if exists on_notification_push on public.notifications;
create trigger on_notification_push
  after insert or update of is_published, title, body on public.notifications
  for each row
  when (new.is_published = true)
  execute function public.notify_push_on_alert();
