from __future__ import annotations

from cfo_stack_setup_data import RuntimeContext, SetupOptions, UninstallOptions
from cfo_stack_setup_files import (
    create_helper_scripts,
    ensure_global_state,
    link_skill_dirs,
    remove_global_state,
    remove_local_tools,
    remove_skill_links,
)
from cfo_stack_setup_output import emit_lines, setup_banner_lines, setup_complete_lines, uninstall_banner_lines
from cfo_stack_setup_paths import registration_root
from cfo_stack_setup_system import detect_install_targets, ensure_python_environment


def perform_setup(options: SetupOptions, context: RuntimeContext) -> None:
    targets = detect_install_targets(options.host)
    emit_lines(setup_banner_lines(options))
    ensure_python_environment(context, dry_run=options.dry_run)
    ensure_global_state(context, options.scope, dry_run=options.dry_run)

    linked_roots: set[str] = set()
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
        label = {"claude": "Claude Code", "codex": "Codex", "openclaw": "OpenClaw", "antigravity": "Antigravity"}[host_name]
        print(f"Registering with {label}...")
        root = registration_root(host_name, options.scope, context, options.project_dir)
        root_key = str(root)
        if root_key not in linked_roots:
            link_skill_dirs(context.cfo_stack_dir, root, "cfo-", dry_run=options.dry_run)
            linked_roots.add(root_key)
        if options.scope == "project":
            print(f"  cfo-stack ready ({host_name} project scope).")
            print(f"  {host_name} project skills: {root}")
        else:
            print(f"  cfo-stack ready ({host_name}).")
            print(f"  {host_name} skills: {root}")

    create_helper_scripts(context, dry_run=options.dry_run)
    emit_lines(setup_complete_lines(context.cfo_stack_dir, options))


def perform_uninstall(options: UninstallOptions, context: RuntimeContext) -> None:
    emit_lines(uninstall_banner_lines(options))
    cleaned_roots: set[str] = set()
    # Intentionally sweep every known host root for --host auto so uninstall can clean up
    # prior registrations even when the corresponding host CLI is not currently on PATH.
    host_targets = [
        ("claude", options.host in ("auto", "claude")),
        ("codex", options.host in ("auto", "codex")),
        ("openclaw", options.host in ("auto", "openclaw")),
        ("antigravity", options.host in ("auto", "antigravity")),
    ]
    for host_name, enabled in host_targets:
        if not enabled:
            continue
        label = {"claude": "Claude Code", "codex": "Codex", "openclaw": "OpenClaw", "antigravity": "Antigravity"}[host_name]
        print(f"Unregistering from {label}...")
        roots = [registration_root(host_name, options.scope, context, options.project_dir)]
        if host_name == "codex" and options.scope == "machine":
            # Legacy cleanup for older Codex installs that linked under ~/.codex/skills.
            roots.append(context.home_dir / ".codex" / "skills")
        for root in roots:
            root_key = str(root)
            if root_key in cleaned_roots:
                continue
            remove_skill_links(context.cfo_stack_dir, root, "cfo-", dry_run=options.dry_run)
            cleaned_roots.add(root_key)
        print("")

    if options.remove_local_tools:
        remove_local_tools(context, dry_run=options.dry_run)
    if options.remove_state:
        remove_global_state(context, options.scope, dry_run=options.dry_run)

    print("Done.")
