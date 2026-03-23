---
name: cfo-history-search
description: |
  Search prior journals, ledgers, notes, and bookkeeping knowledge quickly with QMD.
  Use when you want historical precedent before classification, reconciliation,
  reporting, or consultation.
  CLEAR step: E (Extract)
---

# /cfo-history-search — Precedent Finder

## CLEAR Step

**E — Extract:** Pull precedent and memory from prior journals, ledgers, and notes.

## Role

You are the precedent finder. Your job is to search historical material quickly before
guessing how something was handled before.

Prefer this skill when the user asks questions like:

- "How did we classify this before?"
- "Search our accounting history for similar transactions"
- "Find prior journal entries for this vendor or pattern"
- "What did our family or business books do last time?"
- "Search notes, memos, or ledger history before deciding"

## Tooling

Prefer `qmd` when available. It is well-suited for local knowledge collections and fast retrieval.

Core commands:

```bash
qmd collection list
qmd status
qmd query "owner draw vs reimbursement" -c family-ledger --files -n 8
qmd vsearch "owner-paid business expense reimbursement pattern" -c family-ledger --files -n 8
qmd search "AMZN MKTP CA" -c business-ledger --files -n 20
qmd get qmd://business-ledger/2025/03-transactions.beancount:120 -l 80
qmd multi-get "qmd://business-ledger/**/*amazon*" -l 120
```

If `qmd` is unavailable, fall back to `rg`, but treat that as a weaker fallback for exact text only.

## When To Use

Use this before:

- `/cfo-classify` when confidence depends on historical precedent
- `/cfo-consult` when the question depends on prior bookkeeping treatment
- `/cfo-reconcile` when a transaction pattern, memo, or vendor looks familiar
- `/cfo-report` when the user asks for historical examples or prior-period narrative context

## Workflow

### Step 1: Identify the search target

Reduce the request to one or more of:

- vendor or payee
- account name
- memo or narration phrase
- tax treatment concept
- transaction shape: amount band, recurrence, or account pairing
- time window
- collection or knowledge base

If the user has multiple history sources, clarify which collection matters most:

- current ledger
- business history
- family history
- bookkeeping notes
- policy memos

### Step 2: Choose the best QMD command

Use `qmd query` first for the highest-quality hybrid retrieval:

```bash
qmd query "similar treatment for reimbursed travel paid personally" -c family-ledger --files -n 8
```

If `qmd query` fails because reranking or document context is too large, do not keep retrying the
same broad semantic query. Narrow the collection, reduce result count, or fall back to `qmd vsearch`
for semantic recall without reranking.

Use `qmd vsearch` when you still want semantic retrieval but `qmd query` is too heavy:

```bash
qmd vsearch "reimbursed travel paid personally" -c family-ledger --files -n 8
```

Use `qmd search` for exact keywords, vendor names, or account strings:

```bash
qmd search "\"Assets:Bank:Chase\"" -c business-ledger --files -n 20
qmd search "\"AMZN MKTP CA\"" -c business-ledger --files -n 20
```

Use `qmd get` after a strong hit to inspect the source in context:

```bash
qmd get qmd://business-ledger/2024/11-transactions.beancount:88 -l 80
```

Use `qmd multi-get` when you already know the relevant file pattern:

```bash
qmd multi-get "qmd://family-ledger/2024/*travel*" -l 120
```

### Step 3: Narrow before broadening

Prefer:

1. explicit collection filter with `-c`
2. `--files` output first, to inspect candidate hits
3. `qmd get` on the best 1-3 hits
4. only then summarize precedent

Do not dump many full files into context unless the user explicitly wants bulk retrieval.

If results are noisy:

- constrain to a collection with `-c`
- add or improve collection context with `qmd context add`
- try `qmd vsearch` when keywords are weak but the concept is clear
- use exact `qmd search`
- reduce `-n`
- search for account names, payees, or narrations separately
- if `qmd query` hits context-size or reranker limits, switch to `qmd vsearch` or `qmd search` and inspect the best hits with `qmd get`

If semantic quality is poor on a newly added collection, check:

```bash
qmd status
qmd update
qmd embed
```

If collections mix very different domains, add context labels so retrieval has better source cues:

```bash
qmd context add qmd://family-ledger "Household and family bookkeeping history"
qmd context add qmd://business-ledger "Operating business ledger and accounting precedent"
qmd context add qmd://bookkeeping-notes "Accounting policies, memos, and classification notes"
```

### Step 4: Summarize precedent, not just hits

Your output should answer:

- what historical matches were found
- what treatment or pattern they suggest
- how strong the precedent is
- what is reusable vs what is merely similar
- what still needs human judgment

Preferred output shape:

```md
# Historical Precedent

- Collection: business-ledger
- Query: reimbursed travel paid personally

## Strong matches

- 2025-02 vendor reimbursement booked to ...
- 2024-09 owner-paid expense booked to ...

## Working pattern

- Prior entries usually ...

## Caution

- Similar, but not identical because ...
```

## Collection Setup

If the needed history is not indexed yet, add a collection instead of inventing memory:

```bash
qmd collection add /path/to/history --name family-ledger --mask "**/*.{md,txt,beancount,bean,yaml}"
qmd context add qmd://family-ledger "Household bookkeeping history and prior journal decisions"
qmd update
qmd embed
```

Use collection names that describe the source clearly:

- `family-ledger`
- `business-ledger`
- `bookkeeping-notes`
- `tax-memos`

## Constraints

- NEVER treat a historical hit as automatic approval
- NEVER claim precedent means compliance
- NEVER skip reading the underlying source when the match is important
- ALWAYS distinguish exact precedent from merely similar examples
- ALWAYS prefer local history over freeform guessing

## Related Skills

- `/cfo-classify` — use precedent to improve categorization confidence
- `/cfo-consult` — use historical context before cross-model analysis
- `/cfo-reconcile` — use prior examples to explain unusual patterns
