# Fluxos de Uso

O Playbook exige ao menos três fluxos completos. O Vagare entrega cinco, todos ponta a ponta (app → API → banco) e com tratamento de erro e de falta de conexão.

## Fluxo 1 — Conta e acesso

1. Na tela de boas-vindas, toca em **Criar conta**.
2. Preenche nome, e-mail e senha; a lista de requisitos da senha marca cada regra cumprida.
3. O app chama `POST /auth/register`, guarda os tokens no SecureStore e abre **Minhas viagens**.
4. Alternativas: **Entrar com Google** (`POST /auth/google`) ou login com e-mail e senha.
5. Esqueceu a senha: informa o e-mail, recebe um link, abre o app pelo link e define a nova senha.
6. A sessão é renovada sozinha pelo refresh token; **Sair** encerra a sessão no servidor.

Erros tratados: e-mail já cadastrado, senha fora da política, credenciais inválidas, muitas tentativas (rate limit), sem conexão.

## Fluxo 2 — Planejar uma viagem

1. Em **Minhas viagens** (ou no estado vazio), toca em **Nova viagem**.
2. Informa nome, destino (com busca de local), datas, orçamento, moeda e número de pessoas.
3. A viagem é criada e o app abre o detalhe.
4. Na aba **Roteiro**, adiciona atividades em cada dia, com horário, local, categoria e custo estimado.
5. Na aba **Calendário**, vê os dias com atividades marcados no mês.
6. Na aba **Clima**, consulta a previsão do destino.
7. Pode editar ou excluir a viagem; a exclusão pede confirmação e remove tudo o que estava vinculado.

Erros tratados: campos obrigatórios vazios, data de fim antes do início, atividade fora do período, clima indisponível sem afetar as outras abas.

## Fluxo 3 — Controlar o orçamento

1. No detalhe da viagem, abre a aba **Orçamento**.
2. Vê orçamento total, total gasto, saldo e o custo estimado das atividades.
3. Adiciona um gasto com descrição, valor, moeda e categoria.
4. O saldo é recalculado e o detalhamento por categoria é atualizado.
5. Se os gastos passarem do orçamento, o saldo negativo fica destacado.

Erros tratados: valor vazio ou inválido, moeda inválida.

## Fluxo 4 — Informações práticas

1. Na aba **Info**, escolhe **Voo** ou **Hospedagem**.
2. Preenche os dados (companhia, número do voo, horários; ou nome, endereço, check-in e check-out).
3. As informações aparecem agrupadas por tipo e podem ser editadas ou removidas.

## Fluxo 5 — Usar offline

1. Ao abrir uma viagem com internet, o app guarda viagens, atividades, gastos e infos no SQLite.
2. Sem conexão, o app mostra um banner e continua exibindo os dados salvos.
3. Criações, edições e exclusões feitas offline entram numa fila local, com id provisório.
4. Quando a conexão volta (verificação periódica e ao voltar ao app), a fila é enviada em ordem com `Idempotency-Key`, sem duplicar registros.
5. Um banner mostra a sincronização em andamento; ao sair da conta com pendências, o app avisa antes de descartar.

## Cobertura por testes

| Fluxo | Testes automatizados (Jest) |
|---|---|
| 1 | `AuthContext.test.tsx`, `PasswordInput.test.tsx`, `passwordPolicy.test.ts`, `useSafeLogout.test.ts` |
| 2 | `useCreateTripMutation.test.ts`, `useTripsQuery.test.ts`, `useCreateActivityMutation.test.ts`, `activityPeriod.test.ts` |
| 3 | `useBudgetQuery.test.ts`, `useExpenseMutations.test.ts`, `budget.test.ts`, `currency.test.ts` |
| 4 | `FlightForm.test.tsx`, `LodgingForm.test.tsx`, `FlightCard.test.tsx`, `InfoTab.test.tsx` |
| 5 | `syncQueue.test.ts`, `useSyncQueueDrain.test.ts`, `offlinePrefetch.test.ts`, `*Cache.test.ts` |
