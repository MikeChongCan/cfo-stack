#!/usr/bin/env python3
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable, Sequence


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


def _require_value(argv: Sequence[str], index: int, flag: str, description: str) -> tuple[str, int]:
    if index + 1 >= len(argv):
        raise UserError(f"Error: {flag} requires a value ({description})")
    return argv[index + 1], index + 2


def parse_setup_options(argv: Sequence[str]) -> SetupOptions:
    host = "auto"
    scope = "machine"
    project_dir: Path | None = None
    index = 0
    while index < len(argv):
        token = argv[index]
        if token in HOST_CHOICES:
            host = token
            index += 1
        elif token == "--host":
            host, index = _require_value(argv, index, "--host", ", ".join(HOST_CHOICES))
        elif token.startswith("--host="):
            host = token.split("=", 1)[1]
            index += 1
        elif token == "--scope":
            scope, index = _require_value(argv, index, "--scope", "machine or project")
        elif token.startswith("--scope="):
            scope = token.split("=", 1)[1]
            index += 1
        elif token == "--project-dir":
            value, index = _require_value(argv, index, "--project-dir", "a directory path")
            project_dir = Path(value)
        elif token.startswith("--project-dir="):
            project_dir = Path(token.split("=", 1)[1])
            index += 1
        else:
            raise UserError(f"Unknown argument: {token}")
    return SetupOptions(host=host, scope=scope, project_dir=project_dir)


def parse_uninstall_options(argv: Sequence[str]) -> UninstallOptions:
    host = "auto"
    scope = "machine"
    project_dir: Path | None = None
    remove_local_tools = False
    remove_state = False
    index = 0
    while index < len(argv):
        token = argv[index]
        if token in HOST_CHOICES:
            host = token
            index += 1
        elif token == "--host":
            host, index = _require_value(argv, index, "--host", ", ".join(HOST_CHOICES))
        elif token.startswith("--host="):
            host = token.split("=", 1)[1]
            index += 1
        elif token == "--scope":
            scope, index = _require_value(argv, index, "--scope", "machine or project")
        elif token.startswith("--scope="):
            scope = token.split("=", 1)[1]
            index += 1
        elif token == "--project-dir":
            value, index = _require_value(argv, index, "--project-dir", "a directory path")
            project_dir = Path(value)
        elif token.startswith("--project-dir="):
            project_dir = Path(token.split("=", 1)[1])
            index += 1
        elif token == "--remove-local-tools":
            remove_local_tools = True
            index += 1
        elif token == "--remove-state":
            remove_state = True
            index += 1
        else:
            raise UserError(f"Unknown argument: {token}")
    return UninstallOptions(
        host=host,
        scope=scope,
        project_dir=project_dir,
        remove_local_tools=remove_local_tools,
        remove_state=remove_state,
    )


def validate_common_options(options: CommonOptions, context: RuntimeContext) -> CommonOptions:
    if options.host not in HOST_CHOICES:
        raise UserError(
            f"Unknown --host value: {options.host} (expected {', '.join(HOST_CHOICES)})"
        )
    if options.scope not in SCOPE_CHOICES:
        raise UserError(f"Unknown --scope value: {options.scope} (expected machine or project)")
    if options.scope == "machine" and options.project_dir is not None:
        raise UserError("Error: --project-dir is only valid with --scope project")
    if options.scope == "project":
        project_dir = options.project_dir
        if project_dir is None:
            if context.run_dir == context.cfo_stack_dir:
                raise UserError(
                    "Error: --scope project requires --project-dir when run from the CFO Stack repo."
                )
            project_dir = context.run_dir
        project_dir = project_dir.expanduser()
        if not project_dir.exists() or not project_dir.is_dir():
            raise UserError(f"Error: project directory not found: {project_dir}")
        project_dir = project_dir.resolve()
        if isinstance(options, UninstallOptions):
            return UninstallOptions(
                host=options.host,
                scope=options.scope,
                project_dir=project_dir,
                remove_local_tools=options.remove_local_tools,
                remove_state=options.remove_state,
            )
        return SetupOptions(host=options.host, scope=options.scope, project_dir=project_dir)
    return options


def detect_install_targets(
    host: str,
    which: Callable[[str], str | None] = shutil.which,
) -> InstallTargets:
    if host == "auto":
        claude = which("claude") is not None
        codex = which("codex") is not None
        openclaw = which("openclaw") is not None
        antigravity = which("antigravity") is not None or which("gemini") is not None
        if not any((claude, codex, openclaw, antigravity)):
            claude = True
        return InstallTargets(claude=claude, codex=codex, openclaw=openclaw, antigravity=antigravity)
    return InstallTargets(
        claude=host == "claude",
        codex=host == "codex",
        openclaw=host == "openclaw",
        antigravity=host == "antigravity",
    )


def run_command(
    args: Sequence[str],
    *,
    cwd: Path | None = None,
    capture_output: bool = False,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        list(args),
        cwd=str(cwd) if cwd else None,
        check=True,
        text=True,
        capture_output=capture_output,
    )


def first_line(output: str) -> str:
    return output.strip().splitlines()[0] if output.strip() else ""


def detect_python(which: Callable[[str], str | None] = shutil.which) -> str:
    return which("python3") or which("python") or ""


def python_version_info(python_bin: str) -> tuple[int, int, str]:
    version_data = run_command(
        [
            python_bin,
            "-c",
            "import sys; print(sys.version_info.major); print(sys.version_info.minor)",
        ],
        capture_output=True,
    ).stdout.strip().splitlines()
    version_line = first_line(run_command([python_bin, "--version"], capture_output=True).stdout)
    return int(version_data[0]), int(version_data[1]), version_line


def require_python() -> tuple[str, str]:
    python_bin = detect_python()
    if not python_bin:
        raise UserError(
            "Error: Python 3 is required but not installed.\n"
            "  macOS:   brew install python\n"
            "  Ubuntu:  sudo apt install python3\n"
            "  Windows: https://python.org/downloads/"
        )
    major, minor, version_line = python_version_info(python_bin)
    if major < 3 or (major == 3 and minor < 10):
        raise UserError(
            f"Error: Python 3.10+ required by the current dependency set, found {major}.{minor}"
        )
    return python_bin, version_line


def require_command(name: str, install_hint: str | None = None) -> str:
    path = shutil.which(name)
    if path is None:
        message = f"Error: {name} is required but not installed."
        if install_hint:
            message += f"\n  {install_hint}"
        raise UserError(message)
    return path


def ensure_python_environment(context: RuntimeContext) -> None:
    python_bin, version_line = require_python()
    print(f"  Python: {version_line}")
    git_bin = require_command("git")
    print(f"  Git: {first_line(run_command([git_bin, '--version'], capture_output=True).stdout)}")
    uv_bin = require_command("uv", "Install it: curl -LsSf https://astral.sh/uv/install.sh | sh")
    print(f"  uv: {first_line(run_command([uv_bin, '--version'], capture_output=True).stdout)}")

    print("\nCreating local virtual environment...")
    run_command([uv_bin, "venv", "--allow-existing", "--python", python_bin, str(context.venv_dir)])
    print(f"  Virtualenv: {context.venv_dir}")

    print("\nInstalling Python dependencies via uv...")
    try:
        run_command(
            [
                uv_bin,
                "pip",
                "install",
                "--python",
                str(context.venv_python),
                "--quiet",
                "beancount",
                "fava",
                "beangulp",
                "beanquery",
            ]
        )
    except subprocess.CalledProcessError as exc:
        raise UserError(
            f"Error: Failed to install Python dependencies.\n"
            f'  Try running: uv pip install --python "{context.venv_python}" beancount fava beangulp beanquery'
        ) from exc

    verify_import(context.venv_python, "beancount", "Beancount installed but could not be imported.")
    bc_version = first_line(
        run_command(
            [str(context.venv_python), "-c", "import beancount; print(beancount.__version__)"],
            capture_output=True,
        ).stdout
    )
    print(f"  Beancount: {bc_version or 'installed'}")
    verify_import(context.venv_python, "fava", "Fava could not be imported.")
    print("  Fava: installed")

    if not (context.venv_bin / "bean-check").exists():
        raise UserError(f"Error: bean-check was not installed into {context.venv_bin}.")
    if not (context.venv_bin / "fava").exists():
        raise UserError(f"Error: fava executable was not installed into {context.venv_bin}.")


def verify_import(python_bin: Path, module: str, message: str) -> None:
    try:
        run_command([str(python_bin), "-c", f"import {module}"])
    except subprocess.CalledProcessError as exc:
        raise UserError(f"Error: {message}") from exc


def ensure_global_state(context: RuntimeContext, scope: str) -> None:
    if scope == "machine":
        context.state_dir.mkdir(parents=True, exist_ok=True)
        print("  State dir: ~/.cfo-stack/")
        if context.global_config.exists():
            print(f"  Default policy: {context.global_config} (existing)")
        else:
            context.global_config.write_text(POLICY_CONFIG_TEXT, encoding="utf-8")
            print(f"  Default policy: {context.global_config}")
    else:
        print("  Default policy: skipped (project scope keeps policy in the target ledger)")


def iter_skill_dirs(cfo_stack_dir: Path) -> Iterable[Path]:
    skills_root = cfo_stack_dir / "skills"
    if not skills_root.exists():
        return []
    return sorted(
        (
            path
            for path in skills_root.iterdir()
            if path.is_dir() and (path / "SKILL.md").is_file()
        ),
        key=lambda path: path.name,
    )


def link_skill_dirs(cfo_stack_dir: Path, skills_root: Path, prefix: str) -> list[str]:
    skills_root.mkdir(parents=True, exist_ok=True)
    linked: list[str] = []
    for skill_dir in iter_skill_dirs(cfo_stack_dir):
        skill_name = f"{prefix}{skill_dir.name}"
        target = skills_root / skill_name
        if target.is_symlink():
            target.unlink()
        elif target.exists():
            continue
        target.symlink_to(skill_dir)
        linked.append(skill_name)
    if linked:
        print(f"  Linked skills: {' '.join(linked)}")
    return linked


def remove_skill_links(cfo_stack_dir: Path, skills_root: Path, prefix: str) -> list[str]:
    removed: list[str] = []
    if not skills_root.exists():
        return removed
    for skill_dir in iter_skill_dirs(cfo_stack_dir):
        skill_name = f"{prefix}{skill_dir.name}"
        target = skills_root / skill_name
        if not target.is_symlink():
            continue
        if target.resolve() == skill_dir.resolve():
            target.unlink()
            removed.append(skill_name)
    if removed:
        print(f"  Removed skills: {' '.join(removed)}")
    else:
        print(f"  No CFO Stack skill links found in {skills_root}")
    return removed


def create_helper_scripts(context: RuntimeContext) -> None:
    bin_dir = context.cfo_stack_dir / "bin"
    bin_dir.mkdir(parents=True, exist_ok=True)
    for name, content in HELPER_SCRIPTS.items():
        path = bin_dir / name
        path.write_text(content, encoding="utf-8")
        path.chmod(0o755)


def print_setup_banner(options: SetupOptions) -> None:
    print("╔══════════════════════════════════════════╗")
    print("║          CFO Stack Setup                 ║")
    print("║    AI-Powered Accounting with CLEAR      ║")
    print("╚══════════════════════════════════════════╝")
    print("")
    print(f"  Scope: {options.scope}")
    if options.scope == "project" and options.project_dir is not None:
        print(f"  Project dir: {options.project_dir}")


def print_uninstall_banner(options: UninstallOptions) -> None:
    print("╔══════════════════════════════════════════╗")
    print("║        CFO Stack Uninstall               ║")
    print("║     Remove host registrations safely     ║")
    print("╚══════════════════════════════════════════╝")
    print("")
    print(f"  Scope: {options.scope}")
    if options.scope == "project" and options.project_dir is not None:
        print(f"  Project dir: {options.project_dir}")


def print_setup_complete(context: RuntimeContext, options: SetupOptions) -> None:
    print("")
    print("╔══════════════════════════════════════════╗")
    print("║          Setup Complete!                 ║")
    print("╠══════════════════════════════════════════╣")
    print("║                                          ║")
    print("║  Quick start:                            ║")
    print("║    1. Run /setup to create your ledger   ║")
    if options.scope == "machine":
        print("║    2. Edit ~/.cfo-stack/config.yaml      ║")
        print("║       if you want a different review     ║")
        print("║       threshold than $1,000             ║")
    else:
        print("║    2. Create ledger-local cfo-stack.yaml ║")
        print("║       in your target project if you want ║")
        print("║       policy overrides                   ║")
    print("║    3. Drop bank CSVs in ~/Downloads      ║")
    print("║    4. Run /capture to import them        ║")
    print("║    5. Run /classify to categorize        ║")
    print("║    6. Run /report to see your finances   ║")
    print("║    7. Run cfo-dashboard from this repo   ║")
    print("║                                          ║")
    print("║  The CLEAR cycle:                        ║")
    print("║    Capture → Log → Extract →              ║")
    print("║    Automate → Report                      ║")
    print("║                                          ║")
    print("╚══════════════════════════════════════════╝")
    print("")
    print(f"Helper scripts live in: {context.cfo_stack_dir / 'bin'}")
    if options.scope == "project" and options.project_dir is not None:
        print("Run them from your target project, for example:")
        print(f"  (cd {options.project_dir} && {context.cfo_stack_dir / 'bin' / 'cfo-check'})")
        print(f"  (cd {options.project_dir} && {context.cfo_stack_dir / 'bin' / 'cfo-dashboard'})")


def registration_root(host: str, scope: str, context: RuntimeContext, project_dir: Path | None) -> Path:
    if scope == "project":
        assert project_dir is not None
        if host == "claude":
            return project_dir / ".claude" / "skills"
        return project_dir / ".agents" / "skills"
    if host == "claude":
        return context.home_dir / ".claude" / "skills"
    if host == "codex":
        return context.home_dir / ".agents" / "skills"
    if host == "openclaw":
        return context.home_dir / ".openclaw" / "skills"
    if host == "antigravity":
        return context.home_dir / ".gemini" / "antigravity" / "skills"
    raise ValueError(host)


def perform_setup(options: SetupOptions, context: RuntimeContext) -> None:
    targets = detect_install_targets(options.host)
    print_setup_banner(options)
    ensure_python_environment(context)
    ensure_global_state(context, options.scope)

    linked_roots: set[Path] = set()
    host_targets = [
        ("claude", targets.claude),
        ("codex", targets.codex),
        ("openclaw", targets.openclaw),
        ("antigravity", targets.antigravity),
    ]
    for host_name, enabled in host_targets:
        if not enabled:
            continue
        print("")
        label = {
            "claude": "Claude Code",
            "codex": "Codex",
            "openclaw": "OpenClaw",
            "antigravity": "Antigravity",
        }[host_name]
        print(f"Registering with {label}...")
        root = registration_root(host_name, options.scope, context, options.project_dir)
        if root not in linked_roots:
            link_skill_dirs(context.cfo_stack_dir, root, "cfo-")
            linked_roots.add(root)
        if options.scope == "project":
            print(f"  cfo-stack ready ({host_name} project scope).")
            print(f"  {host_name} project skills: {root}")
        else:
            print(f"  cfo-stack ready ({host_name}).")
            print(f"  {host_name} skills: {root}")

    create_helper_scripts(context)
    print_setup_complete(context, options)


def perform_uninstall(options: UninstallOptions, context: RuntimeContext) -> None:
    print_uninstall_banner(options)
    cleaned_roots: set[Path] = set()
    host_targets = [
        ("claude", options.host in ("auto", "claude")),
        ("codex", options.host in ("auto", "codex")),
        ("openclaw", options.host in ("auto", "openclaw")),
        ("antigravity", options.host in ("auto", "antigravity")),
    ]
    for host_name, enabled in host_targets:
        if not enabled:
            continue
        label = {
            "claude": "Claude Code",
            "codex": "Codex",
            "openclaw": "OpenClaw",
            "antigravity": "Antigravity",
        }[host_name]
        print(f"Unregistering from {label}...")
        roots = [registration_root(host_name, options.scope, context, options.project_dir)]
        if host_name == "codex" and options.scope == "machine":
            roots.append(context.home_dir / ".codex" / "skills")
        for root in roots:
            if root in cleaned_roots:
                continue
            remove_skill_links(context.cfo_stack_dir, root, "cfo-")
            cleaned_roots.add(root)
        print("")

    if options.remove_local_tools:
        print("Removing repo-local tooling...")
        for helper in HELPER_SCRIPTS:
            (context.cfo_stack_dir / "bin" / helper).unlink(missing_ok=True)
        bin_dir = context.cfo_stack_dir / "bin"
        if bin_dir.exists() and not any(bin_dir.iterdir()):
            bin_dir.rmdir()
            print("  Removed empty bin/")
        shutil.rmtree(context.cfo_stack_dir / "skills" / "report-dashboard" / "scripts" / "node_modules", ignore_errors=True)
        shutil.rmtree(context.venv_dir, ignore_errors=True)
        print("  Removed .venv, generated helper scripts, and dashboard node_modules")
        print("")

    if options.remove_state:
        if options.scope == "project":
            print("Skipping global CFO Stack state removal in project scope.")
        else:
            print("Removing global CFO Stack state...")
            context.global_config.unlink(missing_ok=True)
            if context.state_dir.exists() and not any(context.state_dir.iterdir()):
                context.state_dir.rmdir()
                print(f"  Removed empty {context.state_dir}")
            else:
                print(f"  Removed {context.global_config}")
            print("")

    print("Done.")


def main(command: str, argv: Sequence[str] | None = None) -> int:
    argv = list(argv or [])
    context = RuntimeContext(
        cfo_stack_dir=Path(__file__).resolve().parent,
        run_dir=Path.cwd().resolve(),
        home_dir=Path.home(),
    )
    try:
        if command == "setup":
            options = validate_common_options(parse_setup_options(argv), context)
            assert isinstance(options, SetupOptions)
            perform_setup(options, context)
            return 0
        if command == "uninstall":
            options = validate_common_options(parse_uninstall_options(argv), context)
            assert isinstance(options, UninstallOptions)
            perform_uninstall(options, context)
            return 0
        raise UserError(f"Unknown command: {command}")
    except UserError as exc:
        print(str(exc), file=sys.stderr)
        return 1
