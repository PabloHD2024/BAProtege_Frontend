import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ban, ChevronRight, Globe2, ListFilter, Plus, RefreshCw } from 'lucide-react-native';
import {
  FigmaScreen,
  FIGMA_COLORS,
  PageTitle,
  SurfaceCard,
  figmaStyles,
} from '../components/FigmaScreen';
import {
  getCachedSystemRules,
  syncSystemRules,
  type SystemRulesCache,
} from '../services/rulesSync';
import type { AppScreenProps } from '../navigation/types';

const PREVIEW_COUNT = 5;

export default function BlockedSitesScreen({
  navigation,
}: AppScreenProps<'BlockedSites'>) {
  const [rules, setRules] = useState<SystemRulesCache | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Consulta GET /sync/system enviando versión + checksum guardados
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRules(await syncSystemRules());
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar la lista general.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Muestra primero la última lista guardada y después verifica contra el backend
    getCachedSystemRules().then(cached => cached && setRules(cached));
    refresh();
  }, [refresh]);

  return (
    <FigmaScreen onBack={() => navigation.goBack()}>
      <PageTitle
        title="Sitios bloqueados"
        subtitle="Administrá el contenido que no puede abrirse en los dispositivos protegidos."
      />
      <SurfaceCard style={styles.summary}>
        <View style={styles.summaryIcon}>
          <Ban color={FIGMA_COLORS.primary} size={24} />
        </View>
        <View style={styles.summaryText}>
          <Text style={styles.count}>
            {rules ? `Lista general · ${rules.total} reglas` : 'Lista general'}
          </Text>
          <Text style={styles.summaryCaption}>
            {rules
              ? `${rules.domain.length} dominios · ${rules.keyword.length} palabras clave`
              : loading
                ? 'Consultando reglas...'
                : 'Sin datos todavía'}
          </Text>
        </View>
        {rules ? (
          <View style={styles.status}>
            <Text style={styles.statusText}>v{rules.version}</Text>
          </View>
        ) : null}
      </SurfaceCard>

      {rules ? (
        <Text style={styles.meta}>
          Actualizada: {new Date(rules.updatedAt).toLocaleString('es-AR')} · checksum{' '}
          {rules.checksum.slice(0, 8)}
        </Text>
      ) : null}
      {error ? (
        <Text style={styles.error}>
          {error}
          {rules ? ' Se muestra la última lista guardada.' : ''}
        </Text>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        disabled={loading}
        onPress={refresh}
        style={[styles.addButton, styles.refresh, loading && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={FIGMA_COLORS.primary} size="small" />
        ) : (
          <RefreshCw color={FIGMA_COLORS.primary} size={19} />
        )}
        <Text style={styles.addText}>Actualizar lista general</Text>
      </TouchableOpacity>

      {rules && rules.domain.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Ejemplos de la lista</Text>
          <SurfaceCard style={styles.preview}>
            {rules.domain.slice(0, PREVIEW_COUNT).map((domain, index) => (
              <View key={domain} style={[styles.categoryRow, index > 0 && styles.divided]}>
                <View style={styles.categoryIcon}>
                  <Globe2 color={FIGMA_COLORS.primary} size={17} />
                </View>
                <Text style={figmaStyles.rowTitle}>{domain}</Text>
              </View>
            ))}
          </SurfaceCard>
        </>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => navigation.navigate('Blacklist')}
        style={styles.sectionLink}
      >
        <View style={styles.sectionIcon}>
          <ListFilter color={FIGMA_COLORS.primary} size={20} />
        </View>
        <View style={styles.linkText}>
          <Text style={figmaStyles.rowTitle}>Lista negra</Text>
          <Text style={styles.summaryCaption}>Sitios y palabras agregados manualmente</Text>
        </View>
        <ChevronRight color={FIGMA_COLORS.muted} size={19} />
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => navigation.navigate('Blacklist')}
        style={styles.addButton}
      >
        <Plus color={FIGMA_COLORS.primary} size={19} />
        <Text style={styles.addText}>Administrar lista negra</Text>
      </TouchableOpacity>
    </FigmaScreen>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: FIGMA_COLORS.muted,
    fontSize: 11,
    marginBottom: 12,
  },
  error: {
    color: FIGMA_COLORS.danger,
    fontSize: 12,
    marginBottom: 12,
  },
  refresh: {
    marginBottom: 20,
  },
  disabled: {
    opacity: 0.5,
  },
  preview: {
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 0,
  },
  divided: {
    borderTopColor: FIGMA_COLORS.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  summary: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: FIGMA_COLORS.softPurple,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    marginRight: 12,
    width: 44,
  },
  summaryText: {
    flex: 1,
  },
  count: {
    color: FIGMA_COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  summaryCaption: {
    color: FIGMA_COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  status: {
    backgroundColor: '#E8F7EF',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    color: FIGMA_COLORS.positive,
    fontSize: 10,
    fontWeight: '700',
  },
  sectionLink: {
    alignItems: 'center',
    backgroundColor: FIGMA_COLORS.surface,
    borderColor: FIGMA_COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 26,
    padding: 14,
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: FIGMA_COLORS.softPurple,
    borderRadius: 11,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  linkText: {
    flex: 1,
  },
  sectionTitle: {
    color: FIGMA_COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  categoryRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  categoryIcon: {
    alignItems: 'center',
    backgroundColor: FIGMA_COLORS.softPurple,
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    marginRight: 11,
    width: 38,
  },
  activeText: {
    color: FIGMA_COLORS.positive,
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    padding: 10,
  },
  addText: {
    color: FIGMA_COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
