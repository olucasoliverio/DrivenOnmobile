# DriveOn Mobile

App mobile do DriveOn para operação de oficinas mecânicas. O projeto é feito com Expo, React Native e TypeScript.

## Visão Geral

O app concentra as rotinas principais da oficina no celular:

| Módulo | O que faz |
| --- | --- |
| Dashboard | Atalhos, KPIs, OS em andamento, agenda do dia e atividade recente |
| Ordens de Serviço | Lista, filtros, criação, edição, acompanhamento e cobrança |
| Clientes | Cadastro, detalhes, veículos, histórico e WhatsApp |
| Veículos | Cadastro, detalhes, vínculos com cliente e histórico de OS |
| Agenda | Agendamentos, confirmação e cancelamento |
| Orçamentos | Propostas, status, compartilhamento e conversão de fluxo |
| Pagamentos | Contas a receber, filtros, detalhes e baixa de recebimento |
| Notificações | Central de avisos do app |
| Menu | Acesso a módulos secundários e logout |

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

## Pré-requisitos

- Node.js 18 ou superior
- npm
- Android Studio/emulador Android ou dispositivo físico
- Expo CLI via `npx expo`

Para Android nativo, este projeto usa `expo run:android`, então o ambiente Android precisa estar configurado.

## Instalação

```bash
npm install
```

## Rodando o App

Servidor Expo:

```bash
npm start
```

Android:

```bash
npm run android
```

iOS:

```bash
npm run ios
```

Web, quando útil para inspeção rápida:

```bash
npm run web
```

## Configuração da API

A URL da API é definida em `src/api/api.ts`.

Por padrão:

- Android: `http://10.0.2.2:4000/api`
- Outras plataformas: `http://localhost:4000/api`

Para sobrescrever, crie/ajuste o arquivo `.env`:

```env
EXPO_PUBLIC_API_URL=http://SEU_HOST:4000/api
```

Depois reinicie o Metro.

## Scripts

| Script | Descrição |
| --- | --- |
| `npm start` | Inicia o Expo |
| `npm run android` | Compila e abre no Android |
| `npm run ios` | Compila e abre no iOS |
| `npm run web` | Abre via Expo Web |

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
└── package.json
```

## Observações de UI

- A Status Bar Android é preta e não translúcida.
- A bottom bar é flutuante e usa fundo transparente ao redor.
- Ações secundárias, como editar/remover/cancelar, devem usar o menu de três pontinhos (`ActionOverflowMenu`).
- Cards clicáveis no mobile não usam chevron visual.
- Modais de filtro usam `fade` para evitar o backdrop escuro subindo junto com o conteúdo.

## Android

Configurações relevantes:

- `android.edgeToEdgeEnabled`: `false`
- `androidStatusBar.backgroundColor`: `#000000`
- `androidStatusBar.translucent`: `false`
- `androidNavigationBar.backgroundColor`: `#F1F5F9`

Quando mudar configurações nativas, rode um novo build Android:

```bash
npm run android
```

Um reload do Metro pode não ser suficiente para refletir mudanças em `app.json`, `android/` ou permissões nativas.

## Troubleshooting

Limpar cache do Expo:

```bash
npx expo start --clear
```

Reinstalar dependências:

```bash
rm -rf node_modules
npm install
```

No PowerShell:

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
