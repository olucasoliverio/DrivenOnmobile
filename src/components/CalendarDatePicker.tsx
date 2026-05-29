import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { borderRadius, palette, shadows, spacing } from '../theme/theme';

dayjs.locale('pt-br');

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function getCalendarDays(month: dayjs.Dayjs) {
  const startOfMonth = month.startOf('month');
  const leadingEmptyDays = startOfMonth.day();
  return [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...Array.from({ length: month.daysInMonth() }, (_, index) => startOfMonth.date(index + 1)),
  ];
}

type Props = {
  visible: boolean;
  value?: string | null;
  title?: string;
  onSelect: (date: string) => void;
  onClose: () => void;
};

export default function CalendarDatePicker({
  visible,
  value,
  title = 'Selecionar data',
  onSelect,
  onClose,
}: Props) {
  const [calendarMonth, setCalendarMonth] = useState(dayjs().startOf('month'));
  const selectedDate = value ? dayjs(value) : null;

  useEffect(() => {
    if (visible) {
      setCalendarMonth((selectedDate?.isValid() ? selectedDate : dayjs()).startOf('month'));
    }
  }, [visible, value]);

  const handleToday = () => {
    const today = dayjs();
    onSelect(today.format('YYYY-MM-DD'));
    setCalendarMonth(today.startOf('month'));
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.calendarNavBtn}
              onPress={() => setCalendarMonth(current => current.subtract(1, 'month'))}
            >
              <MaterialIcons name="chevron-left" size={24} color={palette.navy800} />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={styles.fieldTitle}>{title}</Text>
              <Text style={styles.calendarTitle}>
                {calendarMonth.format('MMMM').replace(/^\w/, c => c.toUpperCase())}
              </Text>
              <Text style={styles.calendarSubtitle}>{calendarMonth.format('YYYY')}</Text>
            </View>

            <TouchableOpacity
              style={styles.calendarNavBtn}
              onPress={() => setCalendarMonth(current => current.add(1, 'month'))}
            >
              <MaterialIcons name="chevron-right" size={24} color={palette.navy800} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEK_DAYS.map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekDay}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {getCalendarDays(calendarMonth).map((date, index) => {
              const isSelected = Boolean(date && selectedDate?.isValid() && date.isSame(selectedDate, 'day'));
              const isToday = Boolean(date && date.isSame(dayjs(), 'day'));
              return (
                <TouchableOpacity
                  key={date ? date.toISOString() : `empty-${index}`}
                  style={[
                    styles.dayCell,
                    isToday && styles.dayCellToday,
                    isSelected && styles.dayCellSelected,
                  ]}
                  disabled={!date}
                  onPress={() => {
                    if (!date) return;
                    onSelect(date.format('YYYY-MM-DD'));
                    onClose();
                  }}
                  activeOpacity={0.75}
                >
                  {date ? (
                    <Text style={[styles.dayCellText, isSelected && styles.dayCellTextSelected]}>
                      {date.date()}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.calendarActions}>
            <Button mode="text" textColor={palette.slate500} onPress={onClose}>
              Cancelar
            </Button>
            <Button mode="contained" buttonColor={palette.navy800} onPress={handleToday}>
              Hoje
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  calendarCard: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  calendarNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.navy50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.slate400,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  calendarTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: palette.slate900,
    textTransform: 'capitalize',
  },
  calendarSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.slate400,
    marginTop: 2,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: palette.slate400,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  dayCell: {
    width: `${100 / 7}%`,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    marginVertical: 2,
  },
  dayCellToday: {
    backgroundColor: palette.slate100,
  },
  dayCellSelected: {
    backgroundColor: palette.navy800,
  },
  dayCellText: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.slate700,
  },
  dayCellTextSelected: {
    color: palette.white,
  },
  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
