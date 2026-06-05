import api, { API_BASE_URL, getAuthToken } from '../api/api';

type ShareTarget = 'ordens' | 'orcamentos';

export async function createTrackingLink(target: ShareTarget, id: number): Promise<string> {
  const response = await api.post(`/${target}/${id}/share`);
  const code = response.data?.code;
  if (!code) throw new Error('Não foi possível gerar o link de acompanhamento.');
  return `${API_BASE_URL}/s/${code}`;
}

export function getFallbackDocumentLink(target: ShareTarget, id: number): string {
  const token = getAuthToken();
  return `${API_BASE_URL}/${target}/${id}/pdf${token ? `?token=${token}` : ''}`;
}

export function resolveTrackingLink(target: ShareTarget, id: number, shortUrl?: string): string {
  return shortUrl || getFallbackDocumentLink(target, id);
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

type OSMessageInput = {
  clienteNome: string;
  oficinaNome: string;
  veiculoNome: string;
  placa: string;
  osId: number;
  status: string;
  statusLabel: string;
  descricao: string;
  valor: number;
  link: string;
};

export function buildOSTrackingMessage(input: OSMessageInput): string {
  const osNum = String(input.osId).padStart(3, '0');
  const valor = formatCurrency(input.valor);
  const header = `Olá, *${input.clienteNome}*!`;
  const vehicle = `veículo *${input.veiculoNome}* (placa *${input.placa}*)`;

  if (input.status === 'aguardando') {
    return `${header} A OS #${osNum} do seu ${vehicle} está aguardando aprovação na *${input.oficinaNome}*.\n\n*Descrição:* ${input.descricao}\n*Valor estimado:* R$ ${valor}\n\nAcompanhe os detalhes pelo link:\n${input.link}\n\nAssim que confirmarmos os próximos passos, seguimos com o serviço.`;
  }

  if (input.status === 'em_andamento') {
    return `${header} A manutenção do seu ${vehicle} já está em andamento na *${input.oficinaNome}*.\n\nAcompanhe a OS #${osNum} pelo link:\n${input.link}\n\nQualquer novidade importante, vamos te avisar por aqui.`;
  }

  if (input.status === 'aguardando_pecas') {
    return `${header} A OS #${osNum} do seu ${vehicle} está aguardando peças na *${input.oficinaNome}*.\n\nAcompanhe os detalhes pelo link:\n${input.link}\n\nAssim que as peças chegarem, damos continuidade ao serviço.`;
  }

  if (input.status === 'concluido') {
    return `${header} A manutenção do seu ${vehicle} ficou pronta na *${input.oficinaNome}*.\n\n*Total:* R$ ${valor}\n\nVeja o detalhamento da OS #${osNum} pelo link:\n${input.link}\n\nVocê já pode combinar a retirada conosco.`;
  }

  return `${header} Temos uma atualização da OS #${osNum} do seu ${vehicle} na *${input.oficinaNome}*.\n\n*Status atual:* ${input.statusLabel}\n\nAcompanhe pelo link:\n${input.link}`;
}

type OrcamentoMessageInput = {
  clienteNome: string;
  veiculoNome: string;
  placa: string;
  orcamentoId: number;
  status: string;
  total: number;
  itens: { nome: string; quantidade: number; precoUnitario: number }[];
  link: string;
};

export function buildOrcamentoTrackingMessage(input: OrcamentoMessageInput): string {
  const orcNum = String(input.orcamentoId).padStart(3, '0');
  const total = formatCurrency(input.total);
  const header = `Olá, *${input.clienteNome}*!`;
  const vehicle = `veículo *${input.veiculoNome}* (placa *${input.placa}*)`;

  if (input.status === 'aprovado') {
    return `${header} Confirmamos a aprovação do orçamento ORC #${orcNum} para o seu ${vehicle}.\n\n*Total:* R$ ${total}\n\nAcompanhe os detalhes pelo link:\n${input.link}\n\nLogo damos início aos próximos passos.`;
  }

  if (input.status === 'recusado') {
    return `${header} Registramos o orçamento ORC #${orcNum} do seu ${vehicle} como recusado.\n\nVocê pode consultar o detalhamento pelo link:\n${input.link}\n\nSeguimos à disposição.`;
  }

  const itemsList = input.itens.length
    ? input.itens.map((item) => {
        const subtotal = item.quantidade * item.precoUnitario;
        return `- ${item.nome} (Qtd: ${item.quantidade} - R$ ${formatCurrency(subtotal)})`;
      }).join('\n')
    : 'Sem itens informados';

  return `${header} Segue o orçamento ORC #${orcNum} para o seu ${vehicle}.\n\n*Itens:*\n${itemsList}\n\n*Total:* R$ ${total}\n\nAcompanhe o orçamento pelo link:\n${input.link}\n\nAguardamos sua aprovação para seguir com os serviços.`;
}
