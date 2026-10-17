# vagare

## Rodando com Docker

Pré-requisito: Docker Desktop. A API (`portfolio-vagare-backend`) e o Postgres sobem separadamente com `docker compose up -d` no projeto do backend.

```bash
cp .env.example .env
```

No `.env`:

- `EXPO_PUBLIC_API_URL`: URL da API. No celular, use o IP da sua máquina (ex.: `http://192.168.0.10:3000`), pois `localhost` aponta para o próprio celular.
- `REACT_NATIVE_PACKAGER_HOSTNAME`: IP da sua máquina na rede local, para o Expo Go alcançar o Metro.

```bash
docker compose up --build
```

O Metro fica em `http://localhost:8081` (Expo Web) e o QR code aparece nos logs do container. Alterações no código recarregam automaticamente. Depois de mudar o `.env` ou as dependências, rode `docker compose up --build` de novo.

Para parar: `docker compose down` (use `-v` para também apagar o volume do `node_modules`).
