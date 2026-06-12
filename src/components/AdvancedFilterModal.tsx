import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Pressable, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import { palette, borderRadius, spacing, shadows } from '../theme/theme';
import dayjs from 'dayjs';
import CalendarDatePicker from './CalendarDatePicker';

type FilterOption = {
  key: string;
  label: string;
};

type AdvancedFilterModalProps = {
  visible: boolean;
  periodValue: string;
  periodOptions: FilterOption[];
  statusValue: string;
  statusOptions: FilterOption[];
  customStart: string;
  customEnd: string;
  onApply: (period: string, status: string, start: string, end: string) => void;
  onClose: () => void;
  title?: string;
};

export default function AdvancedFilterModal({
  visible,
  periodValue,
  periodOptions,
  statusValue,
  statusOptions,
  customStart,
  customEnd,
  onApply,
  onClose,
  title = 'Filtrar resultados',
}: AdvancedFilterModalProps) {
  // Local states for intermediate edits
  const [tempPeriod, setTempPeriod] = useState(periodValue);
  const [tempStatus, setTempStatus] = useState(statusValue);
  const [tempStart, setTempStart] = useState(customStart);
  const [tempEnd, setTempEnd] = useState(customEnd);
  
  // Date picker states
  const [datePickerType, setDatePickerType] = useState<null | 'start' | 'end'>(null);

  // Sync state when modal is opened
  useEffect(() => {
    if (visible) {
      setTempPeriod(periodValue);
      setTempStatus(statusValue);
      setTempStart(customStart);
      setTempEnd(customEnd);
    }
  }, [visible, periodValue, statusValue, customStart, customEnd]);

  const handleApply = () => {
    onApply(tempPeriod, tempStatus, tempStart, tempEnd);
    onClose();
  };

  const handleClear = () => {
    // Clear to defaults: period 'mes', status 'todos', and blank custom dates
    setTempPeriod('mes');
    setTempStatus('todos');
    setTempStart('');
    setTempEnd('');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.dragIndicator} />
          
          <Text style={styles.title}>{title}</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Seção 1: Período */}
            <Text style={styles.sectionHeader}>Período</Text>
            <View style={styles.chipsGrid}>
              {periodOptions.map((opt) => {
                const isActive = tempPeriod === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setTempPeriod(opt.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Intervalo Personalizado se estiver selecionado */}
            {tempPeriod === 'personalizado' && (
              <View style={styles.customRangeRow}>
                <TouchableOpacity
                  style={styles.customDateButton}
                  activeOpacity={0.75}
                  onPress={() => setDatePickerType('start')}
                >
                  <MaterialIcons name="calendar-today" size={16} color={palette.slate400} />
                  <Text style={[styles.customDateText, !tempStart && styles.customDatePlaceholder]}>
                    {tempStart ? dayjs(tempStart).format('DD/MM/YYYY') : 'Início'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.customDateButton}
                  activeOpacity={0.75}
                  onPress={() => setDatePickerType('end')}
                >
                  <MaterialIcons name="event-available" size={16} color={palette.slate400} />
                  <Text style={[styles.customDateText, !tempEnd && styles.customDatePlaceholder]}>
                    {tempEnd ? dayjs(tempEnd).format('DD/MM/YYYY') : 'Fim'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Separador */}
            <View style={styles.separator} />

            {/* Seção 2: Situação / Status */}
            <Text style={styles.sectionHeader}>Situação</Text>
            <View style={styles.chipsGrid}>
              {statusOptions.map((opt) => {
                const isActive = tempStatus === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setTempStatus(opt.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Botões de Ação no Rodapé */}
          <View style={styles.footerActions}>
            <Button
              mode="outlined"
              textColor={palette.slate500}
              style={styles.clearBtn}
              onPress={handleClear}
            >
              Limpar
            </Button>
            <Button
              mode="contained"
              buttonColor={palette.navy800}
              style={styles.applyBtn}
              onPress={handleApply}
            >
              Aplicar Filtros
            </Button>
          </View>
        </View>
      </Pressable>

      {/* Date Picker interno */}
      <CalendarDatePicker
        visible={datePickerType != null}
        value={datePickerType === 'end' ? tempEnd : tempStart}
        title={datePickerType === 'end' ? 'Fim' : 'Início'}
        onSelect={date => {
          if (datePickerType === 'end') setTempEnd(date);
          else setTempStart(date);
        }}
        onClose={() => setDatePickerType(null)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
    elevation: 24,
    shadowColor: palette.slate900,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.slate200,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.slate900,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: palette.slate100,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  chipActive: {
    backgroundColor: palette.navy50,
    borderColor: palette.navy800,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate500,
  },
  chipTextActive: {
    color: palette.navy800,
    fontWeight: '700',
  },
  customDateButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  customDateText: {
    flex: 1,
    color: palette.slate900,
    fontSize: 13,
    fontWeight: '600',
  },
  customDatePlaceholder: {
    color: palette.slate400,
  },
  customRangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  separator: {
    height: 1,
    backgroundColor: palette.slate200,
    marginVertical: spacing.md,
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  clearBtn: {
    flex: 1,
    borderColor: palette.slate300,
  },
  applyBtn: {
    flex: 2,
    borderRadius: borderRadius.md,
  },
});
