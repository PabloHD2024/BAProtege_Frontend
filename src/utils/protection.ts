import { normalizeRuleValue, validateRuleValue } from './rules';

export type RuleMatch = {
    source: 'system' | 'custom';
    ruleType: 'domain';
    value: string;
};

export type DomainEvaluation = {
    input: string;
    /** Valor normalizado como lo hace el backend (hostname, minúsculas, sin "www."). */
    normalized: string;
    /** Error de validación del dominio ingresado (no se evaluó). */
    error: string | null;
    matched: boolean;
    matches: RuleMatch[];
};

type DomainList = { domain: string[] } | null;

/**
 * Evalúa un dominio contra las reglas sincronizadas.
 *
 * Replica la clasificación del backend para eventos de tipo `domain`
 * (event.services.js): normaliza el valor y busca coincidencia EXACTA con una regla
 * `domain` activa de la lista general o de la personalizada. No hay coincidencia parcial
 * ni por subdominio, igual que en el backend.
 */
export function evaluateDomain(
    input: string,
    system: DomainList,
    custom: DomainList
): DomainEvaluation {
    const normalized = normalizeRuleValue('domain', input);
    const error = validateRuleValue('domain', normalized);
    if (error) return { input, normalized, error, matched: false, matches: [] };

    const matches: RuleMatch[] = [];
    // La lista personalizada es la de la familia: se informa primero
    if (custom?.domain.includes(normalized)) {
        matches.push({ source: 'custom', ruleType: 'domain', value: normalized });
    }
    if (system?.domain.includes(normalized)) {
        matches.push({ source: 'system', ruleType: 'domain', value: normalized });
    }
    return { input, normalized, error: null, matched: matches.length > 0, matches };
}
