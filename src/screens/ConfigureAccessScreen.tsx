import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Button from '../components/Button';
import { FigmaScreen, PageTitle, SurfaceCard, FIGMA_COLORS } from '../components';
import { pairingApi } from '../services/api';
import { formatDateTime } from '../utils/format';
import { notify } from '../utils/notify';
import type { AppScreenProps } from '../navigation/types';

export default function ConfigureAccessScreen({ navigation }: AppScreenProps<'ConfigureAccess'>) {
    const [pin, setPin] = useState('');
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const generarCodigo = async () => {
        setLoading(true);
        try {
            // El backend genera el PIN real de 6 dígitos (vence a los 10 minutos)
            const response = await pairingApi.generatePairingCode();
            setPin(response.code);
            setExpiresAt(response.expiresAt ?? null);
        } catch (error: any) {
            notify('Error', error.message || 'No se pudo generar el código');
        } finally {
            setLoading(false);
        }
    };

    return (
        <FigmaScreen onBack={() => navigation.goBack()}>
            <PageTitle
                title="Vincular dispositivo"
                subtitle="Generá un código temporal e ingresalo en el dispositivo protegido."
            />

            {pin ? (
                <>
                    <SurfaceCard style={styles.pinCard}>
                        <Text style={styles.label}>Código de vinculación</Text>
                        <Text style={styles.pin}>{pin}</Text>
                        <Text style={styles.note}>
                            Ingresalo en el dispositivo protegido. Es de un solo uso y vence a los 10
                            minutos{expiresAt ? ` (${formatDateTime(expiresAt)})` : ''}.
                        </Text>
                    </SurfaceCard>
                    <Button
                        label={loading ? 'Generando código...' : 'Generar nuevo código'}
                        variant="outline"
                        disabled={loading}
                        onPress={generarCodigo}
                    />
                    <Text style={styles.spacer} />
                    <Button label="Ver dispositivos" onPress={() => navigation.navigate('Devices')} />
                </>
            ) : (
                <Button
                    label={loading ? 'Generando código...' : 'Generar código de acceso'}
                    disabled={loading}
                    onPress={generarCodigo}
                />
            )}
        </FigmaScreen>
    );
}

const styles = StyleSheet.create({
    pinCard: { alignItems: 'center', backgroundColor: FIGMA_COLORS.softPurple, marginBottom: 16 },
    label: { color: FIGMA_COLORS.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    pin: {
        color: FIGMA_COLORS.primary,
        fontSize: 48,
        fontWeight: '800',
        letterSpacing: 10,
        marginBottom: 10,
    },
    note: { color: FIGMA_COLORS.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
    spacer: { height: 10 },
});
