from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


HOST_CHOICES = ("claude", "codex", "openclaw", "antigravity", "auto")
SCOPE_CHOICES = ("machine", "project")
POLICY_CONFIG_TEXT = """# yaml-language-server: $schema=https://raw.githubusercontent.com/MikeChongCan/cfo-stack/main/schemas/policy.schema.json
version: 1
review_policy:
  large_transaction_human_confirmation:
    enabled: true
    amount: 1000
    currency_mode: ledger_operating_currency
    note: >-
      Default review threshold installed by CFO Stack setup. Ledger-local
      cfo-stack.yaml may override this value.
"""
HELPER_SCRIPTS = {
    "cfo-check": """#!/usr/bin/env bash
# Wrapper around bean-check with ledger auto-discovery
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENV_BIN="$ROOT_DIR/.venv/bin"
LEDGER="${1:-}"
if [ -z "$LEDGER" ]; then
  if [ -f "./main.beancount" ]; then
    LEDGER="./main.beancount"
  elif [ -f "./ledger/main.beancount" ]; then
    LEDGER="./ledger/main.beancount"
  else
    LEDGER="$(find . -type f -name main.beancount | head -n 1 || true)"
  fi
fi
if [ -z "$LEDGER" ]; then
  echo "Error: no ledger found. Pass a Beancount file explicitly or create main.beancount." >&2
  exit 1
fi
if [ ! -f "$LEDGER" ]; then
  echo "Error: $LEDGER not found" >&2
  exit 1
fi
"$VENV_BIN/bean-check" "$LEDGER" 2>&1
echo "Ledger OK: $LEDGER"
""",
    "cfo-fava": """#!/usr/bin/env bash
# Launch Fava web UI
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENV_BIN="$ROOT_DIR/.venv/bin"
LEDGER="${1:-}"
PORT="${2:-5000}"
if [ -z "$LEDGER" ]; then
  if [ -f "./main.beancount" ]; then
    LEDGER="./main.beancount"
  elif [ -f "./ledger/main.beancount" ]; then
    LEDGER="./ledger/main.beancount"
  else
    LEDGER="$(find . -type f -name main.beancount | head -n 1 || true)"
  fi
fi
if [ -z "$LEDGER" ]; then
  echo "Error: no ledger found. Pass a Beancount file explicitly or create main.beancount." >&2
  exit 1
fi
if [ ! -f "$LEDGER" ]; then
  echo "Error: $LEDGER not found" >&2
  exit 1
fi
echo "Starting Fava (read-only) on http://localhost:$PORT ..."
"$VENV_BIN/fava" "$LEDGER" --port "$PORT" --read-only
""",
    "cfo-dashboard": """#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_DIR="$ROOT_DIR/skills/report-dashboard/scripts"

if ! command -v bun >/dev/null 2>&1; then
  echo "Error: bun is required for cfo-dashboard." >&2
  echo "Install Bun from https://bun.sh and run this command again." >&2
  exit 1
fi

if [ ! -d "$SCRIPTS_DIR/node_modules" ]; then
  echo "Installing dashboard dependencies with Bun..."
  (cd "$SCRIPTS_DIR" && bun install)
fi

exec bun --cwd "$SCRIPTS_DIR" run generate -- "$@"
""",
}


class UserError(Exception):
    pass


@dataclass(frozen=True)
class CommonOptions:
    host: str = "auto"
    scope: str = "machine"
    project_dir: Path | None = None
    dry_run: bool = False


@dataclass(frozen=True)
class SetupOptions(CommonOptions):
    pass


@dataclass(frozen=True)
class UninstallOptions(CommonOptions):
    remove_local_tools: bool = False
    remove_state: bool = False


@dataclass(frozen=True)
class RuntimeContext:
    cfo_stack_dir: Path
    run_dir: Path
    home_dir: Path

    @property
    def venv_dir(self) -> Path:
        return self.cfo_stack_dir / ".venv"

    @property
    def venv_bin(self) -> Path:
        return self.venv_dir / "bin"

    @property
    def venv_python(self) -> Path:
        return self.venv_bin / "python"

    @property
    def state_dir(self) -> Path:
        return self.home_dir / ".cfo-stack"

    @property
    def global_config(self) -> Path:
        return self.state_dir / "config.yaml"


@dataclass(frozen=True)
class InstallTargets:
    claude: bool = False
    codex: bool = False
    openclaw: bool = False
    antigravity: bool = False
