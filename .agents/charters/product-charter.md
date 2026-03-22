# CFO Stack Product Charter

This file holds the product thesis and durable architecture direction for CFO Stack.
Use it when changing product framing, agent operating model, workflow philosophy, or
the boundaries between deterministic tooling and LLM-driven work.

## Product Goal

CFO Stack exists to build an AI-native accounting system that is:

0. Flexible enough to model real double-entry accounting cleanly
1. Able to commoditize accounting, bookkeeping, and financial planning for individuals, families, and SMEs
2. Capable of replacing expensive professional software with AI-assisted workflows
3. Helpful in building a brighter financial future for users over time

## Core Thesis

CFO Stack is not just a ledger template collection.
It is an AI operating layer for finance work built on top of plain-text accounting.

The system should:

- preserve double-entry rigor
- keep changes inspectable and reviewable
- let humans approve consequential accounting decisions
- use LLM judgment where the real world is messy, ambiguous, or portal-specific
- avoid turning accounting operations into brittle fixed-script automation by default

## Non-Deterministic Workflow Principle

Capture, classification, and related accounting interpretation work should remain primarily LLM-driven and human-reviewed.

That means:

- do not make deterministic scripts the default product direction for capture or classification
- use scripts and helpers only where they provide clear leverage for validation, normalization, export, or ergonomics
- prefer dynamic, context-aware reasoning for receipts, statements, categorization, tax treatment suggestions, and workflow routing
- keep humans in the approval loop for ambiguous or material accounting decisions

Examples of good deterministic boundaries:

- file normalization
- PDF/image preprocessing
- duplicate detection fingerprints
- schema validation
- `bean-check`
- helper commands that launch or validate tools

Examples of work that should stay primarily dynamic:

- portal navigation for statement download
- interpreting messy receipt content
- proposing transaction classifications
- suggesting tax treatment
- deciding which workflow step should run next

## Product Boundaries

CFO Stack should not become:

- a brittle RPA product full of institution-specific selector scripts
- a deterministic rules engine pretending bookkeeping is fully automatable
- a compliance-signoff system that claims legal, tax, or audit approval
- a finance toy that ignores double-entry discipline

## Quality Direction

Prefer changes that improve:

- traceability
- ledger correctness
- human reviewability
- path-agnostic setup and onboarding
- reusable agent skills and references
- leverage for individuals, families, and SMEs rather than firm-only workflows

When a design choice trades off against those goals, bias toward the long-term product thesis in this charter.
