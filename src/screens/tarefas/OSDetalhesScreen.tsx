import React, { useState, useEffect } from 'react';
import { Alert, Linking, Share, View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';
import dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import ProcessingOverlay from '../../components/ProcessingOverlay';
import WhatsAppMessagePreview from '../../components/WhatsAppMessagePreview';
import ActionOverflowMenu from '../../components/ActionOverflowMenu';
import api from '../../api/api';
import { sendWhatsAppMessage } from '../../services/whatsappService';
import { buildOSTrackingMessage, createTrackingLink, resolveTrackingLink } from '../../services/trackingShareService';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  em_andamento:    { label: 'Em Andamento',  color: palette.navy700,    bg: palette.navy50,     icon: 'autorenew' },
  aguardando:      { label: 'Aguardando',    color: '#C2410C',          bg: '#FFF7ED',          icon: 'schedule' },
  aguardando_pecas:{ label: 'Aguard. Peças', color: palette.violet600,  bg: '#F5F3FF',          icon: 'inventory' },
  concluido:       { label: 'Concluído',     color: palette.emerald600, bg: palette.emerald100, icon: 'check-circle' },
};

function InfoRow({ icon, label, value, rightElement }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string; rightElement?: React.ReactNode }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <MaterialIcons name={icon} size={16} color={palette.navy700} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {rightElement}
    </View>
  );
}

export default function OSDetalhesScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { osId } = route.params ?? { osId: 1 };
  const { ordens, clientes, veiculos, pagamentos, createRecord, updateRecord, refresh, configuracoes } = useDriveOnData();
  const os = ordens.find(o => o.id === osId) ?? ordens[0];
  const cliente = os ? clientes.find(c => c.id === os.clienteId) : undefined;
  const veiculo = os ? veiculos.find(v => v.id === os.veiculoId) : undefined;
  const pagamentoOS = pagamentos?.find(p => p.ordemId === os?.id);

  const [shortUrl, setShortUrl] = useState('');

  useEffect(() => {
    async function loadShortUrl() {
      if (!os?.id) return;
      try {
        setShortUrl(await createTrackingLink('ordens', os.id));
      } catch (error) {
        console.error('Erro ao gerar link curto:', error);
      }
    }
    loadShortUrl();
  }, [os?.id]);


  if (!os) {
    return (
      <View style={styles.container}>
        <Text>Ordem de servico nao encontrada.</Text>
      </View>
    );
  }
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const effectiveStatus = optimisticStatus ?? os.status;
  const st = STATUS_MAP[effectiveStatus] ?? { label: effectiveStatus, color: palette.slate500, bg: palette.slate100, icon: 'info' as any };

  const itens = [
    { nome: 'Diagnóstico', qtd: 1, valor: 150.0 },
    { nome: 'Mão de Obra', qtd: 1, valor: os.valor - 150 },
  ];

  const trackingLink = resolveTrackingLink('ordens', os.id, shortUrl);

  const getWhatsAppMessageText = (link = trackingLink || 'Link sendo gerado...') => {
    if (!cliente) return '';
    const nomeOficina = configuracoes?.nomeOficina || 'nossa oficina';
    const veiculoNome = veiculo ? `${veiculo.marca} ${veiculo.modelo}` : 'Veiculo';
    const placa = veiculo?.placa ?? '-';

    return buildOSTrackingMessage({
      clienteNome: cliente.nome,
      oficinaNome: nomeOficina,
      veiculoNome,
      placa,
      osId: os.id,
      status: effectiveStatus,
      statusLabel: st.label,
      descricao: os.descricao,
      valor: os.valor,
      link,
    });
  };

  const whatsappPreview = getWhatsAppMessageText();
  const [isWhatsAppModalVisible, setIsWhatsAppModalVisible] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [isConfirmCancelModalVisible, setIsConfirmCancelModalVisible] = useState(false);
  const [isWhatsAppPromptVisible, setIsWhatsAppPromptVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedMetodo, setSelectedMetodo] = useState<'pix' | 'dinheiro' | 'cartao' | 'boleto'>('pix');
  const [selectedStatus, setSelectedStatus] = useState<'pendente' | 'pago'>('pago');
  const [isRegisteringPayment, setIsRegisteringPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreparingLink, setIsPreparingLink] = useState(false);

  useEffect(() => {
    if (optimisticStatus && os.status === optimisticStatus) {
      setOptimisticStatus(null);
    }
  }, [optimisticStatus, os.status]);

  useEffect(() => {
    if (isSuccessModalVisible) {
      const timer = setTimeout(() => {
        setIsSuccessModalVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccessModalVisible]);

  const sugerirNotificacaoWhatsApp = () => {
    if (cliente?.telefone) {
      setIsWhatsAppPromptVisible(true);
    }
  };

  const atualizarStatusOS = async (
    status: string,
    payload: Record<string, unknown> = {},
    options: { notifyWhatsApp?: boolean } = { notifyWhatsApp: true }
  ) => {
    setIsProcessing(true);
    try {
      await api.put(`/ordens/${os.id}`, { ...payload, status });
      setOptimisticStatus(status);
      setIsStatusModalVisible(false);
      setIsConfirmModalVisible(false);
      setIsConfirmCancelModalVisible(false);
      setIsProcessing(false);
      if (options.notifyWhatsApp !== false) {
        sugerirNotificacaoWhatsApp();
      }
      void refresh();
      return true;
    } catch (error: any) {
      setIsProcessing(false);
      Alert.alert('Erro', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
      return false;
    }
  };

  const concluirOS = () => {
    setIsConfirmModalVisible(true);
  };

  const garantirLinkAcompanhamento = async () => {
    if (shortUrl) return shortUrl;
    setIsPreparingLink(true);
    try {
      const link = await createTrackingLink('ordens', os.id);
      setShortUrl(link);
      return link;
    } catch (error: any) {
      Alert.alert('Link indisponível', error?.message ?? 'Não foi possível gerar o link de acompanhamento.');
      return '';
    } finally {
      setIsPreparingLink(false);
    }
  };

  const abrirAcompanhamento = async () => {
    const link = await garantirLinkAcompanhamento();
    if (!link) return;
    const supported = await Linking.canOpenURL(link);
    if (supported) await Linking.openURL(link);
    else Alert.alert('Link indisponível', link);
  };

  const handleWhatsAppPress = () => {
    setIsWhatsAppModalVisible(true);
  };

  const compartilharPeloCelular = async () => {
    try {
      const link = await garantirLinkAcompanhamento();
      if (!link) return;
      await Share.share({
        title: `OS #${String(os.id).padStart(3, '0')}`,
        message: getWhatsAppMessageText(link),
      });
    } catch (error: any) {
      Alert.alert('Não foi possível compartilhar', error?.message ?? 'Tente novamente.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate100 }}>
      <ScreenHeader
        title="Detalhes da OS"
        showBack={true}
        rightElement={
          <ActionOverflowMenu
            options={[
              {
                label: 'Editar OS',
                icon: 'edit',
                onPress: () => navigation.navigate('OSForm', { osId: os.id }),
              },
              ...((effectiveStatus === 'aguardando' || effectiveStatus === 'em_andamento') ? [{
                label: 'Cancelar OS',
                icon: 'cancel',
                destructive: true,
                onPress: () => setIsConfirmCancelModalVisible(true),
              } as const] : []),
            ]}
          />
        }
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 56 }} showsVerticalScrollIndicator={false}>

      {/* ── Cliente ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="person" size={16} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Cliente</Text>
        </View>
        <InfoRow icon="person-outline" label="Nome" value={cliente?.nome ?? '—'} />
        <InfoRow icon="phone" label="Telefone" value={cliente?.telefone ?? '—'} />
        <InfoRow icon="email" label="E-mail" value={cliente?.email ?? '—'} />
      </View>

      {/* ── Veículo ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="directions-car" size={16} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Veículo</Text>
        </View>
        <InfoRow icon="car-repair" label="Modelo" value={veiculo ? `${veiculo.marca} ${veiculo.modelo} ${veiculo.ano}` : '—'} />
        <InfoRow icon="pin" label="Placa" value={veiculo?.placa ?? '—'} />
        <InfoRow icon="palette" label="Cor" value={veiculo?.cor ?? '—'} />
        <InfoRow icon="speed" label="KM" value={veiculo ? `${veiculo.km.toLocaleString()} km` : '—'} />
      </View>

      {/* ── Informações ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="info-outline" size={16} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Informações</Text>
        </View>
        <View style={styles.statusInfoRow}>
          <Text style={styles.statusInfoLabel}>Situação</Text>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <MaterialIcons name={st.icon} size={12} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <InfoRow icon="description" label="Descrição" value={os.descricao} />
        <InfoRow icon="login" label="Entrada" value={dayjs(os.dataEntrada).format('DD/MM/YYYY HH:mm')} />
        <InfoRow icon="event" label="Previsão" value={dayjs(os.dataPrevista).format('DD/MM/YYYY')} />
        <InfoRow icon="engineering" label="Mecânico" value={os.mecanico} />
      </View>

      {/* ── Serviços / Peças ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="build" size={16} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Serviços / Peças</Text>
        </View>
        {(os.itens && os.itens.length > 0 ? os.itens : itens).map((item: any, idx: number) => {
          const qty = item.quantidade ?? item.qtd ?? 1;
          const price = item.precoUnitario ?? item.valor ?? 0;
          const sub = item.subtotal ?? (qty * price);
          return (
            <View key={idx} style={[styles.itemRow, idx < (os.itens?.length || itens.length) - 1 && styles.itemBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemNome}>{item.nome ?? item.descricao}</Text>
                <Text style={styles.itemQtd}>Qtd: {qty} · Un: R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
              </View>
              <Text style={styles.itemValor}>R$ {sub.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            </View>
          );
        })}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValor}>R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
        </View>
      </View>

      {/* ── Financeiro / Cobrança ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="attach-money" size={16} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Cobrança / Recebimento</Text>
        </View>

        {pagamentoOS ? (
          <View style={styles.financeInfo}>
            <View style={styles.financeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.financeLabel}>Situação do Recebimento</Text>
                <Text style={styles.financeValue}>
                  R$ {pagamentoOS.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · {pagamentoOS.formaPagamento?.toUpperCase() || 'PIX'}
                </Text>
              </View>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: pagamentoOS.status === 'pago' ? palette.emerald100 : palette.amber100 }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { color: pagamentoOS.status === 'pago' ? palette.emerald600 : '#92400E' }
                ]}>
                  {pagamentoOS.status === 'pago' ? 'RECEBIDO' : 'PENDENTE'}
                </Text>
              </View>
            </View>

            {pagamentoOS.status !== 'pago' && (
              <TouchableOpacity 
                style={[styles.btnPrimary, { marginTop: spacing.sm }]} 
                activeOpacity={0.8}
                disabled={isProcessing}
                onPress={async () => {
                  setIsProcessing(true);
                  try {
                    await updateRecord('/pagamentos', pagamentoOS.id, {
                      status: 'pago',
                      metodo: pagamentoOS.formaPagamento || 'pix',
                    });
                    void refresh();
                    Alert.alert('Sucesso', 'Recebimento registrado com sucesso!');
                  } catch (error: any) {
                    Alert.alert('Erro', error?.response?.data?.error ?? error?.message);
                  } finally {
                    setIsProcessing(false);
                  }
                }}
              >
                <LinearGradient colors={gradients.navyPrimary} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={palette.white} />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={18} color={palette.white} />
                      <Text style={styles.btnPrimaryText}>Registrar como Recebido</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.financeEmpty}>
            <Text style={styles.financeEmptyText}>Nenhum registro financeiro de cobrança encontrado para esta OS.</Text>
            <TouchableOpacity 
              style={[styles.btnPrimary, styles.chargeButton]} 
              activeOpacity={0.8}
              onPress={() => setIsPaymentModalVisible(true)}
            >
              <LinearGradient colors={gradients.navyPrimary} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <MaterialIcons name="add" size={18} color={palette.white} />
                <Text style={styles.btnPrimaryText}>Registrar Cobrança</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </ScrollView>

      <View style={[styles.fixedActionBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View style={styles.footerHandle} />

        <View style={styles.footerActionsRow}>
          {(effectiveStatus === 'aguardando' || effectiveStatus === 'em_andamento') && (
            <TouchableOpacity style={styles.footerPrimaryAction} activeOpacity={0.82} onPress={() => setIsStatusModalVisible(true)}>
              <LinearGradient colors={gradients.navyPrimary} style={styles.footerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <MaterialIcons name="swap-vert" size={18} color={palette.white} />
                <Text style={styles.footerPrimaryText}>Alterar situação</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.footerSecondaryAction, effectiveStatus !== 'aguardando' && effectiveStatus !== 'em_andamento' && styles.footerActionWide]}
            activeOpacity={0.8}
            onPress={handleWhatsAppPress}
          >
            <MaterialIcons name="ios-share" size={18} color={palette.navy800} />
            <Text style={styles.footerSecondaryText}>Compartilhar</Text>
          </TouchableOpacity>
        </View>
      </View>

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
            <Text style={styles.modalTitle}>Compartilhar</Text>
            <Text style={styles.modalSubtitle}>
              Escolha como enviar o acompanhamento para {cliente?.nome ?? 'o cliente'}.
            </Text>

            {/* Situação da OS */}
            <View style={styles.statusRowInModal}>
              <Text style={styles.statusLabelInModal}>Situação da OS:</Text>
              <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                <MaterialIcons name={st.icon} size={12} color={st.color} />
                <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
              </View>
            </View>

            {/* Prévia da Mensagem */}
            <Text style={styles.dialogLabel}>Mensagem que será enviada</Text>
            <View style={styles.previewBox}>
              <ScrollView 
                style={{ flex: 1 }} 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                <WhatsAppMessagePreview message={whatsappPreview} textStyle={styles.previewText} />
              </ScrollView>
            </View>

            <View style={styles.trackingLinkBox}>
              <MaterialIcons name="link" size={16} color={palette.navy700} />
              <Text style={styles.trackingLinkText} numberOfLines={1}>A mensagem inclui o link para o cliente acompanhar online.</Text>
            </View>

            <View style={styles.shareQuickActions}>
              <TouchableOpacity
                style={styles.shareOptionButton}
                activeOpacity={0.8}
                onPress={() => {
                  setIsWhatsAppModalVisible(false);
                  void abrirAcompanhamento();
                }}
              >
                <MaterialIcons name="open-in-new" size={18} color={palette.navy800} />
                <Text style={styles.shareOptionText}>Abrir link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOptionButton}
                activeOpacity={0.8}
                onPress={() => {
                  setIsWhatsAppModalVisible(false);
                  void compartilharPeloCelular();
                }}
              >
                <MaterialIcons name="ios-share" size={18} color={palette.navy800} />
                <Text style={styles.shareOptionText}>Compartilhar</Text>
              </TouchableOpacity>
            </View>

            {/* Botões de Ação */}
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                activeOpacity={0.8}
                onPress={() => setIsWhatsAppModalVisible(false)}
              >
                <Text style={styles.dialogCancelBtnText}>Agora não</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dialogSendBtn}
                activeOpacity={0.8}
                onPress={async () => {
                  if (!cliente?.telefone) {
                    Alert.alert('Telefone indisponível', 'Este cliente não possui telefone cadastrado.');
                    return;
                  }
                  const link = await garantirLinkAcompanhamento();
                  if (!link) return;
                  setIsWhatsAppModalVisible(false);
                  const success = await sendWhatsAppMessage(cliente.telefone, getWhatsAppMessageText(link));
                  if (success) {
                    setIsSuccessModalVisible(true);
                  }
                }}
              >
                <LinearGradient colors={gradients.navyPrimary} style={styles.dialogSendBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <MaterialCommunityIcons name="whatsapp" size={18} color={palette.white} />
                  <Text style={styles.dialogSendBtnText}>Enviar no WhatsApp</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Confirm Dialog Modal ── */}
      <Modal
        visible={isConfirmModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setIsConfirmModalVisible(false)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialogContent}>
            <View style={[styles.dialogIconBox, { backgroundColor: 'rgba(37, 99, 235, 0.08)' }]}>
              <MaterialIcons name="help-outline" size={32} color={palette.navy700} />
            </View>
            
            <Text style={styles.dialogTitle}>Concluir Ordem de Serviço?</Text>
            <Text style={styles.dialogDescription}>
              A ordem de serviço #{String(os.id).padStart(3, '0')} será marcada como concluída e a data de fechamento será registrada.
            </Text>

            <View style={styles.dialogActionRow}>
              <TouchableOpacity
                style={styles.dialogCancelButton}
                activeOpacity={0.7}
                onPress={() => setIsConfirmModalVisible(false)}
              >
                <Text style={styles.dialogCancelButtonText}>Voltar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dialogConfirmButton}
                activeOpacity={0.8}
                disabled={isProcessing}
                onPress={async () => {
                  const updated = await atualizarStatusOS(
                    'concluida',
                    { data_fechamento: new Date().toISOString() },
                    { notifyWhatsApp: false }
                  );
                  if (updated) {
                    setIsPaymentModalVisible(true);
                  }
                }}
              >
                <LinearGradient
                  colors={gradients.navyPrimary}
                  style={styles.dialogConfirmButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.dialogConfirmButtonText}>Sim, concluir</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Confirm Cancel Modal ── */}
      <Modal
        visible={isConfirmCancelModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setIsConfirmCancelModalVisible(false)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialogContent}>
            <View style={[styles.dialogIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
              <MaterialIcons name="warning" size={32} color={palette.rose600} />
            </View>
            
            <Text style={styles.dialogTitle}>Cancelar Ordem de Serviço?</Text>
            <Text style={styles.dialogDescription}>
              A ordem de serviço #{String(os.id).padStart(3, '0')} será cancelada. Esta ação não poderá ser desfeita.
            </Text>

            <View style={styles.dialogActionRow}>
              <TouchableOpacity
                style={styles.dialogCancelButton}
                activeOpacity={0.7}
                onPress={() => setIsConfirmCancelModalVisible(false)}
              >
                <Text style={styles.dialogCancelButtonText}>Voltar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dialogConfirmButton}
                activeOpacity={0.8}
                disabled={isProcessing}
                onPress={async () => {
                  await atualizarStatusOS('cancelada');
                }}
              >
                <LinearGradient
                  colors={[palette.rose600, '#DC2626']}
                  style={styles.dialogConfirmButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.dialogConfirmButtonText}>Sim, cancelar</Text>
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
            <Text style={styles.modalTitle}>Alterar Status da OS</Text>
            <Text style={styles.modalSubtitle}>
              Selecione o novo status para a OS #{String(os.id).padStart(3, '0')}:
            </Text>

            {effectiveStatus === 'aguardando' && (
              <>
                <TouchableOpacity
                  style={styles.modalOption}
                  activeOpacity={0.7}
                  onPress={async () => {
                    await atualizarStatusOS('em_andamento');
                  }}
                >
                  <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(37, 99, 235, 0.05)' }]}>
                    <MaterialIcons name="autorenew" size={22} color={palette.navy700} />
                  </View>
                  <View style={styles.modalOptionTextContainer}>
                    <Text style={styles.modalOptionText}>Iniciar Serviço (Em Andamento)</Text>
                    <Text style={styles.modalOptionSubtext}>Altera o status da OS para "Em Andamento".</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {effectiveStatus === 'em_andamento' && (
              <>
                <TouchableOpacity
                  style={styles.modalOption}
                  activeOpacity={0.7}
                  onPress={() => {
                    setIsStatusModalVisible(false);
                    setIsConfirmModalVisible(true);
                  }}
                >
                  <View style={[styles.modalOptionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                    <MaterialIcons name="check-circle" size={22} color={palette.emerald600} />
                  </View>
                  <View style={styles.modalOptionTextContainer}>
                    <Text style={styles.modalOptionText}>Concluir OS</Text>
                    <Text style={styles.modalOptionSubtext}>Altera o status da OS para "Concluída".</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

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
              O status da OS foi atualizado. Deseja enviar uma notificação sobre essa mudança para o cliente {cliente?.nome}?
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

      {/* ── Registrar Cobrança Modal ── */}
      <Modal
        visible={isPaymentModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropCloseArea}
            activeOpacity={1}
            onPress={() => setIsPaymentModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalDragIndicator} />
            <Text style={styles.modalTitle}>Registrar Cobrança / Recebimento</Text>
            <Text style={styles.modalSubtitle}>
              Gere um lançamento financeiro para a OS #{String(os.id).padStart(3, '0')} no valor de R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
            </Text>

            {/* Método de Pagamento */}
            <Text style={styles.dialogLabel}>Método de Pagamento</Text>
            <View style={styles.paymentMethodsRow}>
              {(['pix', 'dinheiro', 'cartao', 'boleto'] as const).map(metodo => {
                const isSel = selectedMetodo === metodo;
                const labels = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão', boleto: 'Boleto' };
                const icons = { pix: 'qr-code', dinheiro: 'payments', cartao: 'credit-card', boleto: 'receipt-long' } as const;
                return (
                  <TouchableOpacity
                    key={metodo}
                    style={[styles.paymentMethodButton, isSel && styles.paymentMethodButtonSelected]}
                    onPress={() => setSelectedMetodo(metodo)}
                  >
                    <MaterialIcons name={icons[metodo]} size={16} color={isSel ? palette.white : palette.slate500} style={{ marginRight: 4 }} />
                    <Text style={[styles.paymentMethodText, isSel && styles.paymentMethodTextSelected]}>
                      {labels[metodo]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Status */}
            <Text style={styles.dialogLabel}>Status</Text>
            <View style={styles.paymentMethodsRow}>
              {(['pago', 'pendente'] as const).map(st => {
                const isSel = selectedStatus === st;
                const labels = { pago: 'Pago / Recebido', pendente: 'Pendente' };
                const colorsSt = { pago: palette.emerald600, pendente: palette.amber500 };
                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.paymentStatusButton, 
                      isSel && { backgroundColor: colorsSt[st], borderColor: colorsSt[st] }
                    ]}
                    onPress={() => setSelectedStatus(st)}
                  >
                    <Text style={[styles.paymentStatusText, isSel && styles.paymentStatusTextSelected]}>
                      {labels[st]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botões de Ação */}
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setIsPaymentModalVisible(false);
                }}
              >
                <Text style={styles.dialogCancelBtnText}>Ignorar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dialogSendBtn}
                activeOpacity={0.8}
                disabled={isRegisteringPayment}
                onPress={async () => {
                  setIsRegisteringPayment(true);
                  try {
                    await createRecord('/pagamentos', {
                      tipo: 'receber',
                      valor: os.valor,
                      data_vencimento: dayjs().format('YYYY-MM-DD'),
                      descricao: `Recebimento da OS #${String(os.id).padStart(3, '0')}`,
                      cliente_id: os.clienteId,
                      ordem_servico_id: os.id,
                      metodo: selectedMetodo,
                      status: selectedStatus,
                    });
                    setIsPaymentModalVisible(false);
                    void refresh();
                    Alert.alert('Sucesso', 'Cobrança registrada com sucesso!', [
                      {
                        text: 'OK',
                        onPress: () => sugerirNotificacaoWhatsApp()
                      }
                    ]);
                  } catch (error: any) {
                    Alert.alert('Erro', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
                  } finally {
                    setIsRegisteringPayment(false);
                  }
                }}
              >
                <LinearGradient colors={gradients.navyPrimary} style={styles.dialogSendBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {isRegisteringPayment ? (
                    <ActivityIndicator size="small" color={palette.white} />
                  ) : (
                    <Text style={styles.dialogSendBtnText}>Confirmar</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Success Dialog Modal ── */}
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
            <View style={[styles.dialogIconBox, { backgroundColor: 'rgba(37, 211, 102, 0.08)' }]}>
              <MaterialCommunityIcons name="check-circle" size={32} color="#25D366" />
            </View>
            
            <Text style={styles.dialogTitle}>Mensagem Enviada!</Text>
            <Text style={styles.dialogDescription}>
              A notificação foi enviada com sucesso para o WhatsApp do cliente.
            </Text>

            <View style={styles.dialogActionRow}>
              <TouchableOpacity
                style={styles.dialogConfirmButton}
                activeOpacity={0.8}
                onPress={() => setIsSuccessModalVisible(false)}
              >
                <LinearGradient
                  colors={['#25D366', '#128C7E']}
                  style={styles.dialogConfirmButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.dialogConfirmButtonText}>OK</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <ProcessingOverlay
        visible={isProcessing || isPreparingLink}
        message={isPreparingLink ? 'Preparando link...' : 'Atualizando status...'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },

  // Sections
  section: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: palette.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: palette.slate100 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: palette.slate900 },
  statusInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusInfoLabel: {
    fontSize: 11,
    color: palette.slate400,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm, gap: spacing.sm },
  infoIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: palette.navy50, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: palette.slate400, fontWeight: '600', marginBottom: 1 },
  infoValue: { fontSize: 14, color: palette.slate900, fontWeight: '500' },

  // Item rows (serviços)
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: palette.slate100 },
  itemNome: { fontSize: 14, fontWeight: '600', color: palette.slate900 },
  itemQtd: { fontSize: 12, color: palette.slate400, marginTop: 1 },
  itemValor: { fontSize: 14, fontWeight: '700', color: palette.slate700 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, marginTop: spacing.xs, borderTopWidth: 2, borderTopColor: palette.slate100 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: palette.slate900 },
  totalValor: { fontSize: 20, fontWeight: '800', color: palette.navy800 },

  // Actions
  actions: { marginHorizontal: spacing.lg, gap: spacing.sm },
  fixedActionBar: {
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.22)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    gap: 8,
    ...shadows.lg,
  },
  footerHandle: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.slate200,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  footerPrimaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.sm,
  },
  footerActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  footerPrimaryAction: {
    flex: 1.2,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.sm,
  },
  footerGradient: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  footerPrimaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.white,
  },
  footerSecondaryAction: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    backgroundColor: palette.slate50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  footerActionWide: {
    flex: 1,
  },
  footerSecondaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.navy800,
  },
  footerQuickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  footerQuickButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    backgroundColor: palette.slate50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  footerQuickButtonWide: {
    flex: 1.7,
  },
  footerWhatsappButton: {
    flex: 1.45,
    backgroundColor: '#ECFDF5',
    borderColor: 'rgba(18, 140, 126, 0.18)',
  },
  footerQuickText: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.navy800,
  },
  footerWhatsappText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#128C7E',
  },
  btnPrimary: { borderRadius: borderRadius.md, overflow: 'hidden', ...shadows.sm },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 14 },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: palette.white },
  chargeButton: { alignSelf: 'stretch', marginTop: spacing.sm },
  btnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 14, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: palette.navy800, backgroundColor: palette.white },
  btnOutlineText: { fontSize: 15, fontWeight: '700', color: palette.navy800 },
  btnWhatsApp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: '#25D366',
    ...shadows.sm,
    marginTop: spacing.xs,
  },
  btnWhatsAppText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.white,
  },

  // Custom Modal (Bottom Sheet style for WhatsApp)
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
  trackingLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.navy50,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  trackingLinkText: {
    flex: 1,
    fontSize: 12,
    color: palette.navy800,
    fontWeight: '700',
  },
  shareQuickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  shareOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    backgroundColor: palette.white,
  },
  shareOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.navy800,
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
  btnOutlineCancel: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: spacing.sm, 
    paddingVertical: 14, 
    borderRadius: borderRadius.md, 
    borderWidth: 1.5, 
    borderColor: palette.rose600, 
    backgroundColor: palette.white 
  },
  btnOutlineCancelText: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: palette.rose600 
  },
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
  // Finance styles
  financeInfo: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  financeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  financeLabel: {
    fontSize: 11,
    color: palette.slate400,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  financeValue: {
    fontSize: 14,
    color: palette.slate700,
    fontWeight: '800',
    marginTop: 2,
  },
  financeEmpty: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  financeEmptyText: {
    fontSize: 13,
    color: palette.slate400,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
  },
  paymentMethodButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    backgroundColor: palette.white,
  },
  paymentMethodButtonSelected: {
    borderColor: palette.navy800,
    backgroundColor: palette.navy800,
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.slate700,
  },
  paymentMethodTextSelected: {
    color: palette.white,
  },
  paymentStatusButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    backgroundColor: palette.white,
  },
  paymentStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.slate700,
  },
  paymentStatusTextSelected: {
    color: palette.white,
    fontWeight: '800',
  },
});
