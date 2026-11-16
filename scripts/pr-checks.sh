#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

yarn lint
yarn typecheck
# Gera coverage/lcov.info (lido pelo SonarCloud) e falha abaixo de 25%.
yarn test:coverage
