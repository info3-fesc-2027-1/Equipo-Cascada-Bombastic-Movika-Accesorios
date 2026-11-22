/**
 * config.js — Configuración de la conexión con Supabase
 *
 * Cómo se llenan los dos valores: en Supabase → Project Settings → API:
 *   - "Project URL"                           → supabaseUrl
 *   - "anon public" (o "publishable") key     → supabaseKey
 *
 * Estos dos valores SÍ pueden estar en el repositorio: son públicos por diseño y la
 * seguridad real la dan las reglas de la base de datos (RLS) y el inicio de sesión.
 *
 * ¡NUNCA pongas aquí la clave "service_role" ni la contraseña de la base de datos!
 * Esas dan control total y no deben salir de Supabase.
 *
 * Si los dos valores están vacíos, la página funciona en MODO LOCAL (LocalStorage, sin inicio de sesión),
 * igual que antes. Cuando se llenan, la página exige inicio de sesión y guarda todo en Supabase.
 */
window.MOVIKA_CONFIG = {
  supabaseUrl: "https://kxhzxeiuzzqpznfmiosw.supabase.co",
  supabaseKey: "sb_publishable_sx3YfFjns8DX_DFXHuct9Q_mDrdCTZ2",
};