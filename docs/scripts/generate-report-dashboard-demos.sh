#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DEMO_DIR="$ROOT_DIR/docs/static/demo/report-dashboard"
GENERATOR_DIR="$ROOT_DIR/skills/report-dashboard/scripts"

rm -rf "$DEMO_DIR"
mkdir -p "$DEMO_DIR"

cd "$GENERATOR_DIR"
bun install --frozen-lockfile
bun run generate -- --sample-set all --output ../../../docs/static/demo/report-dashboard
