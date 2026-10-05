-- 0009: secciones conectadas.
-- - areas.kind: qué tipo de trabajo se hace en el área, para que la tarjeta del bloque en Hoy
--   muestre lo que toca (el libro en curso, los temas de estudio). No depende del nombre del área.
-- - Fechas de cuándo pasan las cosas, para la revisión semanal: tema dominado, hito cumplido.
-- - Fecha de seguimiento de una oferta, que aparece en Hoy cuando llega.

begin;

alter table public.areas add column kind text check (kind in ('reading', 'study'));
update public.areas set kind = 'reading' where id = 'lectura';
update public.areas set kind = 'study' where id = 'estudio';

alter table public.study_topics add column mastered_at timestamptz;
update public.study_topics set mastered_at = now() where status = 'mastered';

alter table public.goal_milestones add column done_at timestamptz;
update public.goal_milestones set done_at = now() where done;

alter table public.job_applications add column follow_up_on date;

-- Las cuentas nuevas reciben sus áreas ya con tipo.
create or replace function private.seed_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.areas (user_id, id, name, sort, kind) values
    (new.id, 'trabajo', 'Trabajo', 1, null),
    (new.id, 'estudio', 'Estudio', 2, 'study'),
    (new.id, 'lectura', 'Lectura', 3, 'reading'),
    (new.id, 'ejercicio', 'Ejercicio', 4, null),
    (new.id, 'colchon', 'Colchón', 5, null);
  return new;
end;
$$;

commit;
