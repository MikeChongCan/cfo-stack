# The C.L.E.A.R. Framework

## Overview

CLEAR is a five-step framework for AI-powered financial management. Each step
builds on the previous one, creating a complete cycle from raw data to
actionable financial intelligence.

---

## C — Capture

**Definition:** Consolidate every "evidence of money" into one place.

**Sources:**
- Bank CSV exports
- Credit card statements
- WeChat & Alipay bills
- Receipt photos
- Invoice PDFs

**Core Question:** Where is every piece of evidence of my money right now?

**Skills:** `/capture`, `/bank-import`, `/receipt-scan`

---

## L — Log

**Definition:** Transform captured data into structured entries (double-entry).

**Process:**
- Raw CSV → cleaned, deduplicated transactions
- Transactions → Beancount double-entry format
- AI-assisted classification, not manual typing

**Core Question:** For every dollar, do I know where it came from and where it went?

**Skills:** `/log`, `/classify`, `/validate`

---

## E — Extract

**Definition:** Use AI to distill actionable insights, not just numbers.

**Analysis:**
- Spending pattern analysis
- Anomaly detection
- Trend forecasting
- Tax preparation summaries

**Core Question:** What are these numbers telling me? What should I do?

**Skills:** `/extract`, `/reconcile`, `/tax-plan`

---

## A — Automate

**Definition:** Turn repetitive L and E steps into scripts. 30 min/month.

**Automation:**
- Claude Code generates processing scripts
- Scheduled pipeline runs
- Automated error alerts

**Core Question:** Have I done this more than 3 times? Can a machine do it instead?

**Skills:** `/automate`, `/monthly-close`, `/quarterly-tax`

---

## R — Report

**Definition:** Output a clear financial picture for decisions and compliance.

**Reports:**
- Fava visual reports
- Three core financial statements
- GST/VAT filing data
- AI-powered report interpretation

**Core Question:** Can I describe my current financial health in one paragraph?

**Skills:** `/report`, `/fava`, `/advisor`
