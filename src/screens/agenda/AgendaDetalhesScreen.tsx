import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { useAuth } from '../../context/AuthContext';
import { palette, spacing, borderRadius, shadows } from '../../theme/theme';
import ScreenHeader from '../../components/ScreenHeader';
import dayjs from 'dayjs';



export default function AgendaDetalhesScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { agendamentoId } = route.params ?? { agendamentoId: 1 };
  const { agendamentos, clientes, veiculos, updateRecord, deleteRecord, configuracoes } = useDriveOnData();
  const { can } = useAuth();

  useEffect(() => {
    if (!can('agenda') || configuracoes?.recursosAdicionais?.agenda === false) {
      navigation.goBack();
    }
  }, [can, configuracoes, navigation]);

  const [saving, setSaving] = useState(false);

  const ag = agendamentos.find(a => a.id === agendamentoId);
  const cliente = ag ? clientes.find(c => c.id === ag.clienteId) : undefined;
  const veiculo = ag ? veiculos.find(v => v.id === ag.veiculoId) : undefined;

  if (!ag) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Agendamento não encontrado" showBack={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>O agendamento solicitado não foi localizado.</Text>
        </View>
      </View>
    );
  }

  const isConfirmado = ag.status === 'confirmado';



  const confirmarAgendamento = async () => {
    setSaving(true);
    try {
      const payload = {
        cliente_id: ag.clienteId,
        veiculo_id: ag.veiculoId,
        data: dayjs(ag.data).toISOString(),
        hora: ag.hora,
        servico: ag.servico,
        status: 'confirmado',
        observacao: ag.observacao || null,
      };
      await updateRecord('/agendamentos', ag.id, payload);
    } catch (error: any) {
      Alert.alert('Erro ao confirmar', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const removeAgendamento = () => {
    Alert.alert('Remover Agendamento?', 'Deseja cancelar o compromisso agendado?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar Compromisso',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecord('/agendamentos', ag.id);
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Erro ao remover', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Agendamento"
        subtitle="Visualização do Compromisso"
        showBack={true}
        rightElement={can('agenda', 'update') ? (
          <TouchableOpacity
            style={styles.headerEditBtn}
            onPress={() => navigation.navigate('AgendaForm', { agendamentoId: ag.id })}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={22} color={palette.slate700} />
          </TouchableOpacity>
        ) : undefined}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Card Principal de Agendamento */}
        <View style={styles.mainCard}>
          <View style={styles.timeSection}>
            <MaterialIcons name="event" size={32} color={palette.white} />
            <View style={{ flex: 1 }}>
              <Text style={styles.dateTimeText}>{dayjs(ag.data).format('DD [de] MMMM, YYYY')}</Text>
              <Text style={styles.timeText}>Horário: {ag.hora}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isConfirmado ? palette.emerald100 : palette.amber100 }]}>
              <Text style={[styles.statusBadgeText, { color: isConfirmado ? palette.emerald600 : '#92400E' }]}>
                {isConfirmado ? 'CONFIRMADO' : 'PENDENTE'}
              </Text>
            </View>
          </View>
        </View>

        {/* Detalhes do Serviço */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviço Solicitado</Text>
          <View style={styles.detailsBox}>
            <Text style={styles.serviceName}>{ag.servico}</Text>
            {ag.observacao ? (
              <View style={styles.obsContainer}>
                <Text style={styles.obsLabel}>Observações adicionais:</Text>
                <Text style={styles.obsText}>{ag.observacao}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Ficha Clientes / Veículos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vínculos</Text>
          
          {cliente && (
            <TouchableOpacity
              style={styles.associationCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ClienteDetalhes', { clienteId: cliente.id })}
            >
              <View style={styles.associationIconBox}>
                <MaterialIcons name="person" size={20} color={palette.navy800} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.associationLabel}>Cliente</Text>
                <Text style={styles.associationValue}>{cliente.nome}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={palette.slate400} />
            </TouchableOpacity>
          )}

          {veiculo && (
            <TouchableOpacity
              style={[styles.associationCard, { marginTop: spacing.sm }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('VeiculoDetalhes', { veiculoId: veiculo.id })}
            >
              <View style={styles.associationIconBox}>
                <MaterialIcons name="directions-car" size={20} color={palette.navy800} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.associationLabel}>Veículo</Text>
                <Text style={styles.associationValue}>{veiculo.marca} {veiculo.modelo} ({veiculo.placa})</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={palette.slate400} />
            </TouchableOpacity>
          )}
        </View>

        {/* Ação Primária: Confirmar */}
        {!isConfirmado && can('agenda', 'update') && (
          <TouchableOpacity 
            style={styles.confirmBtn} 
            activeOpacity={0.7} 
            disabled={saving}
            onPress={confirmarAgendamento}
          >
            {saving ? (
              <ActivityIndicator size="small" color={palette.white} />
            ) : (
              <>
                <MaterialIcons name="check-circle" size={20} color={palette.white} />
                <Text style={styles.confirmBtnText}>Confirmar Presença</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Botão de Excluir */}
        {can('agenda', 'delete') && (
          <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.7} onPress={removeAgendamento}>
            <MaterialIcons name="cancel" size={20} color={palette.rose600} />
            <Text style={styles.deleteBtnText}>Cancelar Agendamento</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  errorText: { fontSize: 14, color: palette.slate500, fontWeight: '500' },
  headerEditBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

  // Card Principal
  mainCard: {
    backgroundColor: palette.navy800,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  timeSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dateTimeText: { fontSize: 16, fontWeight: '800', color: palette.white, letterSpacing: -0.2 },
  timeText: { fontSize: 12, color: 'rgba(255, 255, 255, 0.75)', marginTop: 2, fontWeight: '600' },
  statusBadge: { borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 9, fontWeight: '800' },

  // Seções
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: palette.slate500, textTransform: 'uppercase', marginBottom: spacing.sm, letterSpacing: 0.3 },

  // Caixa de serviço
  detailsBox: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.sm,
  },
  serviceName: { fontSize: 16, fontWeight: '800', color: palette.slate900, letterSpacing: -0.2 },
  obsContainer: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: palette.slate100, paddingTop: spacing.md },
  obsLabel: { fontSize: 11, color: palette.slate400, fontWeight: '600', marginBottom: 4 },
  obsText: { fontSize: 13, color: palette.slate700, fontWeight: '500', lineHeight: 18 },

  // Cartões de Associação
  associationCard: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.sm,
  },
  associationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: palette.navy50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  associationLabel: { fontSize: 10, color: palette.slate400, fontWeight: '600' },
  associationValue: { fontSize: 13, color: palette.slate900, fontWeight: '700', marginTop: 1 },

  // Botões
  confirmBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.navy800,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  confirmBtnText: { fontSize: 14, color: palette.white, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: palette.rose100,
    paddingVertical: 14,
    gap: spacing.sm,
    ...shadows.sm,
  },
  deleteBtnText: { fontSize: 14, color: palette.rose600, fontWeight: '700' },
});
