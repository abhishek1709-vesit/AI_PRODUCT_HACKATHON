# UI/UX Specification

## AI Procurement Decision & Negotiation Agent

**Version:** 1.0

---

# 1. Design Objective

The interface should feel:

* Professional
* Trustworthy
* Modern
* Data-driven
* Enterprise-oriented
* Easy to understand

The primary objective is to help users make procurement decisions quickly.

---

# 2. Design Principles

### 1. Evidence First

Important AI findings should be connected to their source.

### 2. Clear Visual Hierarchy

The most important information should be immediately visible.

### 3. Avoid AI Overload

Do not display long AI-generated paragraphs when a concise explanation is sufficient.

### 4. Show Uncertainty

Unknown information should be clearly represented.

### 5. Human-in-the-Loop

Users should review recommendations before taking action.

---

# 3. Main Navigation

Sidebar:

```text
Dashboard
Evaluations
Vendors
Reports
Settings
```

Primary action:

```text
+ New Evaluation
```

---

# 4. Dashboard

The dashboard should display:

* Active evaluations
* Completed evaluations
* Number of vendors analyzed
* Pending decisions
* Recent evaluations

Example:

```text
AI Procurement Assistant

Active Evaluations
     4

Vendors Analyzed
    16

Pending Decisions
     2

[ + New Evaluation ]
```

---

# 5. Evaluation Creation

Fields:

```text
Evaluation Name
Procurement Category
Description
Budget
```

Requirements section:

```text
Requirement
Category
Priority
Weight
Minimum Value
Preferred Value
```

Action:

```text
[ Continue ]
```

---

# 6. Proposal Upload

The user can upload multiple proposals.

Example:

```text
Vendor Proposals

┌──────────────────────────────┐
│ Vendor A Proposal.pdf        │
│ ✓ Uploaded                   │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Vendor B Proposal.pdf        │
│ ✓ Uploaded                   │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Vendor C Proposal.pdf        │
│ ✓ Uploaded                   │
└──────────────────────────────┘

[ Start Analysis ]
```

---

# 7. Analysis Progress

The user should see understandable progress stages.

```text
✓ Reading proposals
✓ Extracting information
✓ Matching requirements
● Comparing vendors
○ Detecting risks
○ Preparing recommendation
```

Do not expose technical implementation details such as:

> "LangGraph Node 4 executing."

Use human-readable stages.

---

# 8. Results Dashboard

After analysis:

```text
Procurement Evaluation

Recommended Vendor
     Vendor A
      88/100

Estimated Best Value
     Vendor A

Highest Risk
     Vendor B

Potential Savings
     ₹X
```

---

# 9. Vendor Comparison

Main comparison table:

```text
Criteria        Vendor A   Vendor B   Vendor C

Price              8          10         7
Technical Fit      9           7         9
SLA               10           8         7
Support            8           9         6
Contract            6           9         7

Overall            88          84        76
```

Requirement status indicators:

```text
✓ Meets
⚠ Partially Meets
✗ Does Not Meet
? Information Missing
```

---

# 10. TCO View

Display:

```text
Estimated 3-Year TCO

Vendor A
₹26.5L

Vendor B
₹29.0L

Vendor C
₹24.8L
```

Show cost components:

```text
Subscription
Implementation
Support
Usage
Additional Charges
```

Explicitly label estimated values.

---

# 11. Risk Center

Risk cards should display:

```text
HIGH

Vendor B

Hidden Usage Charges

Potential Impact:
Actual cost may exceed advertised price.

[ View Evidence ]
```

Severity levels:

* High
* Medium
* Low

---

# 12. Evidence Drawer

When the user clicks:

```text
[ View Evidence ]
```

display:

```text
Vendor A Proposal

Page 14

Contract Term

"36-month minimum commitment..."

Source:
Vendor A Proposal.pdf

[ Open Document ]
```

The relevant evidence should be visually highlighted.

---

# 13. Recommendation Page

Display:

```text
Recommended Vendor

        VENDOR A

        88 / 100
```

Sections:

### Why Vendor A?

* Strongest technical fit
* Meets all critical requirements
* Strong SLA
* Good support

### Risks

* Three-year commitment
* High implementation cost

### Conditions Before Approval

1. Negotiate contract duration.
2. Clarify implementation charges.
3. Confirm SLA penalties.

---

# 14. Negotiation Page

Display:

```text
Negotiation Strategy

HIGH PRIORITY
Reduce contract duration

Reason:
Competitor B offers a shorter commitment.

MEDIUM PRIORITY
Remove implementation fee

LOW PRIORITY
Improve support terms
```

Actions:

```text
[ Generate Questions ]
[ Generate Vendor Email ]
```

---

# 15. Vendor Email

Display generated content inside an editable editor.

Actions:

```text
[ Edit ]
[ Regenerate ]
[ Copy ]
```

The system should never automatically send an email without user approval.

---

# 16. Missing Information

Display a dedicated section:

```text
Information Missing

Vendor B

? Data residency
? SLA compensation
? Disaster recovery
? Cancellation terms

[ Generate Questions ]
```

---

# 17. Loading States

Use:

* Skeleton loaders
* Progress indicators
* Processing states

Avoid blank screens.

---

# 18. Error States

Example:

```text
Unable to process proposal.

The PDF appears to contain scanned images.

[ Upload Another File ]
```

---

# 19. Empty States

Example:

```text
No procurement evaluations yet.

Create your first evaluation to compare vendor proposals.

[ + New Evaluation ]
```

---

# 20. Responsive Design

Primary target:

* Desktop

Secondary:

* Tablet

Mobile should remain usable but is not the primary procurement workflow.

---

# 21. Accessibility

The interface should provide:

* Keyboard navigation
* Accessible labels
* Sufficient contrast
* Clear status indicators
* Non-color-only status representation

For example:

Do not rely only on red/green.

Use:

```text
✓ Meets
✗ Does Not Meet
```

as well as visual styling.

---

# 22. UX Success Criteria

A user should be able to go from:

```text
Upload proposals
      ↓
Understand comparison
      ↓
Identify risks
      ↓
Understand recommendation
      ↓
Inspect evidence
      ↓
Prepare negotiation
```

without requiring technical knowledge of AI.
