import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';
import ScreenHeader from '../../components/ScreenHeader';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import { sendWhatsAppMessage } from '../../services/whatsappService';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import api, { API_BASE_URL, getAuthToken } from '../../api/api';

const editFields: CrudField[] = [
  { key: 'cliente_id', label: 'Cliente', keyboardType: 'number-pad' },
  { key: 'veiculo_id', label: 'Veículo', keyboardType: 'number-pad' },
  { key: 'status', label: 'Status (analise, aprovado, recusado)', autoCapitalize: 'none' },
  { key: 'total', label: 'Total Geral', keyboardType: 'decimal-pad' },
  { key: 'dataCriacao', label: 'Data de Criação (YYYY-MM-DD)', keyboardType: 'default' },
  { key: 'validade', label: 'Data de Validade (YYYY-MM-DD)', keyboardType: 'default' },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  aprovado:  { label: 'Aprovado',  color: palette.emerald600, bg: '#ECFDF5', icon: 'check-circle' },
  recusado:  { label: 'Recusado',  color: palette.rose600,    bg: '#FFE4E6', icon: 'cancel' },
  analise:   { label: 'Em análise', color: palette.amber500,   bg: '#FFFBEB', icon: 'schedule' },
};

export default function OrcamentoDetalhesScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { orcamentoId } = route.params ?? { orcamentoId: 1 };
  const { orcamentos, clientes, veiculos, deleteRecord, updateRecord, refresh } = useDriveOnData();

  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [isWhatsAppModalVisible, setIsWhatsAppModalVisible] = useState(false);
  const [isWhatsAppPromptVisible, setIsWhatsAppPromptVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const orcamento = orcamentos.find(o => o.id === orcamentoId);
  const cliente = orcamento ? clientes.find(c => c.id === orcamento.clienteId) : undefined;
  const veiculo = orcamento ? veiculos.find(v => v.id === orcamento.veiculoId) : undefined;
  
  const [shortUrl, setShortUrl] = useState('');

  useEffect(() => {
    async function loadShortUrl() {
      if (!orcamento?.id) return;
      try {
        const { default: api } = await import('../../api/api');
        const response = await api.post(`/orcamentos/${orcamento.id}/share`);
        const code = response.data?.code;
        if (code) {
          setShortUrl(`${API_BASE_URL}/s/${code}`);
        }
      } catch (error: any) {
        console.log('Erro ao gerar link curto (esperado se backend ainda nao atualizou no cloud):', error?.message ?? error);
      }
    }
    loadShortUrl();
  }, [orcamento?.id]);

  useEffect(() => {
    if (isSuccessModalVisible) {
      const timer = setTimeout(() => {
        setIsSuccessModalVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccessModalVisible]);
  
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

  const isVencido = dayjs(orcamento.validade).isBefore(dayjs()) && orcamento.status === 'analise';
  const st = STATUS_MAP[orcamento.status] ?? { label: orcamento.status, color: palette.slate500, bg: palette.slate100, icon: 'info' as any };

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

  const getWhatsAppMessageText = () => {
    if (!cliente) return '';
    const veiculoNome = veiculo ? `${veiculo.marca} ${veiculo.modelo}` : 'Veículo';
    const placa = veiculo?.placa ?? '—';
    const formattedValor = orcamento.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const orcNum = String(orcamento.id).padStart(3, '0');
    const token = getAuthToken();
    const pdfUrl = shortUrl || `${API_BASE_URL}/orcamentos/${orcamento.id}/pdf${token ? `?token=${token}` : ''}`;

    switch (orcamento.status) {
      case 'aprovado':
        return `Olá, *${cliente.nome}*! Confirmamos a aprovação do orçamento *ORC #${orcNum}* para o seu veículo *${veiculoNome}* (placa *${placa}*). 🛠️🚗\n\n*Valor Total:* R$ ${formattedValor}\n\nPara ver o detalhamento, acesse:\n🔗 ${pdfUrl}\n\nLogo daremos início aos serviços e te manteremos informado. Obrigado pela preferência!`;
      case 'recusado':
        return `Olá, *${cliente.nome}*! Registramos a sua resposta para o orçamento *ORC #${orcNum}* do veículo *${veiculoNome}* (placa *${placa}*) como *Recusado*.\n\nVisualizar orçamento:\n🔗 ${pdfUrl}\n\nAgradecemos a atenção e nos colocamos à disposição para futuras necessidades!`;
      case 'analise':
      default:
        const itemsList = orcamento.itens?.map(item => {
          const qty = item.quantidade;
          const price = item.precoUnitario;
          return `- ${item.nome} (Qtd: ${qty} · R$ ${(qty * price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
        }).join('\n') || 'Sem itens informados';
        return `Olá, *${cliente.nome}*! Segue o orçamento *ORC #${orcNum}* para o seu veículo *${veiculoNome}* (placa *${placa}*):\n\n*Itens:*\n${itemsList}\n\n*Total:* R$ ${formattedValor}\n\nPara ver o orçamento completo, acesse:\n🔗 ${pdfUrl}\n\n📋 Aguardamos a sua aprovação para iniciarmos os serviços!`;
    }
  };

  const whatsappPreview = getWhatsAppMessageText();

  const sugerirNotificacaoWhatsApp = () => {
    if (cliente?.telefone) {
      setIsWhatsAppPromptVisible(true);
    }
  };

  const sugerirConversaoOS = () => {
    Alert.alert(
      'Orçamento Aprovado!',
      'Deseja transformar este orçamento em uma Ordem de Serviço (O.S.) agora?',
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Sim, Gerar O.S.', 
          onPress: () => {
            navigation.navigate('OSForm', { orcamentoId: orcamento.id });
          } 
        }
      ]
    );
  };

  const handleWhatsAppPress = () => {
    if (!cliente?.telefone) {
      Alert.alert('Telefone indisponível', 'Este cliente não possui telefone cadastrado.');
      return;
    }
    setIsWhatsAppModalVisible(true);
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
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => setIsStatusModalVisible(true)}
              style={[styles.statusBadge, { backgroundColor: st.bg, flexDirection: 'row', alignItems: 'center', gap: 4 }]}
            >
              <MaterialIcons name={st.icon} size={12} color={st.color} />
              <Text style={[styles.statusText, { color: st.color }]}>{st.label.toUpperCase()}</Text>
              <MaterialIcons name="arrow-drop-down" size={16} color={st.color} />
            </TouchableOpacity>
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
          <TouchableOpacity style={styles.whatsappBtn} activeOpacity={0.7} onPress={handleWhatsAppPress}>
            <MaterialCommunityIcons name="whatsapp" size={20} color={palette.white} />
            <Text style={styles.whatsappBtnText}>Notificar no WhatsApp</Text>
          </TouchableOpacity>
        )}

        {/* Botão de Excluir */}
        <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.7} onPress={removeOrcamento}>
          <MaterialIcons name="delete" size={20} color={palette.rose600} />
          <Text style={styles.deleteBtnText}>Excluir Orçamento</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── WhatsApp Bottom Sheet Modal ── */}
      <Modal
        visible={isWhatsAppModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsWhatsAppModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropCloseArea}
            activeOpacity={1}
            onPress={() => setIsWhatsAppModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalDragIndicator} />
            <Text style={styles.modalTitle}>Enviar WhatsApp</Text>
            <Text style={styles.modalSubtitle}>
              Envio de notificação de orçamento para o cliente {cliente?.nome}
            </Text>

            {/* Situação do Orçamento */}
            <View style={styles.statusRowInModal}>
              <Text style={styles.statusLabelInModal}>Situação do Orçamento:</Text>
              <View style={[styles.statusBadge, { backgroundColor: st.bg, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <MaterialIcons name={st.icon} size={12} color={st.color} />
                <Text style={[styles.statusText, { color: st.color }]}>{st.label.toUpperCase()}</Text>
              </View>
            </View>

            {/* Prévia da Mensagem */}
            <Text style={styles.dialogLabel}>Prévia da Mensagem</Text>
            <View style={styles.previewBox}>
              <ScrollView 
                style={{ flex: 1 }} 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.previewText}>{whatsappPreview}</Text>
              </ScrollView>
            </View>

            {/* Botões de Ação */}
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                activeOpacity={0.8}
                onPress={() => setIsWhatsAppModalVisible(false)}
              >
                <Text style={styles.dialogCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dialogSendBtn}
                activeOpacity={0.8}
                onPress={async () => {
                  setIsWhatsAppModalVisible(false);
                  if (cliente?.telefone) {
                    const success = await sendWhatsAppMessage(cliente.telefone, whatsappPreview);
                    if (success) {
                      setIsSuccessModalVisible(true);
                    }
                  }
                }}
              >
                <LinearGradient colors={gradients.navyPrimary} style={styles.dialogSendBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <MaterialCommunityIcons name="whatsapp" size={18} color={palette.white} />
                  <Text style={styles.dialogSendBtnText}>Confirmar Envio</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Status Picker Modal (Bottom Sheet) ── */}
      <Modal
        visible={isStatusModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsStatusModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropCloseArea}
            activeOpacity={1}
            onPress={() => setIsStatusModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalDragIndicator} />
            <Text style={styles.modalTitle}>Alterar Status do Orçamento</Text>
            <Text style={styles.modalSubtitle}>
              Selecione a nova situação para o orçamento #{String(orcamento.id).padStart(3, '0')}:
            </Text>

            <TouchableOpacity
              style={styles.modalOption}
              activeOpacity={0.7}
              onPress={async () => {
                setIsStatusModalVisible(false);
                try {
                  await api.patch(`/orcamentos/${orcamento.id}/status`, { status: 'aprovado' });
                  await refresh();
                  sugerirConversaoOS();
                } catch (error: any) {
                  Alert.alert('Erro', error?.response?.data?.error ?? error?.message);
                }
              }}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                <MaterialIcons name="check-circle" size={22} color={palette.emerald600} />
              </View>
              <View style={styles.modalOptionTextContainer}>
                <Text style={styles.modalOptionText}>Aprovar Orçamento</Text>
                <Text style={styles.modalOptionSubtext}>Altera o status para "Aprovado".</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              activeOpacity={0.7}
              onPress={async () => {
                setIsStatusModalVisible(false);
                try {
                  await api.patch(`/orcamentos/${orcamento.id}/status`, { status: 'recusado' });
                  await refresh();
                  sugerirNotificacaoWhatsApp();
                } catch (error: any) {
                  Alert.alert('Erro', error?.response?.data?.error ?? error?.message);
                }
              }}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>
                <MaterialIcons name="cancel" size={22} color={palette.rose600} />
              </View>
              <View style={styles.modalOptionTextContainer}>
                <Text style={styles.modalOptionText}>Recusar Orçamento</Text>
                <Text style={styles.modalOptionSubtext}>Altera o status para "Recusado".</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              activeOpacity={0.7}
              onPress={async () => {
                setIsStatusModalVisible(false);
                try {
                  await api.patch(`/orcamentos/${orcamento.id}/status`, { status: 'analise' });
                  await refresh();
                  sugerirNotificacaoWhatsApp();
                } catch (error: any) {
                  Alert.alert('Erro', error?.response?.data?.error ?? error?.message);
                }
              }}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.05)' }]}>
                <MaterialIcons name="schedule" size={22} color={palette.amber500} />
              </View>
              <View style={styles.modalOptionTextContainer}>
                <Text style={styles.modalOptionText}>Marcar como Em análise</Text>
                <Text style={styles.modalOptionSubtext}>Altera o status de volta para "Em análise".</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              activeOpacity={0.8}
              onPress={() => setIsStatusModalVisible(false)}
            >
              <Text style={styles.modalCancelButtonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── WhatsApp Prompt Modal ── */}
      <Modal
        visible={isWhatsAppPromptVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setIsWhatsAppPromptVisible(false)}
      >
        <TouchableOpacity
          style={styles.dialogBackdrop}
          activeOpacity={1}
          onPress={() => setIsWhatsAppPromptVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.dialogContent}
          >
            <View style={[styles.dialogIconBox, { backgroundColor: 'rgba(37, 211, 102, 0.08)' }]}>
              <MaterialCommunityIcons name="whatsapp" size={32} color="#25D366" />
            </View>
            
            <Text style={styles.dialogTitle}>Enviar Aviso no WhatsApp?</Text>
            <Text style={styles.dialogDescription}>
              O status do orçamento foi atualizado. Deseja notificar o cliente {cliente?.nome} sobre essa mudança?
            </Text>

            <View style={styles.dialogActionRow}>
              <TouchableOpacity
                style={styles.dialogCancelButton}
                activeOpacity={0.7}
                onPress={() => setIsWhatsAppPromptVisible(false)}
              >
                <Text style={styles.dialogCancelButtonText}>Não</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dialogConfirmButton}
                activeOpacity={0.8}
                onPress={() => {
                  setIsWhatsAppPromptVisible(false);
                  setIsWhatsAppModalVisible(true);
                }}
              >
                <LinearGradient
                  colors={['#25D366', '#128C7E']}
                  style={styles.dialogConfirmButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.dialogConfirmButtonText}>Sim, Notificar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Success Modal ── */}
      <Modal
        visible={isSuccessModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setIsSuccessModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.dialogBackdrop}
          activeOpacity={1}
          onPress={() => setIsSuccessModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.dialogContent}
          >
            <View style={[styles.dialogIconBox, { backgroundColor: '#E8F5E9' }]}>
              <MaterialIcons name="check" size={32} color={palette.emerald600} />
            </View>
            
            <Text style={styles.dialogTitle}>Mensagem Enviada!</Text>
            <Text style={styles.dialogDescription}>
              A notificação do orçamento foi disparada com sucesso para o WhatsApp de {cliente?.nome}.
            </Text>

            <View style={styles.dialogActionRow}>
              <TouchableOpacity
                style={styles.dialogConfirmButton}
                activeOpacity={0.8}
                onPress={() => setIsSuccessModalVisible(false)}
              >
                <LinearGradient
                  colors={gradients.navyPrimary}
                  style={styles.dialogConfirmButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.dialogConfirmButtonText}>Ok</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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

  // Custom Modal (Bottom Sheet style for WhatsApp/Status)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdropCloseArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: palette.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 12,
    ...shadows.lg,
  },
  modalDragIndicator: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: palette.slate200,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.slate900,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 13,
    color: palette.slate400,
    fontWeight: '500',
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  statusRowInModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statusLabelInModal: {
    fontSize: 14,
    color: palette.slate500,
    fontWeight: '600',
  },
  dialogLabel: {
    fontSize: 12,
    color: palette.slate500,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
  previewBox: {
    backgroundColor: palette.slate50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    padding: spacing.md,
    minHeight: 120,
    maxHeight: 180,
    marginBottom: spacing.lg,
  },
  previewText: {
    fontSize: 14,
    color: palette.slate700,
    lineHeight: 20,
    fontWeight: '500',
  },
  dialogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
  },
  dialogCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate700,
  },
  dialogSendBtn: {
    flex: 1.5,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  dialogSendBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
  },
  dialogSendBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.white,
  },

  // Centered Confirm Dialog Modal
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  dialogContent: {
    width: '100%',
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  dialogIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.slate900,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  dialogDescription: {
    fontSize: 13,
    color: palette.slate500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
    fontWeight: '500',
  },
  dialogActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  dialogCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
  },
  dialogCancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate700,
  },
  dialogConfirmButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  dialogConfirmButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogConfirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.white,
  },

  // Modal options for Status Picker
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
    gap: spacing.md,
  },
  modalOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionTextContainer: {
    flex: 1,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate700,
  },
  modalOptionSubtext: {
    fontSize: 11,
    color: palette.slate400,
    marginTop: 2,
    fontWeight: '500',
  },
  modalCancelButton: {
    marginTop: spacing.lg,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: palette.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.slate700,
  },
});
