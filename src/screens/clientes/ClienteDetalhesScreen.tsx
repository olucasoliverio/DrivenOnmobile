import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';
import dayjs from 'dayjs';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import { sendWelcomeMessage, sendWhatsAppMessage, sendOSCompletedMessage, sendEstimateMessage } from '../../services/whatsappService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { Portal, Dialog, Button, TextInput } from 'react-native-paper';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  em_andamento:    { label: 'Em Andamento', color: palette.navy800,    bg: 'rgba(37, 99, 235, 0.08)' },
  aguardando:      { label: 'Aguardando',   color: '#C2410C',          bg: '#FFF7ED' },
  aguardando_pecas:{ label: 'Aguard. Peças',color: palette.violet600,  bg: '#F5F3FF' },
  concluido:       { label: 'Concluído',    color: palette.emerald600, bg: '#ECFDF5' },
};

const AVATAR_COLORS = [
  [palette.navy800, palette.navy600],
  ['#8B5CF6', '#A78BFA'],
  ['#10B981', '#34D399'],
] as [string, string][];

const editFields: CrudField[] = [
  { key: 'nome', label: 'Nome', autoCapitalize: 'words' },
  { key: 'telefone', label: 'Telefone', keyboardType: 'phone-pad' },
  { key: 'email', label: 'E-mail', keyboardType: 'email-address', autoCapitalize: 'none' },
  { key: 'observacoes', label: 'Observações', multiline: true },
];

export default function ClienteDetalhesScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { clienteId } = route.params ?? { clienteId: 1 };
  const { clientes, veiculos: veiculosData, ordens: ordensData, pagamentos, orcamentos: orcamentosData, configuracoes, updateRecord } = useDriveOnData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  // WhatsApp Dialog States
  const [isWhatsAppDialogVisible, setIsWhatsAppDialogVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'welcome' | 'estimate' | 'completed' | 'preventive_review' | 'satisfaction_survey' | 'payment_reminder'>('welcome');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null); // OS or Estimate ID
  const [activePickerKey, setActivePickerKey] = useState<'template' | 'estimate' | 'os' | 'veiculo' | 'payment' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [whatsappPreview, setWhatsappPreview] = useState('');
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const cliente = clientes.find(c => c.id === clienteId) ?? clientes[0];
  const veiculos = cliente ? veiculosData.filter(v => v.clienteId === cliente.id) : [];
  const ordens = cliente ? ordensData.filter(o => o.clienteId === cliente.id) : [];
  const pagamentosCliente = cliente ? pagamentos.filter(p => p.clienteId === cliente.id) : [];
  const totalGasto = pagamentosCliente.filter(p => p.status === 'pago').reduce((acc, p) => acc + p.valor, 0);
  const avatarColors = AVATAR_COLORS[clienteId % AVATAR_COLORS.length];

  const orcamentos = cliente ? orcamentosData.filter(o => o.clienteId === cliente.id) : [];

  const handleTemplateChange = (template: 'welcome' | 'estimate' | 'completed' | 'preventive_review' | 'satisfaction_survey' | 'payment_reminder') => {
    setSelectedTemplate(template);
    setSelectedItemId(null);
  };

  const getSelectedTemplateLabel = () => {
    if (selectedTemplate === 'welcome') return 'Boas-vindas';
    if (selectedTemplate === 'estimate') return 'Orçamento';
    if (selectedTemplate === 'completed') return 'Manutenção Pronta';
    if (selectedTemplate === 'preventive_review') return 'Revisão Preventiva';
    if (selectedTemplate === 'satisfaction_survey') return 'Pesquisa de Satisfação';
    if (selectedTemplate === 'payment_reminder') return 'Lembrete de Cobrança';
    return 'Selecione...';
  };

  const getSelectedItemLabel = () => {
    if (!selectedItemId) return 'Toque para selecionar...';
    const id = Number(selectedItemId);
    if (selectedTemplate === 'estimate') {
      const o = orcamentos.find(item => item.id === id);
      return o ? `Orçamento #${String(o.id).padStart(3, '0')} - R$ ${o.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `Orçamento #${id}`;
    }
    if (selectedTemplate === 'completed') {
      const o = ordens.find(item => item.id === id);
      return o ? `OS #${String(o.id).padStart(3, '0')} - R$ ${o.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `OS #${id}`;
    }
    if (selectedTemplate === 'preventive_review' || selectedTemplate === 'satisfaction_survey') {
      const v = veiculos.find(item => item.id === id);
      return v ? `${v.marca} ${v.modelo} (${v.placa})` : `Veículo #${id}`;
    }
    if (selectedTemplate === 'payment_reminder') {
      const p = pagamentosCliente.find(item => item.id === id);
      return p ? `Cobrança #${p.id} - R$ ${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `Pagamento #${id}`;
    }
    return 'Toque para selecionar...';
  };

  React.useEffect(() => {
    if (!cliente) return;
    const nomeOficina = configuracoes?.nomeOficina || 'nossa oficina';
    const pagamentosPendentes = pagamentosCliente.filter(p => p.status === 'pendente');
    if (selectedTemplate === 'welcome') {
      setWhatsappPreview(`Olá, *${cliente.nome}*! É um prazer ter você como cliente da *${nomeOficina}*. Seu cadastro foi realizado com sucesso! 🚗💨\n\nQualquer dúvida, estamos sempre à disposição.`);
    } else if (selectedTemplate === 'estimate') {
      if (!selectedItemId) {
        setWhatsappPreview('Selecione um orçamento para visualizar a prévia da mensagem...');
        return;
      }
      const o = orcamentos.find(item => item.id === Number(selectedItemId));
      if (!o) {
        setWhatsappPreview('Orçamento não encontrado.');
        return;
      }
      const v = veiculosData.find(item => item.id === o.veiculoId);
      const veiculoNome = v ? `${v.marca} ${v.modelo}` : 'Veículo';
      const formattedValor = o.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const desc = o.itens.map(i => i.descricao).join(', ') || 'Serviços';
      setWhatsappPreview(`Olá, *${cliente.nome}*! Segue o orçamento da *OS #${String(o.id).padStart(3, '0')}* da *${nomeOficina}* para o seu veículo *${veiculoNome}*:\n\n*Descrição:* ${desc}\n\n*Valor Estimado:* R$ ${formattedValor}\n\n📋 Aguardamos a sua aprovação para darmos início aos serviços. Ficamos no aguardo!`);
    } else if (selectedTemplate === 'completed') {
      if (!selectedItemId) {
        setWhatsappPreview('Selecione uma ordem de serviço para visualizar a prévia da mensagem...');
        return;
      }
      const o = ordens.find(item => item.id === Number(selectedItemId));
      if (!o) {
        setWhatsappPreview('Ordem de serviço não encontrada.');
        return;
      }
      const v = veiculosData.find(item => item.id === o.veiculoId);
      const veiculoNome = v ? `${v.marca} ${v.modelo}` : 'Veículo';
      const formattedValor = o.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      setWhatsappPreview(`Olá, *${cliente.nome}*! Passando para avisar que a manutenção do seu veículo *${veiculoNome}* (placa *${v?.placa ?? '—'}*) na *${nomeOficina}* ficou pronta! 🛠️🚗\n\nO valor total do serviço ficou em *R$ ${formattedValor}*.\n\nVocê já pode vir retirá-lo. Qualquer dúvida estamos à disposição!`);
    } else if (selectedTemplate === 'preventive_review') {
      if (!selectedItemId) {
        setWhatsappPreview('Selecione um veículo para visualizar a prévia da mensagem...');
        return;
      }
      const v = veiculos.find(item => item.id === Number(selectedItemId));
      if (!v) {
        setWhatsappPreview('Veículo não encontrado.');
        return;
      }
      const veiculoNome = `${v.marca} ${v.modelo}`;
      setWhatsappPreview(`Olá, *${cliente.nome}*! Faz um tempo que não fazemos uma revisão no seu veículo *${veiculoNome}* (placa *${v.placa}*).\n\nQue tal agendar uma revisão preventiva na *${nomeOficina}*? 🚗🔧\n\nA manutenção preventiva evita surpresas indesejadas e garante a sua segurança nas ruas. Vamos agendar um horário?`);
    } else if (selectedTemplate === 'satisfaction_survey') {
      if (!selectedItemId) {
        setWhatsappPreview('Selecione um veículo para visualizar a prévia da mensagem...');
        return;
      }
      const v = veiculos.find(item => item.id === Number(selectedItemId));
      if (!v) {
        setWhatsappPreview('Veículo não encontrado.');
        return;
      }
      const veiculoNome = `${v.marca} ${v.modelo}`;
      setWhatsappPreview(`Olá, *${cliente.nome}*! Agradecemos muito a confiança no trabalho da *${nomeOficina}*.\n\nO que você achou do serviço realizado recentemente no seu veículo *${veiculoNome}*? Sua opinião é fundamental para continuarmos melhorando! ⭐⭐⭐⭐⭐`);
    } else if (selectedTemplate === 'payment_reminder') {
      if (!selectedItemId) {
        setWhatsappPreview('Selecione um pagamento pendente para visualizar a prévia da mensagem...');
        return;
      }
      const p = pagamentosPendentes.find(item => item.id === Number(selectedItemId));
      if (!p) {
        setWhatsappPreview('Pagamento não encontrado.');
        return;
      }
      const o = ordensData.find(item => item.id === p.ordemId);
      const v = o ? veiculosData.find(item => item.id === o.veiculoId) : undefined;
      const veiculoNome = v ? ` referente ao veículo *${v.marca} ${v.modelo}*` : '';
      const formattedValor = p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const dataVenc = dayjs(p.data).format('DD/MM/YYYY');
      setWhatsappPreview(`Olá, *${cliente.nome}*! Passando para lembrar sobre o pagamento pendente na *${nomeOficina}*${veiculoNome} no valor de *R$ ${formattedValor}* com vencimento em *${dataVenc}*.\n\nCaso já tenha efetuado o pagamento, por favor desconsidere esta mensagem. Qualquer dúvida estamos à disposição!`);
    }
  }, [isWhatsAppDialogVisible, selectedTemplate, selectedItemId, cliente, orcamentos, ordens, veiculos, veiculosData, ordensData, pagamentosCliente, configuracoes]);

  if (!cliente) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Cliente não encontrado.</Text>
      </View>
    );
  }

  const openEdit = () => {
    setForm({
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email,
      observacoes: '',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.nome?.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome do cliente.');
      return;
    }
    setSaving(true);
    try {
      await updateRecord('/clientes', cliente.id, {
        nome: form.nome.trim(),
        telefone: form.telefone?.trim() || null,
        email: form.email?.trim() || null,
        observacoes: form.observacoes?.trim() || null,
      });
      setDialogOpen(false);
    } catch (error: any) {
      Alert.alert('Não foi possível salvar', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate100 }}>
      <ScreenHeader 
        title="Detalhes do Cliente" 
        showBack={true} 
        rightElement={
          <TouchableOpacity
            onPress={openEdit}
            style={styles.headerEditBtn}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={20} color={palette.navy800} />
          </TouchableOpacity>
        }
      />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }} 
        showsVerticalScrollIndicator={false}
      >
      {/* ── Perfil do cliente Redesenhado ── */}
      <View style={styles.profileCard}>
        <LinearGradient colors={avatarColors} style={styles.avatar}>
          <Text style={styles.avatarText}>{cliente.nome.substring(0, 2).toUpperCase()}</Text>
        </LinearGradient>
        <Text style={styles.nome}>{cliente.nome}</Text>
        <Text style={styles.cpf}>{cliente.cpf}</Text>

        {/* Estatísticas resumidas em cápsula elegante */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{veiculos.length}</Text>
            <Text style={styles.statLabel}>Veículos</Text>
          </View>
          <View style={[styles.statBox, styles.statDivider]}>
            <Text style={styles.statNum}>{ordens.length}</Text>
            <Text style={styles.statLabel}>O.S.</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>R$ {(totalGasto / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLabel}>Total Gasto</Text>
          </View>
        </View>
      </View>

      {/* ── Contatos com Caixas de Ícone Suaves ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="contacts" size={18} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Contato</Text>
        </View>
        {[
          { icon: 'phone' as const,       label: 'Telefone',  value: cliente.telefone || 'Não informado' },
          { icon: 'email' as const,       label: 'E-mail',    value: cliente.email || 'Não informado' },
          { icon: 'location-on' as const, label: 'Endereço',  value: cliente.endereco ? `${cliente.endereco}, ${cliente.cidade}` : 'Não informado' },
        ].map(item => (
          <View key={item.label} style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <MaterialIcons name={item.icon} size={16} color={palette.navy700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
            {item.label === 'Telefone' && cliente.telefone && (
              <TouchableOpacity
                onPress={() => setIsWhatsAppDialogVisible(true)}
                style={styles.whatsAppIconButton}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="whatsapp" size={18} color={palette.white} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* ── Veículos Redesenhados ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="directions-car" size={18} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Veículos ({veiculos.length})</Text>
        </View>
        {veiculos.map(v => (
          <TouchableOpacity
            key={v.id}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Veiculos', { detectedPlate: v.placa })}
          >
            <View style={styles.veiculoCard}>
              <View style={styles.veiculoIconBox}>
                <MaterialIcons name="directions-car" size={18} color={palette.navy700} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.veiculoNome}>{v.marca} {v.modelo} {v.ano}</Text>
                <Text style={styles.veiculoInfo}>{v.placa} · {v.cor} · {v.km.toLocaleString()} km</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={palette.slate300} />
            </View>
          </TouchableOpacity>
        ))}
        {veiculos.length === 0 && (
          <Text style={styles.emptyText}>Nenhum veículo cadastrado</Text>
        )}
      </View>

      {/* ── Histórico de Ordens de Serviço Redesenhado ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="build" size={18} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Histórico de OS ({ordens.length})</Text>
        </View>
        {ordens.map((os, idx) => {
          const st = STATUS_MAP[os.status];
          return (
            <TouchableOpacity
              key={os.id}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('OSDetalhes', { osId: os.id })}
            >
              <View style={[styles.osRow, idx < ordens.length - 1 && styles.osRowBorder]}>
                <View style={styles.osNumBox}>
                  <Text style={styles.osNum}>#{String(os.id).padStart(3, '0')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.osDesc} numberOfLines={1}>{os.descricao}</Text>
                  <Text style={styles.osData}>{dayjs(os.dataEntrada).format('DD/MM/YYYY')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={[styles.statusBadge, { backgroundColor: st?.bg ?? palette.slate100 }]}>
                    <Text style={[styles.statusBadgeText, { color: st?.color ?? palette.slate500 }]}>{st?.label}</Text>
                  </View>
                  <Text style={styles.osValor}>R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={palette.slate300} style={{ marginLeft: spacing.xs }} />
              </View>
            </TouchableOpacity>
          );
        })}
        {ordens.length === 0 && (
          <Text style={styles.emptyText}>Nenhuma ordem de serviço</Text>
        )}
      </View>

      {/* ── Botões de Ações Redesenhados ── */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.85} onPress={() => navigation.navigate('OS')}>
          <LinearGradient colors={gradients.navyPrimary} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <MaterialIcons name="build" size={18} color={palette.white} />
            <Text style={styles.btnPrimaryText}>Nova OS</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <CrudDialog visible={dialogOpen} title="Editar cliente" fields={editFields} values={form} isSaving={saving} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} onCancel={() => setDialogOpen(false)} onSave={save} />

      {/* ── WhatsApp Custom Dialog Style CRUD ── */}
      {isWhatsAppDialogVisible && (
        <Portal>
          <Dialog
            visible={isWhatsAppDialogVisible}
            onDismiss={() => setIsWhatsAppDialogVisible(false)}
            dismissable={false}
            dismissableBackButton={true}
            style={styles.dialog}
          >
            {/* Header */}
            <View style={styles.dialogHeader}>
              <View style={styles.dialogIconCircle}>
                <MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />
              </View>
              <Text style={styles.dialogHeaderTitle}>Enviar WhatsApp</Text>
            </View>

            {/* Scrollable Form */}
            <ScrollView style={styles.dialogScrollView} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
              
              {/* Select Template Field */}
              <TouchableOpacity
                onPress={() => {
                  setActivePickerKey('template');
                  setSearchQuery('');
                }}
                activeOpacity={0.7}
                style={styles.dialogSelectWrapper}
              >
                <View pointerEvents="none">
                  <TextInput
                    label="Modelo de Mensagem"
                    value={getSelectedTemplateLabel()}
                    mode="outlined"
                    style={styles.dialogInput}
                    activeOutlineColor={palette.navy800}
                    outlineColor={palette.slate200}
                    outlineStyle={{ borderRadius: borderRadius.md }}
                    theme={{ colors: { background: palette.slate50 } }}
                    left={<TextInput.Icon icon="message-text-outline" color={palette.slate400} />}
                    right={<TextInput.Icon icon="chevron-down" color={palette.slate400} />}
                  />
                </View>
              </TouchableOpacity>

              {/* Conditional Orçamento Selector */}
              {selectedTemplate === 'estimate' && (
                <TouchableOpacity
                  onPress={() => {
                    setActivePickerKey('estimate');
                    setSearchQuery('');
                  }}
                  activeOpacity={0.7}
                  style={styles.dialogSelectWrapper}
                >
                  <View pointerEvents="none">
                    <TextInput
                      label="Selecionar Orçamento"
                      value={getSelectedItemLabel()}
                      mode="outlined"
                      style={styles.dialogInput}
                      activeOutlineColor={palette.navy800}
                      outlineColor={palette.slate200}
                      outlineStyle={{ borderRadius: borderRadius.md }}
                      theme={{ colors: { background: palette.slate50 } }}
                      left={<TextInput.Icon icon="description" color={palette.slate400} />}
                      right={<TextInput.Icon icon="chevron-down" color={palette.slate400} />}
                    />
                  </View>
                </TouchableOpacity>
              )}

              {/* Conditional OS Selector */}
              {selectedTemplate === 'completed' && (
                <TouchableOpacity
                  onPress={() => {
                    setActivePickerKey('os');
                    setSearchQuery('');
                  }}
                  activeOpacity={0.7}
                  style={styles.dialogSelectWrapper}
                >
                  <View pointerEvents="none">
                    <TextInput
                      label="Selecionar Ordem de Serviço"
                      value={getSelectedItemLabel()}
                      mode="outlined"
                      style={styles.dialogInput}
                      activeOutlineColor={palette.navy800}
                      outlineColor={palette.slate200}
                      outlineStyle={{ borderRadius: borderRadius.md }}
                      theme={{ colors: { background: palette.slate50 } }}
                      left={<TextInput.Icon icon="wrench-outline" color={palette.slate400} />}
                      right={<TextInput.Icon icon="chevron-down" color={palette.slate400} />}
                    />
                  </View>
                </TouchableOpacity>
              )}

              {/* Conditional Veículo Selector for Preventive Review or Satisfaction Survey */}
              {(selectedTemplate === 'preventive_review' || selectedTemplate === 'satisfaction_survey') && (
                <TouchableOpacity
                  onPress={() => {
                    setActivePickerKey('veiculo');
                    setSearchQuery('');
                  }}
                  activeOpacity={0.7}
                  style={styles.dialogSelectWrapper}
                >
                  <View pointerEvents="none">
                    <TextInput
                      label="Selecionar Veículo"
                      value={getSelectedItemLabel()}
                      mode="outlined"
                      style={styles.dialogInput}
                      activeOutlineColor={palette.navy800}
                      outlineColor={palette.slate200}
                      outlineStyle={{ borderRadius: borderRadius.md }}
                      theme={{ colors: { background: palette.slate50 } }}
                      left={<TextInput.Icon icon="car" color={palette.slate400} />}
                      right={<TextInput.Icon icon="chevron-down" color={palette.slate400} />}
                    />
                  </View>
                </TouchableOpacity>
              )}

              {/* Conditional Pagamento Selector */}
              {selectedTemplate === 'payment_reminder' && (
                <TouchableOpacity
                  onPress={() => {
                    setActivePickerKey('payment');
                    setSearchQuery('');
                  }}
                  activeOpacity={0.7}
                  style={styles.dialogSelectWrapper}
                >
                  <View pointerEvents="none">
                    <TextInput
                      label="Selecionar Cobrança Pendente"
                      value={getSelectedItemLabel()}
                      mode="outlined"
                      style={styles.dialogInput}
                      activeOutlineColor={palette.navy800}
                      outlineColor={palette.slate200}
                      outlineStyle={{ borderRadius: borderRadius.md }}
                      theme={{ colors: { background: palette.slate50 } }}
                      left={<TextInput.Icon icon="cash" color={palette.slate400} />}
                      right={<TextInput.Icon icon="chevron-down" color={palette.slate400} />}
                    />
                  </View>
                </TouchableOpacity>
              )}

              {/* Preview Box with label and ScrollView */}
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
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.dialogActions}>
              <Button
                mode="outlined"
                onPress={() => setIsWhatsAppDialogVisible(false)}
                style={styles.dialogCancelBtn}
                textColor={palette.navy800}
                labelStyle={styles.dialogBtnLabel}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                disabled={
                  (selectedTemplate === 'estimate' && !selectedItemId) ||
                  (selectedTemplate === 'completed' && !selectedItemId) ||
                  ((selectedTemplate === 'preventive_review' || selectedTemplate === 'satisfaction_survey') && !selectedItemId) ||
                  (selectedTemplate === 'payment_reminder' && !selectedItemId)
                }
                onPress={async () => {
                  setIsWhatsAppDialogVisible(false);
                  if (cliente && cliente.telefone) {
                    const success = await sendWhatsAppMessage(cliente.telefone, whatsappPreview);
                    if (success) {
                      setIsSuccessModalVisible(true);
                    }
                  }
                }}
                style={styles.dialogSaveBtn}
                buttonColor={palette.navy800}
                textColor={palette.white}
                labelStyle={styles.dialogBtnLabel}
              >
                Enviar
              </Button>
            </View>
          </Dialog>
        </Portal>
      )}

      {/* Sub-picker Modal dialogs */}
      {activePickerKey && (
        <Portal>
          <Dialog
            visible={true}
            onDismiss={() => setActivePickerKey(null)}
            style={styles.dialogPicker}
          >
            <Dialog.Title style={styles.dialogPickerTitle}>
              {activePickerKey === 'template'
                ? 'Selecione o Modelo'
                : activePickerKey === 'estimate'
                ? 'Selecione o Orçamento'
                : activePickerKey === 'os'
                ? 'Selecione a OS'
                : activePickerKey === 'veiculo'
                ? 'Selecione o Veículo'
                : 'Selecione a Cobrança'}
            </Dialog.Title>

            {/* Search Input for Estimates/OS if lists are long */}
            {activePickerKey !== 'template' && (
              <View style={styles.dialogPickerSearchContainer}>
                <TextInput
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  mode="outlined"
                  dense={true}
                  style={styles.dialogPickerSearchInput}
                  activeOutlineColor={palette.navy800}
                  outlineStyle={{ borderRadius: borderRadius.sm }}
                  left={<TextInput.Icon icon="magnify" color={palette.slate400} />}
                />
              </View>
            )}

            <Dialog.ScrollArea style={styles.dialogPickerScrollArea}>
              <FlatList
                data={
                  activePickerKey === 'template'
                    ? [
                        { id: 'welcome', title: 'Boas-vindas', subtitle: 'Mensagem inicial para novos clientes' },
                        { id: 'estimate', title: 'Orçamento', subtitle: 'Detalhamento e aprovação de serviços' },
                        { id: 'completed', title: 'Manutenção Pronta', subtitle: 'Aviso de conclusão e retirada' },
                        { id: 'preventive_review', title: 'Revisão Preventiva', subtitle: 'Lembrete de manutenção periódica' },
                        { id: 'satisfaction_survey', title: 'Pesquisa de Satisfação', subtitle: 'Solicitação de avaliação do serviço' },
                        { id: 'payment_reminder', title: 'Lembrete de Cobrança', subtitle: 'Aviso de fatura/pagamento em aberto' },
                      ]
                    : activePickerKey === 'estimate'
                    ? orcamentos
                        .filter(item => {
                          const label = `Orçamento #${item.id}`;
                          return label.toLowerCase().includes(searchQuery.toLowerCase());
                        })
                        .map(o => ({
                          id: String(o.id),
                          title: `Orçamento #${String(o.id).padStart(3, '0')}`,
                          subtitle: `Valor: R$ ${o.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        }))
                    : activePickerKey === 'os'
                    ? ordens
                        .filter(item => {
                          const label = `OS #${item.id} ${item.descricao}`;
                          return label.toLowerCase().includes(searchQuery.toLowerCase());
                        })
                        .map(osItem => ({
                          id: String(osItem.id),
                          title: `OS #${String(osItem.id).padStart(3, '0')} - ${osItem.descricao}`,
                          subtitle: `Valor: R$ ${osItem.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        }))
                    : activePickerKey === 'veiculo'
                    ? veiculos
                        .filter(item => {
                          const label = `${item.marca} ${item.modelo} ${item.placa}`;
                          return label.toLowerCase().includes(searchQuery.toLowerCase());
                        })
                        .map(v => ({
                          id: String(v.id),
                          title: `${v.marca} ${v.modelo}`,
                          subtitle: `Placa: ${v.placa} · Ano: ${v.ano}`,
                        }))
                    : pagamentosCliente
                        .filter(p => p.status === 'pendente')
                        .filter(item => {
                          const label = `Cobrança #${item.id} R$ ${item.valor}`;
                          return label.toLowerCase().includes(searchQuery.toLowerCase());
                        })
                        .map(p => ({
                          id: String(p.id),
                          title: `Cobrança #${p.id} - R$ ${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                          subtitle: `Vencimento: ${dayjs(p.data).format('DD/MM/YYYY')}`,
                        }))
                }
                keyExtractor={item => item.id}
                style={styles.dialogPickerFlatList}
                contentContainerStyle={styles.dialogPickerListContent}
                renderItem={({ item }) => {
                  const isSelected =
                    activePickerKey === 'template'
                      ? selectedTemplate === item.id
                      : selectedItemId === item.id;
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        if (activePickerKey === 'template') {
                          handleTemplateChange(item.id as any);
                        } else {
                          setSelectedItemId(item.id);
                        }
                        setActivePickerKey(null);
                      }}
                      activeOpacity={0.7}
                      style={[
                        styles.dialogPickerItem,
                        isSelected && styles.dialogPickerItemActive,
                      ]}
                    >
                      <View style={styles.dialogPickerItemContent}>
                        <Text
                          style={[
                            styles.dialogPickerItemText,
                            isSelected && styles.dialogPickerItemTextActive,
                          ]}
                        >
                          {item.title}
                        </Text>
                        {item.subtitle ? (
                          <Text style={styles.dialogPickerItemSub}>{item.subtitle}</Text>
                        ) : null}
                      </View>
                      {isSelected && (
                        <MaterialIcons name="check-circle" size={20} color={palette.navy800} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </Dialog.ScrollArea>

            <Dialog.Actions style={styles.dialogPickerActions}>
              <Button onPress={() => setActivePickerKey(null)} textColor={palette.navy800}>
                Voltar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}

      {/* ── Success Dialog Modal ── */}
      <Modal
        visible={isSuccessModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setIsSuccessModalVisible(false)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialogContent}>
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
          </View>
        </View>
      </Modal>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },

  emptyText: { fontSize: 14, color: palette.slate400, fontStyle: 'italic', textAlign: 'center', marginTop: 40 },

  // Profile card
  profileCard: { 
    margin: spacing.lg, 
    backgroundColor: palette.white, 
    borderRadius: borderRadius.lg, 
    padding: spacing.lg, 
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.md 
  },
  avatar: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  avatarText: { color: palette.white, fontWeight: '900', fontSize: 24 },
  nome: { fontSize: 22, fontWeight: '900', color: palette.slate900, marginBottom: 4, letterSpacing: -0.3 },
  cpf: { fontSize: 13, color: palette.slate400, fontWeight: '600', marginBottom: spacing.md },
  statsRow: { 
    flexDirection: 'row', 
    width: '100%', 
    backgroundColor: palette.slate50, 
    borderRadius: borderRadius.md, 
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.02)',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: palette.slate200 },
  statNum: { fontSize: 18, fontWeight: '900', color: palette.navy800 },
  statLabel: { fontSize: 11, color: palette.slate500, fontWeight: '700', marginTop: 2 },

  // Sections
  section: { 
    marginHorizontal: spacing.lg, 
    marginBottom: spacing.sm, 
    backgroundColor: palette.white, 
    borderRadius: borderRadius.lg, 
    padding: spacing.md, 
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.sm 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.sm, 
    marginBottom: spacing.md, 
    paddingBottom: spacing.sm, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(15, 23, 42, 0.04)' 
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: palette.slate900, letterSpacing: -0.2 },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  infoIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(37, 99, 235, 0.05)', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: palette.slate400, fontWeight: '700', marginBottom: 1 },
  infoValue: { fontSize: 14, color: palette.slate900, fontWeight: '600' },
  whatsAppIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    ...shadows.sm,
  },

  // Veículos
  veiculoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(15, 23, 42, 0.04)' },
  veiculoIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(37, 99, 235, 0.05)', justifyContent: 'center', alignItems: 'center' },
  veiculoNome: { fontSize: 14, fontWeight: '700', color: palette.slate900 },
  veiculoInfo: { fontSize: 12, color: palette.slate500, fontWeight: '500', marginTop: 2 },

  // OS rows
  osRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  osRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(15, 23, 42, 0.04)' },
  osNumBox: { backgroundColor: 'rgba(37, 99, 235, 0.05)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  osNum: { fontSize: 11, fontWeight: '800', color: palette.navy800 },
  osDesc: { fontSize: 14, fontWeight: '700', color: palette.slate900 },
  osData: { fontSize: 11, color: palette.slate400, fontWeight: '500', marginTop: 2 },
  statusBadge: { borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  osValor: { fontSize: 13, fontWeight: '800', color: palette.slate700 },

  // Actions
  actions: { marginHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.md },
  btnPrimary: { borderRadius: borderRadius.md, overflow: 'hidden', ...shadows.sm },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 14 },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: palette.white },
  btnOutline: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: spacing.sm, 
    paddingVertical: 14, 
    borderRadius: borderRadius.md, 
    borderWidth: 1.5, 
    borderColor: palette.navy800, 
    backgroundColor: palette.white 
  },
  btnOutlineText: { fontSize: 15, fontWeight: '700', color: palette.navy800 },

  // Estilos para o Dialog de WhatsApp (CRUD style)
  dialog: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  dialogIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.slate900,
    flex: 1,
  },
  dialogScrollView: {
    maxHeight: 580,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dialogInput: {
    marginBottom: spacing.md,
    fontSize: 14,
  },
  dialogSelectWrapper: {
    position: 'relative',
  },
  dialogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  dialogCancelBtn: {
    borderRadius: borderRadius.full,
    borderColor: palette.slate200,
    borderWidth: 1,
  },
  dialogSaveBtn: {
    borderRadius: borderRadius.full,
    minWidth: 100,
  },
  dialogBtnLabel: {
    fontWeight: '700',
    fontSize: 14,
  },

  // Estilos para o Dialog Picker
  dialogPicker: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    maxHeight: '80%',
  },
  dialogPickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.slate900,
    textAlign: 'center',
    paddingTop: spacing.md,
  },
  dialogPickerSearchContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  dialogPickerSearchInput: {
    fontSize: 14,
    height: 48,
  },
  dialogPickerScrollArea: {
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.slate100,
  },
  dialogPickerFlatList: {
    maxHeight: 450,
  },
  dialogPickerListContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  dialogPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF2',
  },
  dialogPickerItemActive: {
    backgroundColor: '#F8FAFC',
  },
  dialogPickerItemContent: {
    flex: 1,
  },
  dialogPickerItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.slate900,
  },
  dialogPickerItemTextActive: {
    color: palette.navy800,
    fontWeight: '700',
  },
  dialogPickerItemSub: {
    fontSize: 11,
    color: palette.slate500,
    marginTop: 2,
  },
  dialogPickerActions: {
    paddingHorizontal: spacing.md,
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
    minHeight: 160,
    maxHeight: 240,
    marginBottom: spacing.md,
  },
  previewText: {
    fontSize: 14,
    color: palette.slate700,
    lineHeight: 20,
    fontWeight: '500',
  },
  headerEditBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.slate100,
    justifyContent: 'center',
    alignItems: 'center',
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
});
