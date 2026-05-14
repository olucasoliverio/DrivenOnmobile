import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { FAB, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

const { width } = Dimensions.get('window');

const fields: CrudField[] = [
  { key: 'titulo', label: 'Titulo', autoCapitalize: 'sentences' },
  { key: 'cliente_id', label: 'ID do cliente', keyboardType: 'number-pad' },
  { key: 'veiculo_id', label: 'ID do veiculo', keyboardType: 'number-pad' },
  { key: 'data_inicio', label: 'Inicio (YYYY-MM-DD HH:mm)' },
  { key: 'data_fim', label: 'Fim (YYYY-MM-DD HH:mm)' },
  { key: 'observacao', label: 'Observacao', multiline: true },
];

function getDaysOfWeek() {
  const days = [];
  for (let i = -1; i <= 5; i++) {
    days.push(dayjs().add(i, 'day'));
  }
  return days;
}

export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const { agendamentos, clientes, veiculos, createRecord, updateRecord, deleteRecord } = useDriveOnData();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const days = getDaysOfWeek();

  const agendamentosDodia = agendamentos.filter(a =>
    dayjs(a.data).isSame(selectedDate, 'day')
  );

  const openForm = (item?: (typeof agendamentos)[number]) => {
    setEditingId(item?.id ?? null);
    setForm(item ? {
      titulo: item.servico,
      cliente_id: String(item.clienteId),
      veiculo_id: String(item.veiculoId),
      data_inicio: dayjs(item.data).format('YYYY-MM-DD') + ` ${item.hora || '09:00'}`,
      data_fim: dayjs(item.data).add(1, 'hour').format('YYYY-MM-DD HH:mm'),
      observacao: item.observacao,
    } : {
      cliente_id: clientes[0]?.id ? String(clientes[0].id) : '',
      veiculo_id: veiculos[0]?.id ? String(veiculos[0].id) : '',
      data_inicio: selectedDate.hour(9).minute(0).format('YYYY-MM-DD HH:mm'),
      data_fim: selectedDate.hour(10).minute(0).format('YYYY-MM-DD HH:mm'),
    });
    setDialogOpen(true);
  };

  const parseDate = (value: string) => dayjs(value.trim().replace(' ', 'T')).toISOString();

  const save = async () => {
    if (!form.titulo?.trim() || !form.cliente_id || !form.veiculo_id || !form.data_inicio || !form.data_fim) {
      Alert.alert('Campos obrigatorios', 'Informe titulo, cliente, veiculo, inicio e fim.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titulo: form.titulo.trim(),
        cliente_id: Number(form.cliente_id),
        veiculo_id: Number(form.veiculo_id),
        data_inicio: parseDate(form.data_inicio),
        data_fim: parseDate(form.data_fim),
        observacao: form.observacao?.trim() || null,
      };
      if (editingId) await updateRecord('/agendamentos', editingId, payload);
      else await createRecord('/agendamentos', payload);
      setDialogOpen(false);
    } catch (error: any) {
      Alert.alert('Nao foi possivel salvar', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: number) => {
    Alert.alert('Remover agendamento?', 'Essa acao cancela o registro.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await deleteRecord('/agendamentos', id); }
        catch (error: any) { Alert.alert('Nao foi possivel remover', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.'); }
      } },
    ]);
  };

  return (
    <View style={styles.container}>

      {/* ── Week Header com Gradiente ── */}
      <LinearGradient colors={gradients.navyDark} style={[styles.weekHeader, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.mesAno}>
          {selectedDate.format('MMMM YYYY').replace(/^\w/, c => c.toUpperCase())}
        </Text>
        <FlatList
          horizontal
          data={days}
          keyExtractor={d => d.toISOString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}
          renderItem={({ item: day }) => {
            const isSelected = day.isSame(selectedDate, 'day');
            const isToday = day.isSame(dayjs(), 'day');
            const temAg = agendamentos.some(a => dayjs(a.data).isSame(day, 'day'));
            return (
              <TouchableOpacity
                style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
                onPress={() => setSelectedDate(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayName, isSelected && styles.dayTextSelected, !isSelected && isToday && styles.dayNameToday]}>
                  {day.format('ddd').replace('.', '').substring(0, 3).toUpperCase()}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dayTextSelected, !isSelected && isToday && styles.dayNumToday]}>
                  {day.format('D')}
                </Text>
                {temAg && (
                  <View style={[styles.dot, isSelected ? styles.dotSelected : styles.dotDefault]} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </LinearGradient>

      {/* ── Contador do dia ── */}
      <View style={styles.dayInfoBar}>
        <Text style={styles.dayInfoText}>
          {agendamentosDodia.length === 0
            ? 'Nenhum agendamento'
            : `${agendamentosDodia.length} agendamento${agendamentosDodia.length > 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* ── Lista de agendamentos ── */}
      <FlatList
        data={agendamentosDodia}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <MaterialIcons name="event-available" size={56} color={palette.slate200} />
            <Text style={styles.emptyTitle}>Dia livre!</Text>
            <Text style={styles.emptyText}>Nenhum agendamento nesta data</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const cliente = clientes.find(c => c.id === item.clienteId);
          const veiculo = veiculos.find(v => v.id === item.veiculoId);
          const isConfirmado = item.status === 'confirmado';
          return (
            <TouchableOpacity onPress={() => openForm(item)} activeOpacity={0.8}>
            <View style={styles.card}>
              {/* Barra lateral colorida */}
              <LinearGradient
                colors={isConfirmado ? gradients.navyPrimary : gradients.amber}
                style={styles.colorBar}
              />
              <View style={styles.cardBody}>
                {/* Linha superior: hora + badge */}
                <View style={styles.cardTop}>
                  <View style={styles.horaBox}>
                    <MaterialIcons name="schedule" size={13} color={palette.slate400} />
                    <Text style={styles.hora}>{item.hora}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: isConfirmado ? palette.emerald100 : palette.amber100 }]}>
                    <Text style={[styles.badgeText, { color: isConfirmado ? palette.emerald600 : '#92400E' }]}>
                      {isConfirmado ? 'CONFIRMADO' : 'PENDENTE'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.clienteName}>{cliente?.nome}</Text>

                {veiculo && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="directions-car" size={13} color={palette.slate400} />
                    <Text style={styles.infoText}>
                      {veiculo.marca} {veiculo.modelo} · {veiculo.placa}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <MaterialIcons name="build" size={13} color={palette.slate400} />
                  <Text style={styles.infoText}>{item.servico}</Text>
                </View>

                {item.observacao && (
                  <View style={[styles.infoRow, styles.obsRow]}>
                    <MaterialIcons name="notes" size={13} color={palette.slate400} />
                    <Text style={styles.obsText}>{item.observacao}</Text>
                  </View>
                )}
              </View>
              <IconButton icon="delete-outline" size={20} iconColor="#D32F2F" onPress={() => remove(item.id)} />
            </View>
            </TouchableOpacity>
          );
        }}
      />

      <CrudDialog visible={dialogOpen} title={editingId ? 'Editar agendamento' : 'Novo agendamento'} fields={fields} values={form} isSaving={saving} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} onCancel={() => setDialogOpen(false)} onSave={save} />
      <FAB
        icon="plus"
        style={styles.fab}
        color={palette.white}
        onPress={() => openForm()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },

  // Week header
  weekHeader: { paddingBottom: spacing.md, overflow: 'hidden' },
  mesAno: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: spacing.sm, textTransform: 'capitalize', letterSpacing: 0.5 },
  daysRow: { paddingHorizontal: spacing.md, gap: 8, paddingBottom: 4 },
  dayBtn: { width: 54, height: 72, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  dayBtnSelected: { backgroundColor: palette.white },
  dayName: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  dayNameToday: { color: palette.amber400 },
  dayNum: { fontSize: 20, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },
  dayNumToday: { color: palette.amber400 },
  dayTextSelected: { color: palette.navy800 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotDefault: { backgroundColor: palette.amber400 },
  dotSelected: { backgroundColor: palette.navy800 },

  // Info bar
  dayInfoBar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  dayInfoText: { fontSize: 12, fontWeight: '600', color: palette.slate500 },

  // List
  listContent: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: 90 },

  // Card
  card: { backgroundColor: palette.white, borderRadius: borderRadius.lg, flexDirection: 'row', overflow: 'hidden', ...shadows.sm },
  colorBar: { width: 5 },
  cardBody: { flex: 1, padding: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  horaBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hora: { fontSize: 16, fontWeight: '800', color: palette.slate900 },
  badge: { borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  clienteName: { fontSize: 15, fontWeight: '700', color: palette.slate900, marginBottom: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  infoText: { fontSize: 12, color: palette.slate500, flex: 1 },
  obsRow: { marginTop: 6, padding: spacing.sm, backgroundColor: palette.slate50, borderRadius: borderRadius.sm },
  obsText: { fontSize: 12, color: palette.slate500, fontStyle: 'italic', flex: 1 },

  // Empty
  empty: { alignItems: 'center', marginTop: 60, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: palette.slate700 },
  emptyText: { fontSize: 14, color: palette.slate400 },

  // FAB
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: palette.navy800 },
});
