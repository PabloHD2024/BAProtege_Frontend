import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, Globe2, Pencil, Plus, Tag, Trash2, X } from 'lucide-react-native';
import TextField from '../components/TextField';
import {
  FigmaScreen,
  PageTitle,
  SurfaceCard,
  FIGMA_COLORS,
} from '../components';
import { api, type CustomRule } from '../services/api';
import { normalizeRuleValue, validateRuleValue, type RuleType } from '../utils/rules';
import { notify } from '../utils/notify';
import type { AppScreenProps } from '../navigation/types';

const TYPE_LABEL: Record<RuleType, string> = {
  domain: 'Dominio',
  keyword: 'Palabra clave',
};

export default function BlacklistScreen({ navigation }: AppScreenProps<'Blacklist'>) {
  const [ruleType, setRuleType] = useState<RuleType>('domain');
  const [text, setText] = useState('');
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const canSubmit = text.trim().length > 0 && !isSubmitting;

  // Siempre vuelve a leer del backend, así la lista refleja el estado real tras cada operación
  const loadRules = useCallback(async (showSpinner: boolean) => {
    try {
      if (showSpinner) setLoading(true);
      setRules(await api.getCustomRules());
    } catch (error: any) {
      notify('Error', error.message || 'No se pudo cargar la lista negra');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules(true);
  }, [loadRules]);

  const resetForm = () => {
    setText('');
    setEditingId(null);
    setFormError(null);
  };

  const startEdit = (rule: CustomRule) => {
    setEditingId(rule.id);
    setRuleType(rule.rule_type);
    setText(rule.value);
    setFormError(null);
  };

  const submit = async () => {
    const normalized = normalizeRuleValue(ruleType, text);

    const invalid = validateRuleValue(ruleType, normalized);
    if (invalid) {
      setFormError(invalid);
      return;
    }

    // Duplicados: se compara el valor normalizado, igual que lo hace el backend
    const duplicated = rules.some(
      r =>
        r.id !== editingId &&
        r.rule_type === ruleType &&
        normalizeRuleValue(r.rule_type, r.value) === normalized
    );
    if (duplicated) {
      setFormError(`"${normalized}" ya está en tu lista.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      if (editingId) {
        await api.updateCustomRule(editingId, normalized, ruleType);
      } else {
        await api.addCustomRule(normalized, ruleType);
      }
      resetForm();
      await loadRules(false);
    } catch (error: any) {
      // Incluye el caso de regla duplicada que detecta el backend
      setFormError(error.message || 'No se pudo guardar la regla.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeRule = async (rule: CustomRule) => {
    try {
      await api.deleteCustomRule(rule.id);
      if (editingId === rule.id) resetForm();
      await loadRules(false);
    } catch (error: any) {
      notify('Error', error.message || `No se pudo quitar ${rule.value}`);
    }
  };

  return (
    <FigmaScreen onBack={() => navigation.goBack()}>
      <PageTitle
        title="Lista negra"
        subtitle="Agregá sitios o palabras clave que quieras bloquear manualmente."
      />

      <View style={styles.typeRow}>
        {(Object.keys(TYPE_LABEL) as RuleType[]).map(type => (
          <TouchableOpacity
            key={type}
            accessibilityRole="button"
            disabled={editingId !== null}
            onPress={() => {
              setRuleType(type);
              setFormError(null);
            }}
            style={[
              styles.typeChip,
              ruleType === type && styles.typeChipActive,
              editingId !== null && ruleType !== type && styles.disabled,
            ]}
          >
            <Text style={[styles.typeText, ruleType === type && styles.typeTextActive]}>
              {TYPE_LABEL[type]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputWrap}>
          <TextField
            placeholder={ruleType === 'domain' ? 'sitio.com' : 'palabra'}
            value={text}
            onChangeText={t => {
              setText(t);
              if (formError) setFormError(null);
            }}
            autoCapitalize="none"
          />
        </View>
        {editingId ? (
          <TouchableOpacity
            accessibilityLabel="Cancelar edición"
            accessibilityRole="button"
            onPress={resetForm}
            style={[styles.iconButton, styles.cancelButton]}
          >
            <X color={FIGMA_COLORS.muted} size={22} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          accessibilityLabel={editingId ? 'Guardar cambios' : 'Agregar regla'}
          accessibilityRole="button"
          disabled={!canSubmit}
          onPress={submit}
          style={[styles.iconButton, styles.addButton, !canSubmit && styles.disabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={FIGMA_COLORS.surface} size="small" />
          ) : editingId ? (
            <Check color={FIGMA_COLORS.surface} size={22} />
          ) : (
            <Plus color={FIGMA_COLORS.surface} size={22} />
          )}
        </TouchableOpacity>
      </View>
      {formError ? <Text style={styles.error}>{formError}</Text> : null}

      <Text style={styles.sectionTitle}>Reglas activas ({rules.length})</Text>

      <SurfaceCard style={styles.list}>
        {loading ? (
          <ActivityIndicator color={FIGMA_COLORS.primary} style={{ marginVertical: 30 }} />
        ) : rules.length === 0 ? (
          <Text style={styles.empty}>Todavía no agregaste reglas.</Text>
        ) : (
          rules.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.siteRow,
                index > 0 && styles.divided,
                editingId === item.id && styles.rowEditing,
              ]}
            >
              <View style={styles.siteIcon}>
                {item.rule_type === 'keyword' ? (
                  <Tag color={FIGMA_COLORS.primary} size={18} />
                ) : (
                  <Globe2 color={FIGMA_COLORS.primary} size={18} />
                )}
              </View>
              <View style={styles.siteInfo}>
                <Text style={styles.siteName}>{item.value}</Text>
                <Text style={styles.siteType}>{TYPE_LABEL[item.rule_type] ?? item.rule_type}</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel={`Editar ${item.value}`}
                accessibilityRole="button"
                onPress={() => startEdit(item)}
                style={styles.removeButton}
              >
                <Pencil color={FIGMA_COLORS.muted} size={18} />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel={`Quitar ${item.value}`}
                accessibilityRole="button"
                onPress={() => removeRule(item)}
                style={styles.removeButton}
              >
                <Trash2 color={FIGMA_COLORS.muted} size={18} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </SurfaceCard>
    </FigmaScreen>
  );
}

const styles = StyleSheet.create({
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeChip: {
    backgroundColor: FIGMA_COLORS.surface,
    borderColor: FIGMA_COLORS.border,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  typeChipActive: {
    backgroundColor: FIGMA_COLORS.softPurple,
    borderColor: FIGMA_COLORS.primary,
  },
  typeText: {
    color: FIGMA_COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  typeTextActive: {
    color: FIGMA_COLORS.primary,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    marginLeft: 10,
    width: 50,
  },
  cancelButton: {
    backgroundColor: FIGMA_COLORS.softPurple,
  },
  error: {
    color: FIGMA_COLORS.danger,
    fontSize: 12,
    marginBottom: 14,
    marginTop: -14,
  },
  siteInfo: {
    flex: 1,
  },
  siteType: {
    color: FIGMA_COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  rowEditing: {
    backgroundColor: FIGMA_COLORS.softPurple,
  },
  inputRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 25,
  },
  inputWrap: {
    flex: 1,
  },
  addButton: {
    backgroundColor: FIGMA_COLORS.primary,
  },
  disabled: {
    opacity: 0.45,
  },
  sectionTitle: {
    color: FIGMA_COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  list: {
    paddingHorizontal: 14,
    paddingVertical: 0,
  },
  siteRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 58,
  },
  divided: {
    borderTopColor: FIGMA_COLORS.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  siteIcon: {
    alignItems: 'center',
    backgroundColor: FIGMA_COLORS.softPurple,
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    marginRight: 11,
    width: 34,
  },
  siteName: {
    color: FIGMA_COLORS.text,
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
  },
  empty: {
    color: FIGMA_COLORS.muted,
    fontSize: 14,
    paddingVertical: 20,
    textAlign: 'center',
  },
});