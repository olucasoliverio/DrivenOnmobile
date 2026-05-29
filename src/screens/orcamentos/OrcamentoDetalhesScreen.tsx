import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows } from '../../theme/theme';
import ScreenHeader from '../../components/ScreenHeader';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import { sendEstimateMessage } from '../../services/whatsappService';
import dayjs from 'dayjs';

const editFields: CrudField[] = [
  { key: 'cliente_id', label: 'Cliente', keyboardType: 'number-pad' },
  { key: 'veiculo_id', label: 'Veículo', keyboardType: 'number-pad' },
  { key: 'status', label: 'Status (pendente, aprovado, reprovado)', autoCapitalize: 'none' },
  { key: 'total', label: 'Total Geral', keyboardType: 'decimal-pad' },
  { key: 'dataCriacao', label: 'Data de Criação (YYYY-MM-DD)', keyboardType: 'default' },
  { key: 'validade', label: 'Data de Validade (YYYY-MM-DD)', keyboardType: 'default' },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  aprovado:  { label: 'Aprovado',  color: palette.emerald600, bg: '#ECFDF5' },
  reprovado: { label: 'Reprovado', color: palette.rose600,    bg: '#FFE4E6' },
  pendente:  { label: 'Pendente',  color: palette.amber500,   bg: '#FFFBEB' },
};

export default function OrcamentoDetalhesScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { orcamentoId } = route.params ?? { orcamentoId: 1 };
  const { orcamentos, clientes, veiculos, deleteRecord } = useDriveOnData();

  const orcamento = orcamentos.find(o => o.id === orcamentoId);
  const cliente = orcamento ? clientes.find(c => c.id === orcamento.clienteId) : undefined;
  const veiculo = orcamento ? veiculos.find(v => v.id === orcamento.veiculoId) : undefined;
  
  if (!orcamento) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Orçamento não encontrado" showBack={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>O orçamento solicitado não foi localizado.</Text>
        </View>
      </View>
    );
  }

  const isVencido = dayjs(orcamento.validade).isBefore(dayjs()) && orcamento.status === 'pendente';
  const st = STATUS_MAP[orcamento.status] ?? { label: orcamento.status, color: palette.slate500, bg: palette.slate100 };

  const openEditForm = () => {
    navigation.navigate('OrcamentoForm', { orcamentoId: orcamento.id });
  };

  const removeOrcamento = () => {
    Alert.alert('Excluir Orçamento?', 'Esta ação não poderá ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecord('/orcamentos', orcamento.id);
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Não foi possível excluir', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
          }
        },
      },
    ]);
  };

  const dispararWhatsApp = () => {
    if (!cliente?.telefone) {
      Alert.alert('Telefone indisponível', 'O cliente não possui um número de WhatsApp cadastrado.');
      return;
    }
    const veiculoNome = veiculo ? `${veiculo.marca} ${veiculo.modelo}` : 'Veículo';
    const firstItemDesc = orcamento.itens?.[0]?.nome ?? 'Serviço de oficina';
    
    sendEstimateMessage(
      cliente.nome,
      cliente.telefone,
      orcamento.id,
      veiculoNome,
      firstItemDesc,
      orcamento.total
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={`Orçamento #${String(orcamento.id).padStart(3, '0')}`}
        subtitle="Visualização Geral"
        showBack={true}
        rightElement={
          <TouchableOpacity
            style={styles.headerEditBtn}
            onPress={openEditForm}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={22} color={palette.slate700} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Card Principal */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleColumn}>
              <Text style={styles.orcTitle}>ORC #{String(orcamento.id).padStart(3, '0')}</Text>
              <Text style={styles.orcTotal}>R$ {orcamento.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
              <Text style={[styles.statusText, { color: st.color }]}>{st.label.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.datesRow}>
            <View>
              <Text style={styles.dateLabel}>Criado em</Text>
              <Text style={styles.dateValue}>{dayjs(orcamento.dataCriacao).format('DD/MM/YYYY')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.dateLabel, isVencido && { color: palette.rose600 }]}>
                {isVencido ? '⚠ Vencido' : 'Válido até'}
              </Text>
              <Text style={[styles.dateValue, isVencido && { color: palette.rose600, fontWeight: '700' }]}>
                {dayjs(orcamento.validade).format('DD/MM/YYYY')}
              </Text>
            </View>
          </View>
        </View>

        {/* Ficha Clientes / Veículos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Associação</Text>
          
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

        {/* Itens do Orçamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens e Serviços</Text>
          <View style={styles.itemsBox}>
            {orcamento.itens.map((item: any, idx: number) => {
              const qty = item.quantidade ?? item.qtd ?? 1;
              const price = item.precoUnitario ?? item.valor ?? 0;
              const sub = item.subtotal ?? (qty * price);
              return (
                <View key={idx}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemDesc}>{item.nome ?? item.descricao}</Text>
                      <Text style={styles.itemMeta}>Qtd: {qty} · Un: R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                    </View>
                    <Text style={styles.itemSubtotal}>
                      R$ {sub.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  {idx < orcamento.itens.length - 1 && <View style={styles.itemDivider} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* WhatsApp Compartilhar */}
        {cliente?.telefone && (
          <TouchableOpacity style={styles.whatsappBtn} activeOpacity={0.7} onPress={dispararWhatsApp}>
            <MaterialIcons name="share" size={20} color={palette.white} />
            <Text style={styles.whatsappBtnText}>Enviar por WhatsApp</Text>
          </TouchableOpacity>
        )}

        {/* Botão de Excluir */}
        <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.7} onPress={removeOrcamento}>
          <MaterialIcons name="delete" size={20} color={palette.rose600} />
          <Text style={styles.deleteBtnText}>Excluir Orçamento</Text>
        </TouchableOpacity>
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
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleColumn: { gap: 4 },
  orcTitle: { fontSize: 13, fontWeight: '700', color: palette.slate400, textTransform: 'uppercase' },
  orcTotal: { fontSize: 24, fontWeight: '900', color: palette.navy800, letterSpacing: -0.5 },
  statusBadge: { borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 9, fontWeight: '800' },
  cardDivider: { height: 1, backgroundColor: palette.slate100, marginVertical: spacing.md },
  datesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateLabel: { fontSize: 10, color: palette.slate400, fontWeight: '600' },
  dateValue: { fontSize: 13, color: palette.slate900, fontWeight: '700', marginTop: 1 },

  // Seções
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: palette.slate500, textTransform: 'uppercase', marginBottom: spacing.sm, letterSpacing: 0.3 },

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

  // Itens do orçamento list
  itemsBox: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.sm,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  itemDesc: { fontSize: 13, color: palette.slate900, fontWeight: '700' },
  itemMeta: { fontSize: 11, color: palette.slate400, marginTop: 3, fontWeight: '600' },
  itemSubtotal: { fontSize: 13, color: palette.slate900, fontWeight: '800' },
  itemDivider: { height: 1, backgroundColor: palette.slate50, marginVertical: spacing.sm },

  // WhatsApp e Ações
  whatsappBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#25D366',
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  whatsappBtnText: { fontSize: 14, color: palette.white, fontWeight: '700' },
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
