from __future__ import annotations

import signal
import sys
from pathlib import Path
from typing import Sequence

from cfo_stack_setup_data import RuntimeContext, SetupOptions, UninstallOptions, UserError
from cfo_stack_setup_ops import perform_setup, perform_uninstall
from cfo_stack_setup_parse import parse_setup_options, parse_uninstall_options, validate_common_options


def build_runtime_context() -> RuntimeContext:
    return RuntimeContext(
        cfo_stack_dir=Path(__file__).resolve().parent,
        run_dir=Path.cwd().resolve(),
        home_dir=Path.home(),
    )


def _prompt_with_timeout(prompt: str, timeout_seconds: int) -> str:
    if not hasattr(signal, "SIGALRM"):
        return input(prompt)

    def _handle_timeout(signum: int, frame: object) -> None:
        raise TimeoutError

    previous_handler = signal.getsignal(signal.SIGALRM)
    signal.signal(signal.SIGALRM, _handle_timeout)
    signal.alarm(timeout_seconds)
    try:
        return input(prompt)
    except TimeoutError:
        return ""
    finally:
        signal.alarm(0)
        signal.signal(signal.SIGALRM, previous_handler)


def resolve_setup_options(options: SetupOptions) -> SetupOptions:
    if options.skill_naming is not None:
        return options
    if not sys.stdin.isatty():
        return SetupOptions(
            host=options.host,
            scope=options.scope,
            project_dir=options.project_dir,
            dry_run=options.dry_run,
            skill_naming="namespaced",
        )

    print("")
    print("Skill naming: how should CFO Stack skills appear?")
    print("")
    print("  1) Short names: /setup, /capture, /report")
    print("     Use this if CFO Stack is the only skill pack in the workspace.")
    print("")
    print("  2) Namespaced: /cfo-setup, /cfo-capture, /cfo-report")
    print("     Recommended. Avoids collisions with other skill packs.")
    print("")
    try:
        choice = _prompt_with_timeout("Choice [1/2] (default: 2, auto-selects in 10s): ", 10).strip()
    except EOFError:
        choice = ""
    skill_naming = "short" if choice == "1" else "namespaced"
    return SetupOptions(
        host=options.host,
        scope=options.scope,
        project_dir=options.project_dir,
        dry_run=options.dry_run,
        skill_naming=skill_naming,
    )


def main(command: str, argv: Sequence[str] | None = None) -> int:
    context = build_runtime_context()
    args = list(argv or [])
    try:
        if command == "setup":
            options = resolve_setup_options(parse_setup_options(args))
            options = validate_common_options(options, context)
            assert isinstance(options, SetupOptions)
            perform_setup(options, context)
            return 0
        if command == "uninstall":
            options = validate_common_options(parse_uninstall_options(args), context)
            assert isinstance(options, UninstallOptions)
            perform_uninstall(options, context)
            return 0
        raise UserError(f"Unknown command: {command}")
    except UserError as exc:
        print(str(exc), file=sys.stderr)
        return 1
