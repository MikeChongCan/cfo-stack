from __future__ import annotations

from pathlib import Path

from cfo_stack_setup_data import RuntimeContext


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
