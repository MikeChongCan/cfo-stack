from __future__ import annotations

from pathlib import Path

from cfo_stack_setup_data import SetupOptions, UninstallOptions


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
        "║          Setup Complete!                 ║",
        "╠══════════════════════════════════════════╣",
        "║                                          ║",
        "║  Quick start:                            ║",
        "║    1. Run /setup to create your ledger   ║",
    ]
    if options.scope == "machine":
        lines.extend(
            [
                "║    2. Edit ~/.cfo-stack/config.yaml      ║",
                "║       if you want a different review     ║",
                "║       threshold than $1,000             ║",
            ]
        )
    else:
        lines.extend(
            [
                "║    2. Create ledger-local cfo-stack.yaml ║",
                "║       in your target project if you want ║",
                "║       policy overrides                   ║",
            ]
        )
    lines.extend(
        [
            "║    3. Drop bank CSVs in ~/Downloads      ║",
            "║    4. Run /capture to import them        ║",
            "║    5. Run /classify to categorize        ║",
            "║    6. Run /report to see your finances   ║",
            "║    7. Run cfo-dashboard from this repo   ║",
            "║                                          ║",
            "║  The CLEAR cycle:                        ║",
            "║    Capture → Log → Extract →              ║",
            "║    Automate → Report                      ║",
            "║                                          ║",
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
