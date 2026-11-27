import { Alert, Platform } from 'react-native';

/**
 * Aviso simple multiplataforma.
 * `Alert.alert` de React Native NO hace nada en web (react-native-web lo deja vacío),
 * por eso en navegador se usa window.alert.
 */
export function notify(title: string, message?: string): void {
    if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
            window.alert(message ? `${title}\n\n${message}` : title);
        }
        return;
    }
    Alert.alert(title, message);
}
