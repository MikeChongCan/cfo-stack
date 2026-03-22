from __future__ import annotations

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


def main(command: str, argv: Sequence[str] | None = None) -> int:
    context = build_runtime_context()
    args = list(argv or [])
    try:
        if command == "setup":
            options = validate_common_options(parse_setup_options(args), context)
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
