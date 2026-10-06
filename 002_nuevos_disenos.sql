-- =====================================================================
--  Actualización: 8 diseños + productos recomendados
--  Ejecutar UNA vez en Supabase > SQL Editor
-- =====================================================================

-- Productos recomendados (la estrella del panel)
alter table products add column if not exists featured boolean not null default false;

-- Habilitar los 4 diseños nuevos
alter table restaurant_design drop constraint if exists restaurant_design_theme_check;
alter table restaurant_design add constraint restaurant_design_theme_check
  check (theme in ('elegante','burger','bar','parrilla','cafe','zen','fresco','galeria'));
