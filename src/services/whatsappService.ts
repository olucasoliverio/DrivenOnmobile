import api from '../api/api';
import { Alert } from 'react-native';

export async function sendWhatsAppMessage(phone: string, text: string): Promise<boolean> {
  if (!phone) {
    Alert.alert('Telefone inválido', 'O cliente não possui um telefone cadastrado.');
    return false;
  }

  try {
    console.log(`[WhatsAppService] Enviando mensagem via API para o telefone: ${phone}`);
    await api.post('/whatsapp/send', {
      phone,
      message: text,
    });
    return true;
  } catch (error: any) {
    console.error('[WhatsAppService] Erro ao enviar mensagem:', error);
    const apiError = error?.response?.data?.message ?? error?.message ?? 'Não foi possível enviar a mensagem.';
    Alert.alert('Falha no envio', `Erro ao disparar mensagem via Evolution API: ${apiError}`);
    return false;
  }
}

/**
 * Envia mensagem de Boas-vindas para o cliente
 */
export async function sendWelcomeMessage(nome: string, phone: string) {
  const text = `Olá, *${nome}*! É um prazer ter você como cliente da nossa oficina. Seu cadastro foi realizado com sucesso! 🚗💨\nQualquer dúvida, estamos sempre à disposição.`;
  const success = await sendWhatsAppMessage(phone, text);
  if (success) {
    Alert.alert('Sucesso', 'Mensagem de boas-vindas enviada com sucesso no WhatsApp!');
  }
}

/**
 * Envia mensagem avisando que a manutenção está concluída
 */
export async function sendOSCompletedMessage(
  nome: string,
  phone: string,
  veiculo: string,
  placa: string,
  valor: number
) {
  const formattedValor = valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const text = `Olá, *${nome}*! Passando para avisar que a manutenção do seu veículo *${veiculo}* (placa *${placa}*) ficou pronta! 🛠️🚗\n\nO valor total do serviço ficou em *R$ ${formattedValor}*.\n\nVocê já pode vir retirá-lo. Qualquer dúvida estamos à disposição!`;
  const success = await sendWhatsAppMessage(phone, text);
  if (success) {
    Alert.alert('Sucesso', 'Notificação de manutenção finalizada enviada com sucesso!');
  }
}

/**
 * Envia o orçamento do serviço para aprovação
 */
export async function sendEstimateMessage(
  nome: string,
  phone: string,
  osId: number | string,
  veiculo: string,
  descricao: string,
  valor: number
) {
  const formattedValor = valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const text = `Olá, *${nome}*! Segue o orçamento da *OS #${String(osId).padStart(3, '0')}* para o seu veículo *${veiculo}*:\n\n*Descrição:* ${descricao}\n*Valor Estimado:* R$ ${formattedValor}\n\n📋 Aguardamos a sua aprovação para darmos início aos serviços. Ficamos no aguardo!`;
  const success = await sendWhatsAppMessage(phone, text);
  if (success) {
    Alert.alert('Sucesso', 'Orçamento enviado com sucesso via WhatsApp!');
  }
}
