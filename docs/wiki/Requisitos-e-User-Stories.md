# Requisitos e User Stories

Fonte: RFC do projeto (seções 2.1 a 2.6). Ator único: o **viajante**, qualquer pessoa autenticada que planeja uma viagem.

## Personas

- **William, 27 anos, analista comercial** — viaja algumas vezes por ano e hoje espalha o planejamento entre planilhas, notas e e-mails.
- **Maria Helena, 20 anos, atendente e estudante** — orçamento apertado; precisa saber quanto já gastou e quanto sobra.

## User stories

| ID | Como viajante, quero… | Para… | Requisitos |
|---|---|---|---|
| US01 | criar uma conta com e-mail e senha ou entrar com Google | acessar minhas viagens de qualquer aparelho | RF01–RF05 |
| US02 | redefinir minha senha pelo e-mail | recuperar o acesso se esquecer a senha | RF02 |
| US03 | criar uma viagem com destino, datas, orçamento e número de pessoas | começar o planejamento | RF06, RF07 |
| US04 | ver todas as minhas viagens e editar ou excluir uma delas | manter meus planos organizados | RF08–RF11 |
| US05 | adicionar atividades a cada dia da viagem | montar meu roteiro | RF12–RF14 |
| US06 | ver o roteiro em formato de calendário | enxergar a viagem inteira de relance | RF15 |
| US07 | consultar a previsão do tempo do destino | planejar atividades e bagagem | RF16 |
| US08 | definir o orçamento e registrar gastos por categoria | saber quanto gastei e quanto sobra | RF17–RF20 |
| US09 | guardar dados de voos e hospedagens | ter tudo à mão durante a viagem | RF21–RF24 |
| US10 | consultar e editar a viagem sem internet | usar o app em aeroportos e no exterior | RF25, RNF08 |
| US11 | editar meus dados ou excluir minha conta | ter controle sobre meus dados (LGPD) | — |

## Casos de uso principais

| UC | Fluxo principal | Alternativo | Exceção |
|---|---|---|---|
| UC01 Criar conta | Preenche nome, e-mail e senha → "Criar conta" → entra na tela inicial | Cadastro com Google | E-mail já usado; senha fora da política |
| UC02 Criar viagem | "Nova viagem" → nome, destino, datas, orçamento, pessoas → "Criar viagem" | Sem orçamento | Campos obrigatórios vazios; fim antes do início |
| UC03 Montar roteiro | Aba Roteiro → dia → adicionar atividade (nome, horário, local) | Sem horário | Nome vazio |
| UC04 Registrar gasto | Aba Orçamento → adicionar gasto (descrição, valor, categoria) → saldo atualiza | Sem categoria | Valor vazio ou inválido |
| UC05 Registrar informação | Aba Info → voo ou hospedagem → preencher → salvar | Preenchimento parcial | Nenhum campo preenchido |

## Requisitos funcionais

| ID | Requisito | Status |
|---|---|---|
| RF01 | Criar conta com nome, e-mail e senha | Implementado |
| RF02 | Login com e-mail e senha | Implementado |
| RF03 | Login com conta Google | Implementado |
| RF04 | Avisar quando o e-mail já está em uso | Implementado |
| RF05 | Política de senha no cadastro | Implementado (8+ caracteres, maiúscula, minúscula, número e caractere especial, mais rígida que os 6 da RFC) |
| RF06 | Criar viagem com nome, destino e datas | Implementado |
| RF07 | Orçamento estimado e número de pessoas | Implementado |
| RF08 | Listar viagens com nome, destino, datas e orçamento | Implementado |
| RF09 | Editar viagem | Implementado |
| RF10 | Excluir viagem e dados vinculados | Implementado |
| RF11 | Estado vazio com opção de criar | Implementado |
| RF12 | Adicionar atividades com nome, horário e local | Implementado |
| RF13 | Atividades organizadas por dia dentro do período | Implementado |
| RF14 | Mover atividades entre dias | Implementado (pela edição da data da atividade) |
| RF15 | Roteiro em formato de calendário | Implementado |
| RF16 | Previsão do tempo do destino | Implementado |
| RF17 | Definir orçamento total | Implementado |
| RF18 | Registrar gastos com descrição, valor e categoria | Implementado |
| RF19 | Calcular e exibir saldo | Implementado |
| RF20 | Detalhar gastos por categoria e item | Implementado |
| RF21 | Registrar voos | Implementado |
| RF22 | Registrar hospedagens | Implementado |
| RF23 | Registrar documentos | Suportado pela API; fora da interface desta versão |
| RF24 | Informações agrupadas por categoria | Implementado |
| RF25 | Dados da viagem disponíveis offline | Implementado |

## Requisitos não funcionais

| ID | Requisito | Como o app atende |
|---|---|---|
| RNF01–RNF02 | Telas em < 2 s; dados locais em < 1 s | Cache do TanStack Query + SQLite; tempo de tela medido no Sentry |
| RNF03 | Clima em até 3 s | Consulta sob demanda, isolada na aba Clima |
| RNF04–RNF07 | JWT, senhas criptografadas, HTTPS, isolamento por usuário | Tokens no SecureStore; API com bcrypt, TLS e filtro por dono |
| RNF08 | Roteiro, orçamento e infos offline | SQLite + fila de sincronização |
| RNF09 | Mensagens claras sem internet | Banner offline, banner de sincronização e toasts |
| RNF11 | Tudo em português | Textos e mensagens de erro em pt-BR |
| RNF12 | iOS e Android recentes | Expo SDK 57 / React Native 0.86 |
| RNF13 | Acessibilidade básica | Alvos de toque ≥ 44 pt, `accessibilityLabel` e `accessibilityRole` |

## Regras de negócio

RN01 só usuários autenticados · RN02 nome, destino e datas obrigatórios · RN03 fim ≥ início · RN04 exclusão em cascata e irreversível · RN05 saldo calculado pelo sistema · RN06 gasto acima do orçamento é permitido, com saldo negativo destacado · RN07 atividade só dentro do período · RN08 falha do clima não afeta o resto · RN09 alterações offline sincronizam quando a conexão volta · RN10 viagens não são compartilhadas.

## Fora do escopo

Reservas e compras (FS01), planejamento colaborativo (FS02), sugestões por IA (FS03), importação de e-mails (FS04), mapa com navegação (FS05), versão web (FS06) e notificações push (FS07).
