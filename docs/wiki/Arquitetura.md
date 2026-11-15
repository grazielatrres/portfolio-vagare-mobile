# Arquitetura do App

O app segue uma arquitetura em camadas próxima de **Clean Architecture / MVVM**: telas só renderizam, hooks fazem o papel de ViewModel e services isolam API, banco local e sincronização.

## Visão geral (C4 — containers)

```mermaid
flowchart TB
    subgraph device[Dispositivo]
        subgraph app[App Vagare — Expo / React Native]
            ui[Rotas e telas<br/>app/ + src/screens]
            hooks[Hooks<br/>TanStack Query]
            services[Services<br/>API, cache, fila]
        end
        sqlite[(SQLite<br/>cache + fila de pendências)]
        secure[(SecureStore<br/>tokens)]
    end

    api[Vagare API<br/>AWS EC2 · HTTPS]
    google[Google OAuth]
    osm[Nominatim / OSM]
    sentry[Sentry]

    ui --> hooks --> services
    services --> sqlite
    services --> secure
    services -->|REST + JWT| api
    ui -->|login| google
    services -->|busca de locais| osm
    app -. erros e performance .-> sentry
```

## Camadas

```mermaid
flowchart LR
    screens["Screens / Components<br/>src/screens, src/components"] --> hooks["Hooks (ViewModel)<br/>useTripsQuery, useCreateExpenseMutation…"]
    hooks --> services["Services<br/>trips.ts, expenses.ts, api.ts"]
    hooks --> cache["Cache local<br/>tripsCache.ts, expensesCache.ts"]
    hooks --> queue["Fila offline<br/>syncQueue.ts"]
    services --> http[(API REST)]
    cache --> db[(SQLite)]
    queue --> db
    utils["Utils puros<br/>date, currency, budget"] -.-> screens
    utils -.-> hooks
```

| Pasta | Papel | Regra |
|---|---|---|
| `app/` | Rotas do Expo Router | Só monta a tela e passa parâmetros |
| `src/screens/` | Telas e componentes específicos de cada tela | Sem chamada direta à API |
| `src/components/` | Componentes reutilizáveis (Button, Input, ConfirmModal, banners) | Sem regra de negócio |
| `src/hooks/` | Queries e mutations do TanStack Query, estado de tela | Única ponte entre UI e services |
| `src/services/` | Cliente HTTP, cache SQLite, fila de sincronização, monitoramento | Sem React |
| `src/contexts/` | Sessão (AuthContext) e toasts | Estado global mínimo |
| `src/utils/` | Funções puras (datas, moedas, orçamento, política de senha) | 100% testáveis |
| `src/theme/` | Cores, fontes e espaçamentos | Design system próprio |

## Modo offline e sincronização

```mermaid
sequenceDiagram
    participant U as Usuário
    participant H as Hook (mutation)
    participant C as Cache SQLite
    participant Q as Fila de pendências
    participant A as API

    U->>H: cria gasto sem internet
    H->>C: grava com id local (local-uuid)
    H->>Q: enfileira create + payload
    H-->>U: gasto aparece na hora (otimista)
    Note over Q: verificação a cada 30 s<br/>e ao voltar para o app
    Q->>A: POST /expenses + Idempotency-Key
    A-->>Q: 201 com id definitivo
    Q->>C: troca id local pelo definitivo
    Q-->>U: banner "sincronizado"
```

- Leituras: o TanStack Query busca na API; quando falha por rede, o hook cai para o cache SQLite.
- Escritas: com rede, vão direto à API e atualizam o cache; sem rede, entram na fila.
- Transações SQLite são serializadas (`transactionQueue.ts`) para evitar transações aninhadas.
- O `Idempotency-Key` garante que um reenvio após timeout não duplique o registro na API.

## Segurança

- Access e refresh tokens no **SecureStore** (Keychain/Keystore), nunca em AsyncStorage.
- Renovação automática do token quando a API devolve 401, com uma única renovação em paralelo.
- Logout e exclusão de conta limpam caches locais e a fila.
- Sentry configurado sem dados pessoais (`sendDefaultPii: false`), identificando o usuário só pelo id.
