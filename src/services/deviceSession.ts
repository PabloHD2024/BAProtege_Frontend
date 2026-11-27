import { secureStorage } from './secureStorage';

const DEVICE_TOKEN_KEY = 'lotba_device_token';

/**
 * Sesión del dispositivo protegido: el device_token que devuelve /pairing/consume.
 * El device_uuid NO se guarda acá: vive en deviceIdentity.ts (getOrCreateDeviceUuid),
 * que es la única fuente de verdad del identificador.
 */
export const deviceSession = {
    getToken: (): Promise<string | null> => secureStorage.getItem(DEVICE_TOKEN_KEY),
    setToken: (token: string): Promise<void> => secureStorage.setItem(DEVICE_TOKEN_KEY, token),
    clear: (): Promise<void> => secureStorage.deleteItem(DEVICE_TOKEN_KEY),
};
