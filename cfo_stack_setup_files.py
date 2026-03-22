from __future__ import annotations

import shutil
from pathlib import Path
from typing import Iterable

from cfo_stack_setup_data import HELPER_SCRIPTS, POLICY_CONFIG_TEXT, RuntimeContext


def iter_skill_dirs(cfo_stack_dir: Path) -> Iterable[Path]:
    skills_root = cfo_stack_dir / "skills"
    if not skills_root.exists():
        return []
    return sorted(
        (path for path in skills_root.iterdir() if path.is_dir() and (path / "SKILL.md").is_file()),
        key=lambda path: path.name,
    )


def ensure_global_state(context: RuntimeContext, scope: str, dry_run: bool = False) -> None:
    if scope == "machine":
        print("  State dir: ~/.cfo-stack/")
        if dry_run:
            if context.global_config.exists():
                print(f"  Default policy: {context.global_config} (existing)")
            else:
                print(f"  Dry run: would create {context.global_config}")
                print(f"  Default policy: {context.global_config}")
            return
        context.state_dir.mkdir(parents=True, exist_ok=True)
        if context.global_config.exists():
            print(f"  Default policy: {context.global_config} (existing)")
        else:
            context.global_config.write_text(POLICY_CONFIG_TEXT, encoding="utf-8")
            print(f"  Default policy: {context.global_config}")
    else:
        print("  Default policy: skipped (project scope keeps policy in the target ledger)")


def link_skill_dirs(cfo_stack_dir: Path, skills_root: Path, prefix: str, dry_run: bool = False) -> list[str]:
    linked: list[str] = []
    conflicts: list[str] = []
    if not dry_run:
        skills_root.mkdir(parents=True, exist_ok=True)
    for skill_dir in iter_skill_dirs(cfo_stack_dir):
        skill_name = f"{prefix}{skill_dir.name}"
        target = skills_root / skill_name
        if target.is_symlink():
            if not dry_run:
                target.unlink()
                target.symlink_to(skill_dir)
            linked.append(skill_name)
            continue
        if target.exists():
            conflicts.append(skill_name)
            continue
        if not dry_run:
            target.symlink_to(skill_dir)
        linked.append(skill_name)
    if linked:
        prefix_text = "Would link skills" if dry_run else "Linked skills"
        print(f"  {prefix_text}: {' '.join(linked)}")
    if conflicts:
        print(f"  Skipped existing non-symlink targets: {' '.join(conflicts)}")
    return linked


def remove_skill_links(cfo_stack_dir: Path, skills_root: Path, prefix: str, dry_run: bool = False) -> list[str]:
    removed: list[str] = []
    if not skills_root.exists():
        return removed
    for skill_dir in iter_skill_dirs(cfo_stack_dir):
        skill_name = f"{prefix}{skill_dir.name}"
        target = skills_root / skill_name
        if not target.is_symlink():
            continue
        if target.resolve() == skill_dir.resolve():
            if not dry_run:
                target.unlink()
            removed.append(skill_name)
    if removed:
        prefix_text = "Would remove skills" if dry_run else "Removed skills"
        print(f"  {prefix_text}: {' '.join(removed)}")
    return removed


def create_helper_scripts(context: RuntimeContext, dry_run: bool = False) -> None:
    bin_dir = context.cfo_stack_dir / "bin"
    if dry_run:
        print(f"Dry run: would create helper scripts in {bin_dir}")
        return
    bin_dir.mkdir(parents=True, exist_ok=True)
    for name, content in HELPER_SCRIPTS.items():
        path = bin_dir / name
        path.write_text(content, encoding="utf-8")
        path.chmod(0o755)


def remove_local_tools(context: RuntimeContext, dry_run: bool = False) -> None:
    print("Removing repo-local tooling...")
    if dry_run:
        print("  Dry run: would remove bin helpers, .venv, and dashboard node_modules")
        print("")
        return
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


def remove_global_state(context: RuntimeContext, scope: str, dry_run: bool = False) -> None:
    if scope == "project":
        print("Skipping global CFO Stack state removal in project scope.")
        return
    print("Removing global CFO Stack state...")
    if dry_run:
        print(f"  Dry run: would remove {context.global_config}")
        print("")
        return
    context.global_config.unlink(missing_ok=True)
    if context.state_dir.exists() and not any(context.state_dir.iterdir()):
        context.state_dir.rmdir()
        print(f"  Removed empty {context.state_dir}")
    else:
        print(f"  Removed {context.global_config}")
    print("")
