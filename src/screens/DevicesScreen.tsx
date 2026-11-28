import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Laptop, Smartphone, Tablet } from 'lucide-react-native';
import Button from '../components/Button';
import { FigmaScreen, PageTitle, ScreenFooter, SurfaceCard, FIGMA_COLORS, figmaStyles, } from '../components';
import { api, type Device } from '../services/api';
import type { AppScreenProps } from '../navigation/types';
import { notify } from '../utils/notify';

const iconFor = (osModel?: string | null) => {
    const m = (osModel ?? '').toLowerCase();
    if (m.includes('tablet') || m.includes('ipad')) {
        return <Tablet color={FIGMA_COLORS.primary} size={20} />;
    }
    if (m.includes('browser') || m.includes('laptop') || m.includes('desktop')) {
        return <Laptop color={FIGMA_COLORS.primary} size={20} />;
    }
    return <Smartphone color={FIGMA_COLORS.primary} size={20} />;
};

const statusLabel = (device: Device): { text: string; color: string } => {
    switch (device.status) {
        case 'linked':
            return device.protection_status
                ? { text: 'Vinculado · protegido', color: FIGMA_COLORS.positive }
                : { text: 'Vinculado · sin protección', color: FIGMA_COLORS.warning };
        case 'pending':
            return { text: 'Desvinculación pendiente', color: FIGMA_COLORS.warning };
        default:
            return { text: 'Desvinculado', color: FIGMA_COLORS.muted };
    }
};

export default function DevicesScreen({ navigation }: AppScreenProps<'Devices'>) {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    // Confirmación en dos pasos en la misma fila (Alert con botones no funciona en web)
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    // Recarga cada vez que la pantalla gana foco (p. ej. al volver de generar un PIN)
    useFocusEffect(
        useCallback(() => {
            loadDevices();
        }, [])
    );

    const loadDevices = async () => {
        try {
            setLoading(true);
            const data = await api.getDevices();
            setDevices(data);
        } catch (error: any) {
            notify('Error', error.message || 'No se pudieron cargar los dispositivos');
        } finally {
            setLoading(false);
        }
    };

    // Solicita la desvinculación: el dispositivo pasa a "pending" y debe confirmarla él mismo
    const requestUnlink = async (device: Device) => {
        setBusyId(device.id);
        try {
            await api.requestUnlink(device.id);
            setConfirmingId(null);
            notify(
                'Desvinculación solicitada',
                `Abrí la app en "${device.alias_name}" y confirmá la desvinculación para completarla.`
            );
            await loadDevices();
        } catch (error: any) {
            notify('No se pudo solicitar la desvinculación', error.message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <FigmaScreen onBack={() => navigation.goBack()}>
            <PageTitle
                title="Dispositivos vinculados"
                subtitle="Estos son los dispositivos que estás protegiendo."
            />
            {loading ? (
                <ActivityIndicator color={FIGMA_COLORS.primary} style={{ marginVertical: 40 }} />
            ) : devices.length === 0 ? (
                <SurfaceCard>
                    <Text style={styles.empty}>Todavía no vinculaste ningún dispositivo.</Text>
                </SurfaceCard>
            ) : (
                <SurfaceCard style={styles.list}>
                    {devices.map((device, index) => {
                        const status = statusLabel(device);
                        return (
                            <View
                                key={device.id}
                                style={[styles.item, index > 0 && styles.divided]}
                            >
                                <View style={styles.row}>
                                    <View style={styles.iconWrap}>{iconFor(device.os_model)}</View>
                                    <Text style={[figmaStyles.rowTitle, styles.name]}>{device.alias_name}</Text>
                                    <Text style={[styles.status, { color: status.color }]}>
                                        {status.text}
                                    </Text>
                                </View>

                                {device.status === 'pending' ? (
                                    <Text style={[styles.hint, styles.indented]}>
                                        Esperando que el dispositivo confirme la desvinculación.
                                    </Text>
                                ) : null}

                                {device.status === 'linked' ? (
                                    confirmingId === device.id ? (
                                        <View style={styles.confirmBox}>
                                            <Text style={styles.hint}>
                                                ¿Desvincular este dispositivo? Deberá confirmarlo desde la
                                                app del protegido.
                                            </Text>
                                            <View style={styles.confirmActions}>
                                                <TouchableOpacity
                                                    accessibilityRole="button"
                                                    disabled={busyId === device.id}
                                                    onPress={() => requestUnlink(device)}
                                                >
                                                    <Text style={styles.danger}>
                                                        {busyId === device.id ? 'Solicitando...' : 'Sí, desvincular'}
                                                    </Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    accessibilityRole="button"
                                                    disabled={busyId === device.id}
                                                    onPress={() => setConfirmingId(null)}
                                                >
                                                    <Text style={styles.cancel}>Cancelar</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            accessibilityRole="button"
                                            onPress={() => setConfirmingId(device.id)}
                                            style={styles.unlinkLink}
                                        >
                                            <Text style={styles.danger}>Desvincular</Text>
                                        </TouchableOpacity>
                                    )
                                ) : null}
                            </View>
                        );
                    })}
                </SurfaceCard>
            )}
            <ScreenFooter>
                <Button
                    label="Vincular nuevo dispositivo"
                    onPress={() => navigation.navigate('ConfigureAccess')}
                />
            </ScreenFooter>
        </FigmaScreen>
    );
}

const styles = StyleSheet.create({
    list: { paddingHorizontal: 14, paddingVertical: 0 },
    item: { paddingVertical: 4 },
    row: { alignItems: 'center', flexDirection: 'row', minHeight: 56 },
    indented: { marginLeft: 48 },
    hint: { color: FIGMA_COLORS.muted, fontSize: 12, lineHeight: 18, marginBottom: 8 },
    unlinkLink: { alignSelf: 'flex-start', marginBottom: 10, marginLeft: 48 },
    confirmBox: { marginBottom: 10, marginLeft: 48 },
    confirmActions: { flexDirection: 'row', gap: 20 },
    danger: { color: FIGMA_COLORS.danger, fontSize: 13, fontWeight: '700' },
    cancel: { color: FIGMA_COLORS.muted, fontSize: 13, fontWeight: '600' },
    divided: {
        borderTopColor: FIGMA_COLORS.border,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    iconWrap: {
        alignItems: 'center',
        backgroundColor: FIGMA_COLORS.softPurple,
        borderRadius: 10,
        height: 36,
        justifyContent: 'center',
        marginRight: 12,
        width: 36,
    },
    name: { flex: 1 },
    status: { fontSize: 12, fontWeight: '600' },
    empty: { color: FIGMA_COLORS.muted, fontSize: 14, textAlign: 'center' },
});