import { tokenStorage } from './tokenStorage';
import { deviceSession } from './deviceSession';
import { getOrCreateDeviceUuid } from './deviceIdentity';
import type { RuleType } from '../utils/rules';

// Asegurate de tener EXPO_PUBLIC_API_URL en tu archivo .env
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.10.0.181:3000').replace(/\/$/, '');
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || '';

export type CustomRule = {
    id: string;
    value: string;
    rule_type: RuleType;
    created_at?: string;
};

export type DeviceStatus = 'linked' | 'pending' | 'unlinked';

/** Dispositivo tal como lo devuelve GET /devices (campos del backend). */
export type Device = {
    id: string;
    device_uuid: string;
    alias_name: string;
    os_model?: string | null;
    status: DeviceStatus;
    protection_status: boolean;
    last_ping?: string | null;
    creation_time?: string;
};

/** Evento tal como lo devuelve GET /events. `action` es la clasificación del backend (block, alert...). */
export type ProtectionEvent = {
    id: string;
    id_device: string;
    alias_name: string;
    os_model?: string | null;
    event_type: string;
    value: string;
    category: string | null;
    action: string | null;
    event_time: string;
    es_critico: boolean;
};

export type AlertSeverity = 'critical' | 'warning' | 'info';

/** Alerta tal como la devuelve GET /events/alerts. */
export type ProtectionAlert = {
    id: string;
    id_event: string;
    event_type: string;
    value: string;
    device_name: string;
    severity: AlertSeverity;
    message: string;
    read: boolean;
    alert_time: string;
};

/** Respuesta de POST /events (campo `event`). */
export type ReportedEvent = {
    id: string;
    event_type: string;
    value: string;
    category: string | null;
    action: string | null;
    event_time: string;
    alert_generated: boolean;
};

export type SyncStatus = 'UP_TO_DATE' | 'RESET';

/** Respuesta de GET /sync/system (versión + checksum para saber si hay que actualizar). */
export type SystemSyncResponse = {
    status: SyncStatus;
    current_version: number;
    checksum: string;
    data?: {
        total: number;
        domain: string[];
        keyword: string[];
        regex: string[];
        syncedAt: string;
    };
};

/** Contenido de `data` en GET /sync/custom/device (timestamp + checksum). */
export type DeviceSyncResponse = {
    status: SyncStatus;
    current_timestamp: number;
    checksum: string;
    data?: {
        total: number;
        domain: string[];
        keyword: string[];
        syncedAt: string;
    };
};

export type DeviceSyncResult =
    | { kind: 'ok'; response: DeviceSyncResponse }
    | { kind: 'state'; state: 'pending' | 'unlinked' }
    | { kind: 'offline' };

/** Resultado de consultar el estado del dispositivo protegido contra el backend. */
export type DeviceLinkState = 'linked' | 'pending' | 'unlinked' | 'offline';

type RawCustomRule = {
    id: string;
    value: string;
    rule_type: RuleType;
    creation_time?: string;
    created_at?: string;
};

type LoginResponse = {
    JWT: string;
    refresh_token: string;
    user: { id: string; email: string, name?: string | null };
};

function extractRules(payload: any): CustomRule[] {
    const data = payload?.data ?? payload;
    if (!data) return [];

    // Caso A: array directo
    if (Array.isArray(data)) {
        return data.map((r: RawCustomRule) => ({
            id: r.id,
            value: r.value,
            rule_type: r.rule_type,
            created_at: r.creation_time ?? r.created_at,
        }));
    }

    // Caso B: { total, domain: [], keyword: [], updatedAt }
    const rules: CustomRule[] = [];

    if (Array.isArray(data.domain)) {
        data.domain.forEach((r: RawCustomRule) => {
            rules.push({
                id: r.id,
                value: r.value,
                rule_type: 'domain',
                created_at: r.creation_time ?? r.created_at,
            });
        });
    }

    if (Array.isArray(data.keyword)) {
        data.keyword.forEach((r: RawCustomRule) => {
            rules.push({
                id: r.id,
                value: r.value,
                rule_type: 'keyword',
                created_at: r.creation_time ?? r.created_at,
            });
        });
    }

    return rules;
}

async function persistTokens(data: LoginResponse) {
    await tokenStorage.setAccessToken(data.JWT);
    await tokenStorage.setRefreshToken(data.refresh_token);
    if (data.user) await tokenStorage.setUser(data.user);
}

// --- Refresh automático de JWT ---
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const rt = await tokenStorage.getRefreshToken();
            if (!rt) return false;

            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 
                            'x-api-key': API_KEY, },
                body: JSON.stringify({ refresh_token: rt }),
            });

            if (!res.ok) {
                await tokenStorage.clearAll();
                return false;
            }

            const data = await res.json();

            // Ajustar si el back devuelve otro nombre (ver paso siguiente)
            const newAccess = data.JWT ?? data.access_token;
            const newRefresh = data.refresh_token;

            if (!newAccess) {
                console.warn('[tryRefresh] Respuesta sin token:', data);
                return false;
            }

            await tokenStorage.setAccessToken(newAccess);
            if (newRefresh) await tokenStorage.setRefreshToken(newRefresh);
            if (data.user) await tokenStorage.setUser(data.user);

            return true;
        } catch (e) {
            console.warn('[tryRefresh] Error:', e);
            return false;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}, _retry = false) {
    const token = await tokenStorage.getAccessToken();

    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // El backend devuelve 403 (no 401) cuando el token expiró.
    if (response.status === 401 || response.status === 403) {
        if (_retry) throw new Error('Sesión expirada. Volvé a iniciar sesión.');
        const refreshed = await tryRefresh();
        if (refreshed) return fetchWithAuth(endpoint, options, true);   // ← solo 1 reintento
        throw new Error('Sesión expirada. Volvé a iniciar sesión.');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Error en la petición');
    }

    if (response.status === 204) return null;

    return response.json();
}

export const api = {
    // --- LISTA NEGRA / REGLAS PERSONALIZADAS ---
    getCustomRules: async (): Promise<CustomRule[]> => {
        const res = await fetchWithAuth('/sync/custom/user');
        return extractRules(res);
    },

    addCustomRule: async (value: string, ruleType: RuleType = 'domain'): Promise<CustomRule> => {
        const res = await fetchWithAuth('/sync/custom/user', {
            method: 'POST',
            body: JSON.stringify({ value, rule_type: ruleType }),
        });
        const rule = res?.data ?? res;
        return {
            id: rule.id,
            value: rule.value,
            rule_type: rule.rule_type,
            created_at: rule.creation_time ?? rule.created_at,
        };
    },

    updateCustomRule: async (
        ruleId: string,
        value: string,
        ruleType: RuleType
    ): Promise<CustomRule> => {
        const res = await fetchWithAuth(`/sync/custom/user/${ruleId}`, {
            method: 'PUT',
            body: JSON.stringify({ value, rule_type: ruleType }),
        });
        const rule = res?.data ?? res;
        return {
            id: rule.id,
            value: rule.value,
            rule_type: rule.rule_type,
            created_at: rule.creation_time ?? rule.created_at,
        };
    },

    deleteCustomRule: async (ruleId: string): Promise<void> => {
        await fetchWithAuth(`/sync/custom/user/${ruleId}`, {
            method: 'DELETE',
        });
    },

    // --- DISPOSITIVOS ---
    getDevices: async (): Promise<Device[]> => {
        // El backend responde { devices: [...] }
        const res = await fetchWithAuth('/devices');
        return Array.isArray(res?.devices) ? res.devices : [];
    },

    // --- EVENTOS Y ALERTAS (responsable) ---
    getEvents: async (deviceId?: string): Promise<ProtectionEvent[]> => {
        const qs = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : '';
        const res = await fetchWithAuth(`/events${qs}`);
        return Array.isArray(res?.events) ? res.events : [];
    },

    getAlerts: async (opts: { onlyUnread?: boolean; limit?: number } = {}): Promise<ProtectionAlert[]> => {
        const params = new URLSearchParams();
        if (opts.onlyUnread) params.set('soloNoLeidas', 'true');
        if (opts.limit) params.set('limite', String(opts.limit));
        const qs = params.toString() ? `?${params.toString()}` : '';
        const res = await fetchWithAuth(`/events/alerts${qs}`);
        return Array.isArray(res?.alerts) ? res.alerts : [];
    },

    markAlertRead: async (alertId: string): Promise<void> => {
        await fetchWithAuth(`/events/alerts/${alertId}/read`, { method: 'PATCH' });
    },

    // El responsable solicita la desvinculación: el dispositivo pasa a 'pending'
    requestUnlink: async (deviceId: string): Promise<void> => {
        await fetchWithAuth(`/devices/${deviceId}/unlink`, { method: 'POST' });
    },

    // --- REGISTRO + LOGIN AUTOMÁTICO ---
    register: async (
        name: string,
        surname: string,
        email: string,
        password: string
    ) => {
        const registerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 
                'x-api-key': API_KEY, },
            body: JSON.stringify({ name, surname, email, password }),
        });

        if (!registerRes.ok) {
            const errorData = await registerRes.json().catch(() => ({}));
            // Asegúrate de atrapar las distintas formas en que el back envía el error
            const message = errorData.message || errorData.error || errorData.mensaje || 'Error al registrar usuario';
            throw new Error(message); 
        }

        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, },
            body: JSON.stringify({ email, password }),
        });

        if (!loginRes.ok) {
            // ⬇️ NUEVO: capturar status y body reales
            const errorBody = await loginRes.json().catch(() => ({}));
            console.warn('[register] login automático falló', {
                status: loginRes.status,
                body: errorBody,
                email,
            });
            throw new Error(
                `Usuario creado, pero no se pudo iniciar sesión (${loginRes.status}: ${errorBody.error ?? errorBody.message ?? 'sin detalle'}). Probá iniciar sesión manualmente.`
            );
        }

        if (!loginRes.ok) {
            throw new Error(
                'Usuario creado, pero no se pudo iniciar sesión. Probá iniciar sesión manualmente.'
            );
        }

        const loginData: LoginResponse = await loginRes.json();
        await persistTokens(loginData);
        return loginData;
    },

    // --- LOGIN ---
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY,},
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(
                errorData.message || errorData.error || 'Credenciales incorrectas'
            );
        }

        const data: LoginResponse = await res.json();
        await persistTokens(data);
        return data;
    },

    // --- LOGOUT ---
    logout: async () => {
        await tokenStorage.clearAll();
    },

};

async function readError(res: Response, fallback: string): Promise<string> {
    const body = await res.json().catch(() => ({}));
    return body.error || body.message || fallback;
}

export const pairingApi = {
    // 1. El responsable genera el código
    generatePairingCode: async (): Promise<{ code: string; expiresAt: string }> => {
        const token = await tokenStorage.getAccessToken();
        const res = await fetch(`${API_URL}/pairing/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                Authorization: `Bearer ${token}`,
            },
        });
        if (!res.ok) throw new Error(await readError(res, 'Error al generar el código'));
        return res.json();
    },

    // 2. El protegido ingresa el código. Usa siempre el UUID persistente.
    consumePairingCode: async (code: string, alias: string) => {
        const deviceUuid = await getOrCreateDeviceUuid();
        const res = await fetch(`${API_URL}/pairing/consume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
            body: JSON.stringify({
                code,
                device_uuid: deviceUuid,
                alias_name: alias,
                os_model: 'Web Browser',
            }),
        });

        if (!res.ok) throw new Error(await readError(res, 'PIN inválido o expirado'));

        const data = await res.json();
        await deviceSession.setToken(data.device_token);
        return data;
    },
};

// Lista general del sistema: pública (solo requiere x-api-key)
export const syncApi = {
    /**
     * GET /sync/system. Si se envían versión y checksum y coinciden con los del servidor,
     * responde UP_TO_DATE sin la lista; si no, RESET con la lista completa.
     */
    getSystemRules: async (meta?: { version: number; checksum: string }): Promise<SystemSyncResponse> => {
        const qs = meta
            ? `?version=${encodeURIComponent(String(meta.version))}&checksum=${encodeURIComponent(meta.checksum)}`
            : '';
        const res = await fetch(`${API_URL}/sync/system${qs}`, {
            headers: { 'x-api-key': API_KEY },
        });
        if (!res.ok) throw new Error(await readError(res, 'No se pudo obtener la lista general'));
        return res.json();
    },
};

/**
 * GET /sync/custom/device con device_token + device_uuid. Traduce el estado del vínculo:
 *   200 -> ok | 403 "pendiente" -> pending | 401/403 restantes -> unlinked | sin red -> offline.
 */
async function fetchDeviceCustomRules(
    meta?: { timestamp: number; checksum: string }
): Promise<DeviceSyncResult> {
    const token = await deviceSession.getToken();
    if (!token) return { kind: 'state', state: 'unlinked' };
    const uuid = await getOrCreateDeviceUuid();

    let qs = `?device_uuid=${encodeURIComponent(uuid)}`;
    if (meta) {
        qs += `&client_timestamp=${encodeURIComponent(String(meta.timestamp))}`;
        qs += `&client_checksum=${encodeURIComponent(meta.checksum)}`;
    }

    try {
        const res = await fetch(`${API_URL}/sync/custom/device${qs}`, {
            headers: { 'x-api-key': API_KEY, Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const body = await res.json();
            return { kind: 'ok', response: body.data ?? body };
        }
        const msg = (await readError(res, '')).toLowerCase();
        if (res.status === 403 && msg.includes('pendiente')) return { kind: 'state', state: 'pending' };
        return { kind: 'state', state: 'unlinked' }; // token inválido, revocado o desvinculado
    } catch {
        return { kind: 'offline' };
    }
}

// Operaciones autenticadas con device_token + device_uuid (dispositivo protegido)
export const deviceApi = {
    fetchCustomRules: fetchDeviceCustomRules,

    /**
     * Consulta el estado real del vínculo contra el backend. No existe aún un endpoint
     * dedicado, así que se deduce de GET /sync/custom/device (ver fetchDeviceCustomRules).
     * Devuelve null si no hay token guardado (nunca se vinculó).
     */
    getLinkState: async (): Promise<DeviceLinkState | null> => {
        if (!(await deviceSession.getToken())) return null;
        const result = await fetchDeviceCustomRules();
        if (result.kind === 'ok') return 'linked';
        if (result.kind === 'offline') return 'offline';
        return result.state;
    },

    /**
     * POST /events: el protegido registra un evento. Requiere device_token y estado 'linked'.
     * El backend normaliza el valor, lo clasifica contra las listas y decide si genera alerta.
     */
    reportEvent: async (event: {
        event_type: 'domain' | 'keyword';
        value: string;
    }): Promise<ReportedEvent> => {
        const token = await deviceSession.getToken();
        if (!token) throw new Error('Este dispositivo no está vinculado.');
        const uuid = await getOrCreateDeviceUuid();

        const res = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                device_uuid: uuid,
                event_type: event.event_type,
                value: event.value,
                event_time: new Date().toISOString(),
            }),
        });
        if (!res.ok) throw new Error(await readError(res, 'No se pudo registrar el evento'));
        const body = await res.json();
        return body.event;
    },

    /** Confirma la desvinculación. Solo funciona si el responsable la solicitó antes. */
    confirmUnlink: async (): Promise<void> => {
        const token = await deviceSession.getToken();
        const uuid = await getOrCreateDeviceUuid();
        const res = await fetch(`${API_URL}/devices/confirm-unlink`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ device_uuid: uuid }),
        });
        if (!res.ok) throw new Error(await readError(res, 'No se pudo confirmar la desvinculación'));
        await deviceSession.clear();
    },
};
