-- 0012: cada área tiene un color, para leer la semana de un vistazo.

begin;

alter table public.areas add column color text not null default '#ffffff' check (color ~ '^#[0-9a-f]{6}$');

update public.areas set color = case id
  when 'trabajo' then '#2f6bff'
  when 'estudio' then '#00b8d9'
  when 'lectura' then '#ffa800'
  when 'ejercicio' then '#12b76a'
  when 'colchon' then '#8a8f98'
  else color
end;

create or replace function private.seed_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.areas (user_id, id, name, sort, kind, color) values
    (new.id, 'trabajo', 'Trabajo', 1, null, '#2f6bff'),
    (new.id, 'estudio', 'Estudio', 2, 'study', '#00b8d9'),
    (new.id, 'lectura', 'Lectura', 3, 'reading', '#ffa800'),
    (new.id, 'ejercicio', 'Ejercicio', 4, null, '#12b76a'),
    (new.id, 'colchon', 'Colchón', 5, null, '#ef0f9d');
  return new;
end;
$$;

commit;
