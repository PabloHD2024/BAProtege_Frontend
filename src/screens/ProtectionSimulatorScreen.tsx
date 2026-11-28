import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { FigmaScreen, PageTitle, SurfaceCard, FIGMA_COLORS } from '../components';
import { deviceApi, type DeviceLinkState, type ReportedEvent } from '../services/api';
import {
    getCachedDeviceRules,
    getCachedSystemRules,
    syncAllRules,
    type DeviceRulesCache,
    type SystemRulesCache,
} from '../services/rulesSync';
import { evaluateDomain, type DomainEvaluation } from '../utils/protection';
import { formatDateTime } from '../utils/format';
import { notify } from '../utils/notify';
import type { AppScreenProps } from '../navigation/types';

const SOURCE_LABEL = { system: 'Lista general', custom: 'Lista personalizada' } as const;

export default function ProtectionSimulatorScreen({
    navigation,
}: AppScreenProps<'ProtectionSimulator'>) {
    const [domain, setDomain] = useState('');
    const [system, setSystem] = useState<SystemRulesCache | null>(null);
    const [custom, setCustom] = useState<DeviceRulesCache | null>(null);
    const [linkState, setLinkState] = useState<DeviceLinkState | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);

    const [evaluation, setEvaluation] = useState<DomainEvaluation | null>(null);
    const [registering, setRegistering] = useState(false);
    const [registered, setRegistered] = useState<ReportedEvent | null>(null);

    const sync = useCallback(async () => {
        setSyncing(true);
        setSyncError(null);
        try {
            const outcome = await syncAllRules();
            setSystem(outcome.system);
            setCustom(outcome.custom);
            setLinkState(outcome.state);
            setSyncError(outcome.error);
        } finally {
            setSyncing(false);
        }
    }, []);

    useEffect(() => {
        // Muestra primero lo guardado y después actualiza contra el backend
        Promise.all([getCachedSystemRules(), getCachedDeviceRules()]).then(([s, c]) => {
            setSystem(s);
            setCustom(c);
        });
        sync();
    }, [sync]);

    const hasRules = system !== null || custom !== null;
    const canRegister = linkState === 'linked' && evaluation !== null && !evaluation.error;

    const resetResult = () => {
        setEvaluation(null);
        setRegistered(null);
    };

    const handleEvaluate = () => {
        setRegistered(null);
        setEvaluation(evaluateDomain(domain, system, custom));
    };

    const handleRegister = async () => {
        if (!evaluation || evaluation.error) return;
        setRegistering(true);
        try {
            // Se envía el dominio normalizado; el backend lo clasifica con sus propias listas
            setRegistered(
                await deviceApi.reportEvent({ event_type: 'domain', value: evaluation.normalized })
            );
        } catch (e: any) {
            notify('No se pudo registrar el evento', e?.message);
        } finally {
            setRegistering(false);
        }
    };

    // ¿La clasificación del backend coincide con la evaluación local?
    const backendBlocked =
        registered !== null && (registered.action === 'block' || registered.action === 'alert');
    const consistent = registered !== null && evaluation !== null && backendBlocked === evaluation.matched;

    return (
        <FigmaScreen onBack={() => navigation.goBack()}>
            <PageTitle
                title="Simulador de protección"
                subtitle="Probá cómo se evaluaría un dominio con las reglas sincronizadas."
            />

            <SurfaceCard style={styles.banner}>
                <Text style={styles.bannerTitle}>Simulación web</Text>
                <Text style={styles.bannerText}>
                    Esta pantalla evalúa el dominio contra las reglas descargadas y registra un evento
                    de prueba. No bloquea tráfico real del dispositivo Android.
                </Text>
            </SurfaceCard>

            <SurfaceCard>
                <Text style={styles.cardTitle}>Reglas utilizadas</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Lista general</Text>
                    <Text style={styles.value}>
                        {system ? `${system.domain.length} dominios · v${system.version}` : 'Sin sincronizar'}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Lista personalizada</Text>
                    <Text style={styles.value}>
                        {custom ? `${custom.domain.length} dominios` : 'Sin sincronizar'}
                    </Text>
                </View>
                <Text style={styles.note}>
                    Última actualización: {formatDateTime(custom?.updatedAt ?? system?.updatedAt)}
                </Text>
                {syncError ? <Text style={styles.warning}>{syncError}</Text> : null}
                {linkState === 'offline' ? (
                    <Text style={styles.warning}>Sin conexión: se usan las últimas reglas guardadas.</Text>
                ) : null}
                {linkState === 'pending' || linkState === 'unlinked' ? (
                    <Text style={styles.warning}>
                        Este dispositivo no está vinculado activamente: no se pueden registrar eventos.
                    </Text>
                ) : null}
                <View style={styles.gap}>
                    <Button
                        label={syncing ? 'Actualizando...' : 'Actualizar reglas'}
                        variant="outline"
                        disabled={syncing}
                        onPress={sync}
                    />
                </View>
            </SurfaceCard>

            <View style={styles.form}>
                <TextField
                    label="Dominio a evaluar"
                    placeholder="sitio.com"
                    value={domain}
                    autoCapitalize="none"
                    onChangeText={t => {
                        setDomain(t);
                        resetResult();
                    }}
                />
                <Button
                    label="Evaluar"
                    disabled={!domain.trim() || !hasRules}
                    onPress={handleEvaluate}
                />
                {!hasRules && !syncing ? (
                    <Text style={styles.warning}>Sincronizá las reglas antes de evaluar un dominio.</Text>
                ) : null}
            </View>

            {evaluation ? (
                <SurfaceCard style={styles.result}>
                    {evaluation.error ? (
                        <Text style={styles.error}>{evaluation.error}</Text>
                    ) : (
                        <>
                            <Text
                                style={[
                                    styles.verdict,
                                    { color: evaluation.matched ? FIGMA_COLORS.danger : FIGMA_COLORS.positive },
                                ]}
                            >
                                {evaluation.matched
                                    ? 'Coincide con una regla de bloqueo'
                                    : 'Sin coincidencia con las reglas'}
                            </Text>
                            <Text style={styles.note}>Valor evaluado: {evaluation.normalized}</Text>
                            {evaluation.matches.map(m => (
                                <Text key={m.source} style={styles.match}>
                                    Regla: dominio “{m.value}” · {SOURCE_LABEL[m.source]}
                                </Text>
                            ))}
                            {!evaluation.matched ? (
                                <Text style={styles.note}>
                                    La coincidencia es exacta, igual que en el backend: un subdominio distinto
                                    no coincide.
                                </Text>
                            ) : null}
                            <View style={styles.gap}>
                                <Button
                                    label={registering ? 'Registrando...' : 'Registrar evento de prueba'}
                                    disabled={!canRegister || registering || registered !== null}
                                    onPress={handleRegister}
                                />
                            </View>
                        </>
                    )}
                </SurfaceCard>
            ) : null}

            {registered ? (
                <SurfaceCard style={styles.result}>
                    <Text style={styles.cardTitle}>Evento registrado en el backend</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Clasificación</Text>
                        <Text style={styles.value}>
                            {registered.action
                                ? `${registered.category ?? 'Sin categoría'} · ${registered.action}`
                                : 'Sin regla coincidente'}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Alerta generada</Text>
                        <Text style={styles.value}>{registered.alert_generated ? 'Sí' : 'No'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Fecha</Text>
                        <Text style={styles.value}>{formatDateTime(registered.event_time)}</Text>
                    </View>
                    <Text style={consistent ? styles.okNote : styles.warning}>
                        {consistent
                            ? 'La clasificación del backend coincide con la evaluación local.'
                            : 'El backend clasificó distinto que la evaluación local. Actualizá las reglas y volvé a probar.'}
                    </Text>
                    <Text style={styles.note}>
                        El responsable podrá ver este evento en su historial.
                    </Text>
                </SurfaceCard>
            ) : null}
        </FigmaScreen>
    );
}

const styles = StyleSheet.create({
    banner: { backgroundColor: FIGMA_COLORS.softPurple, marginBottom: 14 },
    bannerTitle: { color: FIGMA_COLORS.primary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
    bannerText: { color: FIGMA_COLORS.text, fontSize: 13, lineHeight: 19 },
    cardTitle: { color: FIGMA_COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    label: { color: FIGMA_COLORS.muted, fontSize: 13 },
    value: { color: FIGMA_COLORS.text, fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
    note: { color: FIGMA_COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
    okNote: { color: FIGMA_COLORS.positive, fontSize: 12, lineHeight: 18, marginTop: 8 },
    warning: { color: FIGMA_COLORS.warning, fontSize: 12, lineHeight: 18, marginTop: 8 },
    error: { color: FIGMA_COLORS.danger, fontSize: 13 },
    gap: { marginTop: 12 },
    form: { gap: 10, marginTop: 16, marginBottom: 14 },
    result: { marginBottom: 14 },
    verdict: { fontSize: 16, fontWeight: '700' },
    match: { color: FIGMA_COLORS.text, fontSize: 13, marginTop: 8 },
});
