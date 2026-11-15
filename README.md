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

## Rodar localmente

```bash
cd vagare-app
yarn install
cp .env.example .env   # ajuste EXPO_PUBLIC_API_URL para a API
yarn dev
```

Detalhes, variáveis de ambiente e execução via Docker em [`vagare-app/README.md`](vagare-app/README.md).

## Stack

Expo 57 · React Native 0.86 · TypeScript · Expo Router · TanStack Query · SQLite · SecureStore · Sentry · Jest + Testing Library · EAS Build/Submit · GitHub Actions · SonarCloud

## Repositórios relacionados

- API: [portfolio-vagare-backend](https://github.com/grazielatrres/portfolio-vagare-backend)
- Política de privacidade: [portfolio-vagare-privacy-politcs](https://github.com/grazielatrres/portfolio-vagare-privacy-politcs)
