# MapleTech Solutions Inc. — Example

A realistic Canadian corporation example managed with CFO Stack.

## About This Company

- **Entity:** Canadian corporation (Alberta)
- **Business:** Tech consulting and SaaS
- **Revenue:** ~$23,000/quarter from two clients
- **Fiscal year:** Calendar year (Jan-Dec)
- **GST registered:** Yes (5% GST)

## What's Included

- Full chart of accounts for a service business
- 3 months of transactions (Jan-Mar 2026)
- Balance assertions at each month-end
- Classification rules learned from corrections
- Receipt references for every transaction >$20

## How to Use

```bash
# Validate the ledger
./bin/cfo-check ./main.beancount

# Launch Fava to explore
./bin/cfo-fava ./main.beancount 5000

# Run CFO Stack skills
/cfo-report          # see financial statements
/cfo-reconcile       # verify balances
/cfo-quarterly-tax   # prepare Q1 GST return
```

## Key Patterns Demonstrated

1. **GST/HST handling:** Every expense shows recoverable input tax tracking
2. **Meals 50% rule:** Entertainment ITCs at half rate
3. **CCA tracking:** MacBook capitalized to equipment, with CCA handled separately
4. **Invoice → Payment:** AR cycle from billing to collection
5. **Month-end close:** Balance assertions at every month-end
