import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Button from '../components/Button';
import { FigmaScreen, PageTitle, ScreenFooter, SurfaceCard, FIGMA_COLORS } from '../components';
import { api, type CustomRule, type Device } from '../services/api';
import { getCachedSystemRules, syncSystemRules, type SystemRulesCache } from '../services/rulesSync';
import { formatDateTime } from '../utils/format';
import type { AppScreenProps } from '../navigation/types';

/**
 * Resumen de la protección con datos reales del backend.
 * No hay endpoint para guardar preferencias del responsable, así que esta pantalla
 * no muestra interruptores: solo lo que existe y se puede administrar de verdad.
 */
export default function SettingsScreen({ navigation }: AppScreenProps<'Settings'>) {
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<Device[] | null>(null);
    const [rules, setRules] = useState<CustomRule[] | null>(null);
    const [system, setSystem] = useState<SystemRulesCache | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        // Cada consulta es independiente: si una falla, las demás se muestran igual
        const [dev, custom, sys] = await Promise.allSettled([
            api.getDevices(),
            api.getCustomRules(),
            syncSystemRules(),
        ]);
        setDevices(dev.status === 'fulfilled' ? dev.value : null);
        setRules(custom.status === 'fulfilled' ? custom.value : null);
        setSystem(sys.status === 'fulfilled' ? sys.value : await getCachedSystemRules());
        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const linked = devices?.filter(d => d.status === 'linked').length;
    const pending = devices?.filter(d => d.status === 'pending').length ?? 0;
    const domains = rules?.filter(r => r.rule_type === 'domain').length;
    const keywords = rules?.filter(r => r.rule_type === 'keyword').length;

    return (
        <FigmaScreen onBack={() => navigation.goBack()}>
            <PageTitle
                title="Resumen de protección"
                subtitle="Estado actual de tus dispositivos y listas de bloqueo."
            />

            {loading ? (
                <ActivityIndicator color={FIGMA_COLORS.primary} style={{ marginVertical: 30 }} />
            ) : (
                <SurfaceCard>
                    <View style={styles.row}>
                        <Text style={styles.label}>Dispositivos vinculados</Text>
                        <Text style={styles.value}>
                            {linked === undefined
                                ? '—'
                                : pending > 0
                                    ? `${linked} (${pending} con desvinculación pendiente)`
                                    : String(linked)}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Lista negra propia</Text>
                        <Text style={styles.value}>
                            {domains === undefined ? '—' : `${domains} dominios · ${keywords} palabras`}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Lista general</Text>
                        <Text style={styles.value}>
                            {system ? `${system.total} reglas · v${system.version}` : '—'}
                        </Text>
                    </View>
                    {system ? (
                        <Text style={styles.note}>
                            Lista general actualizada: {formatDateTime(system.updatedAt)}
                        </Text>
                    ) : null}
                </SurfaceCard>
            )}

            <Text style={styles.footnote}>
                La lista general la mantiene el sistema y se aplica a todos los dispositivos. Tu lista
                negra se suma a ella. Las preferencias adicionales de protección todavía no están
                disponibles en esta versión.
            </Text>

            <ScreenFooter>
                <Button label="Administrar lista negra" onPress={() => navigation.navigate('Blacklist')} />
                <View style={styles.spacer} />
                <Button
                    label="Ver dispositivos"
                    variant="outline"
                    onPress={() => navigation.navigate('Devices')}
                />
            </ScreenFooter>
        </FigmaScreen>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
    label: { color: FIGMA_COLORS.muted, fontSize: 13 },
    value: { color: FIGMA_COLORS.text, fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
    note: { color: FIGMA_COLORS.muted, fontSize: 12, marginTop: 8 },
    footnote: { color: FIGMA_COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 14 },
    spacer: { height: 10 },
});
