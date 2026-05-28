import dayjs from 'dayjs';

// ─── Clientes ───────────────────────────────────────────────────────────────
export const mockClientes = [
  { id: 1, nome: 'João Silva', cpf: '123.456.789-00', telefone: '(48) 99999-1234', email: 'joao@email.com', cidade: 'Florianópolis', endereco: 'Rua das Flores, 123' },
  { id: 2, nome: 'Maria Souza', cpf: '987.654.321-00', telefone: '(48) 98888-5678', email: 'maria@email.com', cidade: 'São José', endereco: 'Av. Central, 456' },
  { id: 3, nome: 'Pedro Oliveira', cpf: '456.789.123-00', telefone: '(48) 97777-9012', email: 'pedro@email.com', cidade: 'Palhoça', endereco: 'Rua Nova, 789' },
  { id: 4, nome: 'Ana Costa', cpf: '789.123.456-00', telefone: '(48) 96666-3456', email: 'ana@email.com', cidade: 'Florianópolis', endereco: 'Rua das Palmeiras, 321' },
  { id: 5, nome: 'Carlos Ferreira', cpf: '321.654.987-00', telefone: '(48) 95555-7890', email: 'carlos@email.com', cidade: 'Biguaçu', endereco: 'Av. Brasil, 654' },
];

// ─── Veículos ────────────────────────────────────────────────────────────────
export const mockVeiculos = [
  { id: 1, clienteId: 1, marca: 'Volkswagen', modelo: 'Gol', ano: 2019, placa: 'ABC-1234', cor: 'Branco', km: 45000 },
  { id: 2, clienteId: 1, marca: 'Honda', modelo: 'Civic', ano: 2021, placa: 'DEF-5678', cor: 'Prata', km: 22000 },
  { id: 3, clienteId: 2, marca: 'Toyota', modelo: 'Corolla', ano: 2020, placa: 'GHI-9012', cor: 'Preto', km: 38000 },
  { id: 4, clienteId: 3, marca: 'Ford', modelo: 'Ka', ano: 2018, placa: 'JKL-3456', cor: 'Vermelho', km: 61000 },
  { id: 5, clienteId: 4, marca: 'Chevrolet', modelo: 'Onix', ano: 2022, placa: 'MNO-7890', cor: 'Azul', km: 15000 },
  { id: 6, clienteId: 5, marca: 'Renault', modelo: 'Sandero', ano: 2017, placa: 'PQR-1234', cor: 'Cinza', km: 82000 },
];

// ─── Ordens de Serviço ───────────────────────────────────────────────────────
export const mockOrdens = [
  { id: 1, clienteId: 1, veiculoId: 1, status: 'em_andamento', descricao: 'Revisão completa e troca de óleo', dataEntrada: dayjs().subtract(2, 'day').toISOString(), dataPrevista: dayjs().add(1, 'day').toISOString(), valor: 450.00, mecanico: 'Carlos Mecânico' },
  { id: 2, clienteId: 2, veiculoId: 3, status: 'aguardando', descricao: 'Troca de pastilhas de freio', dataEntrada: dayjs().subtract(1, 'day').toISOString(), dataPrevista: dayjs().add(2, 'day').toISOString(), valor: 280.00, mecanico: 'Roberto Silva' },
  { id: 3, clienteId: 3, veiculoId: 4, status: 'concluido', descricao: 'Alinhamento e balanceamento', dataEntrada: dayjs().subtract(5, 'day').toISOString(), dataPrevista: dayjs().subtract(4, 'day').toISOString(), valor: 180.00, mecanico: 'Carlos Mecânico' },
  { id: 4, clienteId: 4, veiculoId: 5, status: 'em_andamento', descricao: 'Diagnóstico eletrônico e reparo', dataEntrada: dayjs().toISOString(), dataPrevista: dayjs().add(3, 'day').toISOString(), valor: 650.00, mecanico: 'Roberto Silva' },
  { id: 5, clienteId: 5, veiculoId: 6, status: 'aguardando_pecas', descricao: 'Troca de correia dentada', dataEntrada: dayjs().subtract(3, 'day').toISOString(), dataPrevista: dayjs().add(4, 'day').toISOString(), valor: 890.00, mecanico: 'Carlos Mecânico' },
  { id: 6, clienteId: 1, veiculoId: 2, status: 'concluido', descricao: 'Troca de filtro de ar e combustível', dataEntrada: dayjs().subtract(10, 'day').toISOString(), dataPrevista: dayjs().subtract(9, 'day').toISOString(), valor: 220.00, mecanico: 'Roberto Silva' },
];

// ─── Agendamentos ────────────────────────────────────────────────────────────
export const mockAgendamentos = [
  { id: 1, clienteId: 1, veiculoId: 1, data: dayjs().toISOString(), hora: '09:00', servico: 'Revisão Geral', status: 'confirmado', observacao: '' },
  { id: 2, clienteId: 2, veiculoId: 3, data: dayjs().toISOString(), hora: '11:00', servico: 'Troca de Óleo', status: 'confirmado', observacao: 'Cliente chegará de moto' },
  { id: 3, clienteId: 3, veiculoId: 4, data: dayjs().add(1, 'day').toISOString(), hora: '08:30', servico: 'Alinhamento', status: 'pendente', observacao: '' },
  { id: 4, clienteId: 4, veiculoId: 5, data: dayjs().add(1, 'day').toISOString(), hora: '14:00', servico: 'Diagnóstico', status: 'confirmado', observacao: 'Carro com barulho no motor' },
  { id: 5, clienteId: 5, veiculoId: 6, data: dayjs().add(2, 'day').toISOString(), hora: '10:00', servico: 'Correia Dentada', status: 'pendente', observacao: '' },
  { id: 6, clienteId: 1, veiculoId: 2, data: dayjs().add(3, 'day').toISOString(), hora: '15:30', servico: 'Freios', status: 'confirmado', observacao: '' },
];

// ─── Orçamentos ──────────────────────────────────────────────────────────────
export const mockOrcamentos = [
  { id: 1, clienteId: 1, veiculoId: 1, status: 'aprovado', total: 750.00, dataCriacao: dayjs().subtract(3, 'day').toISOString(), validade: dayjs().add(7, 'day').toISOString(), itens: [{ descricao: 'Óleo Motor 5W30', qtd: 4, valor: 45.00 }, { descricao: 'Filtro de Óleo', qtd: 1, valor: 35.00 }, { descricao: 'Mão de Obra Revisão', qtd: 1, valor: 530.00 }] },
  { id: 2, clienteId: 2, veiculoId: 3, status: 'pendente', total: 480.00, dataCriacao: dayjs().subtract(1, 'day').toISOString(), validade: dayjs().add(14, 'day').toISOString(), itens: [{ descricao: 'Pastilha de Freio', qtd: 1, valor: 180.00 }, { descricao: 'Disco de Freio', qtd: 2, valor: 120.00 }, { descricao: 'Mão de Obra', qtd: 1, valor: 60.00 }] },
  { id: 3, clienteId: 3, veiculoId: 4, status: 'recusado', total: 320.00, dataCriacao: dayjs().subtract(7, 'day').toISOString(), validade: dayjs().subtract(2, 'day').toISOString(), itens: [{ descricao: 'Alinhamento', qtd: 1, valor: 80.00 }, { descricao: 'Balanceamento', qtd: 4, valor: 20.00 }, { descricao: 'Rodagem', qtd: 1, valor: 160.00 }] },
  { id: 4, clienteId: 4, veiculoId: 5, status: 'pendente', total: 1200.00, dataCriacao: dayjs().toISOString(), validade: dayjs().add(10, 'day').toISOString(), itens: [{ descricao: 'Correia Dentada Kit', qtd: 1, valor: 450.00 }, { descricao: 'Bomba D\'água', qtd: 1, valor: 350.00 }, { descricao: 'Mão de Obra', qtd: 1, valor: 400.00 }] },
];

// ─── Pagamentos ──────────────────────────────────────────────────────────────
export const mockPagamentos = [
  { id: 1, clienteId: 1, ordemId: 6, tipo: 'receber', descricao: 'OS #6 - João Silva', valor: 220.00, data: dayjs().subtract(9, 'day').toISOString(), status: 'pago', formaPagamento: 'PIX' },
  { id: 2, clienteId: 3, ordemId: 3, tipo: 'receber', descricao: 'OS #3 - Pedro Oliveira', valor: 180.00, data: dayjs().subtract(4, 'day').toISOString(), status: 'pago', formaPagamento: 'Cartão Débito' },
  { id: 3, clienteId: 2, ordemId: 2, tipo: 'receber', descricao: 'OS #2 - Maria Souza', valor: 280.00, data: dayjs().add(2, 'day').toISOString(), status: 'pendente', formaPagamento: '' },
  { id: 4, clienteId: 1, ordemId: 1, tipo: 'receber', descricao: 'OS #1 - João Silva', valor: 450.00, data: dayjs().add(1, 'day').toISOString(), status: 'pendente', formaPagamento: '' },
  { id: 5, clienteId: null, ordemId: null, tipo: 'pagar', descricao: 'Compra de Peças - Fornecedor AutoParts', valor: 1500.00, data: dayjs().subtract(2, 'day').toISOString(), status: 'pago', formaPagamento: 'Transferência' },
  { id: 6, clienteId: null, ordemId: null, tipo: 'pagar', descricao: 'Aluguel da Oficina', valor: 3200.00, data: dayjs().toISOString(), status: 'pago', formaPagamento: 'Débito Automático' },
  { id: 7, clienteId: null, ordemId: null, tipo: 'pagar', descricao: 'Conta de Energia', valor: 480.00, data: dayjs().add(5, 'day').toISOString(), status: 'pendente', formaPagamento: '' },
];

// ─── Estoque ─────────────────────────────────────────────────────────────────
export const mockEstoque = [
  { id: 1, nome: 'Óleo Motor 5W30', categoria: 'Lubrificantes', quantidade: 24, unidade: 'L', valorUnitario: 18.50, estoqueMinimo: 10 },
  { id: 2, nome: 'Filtro de Óleo Universal', categoria: 'Filtros', quantidade: 15, unidade: 'un', valorUnitario: 28.00, estoqueMinimo: 5 },
  { id: 3, nome: 'Pastilha de Freio Dianteira', categoria: 'Freios', quantidade: 3, unidade: 'jogo', valorUnitario: 95.00, estoqueMinimo: 4 },
  { id: 4, nome: 'Vela de Ignição NGK', categoria: 'Ignição', quantidade: 28, unidade: 'un', valorUnitario: 22.00, estoqueMinimo: 8 },
  { id: 5, nome: 'Correia Dentada', categoria: 'Motor', quantidade: 2, unidade: 'un', valorUnitario: 120.00, estoqueMinimo: 3 },
  { id: 6, nome: 'Fluido de Freio DOT4', categoria: 'Fluidos', quantidade: 8, unidade: 'L', valorUnitario: 35.00, estoqueMinimo: 4 },
  { id: 7, nome: 'Líquido de Arrefecimento', categoria: 'Fluidos', quantidade: 12, unidade: 'L', valorUnitario: 28.00, estoqueMinimo: 6 },
  { id: 8, nome: 'Amortecedor Dianteiro', categoria: 'Suspensão', quantidade: 0, unidade: 'un', valorUnitario: 280.00, estoqueMinimo: 2 },
];

// ─── Fornecedores ────────────────────────────────────────────────────────────
export const mockFornecedores = [
  { id: 1, nome: 'AutoParts Distribuidora', cnpj: '12.345.678/0001-90', telefone: '(48) 3232-1234', email: 'vendas@autoparts.com', cidade: 'Florianópolis', categoria: 'Peças Gerais' },
  { id: 2, nome: 'Lubrax Lubrificantes', cnpj: '98.765.432/0001-10', telefone: '(48) 3241-5678', email: 'contato@lubrax.com', cidade: 'São José', categoria: 'Lubrificantes' },
  { id: 3, nome: 'Fremax Freios', cnpj: '45.678.901/0001-23', telefone: '(47) 3388-9012', email: 'pedidos@fremax.com', cidade: 'Joinville', categoria: 'Freios' },
  { id: 4, nome: 'NGK do Brasil', cnpj: '67.890.123/0001-45', telefone: '(11) 3241-3456', email: 'sp@ngk.com', cidade: 'São Paulo', categoria: 'Ignição' },
];

// ─── Serviços ─────────────────────────────────────────────────────────────────
export const mockServicos = [
  { id: 1, nome: 'Revisão Completa', descricao: 'Revisão geral do veículo com troca de óleo e filtros', valor: 350.00, tempoEstimado: '3h', categoria: 'Revisão' },
  { id: 2, nome: 'Troca de Óleo', descricao: 'Troca de óleo e filtro de óleo', valor: 120.00, tempoEstimado: '1h', categoria: 'Revisão' },
  { id: 3, nome: 'Alinhamento e Balanceamento', descricao: 'Alinhamento direcional e balanceamento das 4 rodas', valor: 180.00, tempoEstimado: '2h', categoria: 'Rodagem' },
  { id: 4, nome: 'Troca de Pastilhas de Freio', descricao: 'Substituição das pastilhas de freio dianteiras e/ou traseiras', valor: 250.00, tempoEstimado: '1.5h', categoria: 'Freios' },
  { id: 5, nome: 'Diagnóstico Eletrônico', descricao: 'Leitura e diagnóstico via scanner automotivo', valor: 150.00, tempoEstimado: '1h', categoria: 'Diagnóstico' },
  { id: 6, nome: 'Correia Dentada', descricao: 'Troca do kit correia dentada com tensor e bomba d\'água', valor: 800.00, tempoEstimado: '4h', categoria: 'Motor' },
  { id: 7, nome: 'Troca de Amortecedores', descricao: 'Substituição dos amortecedores dianteiros e/ou traseiros', valor: 600.00, tempoEstimado: '3h', categoria: 'Suspensão' },
];

// ─── Usuários ─────────────────────────────────────────────────────────────────
export const mockUsuarios = [
  { id: 1, nome: 'Admin DriveOn', email: 'admin@driveon.com', perfil: 'admin', telefone: '(48) 99999-0000', status: 'ativo' },
  { id: 2, nome: 'Carlos Mecânico', email: 'carlos@driveon.com', perfil: 'mecanico', telefone: '(48) 99988-1111', status: 'ativo' },
  { id: 3, nome: 'Roberto Silva', email: 'roberto@driveon.com', perfil: 'mecanico', telefone: '(48) 99977-2222', status: 'ativo' },
  { id: 4, nome: 'Fernanda Atendimento', email: 'fernanda@driveon.com', perfil: 'atendente', telefone: '(48) 99966-3333', status: 'ativo' },
];

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────
export const mockDashboard = {
  osAbertas: 3,
  osConcluidas: 12,
  agendamentosHoje: 2,
  receitaMes: 8450.00,
  receitaAnterior: 7200.00,
  clientesAtivos: 5,
  ticketMedio: 380.00,
  receitaMensal: [
    { mes: 'Nov', valor: 6200 },
    { mes: 'Dez', valor: 7800 },
    { mes: 'Jan', valor: 5900 },
    { mes: 'Fev', valor: 8100 },
    { mes: 'Mar', valor: 7200 },
    { mes: 'Abr', valor: 8450 },
  ],
  statusOS: [
    { status: 'Em Andamento', count: 2, color: '#1565C0' },
    { status: 'Aguardando', count: 1, color: '#FF6F00' },
    { status: 'Aguard. Peças', count: 1, color: '#9C27B0' },
    { status: 'Concluído', count: 2, color: '#2E7D32' },
  ],
};

// ─── Configurações da Oficina ────────────────────────────────────────────────
export const mockConfiguracoes = {
  nomeOficina: 'DriveOn Oficina Mecânica',
  cnpj: '00.000.000/0001-00',
  telefone: '(48) 3333-1234',
  email: 'contato@driveon.com',
  endereco: 'Rua das Oficinas, 100',
  cidade: 'Florianópolis',
  estado: 'SC',
  cep: '88000-000',
  logo: null,
};

// ─── Funcionários ────────────────────────────────────────────────────────────
export const mockFuncionarios = [
  { id: 1, nome: 'Admin DriveOn', email: 'admin@driveon.com', cargo: 'administrador', telefone: '(48) 99999-0000' },
  { id: 2, nome: 'Carlos Mecânico', email: 'carlos@driveon.com', cargo: 'mecanico', telefone: '(48) 99988-1111' },
  { id: 3, nome: 'Roberto Silva', email: 'roberto@driveon.com', cargo: 'mecanico', telefone: '(48) 99977-2222' },
  { id: 4, nome: 'Fernanda Atendimento', email: 'fernanda@driveon.com', cargo: 'atendente', telefone: '(48) 99966-3333' },
];

