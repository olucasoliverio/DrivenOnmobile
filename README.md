# DriveOn Mobile

Aplicativo mobile do DriveOn para operação de oficinas mecânicas. O projeto é desenvolvido com Expo, React Native e TypeScript.

## Visão Geral

O app reúne as principais rotinas da oficina no celular:

| Módulo | O que faz |
| --- | --- |
| Dashboard | Exibe atalhos, indicadores, OS em andamento, agenda do dia e atividades recentes. |
| Ordens de Serviço | Permite listar, filtrar, criar, editar, acompanhar e cobrar ordens de serviço. |
| Clientes | Gerencia cadastro, detalhes, veículos, histórico e contato via WhatsApp. |
| Veículos | Gerencia cadastro, detalhes, vínculo com cliente, histórico de OS e leitura de placas. |
| Agenda | Controla agendamentos, confirmações, detalhes e cancelamentos. |
| Orçamentos | Gerencia propostas, status, compartilhamento e conversão de fluxo. |
| Pagamentos | Controla contas a receber, filtros, detalhes e baixa de recebimento. |
| Notificações | Centraliza avisos e atualizações do app. |
| Menu | Dá acesso a módulos secundários e logout. |

## Stack

| Tecnologia | Versão no projeto |
| --- | --- |
| Expo | `~54.0.33` |
| React Native | `0.81.5` |
| React | `19.1.0` |
| TypeScript | `~5.9.2` |
| React Navigation | `7.x` |
| React Native Paper | `^5.15.1` |
| Axios | `^1.15.2` |
| Day.js | `^1.11.20` |
| Zod | `^4.4.2` |

## Pré-requisitos

- Node.js 18 ou superior
- npm
- Expo via `npx expo`
- Android Studio/emulador Android ou dispositivo físico
- Ambiente Android configurado para builds nativos

Este projeto usa `expo run:android`, então alterações nativas exigem o ambiente Android configurado corretamente.

## Instalação

Na pasta do app mobile:

```bash
cd DrivenOnmobile
npm install
```

## Rodando o App

Inicie o servidor Expo:

```bash
npm start
```

Rode no Android:

```bash
npm run android
```

Rode no iOS:

```bash
npm run ios
```

Abra no navegador, quando útil para inspeção rápida:

```bash
npm run web
```

## Configuração da API

A URL base da API é definida em `src/api/api.ts`.

Valores padrão:

- Android Emulator: `http://10.0.2.2:4000/api`
- Outras plataformas: `http://localhost:4000/api`

Para sobrescrever a URL, crie ou ajuste o arquivo `.env`:

```env
EXPO_PUBLIC_API_URL=http://SEU_HOST:4000/api
```

Exemplo para backend publicado:

```env
EXPO_PUBLIC_API_URL=https://seu-backend.up.railway.app/api
```

Depois de alterar variáveis de ambiente, reinicie o Metro/Expo.

## Scripts

| Script | Descrição |
| --- | --- |
| `npm start` | Inicia o servidor Expo. |
| `npm run android` | Compila e abre o app no Android. |
| `npm run ios` | Compila e abre o app no iOS. |
| `npm run web` | Abre o app via Expo Web. |

Validação TypeScript:

```bash
npx tsc --noEmit
```

## Estrutura

```text
DrivenOnmobile/
├── App.tsx
├── app.json
├── android/
├── assets/
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── navigation/
│   ├── permissions/
│   ├── screens/
│   │   ├── agenda/
│   │   ├── auth/
│   │   ├── clientes/
│   │   ├── dashboard/
│   │   ├── menu/
│   │   ├── notificacoes/
│   │   ├── orcamentos/
│   │   ├── pagamentos/
│   │   ├── tarefas/
│   │   └── veiculos/
│   ├── services/
│   ├── theme/
│   └── utils/
├── package.json
└── tsconfig.json
```

## Desenvolvimento

- Componentes reutilizáveis ficam em `src/components`.
- Fluxos e telas ficam organizados por módulo em `src/screens`.
- Navegação e stacks ficam em `src/navigation`.
- Regras de autenticação, dados globais e alertas ficam em `src/context`.
- Integrações externas e utilitários de negócio ficam em `src/services`.

## Troubleshooting

Limpar cache do Expo:

```bash
npx expo start --clear
```

Reinstalar dependências no PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

Corrigir dependências Expo:

```bash
npx expo install --fix
```

Se a API não responder no Android Emulator, confirme que o backend está rodando na porta `4000` e use `http://10.0.2.2:4000/api`.

## Projetos Relacionados

- Backend: `../Web/Back`
- Frontend Web: `../Web/Front`

## Status

Projeto em desenvolvimento ativo.
