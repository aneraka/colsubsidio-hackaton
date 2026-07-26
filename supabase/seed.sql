-- Usuarios de demo para el módulo de login (PIN real vía Supabase Auth).
-- Se insertan directamente en auth.users/auth.identities (patrón estándar para seed local de
-- Supabase, ya que no hay flujo de signup real). El trigger handle_new_user crea la fila en
-- public.profiles automáticamente; después la actualizamos con el role y full_name reales.

do $$
declare
  v_user_id uuid;
  v_email text;
  v_pin text;
  v_full_name text;
  v_role public.user_role;
  usuarios jsonb := '[
    {"email": "juan.perez@colsubsidio.com",    "pin": "123456", "full_name": "Juan P.",    "role": "operario"},
    {"email": "sandra.martinez@colsubsidio.com","pin": "234567", "full_name": "Sandra M.",  "role": "operario"},
    {"email": "viviana.rojas@colsubsidio.com",  "pin": "345678", "full_name": "Viviana R.", "role": "admin"},
    {"email": "admin@colsubsidio.com",          "pin": "456789", "full_name": "Admin",      "role": "super_admin"},
    {"email": "lider.piscilago@colsubsidio.com","pin": "567890", "full_name": "Roberto Díaz", "role": "operario"}
  ]';
  u jsonb;
  v_lider_id uuid;
  v_site_id uuid;
begin
  for u in select * from jsonb_array_elements(usuarios)
  loop
    v_email := u->>'email';
    v_pin := u->>'pin';
    v_full_name := u->>'full_name';
    v_role := (u->>'role')::public.user_role;
    v_user_id := gen_random_uuid();

    -- GoTrue escanea confirmation_token/recovery_token/email_change_token_new/email_change como
    -- string (no nullable) — hay que forzarlos a '' explícitamente o falla con
    -- "converting NULL to string is unsupported" al hacer login.
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_email, crypt(v_pin, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}', false, false,
      '', '', '', ''
    );

    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      'email', now(), now()
    );

    -- handle_new_user (trigger AFTER INSERT en auth.users) ya insertó la fila en profiles
    -- con role='operario' por defecto; acá fijamos el role y full_name reales de cada usuario.
    -- (lider.piscilago@colsubsidio.com usa 'operario' como placeholder: el trigger sync_lider_role lo
    -- promueve a 'lider' automáticamente más abajo, al crear la sede que lo referencia como líder.)
    update public.profiles set role = v_role, full_name = v_full_name where id = v_user_id;
  end loop;

  -- Sede + bodegas reales (módulo de gestión de usuarios: bodegas a cargo por operario).
  select id into v_lider_id from auth.users where email = 'lider.piscilago@colsubsidio.com';

  insert into public.sites (name, address, leader_id)
  values ('Piscilago', 'Melgar, Tolima', v_lider_id)
  returning id into v_site_id;

  insert into public.warehouses (name, site_id, slug) values
    ('STOCK ALMACEN SUMINISTROS',        v_site_id, 'b-almacen-sumin'),
    ('STOCK ALMACEN AYB',                v_site_id, 'b-almacen-ayb'),
    ('STOCK RESTAURANTE FUENTES AYB',    v_site_id, 'b-rest-fuentes-ayb'),
    ('STOCK RESTAURANTE FUENTES SUMIN',  v_site_id, 'b-rest-fuentes-sumin'),
    ('STOCK KIOSCO TAQUILLA AYB',        v_site_id, 'b-kiosco-taquilla'),
    ('STOCK KIOSCO PISCIGIROS AYB',      v_site_id, 'b-kiosco-piscigiros'),
    ('ZOOLOGICO',                        v_site_id, 'b-zoologico'),
    ('ZOOLOGICO SUMINISTROS',            v_site_id, 'b-zoologico-sumin');
end $$;
