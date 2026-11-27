export type RuleType = 'domain' | 'keyword';

/**
 * Normaliza un valor igual que el backend (utils/normalizeDomains.js):
 *  - domain: extrae el hostname, minúsculas y sin "www."
 *  - keyword: trim y minúsculas
 * Debe mantenerse consistente con el backend: lo usan la validación de duplicados
 * y, en la Etapa 3, el simulador de bloqueo.
 */
export function normalizeRuleValue(type: RuleType, raw: string): string {
    const value = raw ?? '';
    if (!value.trim()) return '';

    if (type === 'domain') {
        const trimmed = value.trim();
        let hostname: string;
        try {
            const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
            hostname = new URL(url).hostname.toLowerCase();
        } catch {
            hostname = trimmed.toLowerCase();
        }
        return hostname.replace(/^www\./, '');
    }

    return value.trim().toLowerCase();
}

/** Devuelve un mensaje de error si el valor no es válido para ese tipo, o null si está bien. */
export function validateRuleValue(type: RuleType, normalized: string): string | null {
    if (!normalized) return 'Ingresá un valor.';
    if (/\s/.test(normalized)) return 'El valor no puede contener espacios.';
    if (type === 'domain' && !normalized.includes('.')) {
        return 'Ingresá un dominio válido, por ejemplo sitio.com.';
    }
    return null;
}
