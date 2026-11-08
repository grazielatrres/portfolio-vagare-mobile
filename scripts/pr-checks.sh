#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../vagare-app"

npx expo-doctor
yarn lint
yarn typecheck
