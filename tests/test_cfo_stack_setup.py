from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from cfo_stack_setup import (
    RuntimeContext,
    SetupOptions,
    UninstallOptions,
    UserError,
    detect_install_targets,
    link_skill_dirs,
    parse_setup_options,
    parse_uninstall_options,
    registration_root,
    remove_skill_links,
    validate_common_options,
)


class SetupCliTests(unittest.TestCase):
    def test_parse_setup_defaults_to_auto(self) -> None:
        options = parse_setup_options([])
        self.assertEqual(options.host, "auto")
        self.assertEqual(options.scope, "machine")
        self.assertIsNone(options.project_dir)

    def test_parse_setup_positional_host(self) -> None:
        options = parse_setup_options(["codex"])
        self.assertEqual(options.host, "codex")

    def test_parse_uninstall_flags(self) -> None:
        options = parse_uninstall_options(
            ["codex", "--scope", "project", "--project-dir", "/tmp/project", "--remove-state"]
        )
        self.assertEqual(options.host, "codex")
        self.assertEqual(options.scope, "project")
        self.assertEqual(options.project_dir, Path("/tmp/project"))
        self.assertTrue(options.remove_state)
        self.assertFalse(options.remove_local_tools)

    def test_unknown_setup_argument_fails(self) -> None:
        with self.assertRaises(UserError):
            parse_setup_options(["--hsto", "auto"])

    def test_project_scope_requires_project_dir_when_run_from_repo(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            root = Path(tempdir)
            context = RuntimeContext(cfo_stack_dir=root, run_dir=root, home_dir=root / "home")
            with self.assertRaises(UserError):
                validate_common_options(SetupOptions(scope="project"), context)

    def test_project_scope_defaults_to_current_directory_when_safe(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            root = Path(tempdir) / "repo"
            project = Path(tempdir) / "project"
            home = Path(tempdir) / "home"
            root.mkdir()
            project.mkdir()
            home.mkdir()
            context = RuntimeContext(cfo_stack_dir=root, run_dir=project, home_dir=home)
            validated = validate_common_options(SetupOptions(scope="project"), context)
            self.assertEqual(validated.project_dir, project.resolve())

    def test_detect_targets_uses_gemini_for_antigravity(self) -> None:
        targets = detect_install_targets(
            "auto",
            which=lambda name: "/bin/fake" if name in {"gemini", "codex"} else None,
        )
        self.assertTrue(targets.codex)
        self.assertTrue(targets.antigravity)
        self.assertFalse(targets.claude)
        self.assertFalse(targets.openclaw)

    def test_registration_root_machine_and_project_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            base = Path(tempdir)
            context = RuntimeContext(
                cfo_stack_dir=base / "repo",
                run_dir=base / "cwd",
                home_dir=base / "home",
            )
            project = base / "project"
            self.assertEqual(
                registration_root("claude", "machine", context, None),
                context.home_dir / ".claude" / "skills",
            )
            self.assertEqual(
                registration_root("codex", "machine", context, None),
                context.home_dir / ".agents" / "skills",
            )
            self.assertEqual(
                registration_root("openclaw", "machine", context, None),
                context.home_dir / ".openclaw" / "skills",
            )
            self.assertEqual(
                registration_root("antigravity", "project", context, project),
                project / ".agents" / "skills",
            )

    def test_link_and_remove_skill_dirs(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            base = Path(tempdir)
            cfo_root = base / "repo"
            skills_root = cfo_root / "skills"
            target_root = base / "target"
            (skills_root / "setup").mkdir(parents=True)
            (skills_root / "setup" / "SKILL.md").write_text("test", encoding="utf-8")
            (skills_root / "report").mkdir(parents=True)
            (skills_root / "report" / "SKILL.md").write_text("test", encoding="utf-8")

            linked = link_skill_dirs(cfo_root, target_root, "cfo-")
            self.assertEqual(linked, ["cfo-report", "cfo-setup"])
            self.assertTrue((target_root / "cfo-setup").is_symlink())

            removed = remove_skill_links(cfo_root, target_root, "cfo-")
            self.assertEqual(removed, ["cfo-report", "cfo-setup"])
            self.assertFalse((target_root / "cfo-setup").exists())


if __name__ == "__main__":
    unittest.main()
