# Guia de Contribuição

## Fluxo de trabalho

1. Crie uma branch a partir de `develop`: `feat/<assunto>`, `fix/<assunto>`, `style/<assunto>` ou `chore/<assunto>`.
2. Rode localmente seguindo [Instalação e Deploy](Instalacao-e-Deploy#rodar-localmente-desenvolvimento).
3. Antes do PR: `yarn lint && yarn typecheck && yarn test:coverage` (o mesmo `scripts/pr-checks.sh` do CI).
4. Abra o PR para `develop` explicando o que mudou e quais requisitos (RF/RN) afeta; inclua print ou vídeo quando mudar tela.
5. O CI e o SonarCloud precisam passar e o PR precisa de revisão antes do merge.
6. `develop` vai para `main` por PR; o merge na `main` dispara o build de produção.

## Padrões

- Commits em Conventional Commits: `feat:`, `fix:`, `style:`, `chore:`, `docs:`, `test:`, `refactor:`.
- Nova tela: rota em `app/` só monta a tela; a tela fica em `src/screens/<Nome>/`; dados sempre por um hook em `src/hooks/`.
- Nova chamada à API: função em `src/services/<recurso>.ts`; se o recurso funciona offline, atualizar também o cache e a fila (`syncQueue.ts`).
- Componentes reutilizáveis em `src/components/`, com cores, fontes e espaçamentos de `src/theme/`.
- Acessibilidade: alvos de toque com no mínimo 44 pt, `accessibilityLabel` e `accessibilityRole` em ícones e botões.
- Textos para o usuário em português; código em inglês.
- Falhas que não devem quebrar a tela: `logError('<contexto>', error)`, que também envia ao Sentry.
- Toda lógica nova vem com teste em `tests/`.
