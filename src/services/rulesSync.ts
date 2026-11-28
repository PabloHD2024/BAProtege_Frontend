import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceApi, syncApi, type DeviceLinkState } from './api';

// Las listas pueden ser grandes y no son secretas: AsyncStorage (SecureStore nativo
// tiene un límite de tamaño muy bajo).
const SYSTEM_KEY = 'lotba_rules_system';
const DEVICE_KEY = 'lotba_rules_custom_device';

export type SystemRulesCache = {
    version: number;
    checksum: string;
    total: number;
    domain: string[];
    keyword: string[];
    regex: string[];
    /** Última vez que se verificó/actualizó con éxito contra el backend (ISO, hora local del dispositivo). */
    updatedAt: string;
};

export type DeviceRulesCache = {
    timestamp: number;
    checksum: string;
    total: number;
    domain: string[];
    keyword: string[];
    updatedAt: string;
};

async function readJson<T>(key: string): Promise<T | null> {
    try {
        const raw = await AsyncStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

async function writeJson(key: string, value: unknown): Promise<void> {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('[rulesSync] no se pudo guardar', key, e);
    }
}

export const getCachedSystemRules = () => readJson<SystemRulesCache>(SYSTEM_KEY);
export const getCachedDeviceRules = () => readJson<DeviceRulesCache>(DEVICE_KEY);

export async function clearDeviceRulesCache(): Promise<void> {
    await AsyncStorage.removeItem(DEVICE_KEY).catch(() => {});
}

/**
 * Sincroniza la lista general. Envía versión + checksum guardados: si el backend responde
 * UP_TO_DATE se conserva la lista; si responde RESET se reemplaza completa.
 * Ante un error de red/HTTP lanza y deja intacta la última lista válida.
 */
export async function syncSystemRules(): Promise<SystemRulesCache> {
    const cached = await getCachedSystemRules();
    const res = await syncApi.getSystemRules(
        cached ? { version: cached.version, checksum: cached.checksum } : undefined
    );
    const updatedAt = new Date().toISOString();

    if (res.status === 'UP_TO_DATE' && cached) {
        const refreshed = { ...cached, updatedAt };
        await writeJson(SYSTEM_KEY, refreshed);
        return refreshed;
    }

    if (!res.data) {
        // UP_TO_DATE sin cache local no debería ocurrir; pedimos la lista completa
        if (cached === null && res.status === 'UP_TO_DATE') {
            const full = await syncApi.getSystemRules();
            if (!full.data) throw new Error('Respuesta inválida de la lista general');
            return storeSystem(full, updatedAt);
        }
        throw new Error('Respuesta inválida de la lista general');
    }
    return storeSystem(res, updatedAt);
}

async function storeSystem(
    res: Awaited<ReturnType<typeof syncApi.getSystemRules>>,
    updatedAt: string
): Promise<SystemRulesCache> {
    const d = res.data!;
    const next: SystemRulesCache = {
        version: res.current_version,
        checksum: res.checksum,
        total: d.total,
        domain: d.domain ?? [],
        keyword: d.keyword ?? [],
        regex: d.regex ?? [],
        updatedAt,
    };
    await writeJson(SYSTEM_KEY, next);
    return next;
}

export type DeviceSyncOutcome = {
    state: DeviceLinkState;
    rules: DeviceRulesCache | null;
};

/**
 * Sincroniza la lista personalizada del dispositivo protegido (device_token + device_uuid).
 * También informa el estado real del vínculo. Si el dispositivo quedó desvinculado se
 * borra la lista guardada; sin conexión se devuelve la última lista válida.
 */
export async function syncDeviceRules(): Promise<DeviceSyncOutcome> {
    const cached = await getCachedDeviceRules();
    const result = await deviceApi.fetchCustomRules(
        cached ? { timestamp: cached.timestamp, checksum: cached.checksum } : undefined
    );

    if (result.kind === 'offline') return { state: 'offline', rules: cached };

    if (result.kind === 'state') {
        if (result.state === 'unlinked') await clearDeviceRulesCache();
        return { state: result.state, rules: result.state === 'unlinked' ? null : cached };
    }

    const res = result.response;
    const updatedAt = new Date().toISOString();

    if (res.status === 'UP_TO_DATE' && cached) {
        const refreshed = { ...cached, updatedAt };
        await writeJson(DEVICE_KEY, refreshed);
        return { state: 'linked', rules: refreshed };
    }

    if (res.status === 'UP_TO_DATE' || !res.data) {
        // Sin cache local o sin datos: volvemos a pedir la lista completa
        const full = await deviceApi.fetchCustomRules();
        if (full.kind !== 'ok' || !full.response.data) {
            return { state: 'linked', rules: cached };
        }
        return { state: 'linked', rules: await storeDevice(full.response, updatedAt) };
    }

    return { state: 'linked', rules: await storeDevice(res, updatedAt) };
}

async function storeDevice(
    res: { current_timestamp: number; checksum: string; data?: { total: number; domain: string[]; keyword: string[] } },
    updatedAt: string
): Promise<DeviceRulesCache> {
    const d = res.data!;
    const next: DeviceRulesCache = {
        timestamp: res.current_timestamp,
        checksum: res.checksum,
        total: d.total,
        domain: d.domain ?? [],
        keyword: d.keyword ?? [],
        updatedAt,
    };
    await writeJson(DEVICE_KEY, next);
    return next;
}

export type SyncAllOutcome = {
    state: DeviceLinkState;
    system: SystemRulesCache | null;
    custom: DeviceRulesCache | null;
    /** Error al actualizar la lista general (se conserva la última guardada). */
    error: string | null;
};

/**
 * Valida el vínculo y sincroniza la lista personalizada y la general en un solo paso.
 * Siempre devuelve la última lista válida disponible, aunque la actualización falle.
 */
export async function syncAllRules(): Promise<SyncAllOutcome> {
    const device = await syncDeviceRules();
    let system = await getCachedSystemRules();
    let error: string | null = null;

    if (device.state === 'linked' || device.state === 'offline') {
        try {
            system = await syncSystemRules();
        } catch (e: any) {
            error = e?.message || 'No se pudo actualizar la lista general.';
        }
    }
    return { state: device.state, system, custom: device.rules, error };
}
