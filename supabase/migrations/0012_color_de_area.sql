-- 0012: cada área tiene un color, para leer la semana de un vistazo.

begin;

alter table public.areas add column color text not null default '#ffffff' check (color ~ '^#[0-9a-f]{6}$');

update public.areas set color = case id
  when 'trabajo' then '#7aa2ff'
  when 'estudio' then '#c792ea'
  when 'lectura' then '#f2c46d'
  when 'ejercicio' then '#6fd39b'
  when 'colchon' then '#9aa0a6'
  else color
end;

create or replace function private.seed_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.areas (user_id, id, name, sort, kind, color) values
    (new.id, 'trabajo', 'Trabajo', 1, null, '#7aa2ff'),
    (new.id, 'estudio', 'Estudio', 2, 'study', '#c792ea'),
    (new.id, 'lectura', 'Lectura', 3, 'reading', '#f2c46d'),
    (new.id, 'ejercicio', 'Ejercicio', 4, null, '#6fd39b'),
    (new.id, 'colchon', 'Colchón', 5, null, '#9aa0a6');
  return new;
end;
$$;

commit;
