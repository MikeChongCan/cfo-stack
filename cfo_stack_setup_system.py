from __future__ import annotations

import shutil
import subprocess
from pathlib import Path
from typing import Callable, Sequence

from cfo_stack_setup_data import InstallTargets, RuntimeContext, UserError


def detect_install_targets(host: str, which: Callable[[str], str | None] = shutil.which) -> InstallTargets:
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
    dry_run: bool = False,
) -> subprocess.CompletedProcess[str]:
    if dry_run:
        return subprocess.CompletedProcess(list(args), 0, "", "")
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
        [python_bin, "-c", "import sys; print(sys.version_info.major); print(sys.version_info.minor)"],
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
        raise UserError(f"Error: Python 3.10+ required by the current dependency set, found {major}.{minor}")
    return python_bin, version_line


def require_command(name: str, install_hint: str | None = None) -> str:
    path = shutil.which(name)
    if path is None:
        message = f"Error: {name} is required but not installed."
        if install_hint:
            message += f"\n  {install_hint}"
        raise UserError(message)
    return path


def verify_import(python_bin: Path, module: str, message: str, dry_run: bool = False) -> None:
    try:
        run_command([str(python_bin), "-c", f"import {module}"], dry_run=dry_run)
    except subprocess.CalledProcessError as exc:
        raise UserError(f"Error: {message}") from exc


def ensure_python_environment(context: RuntimeContext, dry_run: bool = False) -> None:
    python_bin, version_line = require_python()
    print(f"  Python: {version_line}")
    git_bin = require_command("git")
    print(f"  Git: {first_line(run_command([git_bin, '--version'], capture_output=True).stdout)}")
    uv_bin = require_command("uv", "Install it: curl -LsSf https://astral.sh/uv/install.sh | sh")
    print(f"  uv: {first_line(run_command([uv_bin, '--version'], capture_output=True).stdout)}")

    print("\nCreating local virtual environment...")
    if dry_run:
        print(f"  Dry run: would create virtualenv at {context.venv_dir}")
    else:
        run_command([uv_bin, "venv", "--allow-existing", "--python", python_bin, str(context.venv_dir)])
    print(f"  Virtualenv: {context.venv_dir}")

    print("\nInstalling Python dependencies via uv...")
    if dry_run:
        print("  Dry run: would install beancount, fava, beangulp, beanquery")
        print("  Beancount: installed")
        print("  Fava: installed")
        return

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
        run_command([str(context.venv_python), "-c", "import beancount; print(beancount.__version__)"], capture_output=True).stdout
    )
    print(f"  Beancount: {bc_version or 'installed'}")
    verify_import(context.venv_python, "fava", "Fava could not be imported.")
    print("  Fava: installed")

    if not (context.venv_bin / "bean-check").exists():
        raise UserError(f"Error: bean-check was not installed into {context.venv_bin}.")
    if not (context.venv_bin / "fava").exists():
        raise UserError(f"Error: fava executable was not installed into {context.venv_bin}.")
