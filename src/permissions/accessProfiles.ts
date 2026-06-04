export const accessModules = [
  'painel',
  'agenda',
  'clientes',
  'veiculos',
  'estoque',
  'servicos',
  'ordens',
  'financeiro',
  'fornecedores',
  'orcamentos',
  'funcionarios',
  'relatorios',
  'configuracoes',
  'recursos_adicionais',
] as const;

export const accessActions = ['read', 'create', 'update', 'delete'] as const;

export type AccessModule = (typeof accessModules)[number];
export type AccessAction = (typeof accessActions)[number];
export type PermissionsMap = Partial<Record<AccessModule, AccessAction[]>>;

export const additionalResourceKeys = ['agenda', 'estoque', 'fornecedores'] as const;

export type AdditionalResourceKey = (typeof additionalResourceKeys)[number];
export type AdditionalResourcesMap = Record<AdditionalResourceKey, boolean>;

export const defaultAdditionalResources: AdditionalResourcesMap = {
  agenda: true,
  estoque: true,
  fornecedores: true,
};

export const moduleResourceMap: Partial<Record<AccessModule, AdditionalResourceKey>> = {
  agenda: 'agenda',
  estoque: 'estoque',
  fornecedores: 'fornecedores',
};

export function hasPermission(
  permissions: PermissionsMap | undefined,
  module: AccessModule,
  action: AccessAction = 'read',
) {
  return !!permissions?.[module]?.includes(action);
}

export function normalizeAdditionalResources(value: unknown): AdditionalResourcesMap {
  const input = value && typeof value === 'object' ? value as Partial<Record<AdditionalResourceKey, unknown>> : {};

  return additionalResourceKeys.reduce((acc, key) => {
    acc[key] = typeof input[key] === 'boolean' ? Boolean(input[key]) : defaultAdditionalResources[key];
    return acc;
  }, {} as AdditionalResourcesMap);
}

export function isModuleResourceEnabled(resources: AdditionalResourcesMap, module: AccessModule) {
  const resource = moduleResourceMap[module];
  return !resource || resources[resource] !== false;
}
