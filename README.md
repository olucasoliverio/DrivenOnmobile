# 🔧 DriveOn Mobile

> **Sistema de Gestão para Oficinas Mecânicas** — App React Native (Expo)

<div align="center">
  <img src="https://img.shields.io/badge/Expo-54.0-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Native-0.76-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-orange?style=for-the-badge" />
</div>

---

## 📋 Sobre o Projeto

O **DriveOn Mobile** é o app React Native do sistema de gestão DriveOn para oficinas mecânicas. Ele cobre os principais módulos operacionais:

| Módulo | Descrição |
|--------|-----------|
| 📊 Dashboard | KPIs, receita mensal, OS abertas |
| 📅 Agenda | Agendamentos por dia |
| 🔧 Ordens de Serviço | Criação e acompanhamento de OS |
| 👤 Clientes | Cadastro e histórico |
| 🚗 Veículos | Frota por cliente |
| 💰 Pagamentos | Extrato, contas a pagar/receber |
| 📦 Estoque | Controle de peças |
| 📋 Orçamentos | Propostas com status |
| 🏭 Fornecedores | Contatos e categorias |
| 🛠️ Serviços | Tabela de serviços |
| 📈 Relatórios | Análises financeiras e operacionais |
| ⚙️ Configurações | Dados da oficina |
| 👥 Usuários | Equipe e permissões |

> **Nota:** Esta versão usa **dados mockados** (sem backend real). Ideal para testes e demonstrações.

---

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- **[Node.js](https://nodejs.org/)** versão 18 ou superior
  - Verifique com: `node --version`
- **[Git](https://git-scm.com/)** para clonar o repositório
- **[Expo Go](https://expo.dev/go)** instalado no seu celular:
  - 📱 Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - 🍎 iOS: [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

> ⚠️ **Importante:** Seu celular e computador precisam estar na **mesma rede Wi-Fi**.

---

## 🚀 Como Rodar

### 1. Clonar o repositório

```bash
git clone <URL-DO-REPOSITÓRIO>
cd MobileDriveOn
```

### 2. Instalar dependências

```bash
npm install
```

> Aguarde a instalação de todos os pacotes. Pode levar alguns minutos.

### 3. Iniciar o servidor de desenvolvimento

```bash
npx expo start
```

Você verá uma saída parecida com esta no terminal:

```
Starting project at ...
Starting Metro Bundler
Waiting on http://localhost:8081

› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### 4. Abrir no celular

**Android:**
1. Abra o app **Expo Go** no celular
2. Toque em **"Scan QR code"**
3. Aponte a câmera para o QR Code no terminal

**iOS:**
1. Abra o app **Câmera** nativa do iPhone
2. Aponte para o QR Code no terminal
3. Toque na notificação que aparecer para abrir no Expo Go

---

## 🔑 Credenciais de Acesso

O app usa autenticação mockada. Use qualquer um dos acessos abaixo:

| E-mail | Senha | Perfil |
|--------|-------|--------|
| `admin@driveon.com` | `123456` | Administrador |
| qualquer@email.com | `123456` | Qualquer perfil |

> Qualquer e-mail funciona, desde que a senha seja **`123456`**.

---

## 🗂️ Estrutura do Projeto

```
MobileDriveOn/
├── App.tsx                          # Ponto de entrada
├── app.json                         # Configurações do Expo
├── src/
│   ├── theme/
│   │   └── theme.ts                 # Tema de cores (light)
│   ├── data/
│   │   └── mockData.ts              # Dados fictícios de demonstração
│   ├── context/
│   │   └── AuthContext.tsx          # Gerenciamento de autenticação
│   ├── navigation/
│   │   ├── RootNavigator.tsx        # Navegação raiz
│   │   ├── AppTabs.tsx              # Abas principais (Bottom Navigation)
│   │   └── stacks/                  # Stacks por módulo
│   └── screens/                     # Todas as telas do app
│       ├── auth/
│       ├── dashboard/
│       ├── agenda/
│       ├── tarefas/
│       ├── clientes/
│       ├── veiculos/
│       ├── orcamentos/
│       ├── pagamentos/
│       ├── estoque/
│       ├── fornecedores/
│       ├── servicos/
│       ├── relatorios/
│       ├── configuracoes/
│       ├── usuarios/
│       └── menu/
└── assets/                          # Ícones e imagens
```

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Função |
|------------|--------|--------|
| Expo | ~54.0 | Framework base |
| React Native | ~0.76 | Core mobile |
| TypeScript | ~5.8 | Tipagem estática |
| React Navigation | ^7 | Navegação entre telas |
| React Native Paper | ^5 | Componentes de UI (Material Design) |
| AsyncStorage | ~2.2 | Persistência local |
| Day.js | ^1.11 | Manipulação de datas |
| Axios | ^1.11 | Requisições HTTP (pronto para backend) |

---

## ❓ Solução de Problemas

### "Unable to resolve module..."
Execute novamente:
```bash
npm install
npx expo start --clear
```

### QR Code não funciona / App não abre
- Confirme que celular e computador estão na **mesma rede Wi-Fi**
- Tente usar a opção de **tunnel** (mais lenta, mas funciona em redes diferentes):
  ```bash
  npx expo start --tunnel
  ```
  > Pode pedir para instalar o pacote `@expo/ngrok`. Aceite com `Y`.

### App travando ou crash no celular
- Feche e abra o Expo Go novamente
- Agite o celular para abrir o menu de developer e toque em **"Reload"**

### Erros de versão no terminal
```bash
npx expo install --fix
```

---

## 🔗 Projetos Relacionados

- **Backend (API REST):** [`/Back`](./Back) — Node.js + Express + Prisma + PostgreSQL
- **Frontend Web:** [`/Front`](./Front) — React + Vite + TypeScript + MUI

---

## 👨‍💻 Desenvolvimento

Para conectar ao backend real quando disponível, edite o arquivo:

```
src/api/client.ts
```

E substitua a URL base:
```ts
baseURL: 'http://SEU-SERVIDOR:3000'
```

---

<div align="center">
  <p>Feito com ❤️ — DriveOn &copy; 2026</p>
</div>
