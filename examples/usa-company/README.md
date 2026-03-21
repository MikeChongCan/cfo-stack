# Sarah Chen — Freelance Software Consultant (Example)

A realistic US freelancer example managed with CPA Stack.

## About This Freelancer

- **Entity:** Sole proprietor (Schedule C)
- **Business:** Software consulting
- **Revenue:** ~$13,000-$14,000/month from two clients
- **Location:** San Francisco, CA
- **Health insurance:** Self-employed health insurance deduction

## What's Included

- Chart of accounts mapped to Schedule C lines
- 3 months of transactions (Jan-Mar 2026)
- Balance assertions at each month-end
- Classification rules from corrections
- Travel expense tracking with receipts
- Estimated tax payment tracking

## How to Use

```bash
# Validate the ledger
./bin/cpa-check main.beancount

# Launch Fava to explore
./bin/cpa-fava main.beancount 5000

# Run CPA Stack skills
/report          # see P&L mapped to Schedule C
/tax-plan        # quarterly estimated tax planning
/advisor         # FIRE progress tracking
```

## Key Patterns Demonstrated

1. **Schedule C mapping:** Every expense references its Schedule C line
2. **Estimated tax payments:** Q4 2025 payment tracked in January
3. **Health insurance deduction:** Self-employed premium tracking
4. **Meals 50% rule:** Business meals flagged as 50% deductible
5. **Travel expenses:** Flights + hotels with receipt references
6. **Two income streams:** Multiple 1099 clients tracked separately
