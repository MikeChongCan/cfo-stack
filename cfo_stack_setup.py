#!/usr/bin/env python3
from __future__ import annotations

from cfo_stack_setup_cli import main
from cfo_stack_setup_data import (
    HOST_CHOICES,
    SCOPE_CHOICES,
    CommonOptions,
    InstallTargets,
    RuntimeContext,
    SetupOptions,
    UninstallOptions,
    UserError,
)
from cfo_stack_setup_files import link_skill_dirs, remove_skill_links
from cfo_stack_setup_parse import parse_setup_options, parse_uninstall_options, validate_common_options
from cfo_stack_setup_paths import registration_root
from cfo_stack_setup_system import detect_install_targets


__all__ = [
    "HOST_CHOICES",
    "SCOPE_CHOICES",
    "CommonOptions",
    "InstallTargets",
    "RuntimeContext",
    "SetupOptions",
    "UninstallOptions",
    "UserError",
    "detect_install_targets",
    "link_skill_dirs",
    "main",
    "parse_setup_options",
    "parse_uninstall_options",
    "registration_root",
    "remove_skill_links",
    "validate_common_options",
]
