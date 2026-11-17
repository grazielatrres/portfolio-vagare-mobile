# Vagare

Aplicativo mobile (Android e iOS) para planejar viagens em um só lugar: roteiro por dia, calendário, orçamento com controle de gastos, previsão do tempo e informações de voos e hospedagens, funcionando também offline.

Projeto de Portfólio de Engenharia de Software — Católica SC (linha Aplicações Mobile, com backend próprio).

## Documentação

A documentação completa está na **[Wiki](https://github.com/grazielatrres/portfolio-vagare-mobile/wiki)** (fonte versionada em [`docs/wiki/`](docs/wiki)):

| Assunto | Página |
|---|---|
| Requisitos funcionais, user stories e casos de uso | [Requisitos e User Stories](docs/wiki/Requisitos-e-User-Stories.md) |
| Estrutura de navegação | [Navegação](docs/wiki/Navegacao.md) |
| Fluxos de uso completos | [Fluxos de Uso](docs/wiki/Fluxos-de-Uso.md) |
| Diagrama de arquitetura | [Arquitetura](docs/wiki/Arquitetura.md) |
| Decisões técnicas | [Decisões Técnicas](docs/wiki/Decisoes-Tecnicas.md) |
| Instalação e deploy | [Instalação e Deploy](docs/wiki/Instalacao-e-Deploy.md) |
| Monitoramento, testes e análise estática | [Observabilidade e Qualidade](docs/wiki/Observabilidade-e-Qualidade.md) |
| Como contribuir | [Guia de Contribuição](docs/wiki/Guia-de-Contribuicao.md) |

## Instalar

- **Android:** teste interno no Google Play — ver [Instalação](docs/wiki/Instalacao-e-Deploy.md#android--google-play-teste-interno).
- **iOS:** TestFlight — ver [Instalação](docs/wiki/Instalacao-e-Deploy.md#ios--testflight).

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
docs/wiki/        fonte da Wiki
scripts/          verificações usadas no CI
```

Arquitetura e fluxo offline: [Arquitetura](docs/wiki/Arquitetura.md).

## Rodar localmente

Pré-requisitos: Node.js 22, Yarn 1 e a [API](https://github.com/grazielatrres/portfolio-vagare-backend) rodando.

```bash
yarn install
cp .env.example .env   # ajuste EXPO_PUBLIC_API_URL para a API
yarn dev
```

| Variável | Uso |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL da API. No celular, use o IP da sua máquina (ex.: `http://192.168.0.10:3000`), pois `localhost` aponta para o próprio celular |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Client ID do Google OAuth |
| `EXPO_PUBLIC_SENTRY_DSN` | DSN do Sentry; vazio desliga o monitoramento |
| `EXPO_PUBLIC_APP_ENV` | Ambiente reportado ao Sentry (`development` / `staging` / `production`); nos builds do EAS vem do `eas.json` |
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

## Rodar com Docker

Pré-requisito: Docker Desktop. A API (`portfolio-vagare-backend`) e o Postgres sobem separadamente com `docker compose up -d` no projeto do backend.

```bash
cp .env.example .env    # preencha EXPO_PUBLIC_API_URL e REACT_NATIVE_PACKAGER_HOSTNAME
docker compose up --build
```

O Metro fica em `http://localhost:8081` (Expo Web) e o QR code aparece nos logs do container. Alterações no código recarregam automaticamente. Depois de mudar o `.env` ou as dependências, rode `docker compose up --build` de novo.

Para parar: `docker compose down` (use `-v` para também apagar o volume do `node_modules`).

## Build e publicação

Os builds de loja são feitos pelo workflow **Release** (GitHub Actions + EAS): automático na `main` (Google Play teste interno + TestFlight) e manual para `develop`. Detalhes em [Instalação e Deploy](docs/wiki/Instalacao-e-Deploy.md).

## Stack

Expo 57 · React Native 0.86 · TypeScript · Expo Router · TanStack Query · SQLite · SecureStore · Sentry · Jest + Testing Library · EAS Build/Submit · GitHub Actions · SonarCloud

## Repositórios relacionados

- API: [portfolio-vagare-backend](https://github.com/grazielatrres/portfolio-vagare-backend)
- Política de privacidade: [portfolio-vagare-privacy-politcs](https://github.com/grazielatrres/portfolio-vagare-privacy-politcs)
