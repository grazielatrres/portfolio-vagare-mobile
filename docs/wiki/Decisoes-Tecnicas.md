# Decisões Técnicas (ADRs) — App

Decisões do backend estão na [Wiki da API](https://github.com/grazielatrres/portfolio-vagare-backend/wiki/Decisoes-Tecnicas).

## ADR-M01 — React Native com Expo

- **Contexto:** desenvolvedora única, Android e iOS, prazo de um semestre.
- **Decisão:** React Native com Expo (SDK 57) e TypeScript.
- **Alternativas:** Kotlin + Swift (duas bases de código), Flutter (Dart, sem compartilhar tipos com a API em TypeScript).
- **Consequências:** uma base de código; build e envio às lojas pelo EAS; módulos nativos via config plugins, sem manter as pastas `android/` e `ios/` no repositório (Continuous Native Generation).

## ADR-M02 — Expo Router com rotas protegidas

- **Decisão:** rotas por arquivo em `app/` e `Stack.Protected` para separar telas com e sem sessão.
- **Consequências:** o deep link de redefinição de senha (`vagareapp://reset-password`) funciona sem configuração extra; não existe forma de abrir uma tela interna sem sessão.

## ADR-M03 — TanStack Query como camada de estado do servidor

- **Contexto:** a maior parte do estado vem da API e precisa de cache, revalidação e atualização otimista.
- **Decisão:** cada recurso tem hooks próprios (`useTripsQuery`, `useCreateExpenseMutation`…), que funcionam como ViewModels.
- **Alternativas:** Redux (mais código para o mesmo resultado), estado local por tela (duplicação).
- **Consequências:** telas sem lógica de dados; hooks testados isoladamente com `renderHook`.

## ADR-M04 — Offline-first com SQLite e fila de sincronização

- **Contexto:** RNF08/RN09 exigem consultar e alterar a viagem sem internet (aeroporto, exterior).
- **Decisão:** cache em SQLite (`expo-sqlite`) por entidade e uma fila de pendências com ids locais; a fila é drenada quando o servidor volta a responder, com `Idempotency-Key`.
- **Alternativas:** persistir só o cache do TanStack Query (não cobre escritas), WatermelonDB (mais pesado para o escopo).
- **Consequências:** ids locais precisam ser trocados pelos definitivos após a sincronização; o logout avisa quando há alterações não enviadas.

## ADR-M05 — Tokens no SecureStore

- **Decisão:** access e refresh tokens no `expo-secure-store` (Keychain/Keystore).
- **Consequências:** tokens criptografados pelo sistema operacional; renovação automática no 401.

## ADR-M06 — Sentry para monitoramento

- **Contexto:** a RFC (5.7) prevê Sentry no mobile e no backend; o Playbook exige monitoramento.
- **Decisão:** `@sentry/react-native` com `Sentry.wrap` no layout raiz, integração de navegação (tempo de abertura de cada tela) e `logError` enviando as falhas não críticas (cache, sincronização).
- **Privacidade:** `sendDefaultPii: false`; usuário identificado só pelo id; a política de privacidade descreve os dados enviados.
- **Consequências:** sem `EXPO_PUBLIC_SENTRY_DSN` o envio fica desligado (dev e testes).

## ADR-M07 — Distribuição pelo EAS em duas trilhas

- **Decisão:** perfil `development-store` (Play teste interno + TestFlight) a partir da `develop`, e `production` (Play teste fechado + TestFlight) a partir da `main`, ambos pelo workflow **Release**.
- **Consequências:** ambiente de homologação separado da versão que o parceiro e os avaliadores usam.

## ADR-M08 — Firebase Analytics adiado

- **Contexto:** a RFC citava Firebase Analytics.
- **Decisão:** não incluir nesta versão; o Sentry cobre erros e performance, e os KPIs de uso vêm dos dados do backend.
- **Consequências:** nenhum SDK coleta comportamento do usuário; política de privacidade mais simples.
