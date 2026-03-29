from __future__ import annotations

import shutil
import subprocess
from os import environ
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
from cfo_stack_setup_files import ensure_global_state
from cfo_stack_setup_output import setup_banner_lines, setup_complete_lines, uninstall_banner_lines


ROOT = Path(__file__).resolve().parents[1]


def make_setup_repo_copy(tmp_path: Path) -> Path:
    repo_copy = tmp_path / "repo-copy"
    repo_copy.mkdir()
    for file_name in [
        "setup",
        "uninstall",
        "cfo_stack_setup.py",
        "cfo_stack_setup_cli.py",
        "cfo_stack_setup_data.py",
        "cfo_stack_setup_files.py",
        "cfo_stack_setup_ops.py",
        "cfo_stack_setup_output.py",
        "cfo_stack_setup_parse.py",
        "cfo_stack_setup_paths.py",
        "cfo_stack_setup_system.py",
    ]:
        shutil.copy2(ROOT / file_name, repo_copy / file_name)
    shutil.copytree(ROOT / "skills", repo_copy / "skills")
    return repo_copy


def test_parse_setup_defaults_to_auto() -> None:
    options = parse_setup_options([])
    assert options.host == "auto"
    assert options.scope == "machine"
    assert options.project_dir is None
    assert options.dry_run is False
    assert options.skill_naming is None


def test_parse_setup_positional_host() -> None:
    options = parse_setup_options(["codex"])
    assert options.host == "codex"


def test_parse_uninstall_flags() -> None:
    options = parse_uninstall_options(
        [
            "codex",
            "--scope",
            "project",
            "--project-dir",
            "/tmp/project",
            "--remove-state",
            "--dry-run",
        ]
    )
    assert options.host == "codex"
    assert options.scope == "project"
    assert options.project_dir == Path("/tmp/project")
    assert options.dry_run is True
    assert options.remove_state is True
    assert options.remove_local_tools is False
    assert options.skill_naming is None


def test_parse_setup_skill_naming_flags() -> None:
    assert parse_setup_options(["--skill-naming", "short"]).skill_naming == "short"
    assert parse_setup_options(["--skill-naming=namespaced"]).skill_naming == "namespaced"
    assert parse_setup_options(["--short-names"]).skill_naming == "short"
    assert parse_setup_options(["--namespaced"]).skill_naming == "namespaced"


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


def test_validate_common_options_preserves_dry_run(tmp_path: Path) -> None:
    context = RuntimeContext(cfo_stack_dir=tmp_path / "repo", run_dir=tmp_path, home_dir=tmp_path / "home")
    validated = validate_common_options(SetupOptions(host="codex", scope="machine", dry_run=True), context)
    assert validated.dry_run is True


def test_validate_common_options_rejects_unknown_skill_naming(tmp_path: Path) -> None:
    context = RuntimeContext(cfo_stack_dir=tmp_path / "repo", run_dir=tmp_path, home_dir=tmp_path / "home")
    with pytest.raises(UserError, match="Unknown --skill-naming value: aliased"):
        validate_common_options(SetupOptions(skill_naming="aliased"), context)


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


def test_link_and_remove_skill_dirs_with_short_names(
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    cfo_root = tmp_path / "repo"
    skills_root = cfo_root / "skills"
    target_root = tmp_path / "target"
    (skills_root / "setup").mkdir(parents=True)
    (skills_root / "setup" / "SKILL.md").write_text("test", encoding="utf-8")
    (skills_root / "report").mkdir(parents=True)
    (skills_root / "report" / "SKILL.md").write_text("test", encoding="utf-8")

    linked = link_skill_dirs(cfo_root, target_root, "")
    assert linked == ["report", "setup"]
    assert (target_root / "setup").is_symlink()

    removed = remove_skill_links(cfo_root, target_root, "")
    assert removed == ["report", "setup"]
    assert not (target_root / "setup").exists()

    captured = capsys.readouterr()
    assert "Linked skills: report setup" in captured.out
    assert "Removed skills: report setup" in captured.out


def test_link_skill_dirs_dry_run_has_no_side_effects(
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    cfo_root = tmp_path / "repo"
    skills_root = cfo_root / "skills"
    target_root = tmp_path / "target"
    (skills_root / "setup").mkdir(parents=True)
    (skills_root / "setup" / "SKILL.md").write_text("test", encoding="utf-8")

    linked = link_skill_dirs(cfo_root, target_root, "cfo-", dry_run=True)

    assert linked == ["cfo-setup"]
    assert not target_root.exists()
    captured = capsys.readouterr()
    assert "Would link skills: cfo-setup" in captured.out


def test_link_skill_dirs_dry_run_reports_conflicts(
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    cfo_root = tmp_path / "repo"
    skills_root = cfo_root / "skills"
    target_root = tmp_path / "target"
    (skills_root / "setup").mkdir(parents=True)
    (skills_root / "setup" / "SKILL.md").write_text("test", encoding="utf-8")
    target_root.mkdir()
    (target_root / "cfo-setup").mkdir()

    linked = link_skill_dirs(cfo_root, target_root, "cfo-", dry_run=True)

    assert linked == []
    captured = capsys.readouterr()
    assert "Would link skills" not in captured.out
    assert "Skipped existing non-symlink targets: cfo-setup" in captured.out


def test_ensure_global_state_dry_run_has_no_side_effects(
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    context = RuntimeContext(cfo_stack_dir=tmp_path / "repo", run_dir=tmp_path, home_dir=tmp_path / "home")

    ensure_global_state(context, "machine", dry_run=True)

    assert not context.state_dir.exists()
    captured = capsys.readouterr()
    assert f"Dry run: would create {context.global_config}" in captured.out


def test_setup_banner_snapshot_for_project_dry_run() -> None:
    assert setup_banner_lines(
        SetupOptions(scope="project", project_dir=Path("/tmp/project"), dry_run=True, skill_naming="namespaced")
    ) == [
        "╔══════════════════════════════════════════╗",
        "║          CFO Stack Setup                 ║",
        "║    AI-Powered Accounting with CLEAR      ║",
        "╚══════════════════════════════════════════╝",
        "",
        "  Scope: project",
        "  Skill naming: namespaced",
        "  Project dir: /tmp/project",
        "  Mode: dry-run",
    ]


def test_uninstall_banner_snapshot_for_project_dry_run() -> None:
    assert uninstall_banner_lines(
        parse_uninstall_options(
            ["codex", "--scope", "project", "--project-dir", "/tmp/project", "--dry-run"]
        )
    ) == [
        "╔══════════════════════════════════════════╗",
        "║        CFO Stack Uninstall               ║",
        "║     Remove host registrations safely     ║",
        "╚══════════════════════════════════════════╝",
        "",
        "  Scope: project",
        "  Project dir: /tmp/project",
        "  Mode: dry-run",
    ]


def test_setup_complete_snapshot_for_machine_scope() -> None:
    assert setup_complete_lines(Path("/repo"), SetupOptions(skill_naming="namespaced")) == [
        "",
        "╔══════════════════════════════════════════╗",
        "║          Setup Complete!               ║",
        "╠══════════════════════════════════════════╣",
        "║                                        ║",
        "║  Quick start:                          ║",
        "║    1. Run /cfo-setup to start books    ║",
        "║    2. Edit ~/.cfo-stack/config.yaml    ║",
        "║       if you want a different review   ║",
        "║       threshold than $1,000            ║",
        "║    3. Drop bank CSVs in ~/Downloads    ║",
        "║    4. Run /cfo-capture to import       ║",
        "║    5. Run /cfo-classify to review      ║",
        "║    6. Run /cfo-report for statements   ║",
        "║    7. Run cfo-dashboard from this repo ║",
        "║                                        ║",
        "║  The CLEAR cycle:                      ║",
        "║    Capture → Log → Extract →           ║",
        "║    Automate → Report                   ║",
        "║                                        ║",
        "╚══════════════════════════════════════════╝",
        "",
        "Helper scripts live in: /repo/bin",
    ]


def test_setup_complete_snapshot_for_short_names() -> None:
    assert setup_complete_lines(Path("/repo"), SetupOptions(skill_naming="short")) == [
        "",
        "╔══════════════════════════════════════════╗",
        "║          Setup Complete!               ║",
        "╠══════════════════════════════════════════╣",
        "║                                        ║",
        "║  Quick start:                          ║",
        "║    1. Run /setup to start books        ║",
        "║    2. Edit ~/.cfo-stack/config.yaml    ║",
        "║       if you want a different review   ║",
        "║       threshold than $1,000            ║",
        "║    3. Drop bank CSVs in ~/Downloads    ║",
        "║    4. Run /capture to import           ║",
        "║    5. Run /classify to review          ║",
        "║    6. Run /report for statements       ║",
        "║    7. Run cfo-dashboard from this repo ║",
        "║                                        ║",
        "║  The CLEAR cycle:                      ║",
        "║    Capture → Log → Extract →           ║",
        "║    Automate → Report                   ║",
        "║                                        ║",
        "╚══════════════════════════════════════════╝",
        "",
        "Helper scripts live in: /repo/bin",
    ]


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


def test_setup_entrypoint_supports_dry_run(tmp_path: Path) -> None:
    repo_copy = make_setup_repo_copy(tmp_path)
    home_dir = tmp_path / "home"
    home_dir.mkdir()
    env = dict(environ)
    env["HOME"] = str(home_dir)

    result = subprocess.run(
        [str(repo_copy / "setup"), "--host", "codex", "--dry-run"],
        cwd=repo_copy,
        text=True,
        capture_output=True,
        check=False,
        env=env,
    )

    assert result.returncode == 0
    assert "Mode: dry-run" in result.stdout
    assert "Skill naming: namespaced" in result.stdout
    assert "Would link skills:" in result.stdout
    assert "Dry run: would create helper scripts" in result.stdout
    assert not (home_dir / ".agents").exists()
    assert not (repo_copy / "bin" / "cfo-check").exists()


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


def test_uninstall_entrypoint_supports_dry_run(tmp_path: Path) -> None:
    repo_copy = make_setup_repo_copy(tmp_path)
    home_dir = tmp_path / "home"
    home_dir.mkdir()
    env = dict(environ)
    env["HOME"] = str(home_dir)

    result = subprocess.run(
        [str(repo_copy / "uninstall"), "--host", "codex", "--dry-run", "--remove-local-tools", "--remove-state"],
        cwd=repo_copy,
        text=True,
        capture_output=True,
        check=False,
        env=env,
    )

    assert result.returncode == 0
    assert "Mode: dry-run" in result.stdout
    assert "Skill naming:" not in result.stdout
    assert "Dry run: would remove bin helpers, .venv, and dashboard node_modules" in result.stdout
    assert "Dry run: would remove" in result.stdout
    assert not (home_dir / ".agents").exists()


def test_uninstall_rejects_setup_only_skill_naming_flags() -> None:
    with pytest.raises(UserError, match="Unknown argument: --namespaced"):
        parse_uninstall_options(["--namespaced"])
    with pytest.raises(UserError, match="Unknown argument: --short-names"):
        parse_uninstall_options(["--short-names"])
    with pytest.raises(UserError, match="Unknown argument: --skill-naming"):
        parse_uninstall_options(["--skill-naming", "short"])
