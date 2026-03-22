---
name: cfo-setup-governance
description: Use when changing setup or uninstall behavior, onboarding intake, install-scope semantics, host registration docs, or setup-related agent guidance that should not live in AGENTS.md.
---

# CFO Setup Governance

Use this skill when the task touches:

- `./setup` or `./uninstall`
- onboarding and first-run guidance
- install-scope semantics
- host registration paths
- docs or prompts that describe setup behavior

## Onboarding Intake

During setup or ledger initialization, ask blocking questions when any template-driving input is unclear:

- personal vs business vs family/household
- country
- entity type
- province/state when relevant
- operating currency

Do not guess template-driving answers.

## Setup Contract

Keep these behaviors stable unless the change is intentional and broadly reflected:

- `./setup` defaults to `--host auto`
- shorthand positional host form is valid: `./setup codex`
- explicit flag form is also valid: `./setup --host codex`
- `setup` and `uninstall` behavior should stay symmetric where practical
- machine-scope install must stay path-agnostic
- `./uninstall --host auto` may intentionally sweep all known host roots so cleanup still works even if a host CLI is no longer installed

Machine scope:

- Claude: `~/.claude/skills/`
- Codex: `~/.agents/skills/`
- OpenClaw: `~/.openclaw/skills/`
- Antigravity: `~/.gemini/antigravity/skills/`
- global fallback policy: `~/.cfo-stack/config.yaml`

Project scope:

- register skills inside the target project
- skip global `~/.cfo-stack/config.yaml`
- expect policy overrides in ledger-local `cfo-stack.yaml`

## Related Workflow Guidance

- For browser-assisted statement downloads, prefer `./.agents/skills/cfo-chrome-download-statements/SKILL.md`.
- Keep statement export human-in-the-loop and LLM-driven rather than selector-pack driven.

## Editing Guidance

- Keep high-order setup rules summarized in `AGENTS.md`.
- Move operational detail, examples, and edge cases here or into the command-specific slash skills such as `skills/setup/SKILL.md`.
- When setup behavior changes, keep `AGENTS.md`, this skill, and `skills/setup/SKILL.md` aligned.
