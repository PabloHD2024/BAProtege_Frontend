/** Fecha y hora legibles en es-AR; devuelve "—" si el valor falta o es inválido. */
export function formatDateTime(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-AR');
}
