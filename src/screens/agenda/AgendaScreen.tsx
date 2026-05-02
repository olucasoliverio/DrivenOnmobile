import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Surface, Chip, FAB, Portal, Modal, TextInput, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { mockAgendamentos, mockClientes, mockVeiculos } from '../../data/mockData';
import { colors, spacing, borderRadius } from '../../theme/theme';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

function getDaysOfWeek() {
  const days = [];
  for (let i = -1; i <= 5; i++) {
    days.push(dayjs().add(i, 'day'));
  }
  return days;
}

export default function AgendaScreen() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [modalVisible, setModalVisible] = useState(false);
  const days = getDaysOfWeek();

  const agendamentosDodia = mockAgendamentos.filter(a =>
    dayjs(a.data).isSame(selectedDate, 'day')
  );

  return (
    <View style={styles.container}>
      {/* Seletor de dias */}
      <View style={styles.weekHeader}>
        <Text style={styles.mesAno}>{selectedDate.format('MMMM YYYY').replace(/^\w/, c => c.toUpperCase())}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
          {days.map((day) => {
            const isSelected = day.isSame(selectedDate, 'day');
            const isToday = day.isSame(dayjs(), 'day');
            const temAgendamento = mockAgendamentos.some(a => dayjs(a.data).isSame(day, 'day'));
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[styles.dayName, isSelected && styles.dayTextSelected]}>
                  {day.format('ddd').replace('.', '').substring(0, 3).toUpperCase()}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dayTextSelected, isToday && !isSelected && { color: colors.primary, fontWeight: '700' }]}>
                  {day.format('D')}
                </Text>
                {temAgendamento && (
                  <View style={[styles.dot, isSelected && { backgroundColor: '#FFF' }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de agendamentos */}
      <FlatList
        data={agendamentosDodia}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 80 }}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <MaterialIcons name="event-available" size={48} color="#BDBDBD" />
            <Text style={styles.emptyText}>Nenhum agendamento nesta data</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const cliente = mockClientes.find(c => c.id === item.clienteId);
          const veiculo = mockVeiculos.find(v => v.id === item.veiculoId);
          const isConfirmado = item.status === 'confirmado';
          return (
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardLeft}>
                <View style={[styles.colorBar, { backgroundColor: isConfirmado ? colors.primary : colors.secondary }]} />
              </View>
              <View style={{ flex: 1, paddingLeft: spacing.sm }}>
                <View style={styles.cardRow}>
                  <Text style={styles.hora}>{item.hora}</Text>
                  <View style={[styles.badge, { backgroundColor: isConfirmado ? '#E8F5E9' : '#FFF3E0' }]}>
                    <Text style={[styles.badgeText, { color: isConfirmado ? '#2E7D32' : '#E65100' }]}>
                      {isConfirmado ? 'CONFIRMADO' : 'PENDENTE'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.clienteName}>{cliente?.nome}</Text>
                <Text style={styles.veiculoText}>{veiculo ? `${veiculo.marca} ${veiculo.modelo} • ${veiculo.placa}` : ''}</Text>
                <View style={styles.servicoRow}>
                  <MaterialIcons name="build" size={13} color="#9E9E9E" />
                  <Text style={styles.servicoText}>{item.servico}</Text>
                </View>
                {item.observacao ? (
                  <View style={styles.obsRow}>
                    <MaterialIcons name="notes" size={13} color="#9E9E9E" />
                    <Text style={styles.obsText}>{item.observacao}</Text>
                  </View>
                ) : null}
              </View>
            </Surface>
          );
        }}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        color="#FFF"
        onPress={() => setModalVisible(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  weekHeader: { backgroundColor: '#FFF', paddingTop: spacing.md, paddingBottom: spacing.md, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  mesAno: { fontSize: 15, fontWeight: '700', color: colors.onBackground, textAlign: 'center', marginBottom: spacing.sm, textTransform: 'capitalize' },
  daysRow: { paddingHorizontal: spacing.md, gap: 8 },
  dayBtn: { width: 52, height: 68, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#F5F5F5' },
  dayBtnSelected: { backgroundColor: colors.primary },
  dayName: { fontSize: 10, fontWeight: '600', color: '#9E9E9E' },
  dayNum: { fontSize: 18, fontWeight: '700', color: colors.onBackground },
  dayTextSelected: { color: '#FFF' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary },
  empty: { flex: 1, alignItems: 'center', marginTop: 80, gap: spacing.md },
  emptyText: { color: '#9E9E9E', fontSize: 14 },
  card: { borderRadius: borderRadius.md, backgroundColor: '#FFF', flexDirection: 'row', overflow: 'hidden' },
  cardLeft: { width: 6 },
  colorBar: { flex: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingTop: spacing.md, paddingRight: spacing.md },
  hora: { fontSize: 18, fontWeight: '800', color: colors.onBackground },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  clienteName: { fontSize: 15, fontWeight: '700', color: colors.onBackground, paddingRight: spacing.md },
  veiculoText: { fontSize: 12, color: '#757575', marginTop: 2, paddingRight: spacing.md },
  servicoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  servicoText: { fontSize: 12, color: '#9E9E9E' },
  obsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginBottom: spacing.md },
  obsText: { fontSize: 12, color: '#9E9E9E', fontStyle: 'italic', flex: 1 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary },
});
