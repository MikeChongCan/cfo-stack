# CFO Stack Project Skills

Use this directory for project-specific agent skills when `AGENTS.md` would otherwise
become too large.

Guidelines:

- `AGENTS.md` stays high-order and lean.
- Put detailed workflows, domain-heavy instructions, and reusable project-specific
  agent behavior in `./.agents/skills/*`.
- When repo-level governance changes materially, update `AGENTS.md` and keep these
  project skills aligned with it.

Current repo-level skills:

- `cfo-ledger-ops` — canonical workflow, Beancount conventions, and ledger layout
- `cfo-setup-governance` — setup/uninstall semantics, onboarding intake, and host registration rules
- `cfo-chrome-download-statements` — browser-assisted statement export workflow
- `cfo-canadian-tax-prep` — CRA-anchored Canadian tax prep workflow for self-employed, corporate, GST/HST, payroll, and slip-season review packets
