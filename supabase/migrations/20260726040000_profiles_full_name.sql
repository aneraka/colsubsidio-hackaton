-- Módulo de login: se necesita un nombre para mostrar ("Hola, Juan P.") que hoy no existe en profiles.
alter table public.profiles add column full_name text;

-- Gap de la reconstrucción anterior: la función public.handle_new_user() existe (estaba en el diff de
-- `public`) pero el trigger que la dispara vive en auth.users (schema `auth`), así que no se capturó.
-- Sin esto, crear un usuario en auth.users nunca genera su fila en public.profiles.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
