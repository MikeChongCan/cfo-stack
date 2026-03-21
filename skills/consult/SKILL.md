---
name: consult
description: |
  Cross-model accounting and tax self-consulting via 10x-chat. Ask ChatGPT,
  Gemini, Claude, Grok, or NotebookLM a CFO Stack question, compare answers,
  and synthesize a markdown memo for human review.
  Use when you want external model perspectives on bookkeeping treatment, tax framing,
  workflow design, or ambiguous finance operations questions.
  CLEAR step: E (Extract)
---

# /consult — Cross-Model Consultant

## CLEAR Step

**E — Extract:** Pull decision-support insight out of ambiguous accounting or tax questions.

**Core question:** What do multiple strong models think this means, and what should I review next?

## Role

You are a cross-model research consultant. You turn one CFO Stack question into a focused,
auditable consultation loop across multiple AI providers, then reduce the output into a clean
markdown answer the user can act on.

This is for research and self-consulting, not compliance.

## Backing Tool

This skill uses the `10x-chat` CLI workflow for web-based AI providers.

Brief reference:

```bash
# one-time login per provider
npx 10x-chat@latest login chatgpt
npx 10x-chat@latest login gemini
npx 10x-chat@latest login claude
npx 10x-chat@latest login grok
npx 10x-chat@latest login notebooklm

# ask a provider a question with markdown/file context
npx 10x-chat@latest chat --provider gemini -p "Question" --file context.md

# preview the prompt bundle without sending
npx 10x-chat@latest chat --dry-run -p "Question" --file context.md

# inspect prior sessions
npx 10x-chat@latest status
npx 10x-chat@latest session <id> --render
```

Providers supported by the referenced `10x-chat` skill:
- ChatGPT
- Gemini
- Claude
- Grok
- NotebookLM

Run providers sequentially, not in parallel browser sessions.

## When To Use

- ambiguous bookkeeping treatment
- tax categorization questions
- tradeoff analysis between two ledger modeling approaches
- choosing how to structure a CFO Stack workflow
- sanity-checking a reporting interpretation before presenting it
- generating a brief or full markdown research memo from multiple model opinions

## Workflow

### Step 1: Frame the question

Reduce the user request to one concrete question.

Good examples:
- "Should this owner draw be modeled as equity or expense in this ledger?"
- "How should I think about reimbursable client expenses in Beancount?"
- "What are the risks of treating this contractor payment category as COGS?"

If the issue depends on jurisdiction, include:
- country
- province/state
- entity type
- tax year or effective period if relevant

### Step 2: Build a tight markdown context bundle

Prefer markdown-first context:
- short problem statement
- relevant ledger excerpts
- relevant policy or jurisdiction-pack excerpts
- current assumptions
- what decision must be made

Keep it focused. Do not dump the entire repo.

Recommended bundle shape:

~~~md
# Question

[one concrete question]

# Context

- entity:
- jurisdiction:
- ledger accounts involved:
- current treatment:

# Relevant excerpts

```beancount
[small ledger snippet]
```

# What I need

- explain competing treatments
- list risks
- recommend what to review with a human
~~~

### Step 3: Ask multiple providers sequentially

Use `npx 10x-chat@latest`.

Typical pattern:

```bash
npx 10x-chat@latest chat --provider gemini --file consult.md -p "Answer the question in markdown."
npx 10x-chat@latest chat --provider claude --file consult.md -p "Answer the question in markdown."
npx 10x-chat@latest chat --provider chatgpt --file consult.md -p "Answer the question in markdown."
```

Use `--dry-run` first when the prompt bundle may include sensitive material.

If NotebookLM is the right fit, use it when the user has source-heavy materials such as:
- tax guides
- memos
- PDFs
- accounting policy docs

### Step 4: Synthesize into markdown

Produce either:

- **brief markdown** for fast decision support
- **full markdown memo** for durable notes or issue threads

Required synthesis sections:
- Question
- Context
- Where the models agree
- Where the models differ
- Risks / unknowns
- Working conclusion
- Human review required

Preferred brief format:

```md
# Consultation Summary

## Question

...

## Agreement

- ...

## Disagreement

- ...

## Working Conclusion

- ...

## Human Review Required

- ...
```

### Step 5: Keep CFO Stack guardrails

If the question touches tax or compliance:
- never present the answer as legal or tax advice
- never invent statutory rates or filing requirements
- prefer jurisdiction-pack facts over model speculation
- mark unresolved items clearly

If the consultation changes repo policy or durable workflow:
- update the relevant skill or doc
- keep `AGENTS.md` lean
- move detailed operating guidance into a repo-local skill when needed

## Constraints

- NEVER send credentials, account numbers, raw secrets, or OTP material to external models
- NEVER present a model consensus as compliance approval
- NEVER treat a model answer as deterministic truth
- ALWAYS preserve ambiguity when the models disagree
- ALWAYS prefer markdown deliverables over prose blobs
- ALWAYS keep the final recommendation human-reviewable

## Output

A markdown consultation note, either brief or full-length, that captures:
- the question
- the relevant context
- cross-model agreement and disagreement
- a working conclusion
- explicit human-review items
