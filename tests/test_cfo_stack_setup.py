from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

import pytest

from cfo_stack_setup import (
    RuntimeContext,
    SetupOptions,
    UserError,
    detect_install_targets,
    link_skill_dirs,
    parse_setup_options,
    parse_uninstall_options,
    registration_root,
    remove_skill_links,
    validate_common_options,
)


ROOT = Path(__file__).resolve().parents[1]


def test_parse_setup_defaults_to_auto() -> None:
    options = parse_setup_options([])
    assert options.host == "auto"
    assert options.scope == "machine"
    assert options.project_dir is None


def test_parse_setup_positional_host() -> None:
    options = parse_setup_options(["codex"])
    assert options.host == "codex"


def test_parse_uninstall_flags() -> None:
    options = parse_uninstall_options(
        ["codex", "--scope", "project", "--project-dir", "/tmp/project", "--remove-state"]
    )
    assert options.host == "codex"
    assert options.scope == "project"
    assert options.project_dir == Path("/tmp/project")
    assert options.remove_state is True
    assert options.remove_local_tools is False


def test_unknown_setup_argument_fails() -> None:
    with pytest.raises(UserError, match="Unknown argument: --hsto"):
        parse_setup_options(["--hsto", "auto"])


def test_project_scope_requires_project_dir_when_run_from_repo(tmp_path: Path) -> None:
    context = RuntimeContext(cfo_stack_dir=tmp_path, run_dir=tmp_path, home_dir=tmp_path / "home")
    with pytest.raises(
        UserError,
        match="--scope project requires --project-dir when run from the CFO Stack repo",
    ):
        validate_common_options(SetupOptions(scope="project"), context)


def test_project_scope_defaults_to_current_directory_when_safe(tmp_path: Path) -> None:
    root = tmp_path / "repo"
    project = tmp_path / "project"
    home = tmp_path / "home"
    root.mkdir()
    project.mkdir()
    home.mkdir()
    context = RuntimeContext(cfo_stack_dir=root, run_dir=project, home_dir=home)
    validated = validate_common_options(SetupOptions(scope="project"), context)
    assert validated.project_dir == project.resolve()


def test_detect_targets_uses_gemini_for_antigravity() -> None:
    targets = detect_install_targets(
        "auto",
        which=lambda name: "/bin/fake" if name in {"gemini", "codex"} else None,
    )
    assert targets.codex is True
    assert targets.antigravity is True
    assert targets.claude is False
    assert targets.openclaw is False


def test_registration_root_machine_and_project_paths(tmp_path: Path) -> None:
    context = RuntimeContext(
        cfo_stack_dir=tmp_path / "repo",
        run_dir=tmp_path / "cwd",
        home_dir=tmp_path / "home",
    )
    project = tmp_path / "project"
    assert registration_root("claude", "machine", context, None) == context.home_dir / ".claude" / "skills"
    assert registration_root("codex", "machine", context, None) == context.home_dir / ".agents" / "skills"
    assert registration_root("openclaw", "machine", context, None) == context.home_dir / ".openclaw" / "skills"
    assert registration_root("antigravity", "project", context, project) == project / ".agents" / "skills"


def test_link_and_remove_skill_dirs(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    cfo_root = tmp_path / "repo"
    skills_root = cfo_root / "skills"
    target_root = tmp_path / "target"
    (skills_root / "setup").mkdir(parents=True)
    (skills_root / "setup" / "SKILL.md").write_text("test", encoding="utf-8")
    (skills_root / "report").mkdir(parents=True)
    (skills_root / "report" / "SKILL.md").write_text("test", encoding="utf-8")

    linked = link_skill_dirs(cfo_root, target_root, "cfo-")
    assert linked == ["cfo-report", "cfo-setup"]
    assert (target_root / "cfo-setup").is_symlink()

    removed = remove_skill_links(cfo_root, target_root, "cfo-")
    assert removed == ["cfo-report", "cfo-setup"]
    assert not (target_root / "cfo-setup").exists()

    captured = capsys.readouterr()
    assert "Linked skills: cfo-report cfo-setup" in captured.out
    assert "Removed skills: cfo-report cfo-setup" in captured.out


def test_setup_entrypoint_is_runnable_for_fast_fail() -> None:
    result = subprocess.run(
        [str(ROOT / "setup"), "--hsto", "auto"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    assert result.returncode != 0
    assert "Unknown argument: --hsto" in result.stderr


def test_uninstall_entrypoint_is_runnable_for_fast_fail() -> None:
    result = subprocess.run(
        [str(ROOT / "uninstall"), "--unknown-flag"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    assert result.returncode != 0
    assert "Unknown argument: --unknown-flag" in result.stderr
