/** Normaliza texto para búsquedas insensibles a mayúsculas/acentos (minúsculas, sin tildes, sin puntuación). */
export function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
