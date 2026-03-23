from __future__ import annotations

from pathlib import Path

from cfo_stack_setup_data import SetupOptions, UninstallOptions


def box_line(content: str = "") -> str:
    return f"║{content:<40}║"


def setup_banner_lines(options: SetupOptions) -> list[str]:
    lines = [
        "╔══════════════════════════════════════════╗",
        "║          CFO Stack Setup                 ║",
        "║    AI-Powered Accounting with CLEAR      ║",
        "╚══════════════════════════════════════════╝",
        "",
        f"  Scope: {options.scope}",
    ]
    if options.scope == "project" and options.project_dir is not None:
        lines.append(f"  Project dir: {options.project_dir}")
    if options.dry_run:
        lines.append("  Mode: dry-run")
    return lines


def uninstall_banner_lines(options: UninstallOptions) -> list[str]:
    lines = [
        "╔══════════════════════════════════════════╗",
        "║        CFO Stack Uninstall               ║",
        "║     Remove host registrations safely     ║",
        "╚══════════════════════════════════════════╝",
        "",
        f"  Scope: {options.scope}",
    ]
    if options.scope == "project" and options.project_dir is not None:
        lines.append(f"  Project dir: {options.project_dir}")
    if options.dry_run:
        lines.append("  Mode: dry-run")
    return lines


def setup_complete_lines(cfo_stack_dir: Path, options: SetupOptions) -> list[str]:
    lines = [
        "",
        "╔══════════════════════════════════════════╗",
        box_line("          Setup Complete!"),
        "╠══════════════════════════════════════════╣",
        box_line(),
        box_line("  Quick start:"),
        box_line("    1. Run /cfo-setup to start books"),
    ]
    if options.scope == "machine":
        lines.extend(
            [
                box_line("    2. Edit ~/.cfo-stack/config.yaml"),
                box_line("       if you want a different review"),
                box_line("       threshold than $1,000"),
            ]
        )
    else:
        lines.extend(
            [
                box_line("    2. Create ledger-local cfo-stack.yaml"),
                box_line("       in your target project if you want"),
                box_line("       policy overrides"),
            ]
        )
    lines.extend(
        [
            box_line("    3. Drop bank CSVs in ~/Downloads"),
            box_line("    4. Run /cfo-capture to import"),
            box_line("    5. Run /cfo-classify to review"),
            box_line("    6. Run /cfo-report for statements"),
            box_line("    7. Run cfo-dashboard from this repo"),
            box_line(),
            box_line("  The CLEAR cycle:"),
            box_line("    Capture → Log → Extract →"),
            box_line("    Automate → Report"),
            box_line(),
            "╚══════════════════════════════════════════╝",
            "",
            f"Helper scripts live in: {cfo_stack_dir / 'bin'}",
        ]
    )
    if options.scope == "project" and options.project_dir is not None:
        lines.extend(
            [
                "Run them from your target project, for example:",
                f"  (cd {options.project_dir} && {cfo_stack_dir / 'bin' / 'cfo-check'})",
                f"  (cd {options.project_dir} && {cfo_stack_dir / 'bin' / 'cfo-dashboard'})",
            ]
        )
    return lines


def emit_lines(lines: list[str]) -> None:
    for line in lines:
        print(line)
