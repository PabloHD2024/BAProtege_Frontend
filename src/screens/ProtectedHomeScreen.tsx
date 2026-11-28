import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import PinEntry from '../components/PinEntry';
import { FigmaScreen, PageTitle, SurfaceCard, FIGMA_COLORS } from '../components';
import { deviceApi, pairingApi, type DeviceLinkState } from '../services/api';
import {
    clearDeviceRulesCache,
    syncAllRules,
    type DeviceRulesCache,
    type SystemRulesCache,
} from '../services/rulesSync';
import { notify } from '../utils/notify';
import type { AppScreenProps } from '../navigation/types';

type ViewState = 'loading' | 'unlinked' | DeviceLinkState;

export default function ProtectedHomeScreen({ navigation }: AppScreenProps<'ProtectedHome'>) {
    const [codigo, setCodigo] = useState('');
    const [state, setState] = useState<ViewState>('loading');
    const [busy, setBusy] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [systemRules, setSystemRules] = useState<SystemRulesCache | null>(null);
    const [deviceRules, setDeviceRules] = useState<DeviceRulesCache | null>(null);

    // Valida el vínculo contra el backend y descarga lista general + personalizada.
    // Si algo falla, se conserva y muestra la última lista válida guardada.
    const refreshState = useCallback(async () => {
        setSyncing(true);
        setSyncError(null);
        try {
            const outcome = await syncAllRules();
            setState(outcome.state);
            setDeviceRules(outcome.custom);
            setSystemRules(outcome.system);
            setSyncError(outcome.error);
        } finally {
            setSyncing(false);
        }
    }, []);

    useEffect(() => {
        refreshState();
    }, [refreshState]);

    const handleVincular = async () => {
        if (codigo.length !== 6) return notify('Error', 'El código debe tener 6 dígitos.');
        setBusy(true);
        try {
            await pairingApi.consumePairingCode(codigo, 'Dispositivo protegido');
            setCodigo('');
            setState('linked');
            refreshState(); // primera sincronización de reglas
        } catch (error: any) {
            notify('No se pudo vincular', error.message);
        } finally {
            setBusy(false);
        }
    };

    // Solo confirma una desvinculación que el responsable ya solicitó desde su cuenta
    const handleConfirmUnlink = async () => {
        setBusy(true);
        try {
            await deviceApi.confirmUnlink();
            await clearDeviceRulesCache();
            setDeviceRules(null);
            setState('unlinked');
        } catch (error: any) {
            notify('Desvinculación', error.message);
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
                <View style={styles.pin}>
                    <PinEntry
                        value={codigo}
                        onChangeText={setCodigo}
                        accessibilityLabel="Código de vinculación de 6 dígitos"
                        autoFocus
                        onSubmitEditing={() => {
                            if (codigo.length === 6 && !busy) handleVincular();
                        }}
                    />
                </View>
                <Button
                    label={busy ? 'Validando...' : 'Vincular'}
                    disabled={busy || codigo.length !== 6}
                    onPress={handleVincular}
                />
            </FigmaScreen>
        );
    }

    const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString('es-AR') : '—');
    const lastUpdate = deviceRules?.updatedAt ?? systemRules?.updatedAt;

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
                <Text style={styles.warning}>
                    No se pudo verificar el estado (sin conexión). Se muestra la última lista guardada.
                </Text>
            ) : null}
            {syncError ? <Text style={styles.warning}>{syncError}</Text> : null}

            {state !== 'pending' ? (
                <SurfaceCard>
                    <Text style={styles.cardTitle}>Reglas sincronizadas</Text>
                    <View style={styles.ruleRow}>
                        <Text style={styles.ruleLabel}>Lista general</Text>
                        <Text style={styles.ruleValue}>
                            {systemRules
                                ? `${systemRules.total} reglas · v${systemRules.version}`
                                : 'Sin sincronizar'}
                        </Text>
                    </View>
                    <View style={styles.ruleRow}>
                        <Text style={styles.ruleLabel}>Lista personalizada</Text>
                        <Text style={styles.ruleValue}>
                            {deviceRules
                                ? `${deviceRules.domain.length} dominios · ${deviceRules.keyword.length} palabras`
                                : 'Sin sincronizar'}
                        </Text>
                    </View>
                    <Text style={styles.note}>Última actualización: {fmt(lastUpdate)}</Text>
                </SurfaceCard>
            ) : null}

            <View style={styles.actions}>
                {state === 'pending' ? (
                    <Button
                        label={busy ? 'Confirmando...' : 'Confirmar desvinculación'}
                        disabled={busy}
                        onPress={handleConfirmUnlink}
                    />
                ) : (
                    <>
                        <Button
                            label={syncing ? 'Actualizando...' : 'Actualizar reglas'}
                            disabled={syncing}
                            onPress={refreshState}
                        />
                        <Button
                            label="Simulador de protección"
                            variant="outline"
                            onPress={() => navigation.navigate('ProtectionSimulator')}
                        />
                    </>
                )}
            </View>
        </FigmaScreen>
    );
}

const styles = StyleSheet.create({
    pin: { marginBottom: 14 },
    note: { color: FIGMA_COLORS.muted, fontSize: 12, marginTop: 10 },
    warning: { color: FIGMA_COLORS.warning, fontSize: 13, marginBottom: 12 },
    cardTitle: { color: FIGMA_COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 8 },
    ruleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    ruleLabel: { color: FIGMA_COLORS.muted, fontSize: 13 },
    ruleValue: { color: FIGMA_COLORS.text, fontSize: 13, fontWeight: '600' },
    actions: { gap: 10, marginTop: 20 },
});
