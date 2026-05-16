-- =============================================================
-- Migration 003: WhatsApp via CallMeBot (self-notifications)
--
-- Reemplaza dependencia de Meta WhatsApp Cloud API por CallMeBot,
-- un servicio HTTP simple que envía mensajes a TU propio número WA
-- después de un opt-in manual one-time.
--
-- Cada profile tiene su propia api_key porque CallMeBot la emite
-- por número de teléfono, no por app.
-- =============================================================

alter table profiles
  add column if not exists callmebot_api_key text;
