# Sarah Chen — Freelance Software Consultant (Example)

A realistic US freelancer example managed with CFO Stack.

## About This Freelancer

- **Entity:** Sole proprietor (Schedule C)
- **Business:** Software consulting
- **Revenue:** ~$13,000-$14,000/month from two clients
- **Location:** San Francisco, CA
- **Owner transactions:** shows how to keep owner taxes and health insurance out of business expenses

## What's Included

- Chart of accounts mapped to Schedule C lines
- 3 months of transactions (Jan-Mar 2026)
- Balance assertions at each month-end
- Classification rules from corrections
- Travel expense tracking with receipts
- Owner draw tracking for non-business cash outflows

## How to Use

```bash
# Validate the ledger
./bin/cfo-check ./main.beancount

# Launch Fava to explore
./bin/cfo-fava ./main.beancount 5000

# Run CFO Stack skills
/report          # see P&L mapped to Schedule C
/tax-plan        # quarterly estimated tax planning
/advisor         # FIRE progress tracking
```

## Key Patterns Demonstrated

1. **Schedule C mapping:** Every expense references its Schedule C line
2. **Owner draws:** estimated taxes and personal health insurance kept outside Schedule C expenses
3. **Business-only P&L:** deductible operating costs stay separate from owner-level items
4. **Meals 50% rule:** Business meals flagged as 50% deductible
5. **Travel expenses:** Flights + hotels with receipt references
6. **Two income streams:** Multiple 1099 clients tracked separately
