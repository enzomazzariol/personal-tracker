-- 0006: lectura. Libros con su estado y notas, y un registro de páginas por día.

begin;

create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (title <> ''),
  author text not null default '',
  pages int check (pages > 0),
  status text not null default 'want' check (status in ('want', 'reading', 'done')),
  started_on date,
  finished_on date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index books_user_idx on public.books (user_id);

create table public.reading_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_id uuid not null,
  date date not null default current_date,
  pages int not null check (pages > 0),
  created_at timestamptz not null default now(),
  foreign key (book_id, user_id) references public.books (id, user_id) on delete cascade
);
create index reading_log_book_idx on public.reading_log (book_id);
create index reading_log_user_date_idx on public.reading_log (user_id, date);

alter table public.books enable row level security;
create policy "own_rows" on public.books for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.books to authenticated;
revoke all on public.books from anon;

alter table public.reading_log enable row level security;
create policy "own_rows" on public.reading_log for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.reading_log to authenticated;
revoke all on public.reading_log from anon;

commit;
