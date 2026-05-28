import dayjs from 'dayjs';
import api from '../api/api';
import {
  mockAgendamentos,
  mockClientes,
  mockConfiguracoes,
  mockDashboard,
  mockEstoque,
  mockFornecedores,
  mockOrcamentos,
  mockOrdens,
  mockPagamentos,
  mockServicos,
  mockUsuarios,
  mockVeiculos,
  mockFuncionarios,
} from '../data/mockData';

export type Cliente = {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  cidade: string;
  endereco: string;
};

export type Veiculo = {
  id: number;
  clienteId: number;
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
  cor: string;
  km: number;
};

export type Ordem = {
  id: number;
  clienteId: number;
  veiculoId: number;
  status: string;
  descricao: string;
  dataEntrada: string;
  dataPrevista: string;
  valor: number;
  mecanico: string;
};

export type Agendamento = {
  id: number;
  clienteId: number;
  veiculoId: number;
  data: string;
  hora: string;
  servico: string;
  status: string;
  observacao: string;
};

export type Orcamento = {
  id: number;
  clienteId: number;
  veiculoId: number;
  status: string;
  total: number;
  dataCriacao: string;
  validade: string;
  itens: { descricao: string; qtd: number; valor: number }[];
};

export type Pagamento = {
  id: number;
  clienteId: number | null;
  ordemId: number | null;
  tipo: string;
  descricao: string;
  valor: number;
  data: string;
  status: string;
  formaPagamento: string;
};

export type EstoqueItem = {
  id: number;
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  estoqueMinimo: number;
};

export type Fornecedor = {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  cidade: string;
  categoria: string;
};

export type Servico = {
  id: number;
  nome: string;
  descricao: string;
  valor: number;
  tempoEstimado: string;
  categoria: string;
};

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  telefone: string;
  status: string;
};

export type Funcionario = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
};

export type Configuracoes = {
  nomeOficina: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  logo: string | null;
};
export type Dashboard = typeof mockDashboard;

export type DriveOnData = {
  clientes: Cliente[];
  veiculos: Veiculo[];
  ordens: Ordem[];
  agendamentos: Agendamento[];
  orcamentos: Orcamento[];
  pagamentos: Pagamento[];
  estoque: EstoqueItem[];
  fornecedores: Fornecedor[];
  servicos: Servico[];
  usuarios: Usuario[];
  funcionarios: Funcionario[];
  configuracoes: Configuracoes;
  dashboard: Dashboard;
};

export type ClientePayload = {
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  observacoes?: string;
};

export const fallbackDriveOnData: DriveOnData = {
  clientes: mockClientes,
  veiculos: mockVeiculos,
  ordens: mockOrdens,
  agendamentos: mockAgendamentos,
  orcamentos: mockOrcamentos,
  pagamentos: mockPagamentos,
  estoque: mockEstoque,
  fornecedores: mockFornecedores,
  servicos: mockServicos,
  usuarios: mockUsuarios,
  funcionarios: mockFuncionarios.map(f => ({
    id: f.id,
    nome: f.nome,
    email: f.email,
    telefone: f.telefone,
    cargo: f.cargo,
  })),
  configuracoes: mockConfiguracoes,
  dashboard: mockDashboard,
};

export const emptyDriveOnData: DriveOnData = {
  clientes: [],
  veiculos: [],
  ordens: [],
  agendamentos: [],
  orcamentos: [],
  pagamentos: [],
  estoque: [],
  fornecedores: [],
  servicos: [],
  usuarios: [],
  funcionarios: [],
  configuracoes: {
    nomeOficina: 'DriveOn',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    logo: null,
  },
  dashboard: {
    osAbertas: 0,
    osConcluidas: 0,
    agendamentosHoje: 0,
    receitaMes: 0,
    receitaAnterior: 1,
    clientesAtivos: 0,
    ticketMedio: 0,
    receitaMensal: [],
    statusOS: [],
  },
};

const numberValue = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const textValue = (value: unknown, fallback = '') => {
  if (value == null) return fallback;
  return String(value);
};

const normalizeStatusOS = (status?: string) => {
  if (status === 'aberta') return 'aguardando';
  if (status === 'concluida') return 'concluido';
  if (status === 'cancelada') return 'concluido';
  return status || 'aguardando';
};

const formatTime = (value: unknown) => {
  const parsed = dayjs(String(value));
  return parsed.isValid() ? parsed.format('HH:mm') : '';
};

export function adaptCliente(item: any): Cliente {
  return {
    id: numberValue(item.id),
    nome: textValue(item.nome, 'Cliente sem nome'),
    cpf: textValue(item.cpf, ''),
    telefone: textValue(item.telefone, ''),
    email: textValue(item.email, ''),
    cidade: textValue(item.cidade?.nome ?? item.cidade, ''),
    endereco: textValue(item.endereco ?? item.logradouro ?? item.observacao, ''),
  };
}

export function adaptVeiculo(item: any): Veiculo {
  return {
    id: numberValue(item.id),
    clienteId: numberValue(item.cliente_id ?? item.clienteId),
    marca: textValue(item.marca, ''),
    modelo: textValue(item.modelo, ''),
    ano: numberValue(item.ano),
    placa: textValue(item.placa, ''),
    cor: textValue(item.cor, ''),
    km: numberValue(item.km ?? item.quilometragem),
  };
}

export function adaptOrdem(item: any): Ordem {
  const dataEntrada = textValue(item.data_abertura ?? item.created_at, dayjs().toISOString());
  const dataPrevista = textValue(item.data_fechamento ?? item.updated_at ?? item.data_abertura, dataEntrada);
  return {
    id: numberValue(item.id),
    clienteId: numberValue(item.cliente_id ?? item.clienteId),
    veiculoId: numberValue(item.veiculo_id ?? item.veiculoId),
    status: normalizeStatusOS(item.status),
    descricao: textValue(item.observacoes ?? item.descricao, 'Ordem de servico'),
    dataEntrada,
    dataPrevista,
    valor: numberValue(item.valor_total ?? item.valor),
    mecanico: textValue(item.funcionario?.nome ?? item.mecanico, 'Nao informado'),
  };
}

export function adaptAgendamento(item: any): Agendamento {
  const inicio = textValue(item.data_inicio ?? item.data ?? item.start, dayjs().toISOString());
  return {
    id: numberValue(item.id),
    clienteId: numberValue(item.cliente_id ?? item.clienteId),
    veiculoId: numberValue(item.veiculo_id ?? item.veiculoId),
    data: inicio,
    hora: textValue(item.hora, formatTime(inicio)),
    servico: textValue(item.titulo ?? item.servico, 'Agendamento'),
    status: textValue(item.status, 'pendente'),
    observacao: textValue(item.observacao ?? item.descricao, ''),
  };
}

export function adaptPagamento(item: any): Pagamento {
  return {
    id: numberValue(item.id),
    clienteId: item.cliente_id == null ? null : numberValue(item.cliente_id),
    ordemId: item.ordem_servico_id == null ? null : numberValue(item.ordem_servico_id),
    tipo: textValue(item.tipo, 'receber') as Pagamento['tipo'],
    descricao: textValue(item.descricao, ''),
    valor: numberValue(item.valor),
    data: textValue(item.data_vencimento ?? item.data_pagamento ?? item.created_at, dayjs().toISOString()),
    status: textValue(item.status, 'pendente') as Pagamento['status'],
    formaPagamento: textValue(item.metodo, ''),
  };
}

export function adaptEstoque(item: any): EstoqueItem {
  return {
    id: numberValue(item.id),
    nome: textValue(item.nome, ''),
    categoria: textValue(item.categoria ?? 'Geral'),
    quantidade: numberValue(item.estoque_qtd ?? item.quantidade),
    unidade: textValue(item.unidade, 'un'),
    valorUnitario: numberValue(item.preco_venda ?? item.valorUnitario),
    estoqueMinimo: numberValue(item.estoque_minimo ?? item.estoqueMinimo, 1),
  };
}

export function adaptFornecedor(item: any): Fornecedor {
  return {
    id: numberValue(item.id),
    nome: textValue(item.nome, ''),
    cnpj: textValue(item.cnpj, ''),
    telefone: textValue(item.telefone ?? item.contato, ''),
    email: textValue(item.email, ''),
    cidade: textValue(item.cidade?.nome ?? item.cidade, ''),
    categoria: textValue(item.categoria, 'Geral'),
  };
}

export function adaptServico(item: any): Servico {
  return {
    id: numberValue(item.id),
    nome: textValue(item.nome, ''),
    descricao: textValue(item.descricao, ''),
    valor: numberValue(item.preco ?? item.valor),
    tempoEstimado: textValue(item.tempo_estimado ?? item.tempoEstimado, '-'),
    categoria: textValue(item.categoria, 'Geral'),
  };
}

export function adaptUsuario(item: any): Usuario {
  return {
    id: numberValue(item.id),
    nome: textValue(item.nome, ''),
    email: textValue(item.email, ''),
    perfil: textValue(item.tipo ?? item.perfil, ''),
    telefone: textValue(item.telefone, ''),
    status: textValue(item.status, 'ativo'),
  };
}

export function adaptFuncionario(item: any): Funcionario {
  return {
    id: numberValue(item.id),
    nome: textValue(item.nome, ''),
    email: textValue(item.email, ''),
    telefone: textValue(item.telefone, ''),
    cargo: textValue(item.cargo, ''),
  };
}

export function adaptOrcamento(item: any): Orcamento {
  return {
    id: numberValue(item.id),
    clienteId: numberValue(item.cliente_id ?? item.clienteId),
    veiculoId: numberValue(item.veiculo_id ?? item.veiculoId),
    status: textValue(item.status, 'pendente') as Orcamento['status'],
    total: numberValue(item.valor ?? item.total),
    dataCriacao: textValue(item.data ?? item.created_at, dayjs().toISOString()),
    validade: textValue(item.validade ?? item.data ?? item.created_at, dayjs().add(7, 'day').toISOString()),
    itens: Array.isArray(item.itens) ? item.itens : [],
  };
}

export function adaptConfiguracoes(item: any): Configuracoes {
  return {
    nomeOficina: textValue(item?.nome, 'DriveOn'),
    cnpj: textValue(item?.cnpj, ''),
    telefone: textValue(item?.telefone, ''),
    email: textValue(item?.email, ''),
    endereco: textValue(item ? `${item.logradouro ?? ''}, ${item.numero ?? ''}`.trim().replace(/^,\s*|\s*,\s*$/, '') : '', ''),
    cidade: textValue(item?.cidade?.nome, ''),
    estado: textValue(item?.cidade?.uf, ''),
    cep: textValue(item?.cep, ''),
    logo: item?.logo_url ? textValue(item.logo_url) : null,
  };
}

function buildDashboard(data: Omit<DriveOnData, 'dashboard' | 'configuracoes'>): Dashboard {
  const osAbertas = data.ordens.filter((ordem) => ordem.status !== 'concluido').length;
  const osConcluidas = data.ordens.filter((ordem) => ordem.status === 'concluido').length;
  const receitaMes = data.pagamentos
    .filter((pagamento) => pagamento.tipo === 'receber' && pagamento.status === 'pago' && dayjs(pagamento.data).isSame(dayjs(), 'month'))
    .reduce((sum, pagamento) => sum + pagamento.valor, 0);
  const receitaAnterior = data.pagamentos
    .filter((pagamento) => pagamento.tipo === 'receber' && pagamento.status === 'pago' && dayjs(pagamento.data).isSame(dayjs().subtract(1, 'month'), 'month'))
    .reduce((sum, pagamento) => sum + pagamento.valor, 0);

  const statusCounts = {
    em_andamento: 0,
    aguardando: 0,
    aguardando_pecas: 0,
    concluido: 0,
  };
  data.ordens.forEach(os => {
    const s = os.status as keyof typeof statusCounts;
    if (statusCounts[s] !== undefined) {
      statusCounts[s]++;
    }
  });
  const statusOS = [
    { status: 'Em Andamento', count: statusCounts.em_andamento, color: '#1565C0' },
    { status: 'Aguardando', count: statusCounts.aguardando, color: '#FF6F00' },
    { status: 'Aguard. Peças', count: statusCounts.aguardando_pecas, color: '#9C27B0' },
    { status: 'Concluído', count: statusCounts.concluido, color: '#2E7D32' },
  ];

  const receitaMensal = [];
  for (let i = 5; i >= 0; i--) {
    const targetMonth = dayjs().subtract(i, 'month');
    const label = targetMonth.format('MMM');
    const valor = data.pagamentos
      .filter((pagamento) => 
        pagamento.tipo === 'receber' && 
        pagamento.status === 'pago' && 
        dayjs(pagamento.data).isSame(targetMonth, 'month')
      )
      .reduce((sum, pagamento) => sum + pagamento.valor, 0);
    receitaMensal.push({
      mes: label.charAt(0).toUpperCase() + label.slice(1).replace('.', ''),
      valor,
    });
  }

  return {
    osAbertas,
    osConcluidas,
    agendamentosHoje: data.agendamentos.filter((agendamento) => dayjs(agendamento.data).isSame(dayjs(), 'day')).length,
    receitaMes,
    receitaAnterior: receitaAnterior || receitaMes || 1,
    clientesAtivos: data.clientes.length,
    ticketMedio: osConcluidas ? receitaMes / osConcluidas : 0,
    receitaMensal,
    statusOS,
  };
}

async function getList<T>(path: string, adapter: (item: any) => T): Promise<T[]> {
  const { data } = await api.get(path);
  const list = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
  return list.map(adapter);
}

export async function fetchDriveOnData(): Promise<DriveOnData> {
  const [
    clientesResult,
    veiculosResult,
    ordensResult,
    agendamentosResult,
    orcamentosResult,
    pagamentosResult,
    estoqueResult,
    fornecedoresResult,
    servicosResult,
    usuariosResult,
    funcionariosResult,
    oficinaResult,
  ] = await Promise.allSettled([
    getList('/clientes', adaptCliente),
    getList('/veiculos', adaptVeiculo),
    getList('/ordens', adaptOrdem),
    getList('/agendamentos', adaptAgendamento),
    getList('/orcamentos', adaptOrcamento),
    getList('/pagamentos', adaptPagamento),
    getList('/estoque', adaptEstoque),
    getList('/fornecedores', adaptFornecedor),
    getList('/servicos', adaptServico),
    getList('/usuario', adaptUsuario),
    getList('/funcionarios', adaptFuncionario),
    api.get('/oficinas/minha'),
  ]);

  const valueOrFallback = <T,>(result: PromiseSettledResult<T[]>, fallback: T[]) =>
    result.status === 'fulfilled' ? result.value : fallback;

  const clientes = valueOrFallback(clientesResult, []);
  const veiculos = valueOrFallback(veiculosResult, []);
  const ordens = valueOrFallback(ordensResult, []);
  const agendamentos = valueOrFallback(agendamentosResult, []);
  const orcamentos = valueOrFallback(orcamentosResult, []);
  const pagamentos = valueOrFallback(pagamentosResult, []);
  const estoque = valueOrFallback(estoqueResult, []);
  const fornecedores = valueOrFallback(fornecedoresResult, []);
  const servicos = valueOrFallback(servicosResult, []);
  const usuarios = valueOrFallback(usuariosResult, []);
  const funcionarios = valueOrFallback(funcionariosResult, []);

  const configuracoes = oficinaResult.status === 'fulfilled'
    ? adaptConfiguracoes(oficinaResult.value.data)
    : mockConfiguracoes;

  const baseData = {
    clientes,
    veiculos,
    ordens,
    agendamentos,
    orcamentos,
    pagamentos,
    estoque,
    fornecedores,
    servicos,
    usuarios,
    funcionarios,
  };

  return {
    ...baseData,
    configuracoes,
    dashboard: buildDashboard(baseData),
  };
}

export async function createCliente(payload: ClientePayload): Promise<Cliente> {
  const { data } = await api.post('/clientes', {
    nome: payload.nome,
    email: payload.email || undefined,
    telefone: payload.telefone || undefined,
    cpf: payload.cpf || undefined,
    data_nascimento: payload.data_nascimento || undefined,
    observacoes: payload.observacoes || undefined,
  });

  return adaptCliente(data);
}
