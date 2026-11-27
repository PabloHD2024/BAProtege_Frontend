import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../components/Button';
import { FigmaScreen, PageTitle, SurfaceCard, FIGMA_COLORS } from '../components';
import { deviceApi, pairingApi, type DeviceLinkState } from '../services/api';
import type { AppScreenProps } from '../navigation/types';

type ViewState = 'loading' | 'unlinked' | DeviceLinkState;

export default function ProtectedHomeScreen(_: AppScreenProps<'ProtectedHome'>) {
    const [codigo, setCodigo] = useState('');
    const [state, setState] = useState<ViewState>('loading');
    const [busy, setBusy] = useState(false);

    // Recupera el vínculo guardado y lo valida contra el backend (no un booleano local)
    const refreshState = useCallback(async () => {
        const result = await deviceApi.getLinkState();
        setState(result ?? 'unlinked');
    }, []);

    useEffect(() => {
        refreshState();
    }, [refreshState]);

    const handleVincular = async () => {
        if (codigo.length !== 6) return Alert.alert('Error', 'El código debe tener 6 dígitos.');
        setBusy(true);
        try {
            await pairingApi.consumePairingCode(codigo, 'Dispositivo protegido');
            setCodigo('');
            setState('linked');
        } catch (error: any) {
            Alert.alert('No se pudo vincular', error.message);
        } finally {
            setBusy(false);
        }
    };

    // Solo confirma una desvinculación que el responsable ya solicitó desde su cuenta
    const handleConfirmUnlink = async () => {
        setBusy(true);
        try {
            await deviceApi.confirmUnlink();
            setState('unlinked');
        } catch (error: any) {
            Alert.alert('Desvinculación', error.message);
        } finally {
            setBusy(false);
        }
    };

    if (state === 'loading') {
        return (
            <FigmaScreen>
                <ActivityIndicator color={FIGMA_COLORS.primary} style={{ marginVertical: 60 }} />
            </FigmaScreen>
        );
    }

    if (state === 'unlinked') {
        return (
            <FigmaScreen>
                <PageTitle
                    title="Vincular dispositivo"
                    subtitle="Ingresá el código de 6 dígitos que generó el responsable desde su panel."
                />
                <TextInput
                    style={styles.input}
                    placeholder="000000"
                    placeholderTextColor={FIGMA_COLORS.muted}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={codigo}
                    onChangeText={t => setCodigo(t.replace(/\D/g, ''))}
                    textAlign="center"
                />
                <Button
                    label={busy ? 'Validando...' : 'Vincular'}
                    disabled={busy || codigo.length !== 6}
                    onPress={handleVincular}
                />
            </FigmaScreen>
        );
    }

    return (
        <FigmaScreen>
            <PageTitle
                title="Dispositivo protegido"
                subtitle={
                    state === 'pending'
                        ? 'El responsable solicitó desvincular este dispositivo.'
                        : 'Este dispositivo está vinculado a la cuenta del responsable.'
                }
            />
            {state === 'offline' ? (
                <SurfaceCard>
                    <Text style={styles.note}>
                        No se pudo verificar el estado (sin conexión). Reintentá más tarde.
                    </Text>
                </SurfaceCard>
            ) : null}
            <View style={styles.actions}>
                {state === 'pending' ? (
                    <Button
                        label={busy ? 'Confirmando...' : 'Confirmar desvinculación'}
                        disabled={busy}
                        onPress={handleConfirmUnlink}
                    />
                ) : null}
                <Button label="Actualizar estado" variant="outline" onPress={refreshState} />
            </View>
        </FigmaScreen>
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: FIGMA_COLORS.surface,
        borderColor: FIGMA_COLORS.border,
        borderRadius: 12,
        borderWidth: 1,
        color: FIGMA_COLORS.text,
        fontSize: 24,
        fontWeight: '700',
        height: 60,
        letterSpacing: 8,
        marginBottom: 24,
    },
    note: { color: FIGMA_COLORS.muted, fontSize: 14, textAlign: 'center' },
    actions: { gap: 10, marginTop: 20 },
});
