#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../vagare-app"

yarn lint
yarn typecheck
