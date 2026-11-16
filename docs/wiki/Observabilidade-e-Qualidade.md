# Observabilidade e Qualidade

## Monitoramento — Sentry

| O que é capturado | Como |
|---|---|
| Erros de JavaScript e travamentos nativos | `Sentry.init` + `Sentry.wrap` no layout raiz (`app/_layout.tsx`) |
| Falhas não críticas (cache SQLite, sincronização, prefetch) | `logError(context, error)` → evento com a tag `context` |
| Tempo de abertura de cada tela | `reactNavigationIntegration` registrado no container de navegação |
| Usuário afetado | Só o id interno, via `setMonitoringUser` (sem nome nem e-mail) |

Configuração em `src/services/monitoring.ts`:

- Ligado apenas quando `EXPO_PUBLIC_SENTRY_DSN` está definido (no EAS, por ambiente).
- `environment` vem de `EXPO_PUBLIC_APP_ENV`, definido por perfil no `eas.json`: `development` (builds internos), `staging` (`development-store`, a partir da `develop`) e `production` (`main`).
- `tracesSampleRate`: 100% das navegações em desenvolvimento e 20% nos builds de loja.
- `sendDefaultPii: false` — sem IP, cookies ou corpo de requisições.

### Configuração no build

- `app.config.js` registra o plugin `@sentry/react-native/expo` (organização `vagare-app`, projeto `vagare-mobile`), que configura o SDK nativo (crashes de Android e iOS) e envia os source maps e símbolos de debug no build.
- `metro.config.js` usa `getSentryExpoConfig`, que gera os Debug IDs que ligam o bundle aos source maps: os erros aparecem com o arquivo e a linha do código TypeScript.
- O release é definido pelo SDK nativo como `<bundle id>@<versão>+<build>`, o mesmo que aparece nas lojas.

| Variável no EAS (ambientes `preview` e `production`) | Visibilidade | Uso |
|---|---|---|
| `EXPO_PUBLIC_SENTRY_DSN` | Plain text | Endereço para onde o app envia os eventos (é público por natureza) |
| `SENTRY_AUTH_TOKEN` | Secret | Token de organização usado só no build, para enviar os source maps |

Os perfis `development` e `preview` (builds internos) têm `SENTRY_DISABLE_AUTO_UPLOAD=true` e não precisam do token.

O backend envia seus próprios erros ao Sentry, com o release igual ao SHA do commit ([Observabilidade da API](https://github.com/grazielatrres/portfolio-vagare-backend/wiki/Observabilidade)).

## Testes

| Tipo | Ferramenta | Exemplos |
|---|---|---|
| Funções puras | Jest | `date.test.ts`, `currency.test.ts`, `budget.test.ts`, `passwordPolicy.test.ts` |
| Hooks (queries e mutations) | Jest + `renderHook` | `useTripsQuery.test.ts`, `useExpenseMutations.test.ts` |
| Cache e sincronização offline | Jest + SQLite mockado | `syncQueue.test.ts`, `tripsCache.test.ts`, `transactionQueue.test.ts` |
| Componentes | React Native Testing Library | `FlightForm.test.tsx`, `TripCard.test.tsx`, `SyncStatusBanner.test.tsx` |
| Monitoramento | Jest | `monitoring.test.ts` |

Resultado em 15/11/2026: **224 testes em 46 suítes**, cobertura de ~55% das linhas (o `jest.config.js` exige no mínimo 25%).

## Análise estática

| Ferramenta | Onde |
|---|---|
| TypeScript (`tsc --noEmit`) | `scripts/pr-checks.sh` |
| ESLint (`eslint-config-expo`) | `scripts/pr-checks.sh` |
| SonarCloud | `pr-script.yml`, com cobertura de `coverage/lcov.info` (projeto `grazielatrres_portfolio-vagare-mobile`) |

Os mesmos checks rodam antes de qualquer build de loja no workflow **Release**: código com erro de lint, tipo ou teste não chega aos testadores.
