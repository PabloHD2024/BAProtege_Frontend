import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, CheckCheck, Clock3, Globe2, ShieldAlert } from 'lucide-react-native';
import { FigmaScreen, PageTitle, SurfaceCard, FIGMA_COLORS, figmaStyles } from '../components/FigmaScreen';
import {
  api,
  type AlertSeverity,
  type Device,
  type ProtectionAlert,
  type ProtectionEvent,
} from '../services/api';
import { formatDateTime } from '../utils/format';
import { notify } from '../utils/notify';
import type { AppScreenProps } from '../navigation/types';

type Tab = 'events' | 'alerts';

const MAX_ITEMS = 100;

const EVENT_LABEL: Record<string, string> = {
  domain: 'Acceso a dominio',
  keyword: 'Palabra clave',
  regex: 'Patrón bloqueado',
  uninstall_attempt: 'Intento de desinstalación',
  app_install_attempt: 'Intento de instalar una app',
  os_permission_change: 'Cambio de permisos',
  score_exceeded: 'Umbral de riesgo excedido',
  custom: 'Evento personalizado',
};

const SEVERITY: Record<AlertSeverity, { label: string; color: string }> = {
  critical: { label: 'Crítica', color: FIGMA_COLORS.danger },
  warning: { label: 'Advertencia', color: FIGMA_COLORS.warning },
  info: { label: 'Informativa', color: FIGMA_COLORS.primary },
};

/**
 * Estado a mostrar de un evento. Se decide por la clasificación del backend (`action`),
 * no por `es_critico`: un dominio sin coincidencia también viene como es_critico=true
 * y no debe presentarse como bloqueado.
 */
function describeStatus(ev: ProtectionEvent): { label: string; color: string } {
  if (ev.action === 'block') return { label: 'Bloqueado', color: FIGMA_COLORS.danger };
  if (ev.action === 'alert') return { label: 'Alerta', color: FIGMA_COLORS.warning };
  if (['domain', 'keyword', 'regex'].includes(ev.event_type)) {
    return { label: 'Sin coincidencia', color: FIGMA_COLORS.muted };
  }
  return { label: 'Registrado', color: FIGMA_COLORS.primary };
}

export default function HistoryScreen({ navigation }: AppScreenProps<'History'>) {
  const [tab, setTab] = useState<Tab>('events');
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [events, setEvents] = useState<ProtectionEvent[]>([]);
  const [alerts, setAlerts] = useState<ProtectionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const unread = alerts.filter(a => !a.read).length;

  const load = useCallback(async (filter?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [ev, al, dev] = await Promise.all([
        api.getEvents(filter),
        api.getAlerts({ limit: MAX_ITEMS }),
        api.getDevices(),
      ]);
      setEvents(ev);
      setAlerts(al);
      setDevices(dev);
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar la actividad.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarga cada vez que la pantalla gana foco, para ver eventos nuevos
  useFocusEffect(
    useCallback(() => {
      load(deviceId);
    }, [load, deviceId])
  );

  const markRead = async (alert: ProtectionAlert) => {
    setMarkingId(alert.id);
    try {
      await api.markAlertRead(alert.id);
      setAlerts(current => current.map(a => (a.id === alert.id ? { ...a, read: true } : a)));
    } catch (e: any) {
      notify('No se pudo marcar la alerta', e?.message);
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <FigmaScreen onBack={() => navigation.goBack()}>
      <PageTitle
        title="Historial"
        subtitle="Actividad registrada por los dispositivos protegidos."
      />

      <View style={styles.tabs}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setTab('events')}
          style={[styles.chip, tab === 'events' && styles.chipActive]}
        >
          <Text style={[styles.chipText, tab === 'events' && styles.chipTextActive]}>Eventos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setTab('alerts')}
          style={[styles.chip, tab === 'alerts' && styles.chipActive]}
        >
          <Text style={[styles.chipText, tab === 'alerts' && styles.chipTextActive]}>
            Alertas{unread > 0 ? ` (${unread} sin leer)` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'events' && devices.length > 1 ? (
        <View style={styles.tabs}>
          {[{ id: undefined as string | undefined, alias_name: 'Todos' }, ...devices].map(d => (
            <TouchableOpacity
              key={d.id ?? 'all'}
              accessibilityRole="button"
              onPress={() => setDeviceId(d.id)}
              style={[styles.chip, styles.chipSmall, deviceId === d.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, deviceId === d.id && styles.chipTextActive]}>
                {d.alias_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SurfaceCard>
        {loading ? (
          <ActivityIndicator color={FIGMA_COLORS.primary} style={{ marginVertical: 30 }} />
        ) : tab === 'events' ? (
          events.length === 0 ? (
            <Text style={styles.empty}>Todavía no hay eventos registrados.</Text>
          ) : (
            events.slice(0, MAX_ITEMS).map((item, index) => {
              const status = describeStatus(item);
              const blocked = item.action === 'block' || item.action === 'alert';
              return (
                <View key={item.id} style={[styles.event, index > 0 && styles.divided]}>
                  <View style={[styles.eventIcon, blocked ? styles.blockedIcon : styles.allowedIcon]}>
                    {blocked ? (
                      <ShieldAlert color={status.color} size={20} />
                    ) : (
                      <Globe2 color={FIGMA_COLORS.muted} size={20} />
                    )}
                  </View>
                  <View style={styles.eventBody}>
                    <Text style={styles.site}>{item.value}</Text>
                    <Text style={styles.detail}>
                      {EVENT_LABEL[item.event_type] ?? item.event_type} · {item.alias_name}
                    </Text>
                    <Text style={[styles.status, { color: status.color }]}>
                      {status.label}
                      {item.category ? ` · ${item.category}` : ''}
                    </Text>
                    <View style={styles.time}>
                      <Clock3 color={FIGMA_COLORS.muted} size={12} />
                      <Text style={styles.timeText}>{formatDateTime(item.event_time)}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )
        ) : alerts.length === 0 ? (
          <Text style={styles.empty}>No hay alertas. No todos los eventos generan una.</Text>
        ) : (
          alerts.map((item, index) => {
            const sev = SEVERITY[item.severity] ?? SEVERITY.info;
            return (
              <View
                key={item.id}
                style={[styles.event, index > 0 && styles.divided, item.read && styles.readAlert]}
              >
                <View style={[styles.eventIcon, { backgroundColor: FIGMA_COLORS.softPurple }]}>
                  <Bell color={sev.color} size={20} />
                </View>
                <View style={styles.eventBody}>
                  <Text style={[styles.status, { color: sev.color, marginTop: 0 }]}>
                    {sev.label}
                    {item.read ? ' · leída' : ''}
                  </Text>
                  <Text style={styles.site}>{item.message}</Text>
                  <Text style={styles.detail}>
                    {item.device_name} · {formatDateTime(item.alert_time)}
                  </Text>
                  {!item.read ? (
                    <TouchableOpacity
                      accessibilityRole="button"
                      disabled={markingId === item.id}
                      onPress={() => markRead(item)}
                      style={styles.readButton}
                    >
                      {markingId === item.id ? (
                        <ActivityIndicator color={FIGMA_COLORS.primary} size="small" />
                      ) : (
                        <CheckCheck color={FIGMA_COLORS.primary} size={15} />
                      )}
                      <Text style={styles.readText}>Marcar como leída</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </SurfaceCard>

      <TouchableOpacity accessibilityRole="button" onPress={() => load(deviceId)} disabled={loading}>
        <Text style={styles.refresh}>Actualizar</Text>
      </TouchableOpacity>
    </FigmaScreen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    backgroundColor: FIGMA_COLORS.surface,
    borderColor: FIGMA_COLORS.border,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipSmall: { paddingVertical: 5 },
  chipActive: { backgroundColor: FIGMA_COLORS.softPurple, borderColor: FIGMA_COLORS.primary },
  chipText: { color: FIGMA_COLORS.muted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: FIGMA_COLORS.primary },
  event: { alignItems: 'flex-start', flexDirection: 'row', paddingVertical: 13 },
  divided: { borderTopColor: FIGMA_COLORS.border, borderTopWidth: StyleSheet.hairlineWidth },
  readAlert: { opacity: 0.55 },
  eventIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    marginRight: 12,
    width: 42,
  },
  blockedIcon: { backgroundColor: FIGMA_COLORS.softPurple },
  allowedIcon: { backgroundColor: '#F1F0F5' },
  eventBody: { flex: 1 },
  site: { ...figmaStyles.rowTitle },
  detail: { color: FIGMA_COLORS.muted, fontSize: 12, marginTop: 4 },
  status: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  time: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 5 },
  timeText: { color: FIGMA_COLORS.muted, fontSize: 11 },
  readButton: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 8 },
  readText: { color: FIGMA_COLORS.primary, fontSize: 12, fontWeight: '600' },
  empty: { color: FIGMA_COLORS.muted, fontSize: 14, paddingVertical: 20, textAlign: 'center' },
  error: { color: FIGMA_COLORS.danger, fontSize: 12, marginBottom: 12 },
  refresh: {
    color: FIGMA_COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
    textAlign: 'center',
  },
});
