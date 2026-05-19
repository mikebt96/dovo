-- Alter core.tratos para soportar invitaciones pendientes:
-- partner_id puede ser NULL hasta que el invitado acepta. partner_email
-- + invite_token identifican al partner antes de que tenga partner_id.

alter table core.tratos alter column partner_id drop not null;

alter table core.tratos
  add column partner_email text not null
  check (length(partner_email) between 3 and 255);

alter table core.tratos
  add column invite_token text not null
  default replace(gen_random_uuid()::text, '-', '');

create unique index tratos_invite_token_idx on core.tratos(invite_token);

alter table core.tratos
  add column invite_expires_at timestamptz not null
  default (now() + interval '7 days');

alter table core.tratos drop constraint creator_ne_partner;
alter table core.tratos
  add constraint creator_ne_partner
  check (partner_id is null or creator_id != partner_id);

comment on column core.tratos.partner_email is 'Email del invitado al crear el trato. Identifica al partner antes de que tenga partner_id.';
comment on column core.tratos.invite_token is 'Token único en el link /invite/[token]. Se consume al aceptar (no se nullifica, solo state cambia).';
comment on column core.tratos.invite_expires_at is 'Cuándo expira el invite (default 7 días). Después de esto el accept rechaza.';

-- RLS update: el partner_email también puede leer su trato pendiente
-- (vía el email, no via partner_id que es null hasta aceptar)
drop policy tratos_read_member on core.tratos;
create policy tratos_read_member on core.tratos
  for select using (
    auth.uid() = creator_id
    or auth.uid() = partner_id
    or partner_email = (select email from core.users where id = auth.uid())
  );

-- Policy update: el invitado (que matchea partner_email) puede aceptar
drop policy tratos_update_member on core.tratos;
create policy tratos_update_member on core.tratos
  for update using (
    auth.uid() = creator_id
    or auth.uid() = partner_id
    or (
      partner_id is null
      and partner_email = (select email from core.users where id = auth.uid())
    )
  );
