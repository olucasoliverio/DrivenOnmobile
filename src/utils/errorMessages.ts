type ApiLikeError = {
  response?: {
    data?: unknown;
    status?: number;
  };
  message?: string;
};

function getRawMessage(error: ApiLikeError): string {
  const data = error.response?.data;

  if (typeof data === 'string') return data;

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const candidates = [
      record.error,
      record.message,
      record.mensagem,
      record.detail,
      record.details,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate;
      }
    }
  }

  return error.message ?? '';
}

export function getFriendlyErrorMessage(
  error: ApiLikeError,
  fallback = 'Tente novamente em alguns instantes.',
): string {
  const raw = getRawMessage(error).trim();
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (!raw) {
    if (error.response?.status === 401) {
      return 'Sua sessão expirou. Entre novamente para continuar.';
    }
    if (error.response?.status === 403) {
      return 'Você não tem permissão para fazer esta ação.';
    }
    if (error.response?.status === 404) {
      return 'O registro não foi encontrado. Atualize a lista e tente novamente.';
    }
    if (error.response?.status && error.response.status >= 500) {
      return 'O servidor não conseguiu concluir a ação agora. Tente novamente em alguns instantes.';
    }
    return fallback;
  }

  if (normalized.includes('valor') && (
    normalized.includes('zero') ||
    normalized.includes('maior que 0') ||
    normalized.includes('maior que zero') ||
    normalized.includes('positivo')
  )) {
    return 'Informe um valor maior que R$ 0,00 para continuar.';
  }

  if (normalized.includes('total') && (
    normalized.includes('zero') ||
    normalized.includes('maior que 0') ||
    normalized.includes('maior que zero') ||
    normalized.includes('positivo')
  )) {
    return 'O total precisa ser maior que R$ 0,00. Revise os itens antes de salvar.';
  }

  if (normalized.includes('estoque')) {
    return raw || 'A quantidade informada é maior que o estoque disponível.';
  }

  if (normalized.includes('placa')) {
    return 'Verifique a placa do veículo. Use o formato AAA-1234 ou AAA1A23.';
  }

  if (normalized.includes('cliente')) {
    return raw || 'Selecione um cliente válido para continuar.';
  }

  if (normalized.includes('veiculo')) {
    return raw || 'Selecione um veículo válido para continuar.';
  }

  if (normalized.includes('data') || normalized.includes('horario') || normalized.includes('hora')) {
    return raw || 'Verifique a data e o horário informados.';
  }

  if (normalized.includes('network') || normalized.includes('timeout')) {
    return 'Não foi possível conectar. Verifique a internet e tente novamente.';
  }

  return raw || fallback;
}

export function parseMoneyValue(value: string): number {
  const compact = value.replace(/\s/g, '');
  const normalized = compact.includes(',')
    ? compact.replace(/\./g, '').replace(',', '.')
    : compact;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isValidTime(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}
