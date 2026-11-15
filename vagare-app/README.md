# Vagare — app mobile

Código do app Vagare (Expo / React Native / TypeScript). Visão geral do projeto no [README da raiz](../README.md) e documentação completa na [Wiki](../docs/wiki/Home.md).

## Estrutura

```
app/              rotas (Expo Router): (auth), (tabs), trip/create, trip/[id], reset-password
src/screens/      telas e componentes específicos de cada tela
src/components/   componentes reutilizáveis (Button, Input, ConfirmModal, banners)
src/hooks/        queries e mutations (TanStack Query) — ponte entre telas e services
src/services/     API, cache SQLite, fila offline, monitoramento (Sentry)
src/contexts/     sessão (AuthContext) e toasts
src/utils/        funções puras (datas, moedas, orçamento, senha)
src/theme/        cores, fontes, espaçamentos
tests/            Jest + React Native Testing Library
```

Arquitetura e fluxo offline: [Arquitetura](../docs/wiki/Arquitetura.md).

## Rodando localmente

Pré-requisitos: Node.js 22, Yarn 1 e a [API](https://github.com/grazielatrres/portfolio-vagare-backend) rodando.

```bash
yarn install
cp .env.example .env
yarn dev
```

| Variável | Uso |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL da API. No celular, use o IP da sua máquina (ex.: `http://192.168.0.10:3000`), pois `localhost` aponta para o próprio celular |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Client ID do Google OAuth |
| `EXPO_PUBLIC_SENTRY_DSN` | DSN do Sentry; vazio desliga o monitoramento |
| `EXPO_PUBLIC_APP_ENV` | Ambiente reportado ao Sentry (`development` / `production`) |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | URL da política de privacidade aberta no Perfil |
| `EAS_PROJECT_ID` | Projeto no EAS, para builds locais |
| `REACT_NATIVE_PACKAGER_HOSTNAME` | IP da máquina na rede local (uso com Docker) |

## Scripts

| Script | Descrição |
|---|---|
| `yarn dev` | Inicia o Metro |
| `yarn android` / `yarn ios` | Build nativo local no dispositivo |
| `yarn lint` | ESLint |
| `yarn typecheck` | TypeScript sem emitir arquivos |
| `yarn test` / `yarn test:coverage` | Testes (cobertura mínima de 25%) |
| `yarn build:preview` | APK interno pelo EAS |
| `yarn build:production` | Build de loja pelo EAS |

## Rodando com Docker

Pré-requisito: Docker Desktop. A API (`portfolio-vagare-backend`) e o Postgres sobem separadamente com `docker compose up -d` no projeto do backend.

```bash
cp .env.example .env    # preencha EXPO_PUBLIC_API_URL e REACT_NATIVE_PACKAGER_HOSTNAME
docker compose up --build
```

O Metro fica em `http://localhost:8081` (Expo Web) e o QR code aparece nos logs do container. Alterações no código recarregam automaticamente. Depois de mudar o `.env` ou as dependências, rode `docker compose up --build` de novo.

Para parar: `docker compose down` (use `-v` para também apagar o volume do `node_modules`).

## Build e publicação

Os builds de loja são feitos pelo workflow **Release** (GitHub Actions + EAS): automático na `main` (Google Play teste fechado + TestFlight) e manual para `develop`. Detalhes em [Instalação e Deploy](../docs/wiki/Instalacao-e-Deploy.md).
