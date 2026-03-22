from __future__ import annotations

from pathlib import Path
from typing import Sequence

from cfo_stack_setup_data import (
    HOST_CHOICES,
    SCOPE_CHOICES,
    RuntimeContext,
    SetupOptions,
    UninstallOptions,
    UserError,
)


def _require_value(argv: Sequence[str], index: int, flag: str, description: str) -> tuple[str, int]:
    if index + 1 >= len(argv):
        raise UserError(f"Error: {flag} requires a value ({description})")
    return argv[index + 1], index + 2


def parse_setup_options(argv: Sequence[str]) -> SetupOptions:
    host = "auto"
    scope = "machine"
    project_dir: Path | None = None
    dry_run = False
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
        elif token == "--dry-run":
            dry_run = True
            index += 1
        else:
            raise UserError(f"Unknown argument: {token}")
    return SetupOptions(host=host, scope=scope, project_dir=project_dir, dry_run=dry_run)


def parse_uninstall_options(argv: Sequence[str]) -> UninstallOptions:
    host = "auto"
    scope = "machine"
    project_dir: Path | None = None
    dry_run = False
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
        elif token == "--dry-run":
            dry_run = True
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
        dry_run=dry_run,
        remove_local_tools=remove_local_tools,
        remove_state=remove_state,
    )


def validate_common_options(
    options: SetupOptions | UninstallOptions,
    context: RuntimeContext,
) -> SetupOptions | UninstallOptions:
    if options.host not in HOST_CHOICES:
        raise UserError(f"Unknown --host value: {options.host} (expected {', '.join(HOST_CHOICES)})")
    if options.scope not in SCOPE_CHOICES:
        raise UserError(f"Unknown --scope value: {options.scope} (expected machine or project)")
    if options.scope == "machine" and options.project_dir is not None:
        raise UserError("Error: --project-dir is only valid with --scope project")
    if options.scope != "project":
        return options

    project_dir = options.project_dir
    if project_dir is None:
        if context.run_dir == context.cfo_stack_dir:
            raise UserError("Error: --scope project requires --project-dir when run from the CFO Stack repo.")
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
            dry_run=options.dry_run,
            remove_local_tools=options.remove_local_tools,
            remove_state=options.remove_state,
        )
    return SetupOptions(
        host=options.host,
        scope=options.scope,
        project_dir=project_dir,
        dry_run=options.dry_run,
    )
