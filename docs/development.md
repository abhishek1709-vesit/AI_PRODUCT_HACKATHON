# Development Plan

## AI Procurement Decision & Negotiation Agent

**Version:** 1.0

---

# 1. Development Strategy

The project will be developed incrementally.

The priority is to build a complete end-to-end MVP before implementing advanced features.

The core workflow is:

```text
Upload
   ↓
Extract
   ↓
Compare
   ↓
Detect Risks
   ↓
Recommend
```

After the core workflow works, negotiation features will be added.

---

# 2. Development Stack

## Frontend

* React
* TypeScript
* Tailwind CSS

## Backend

* Python
* FastAPI

## AI

* LangGraph
* LLM API
* Embeddings

## Database

* Supabase PostgreSQL
* pgvector

## Storage

* Supabase Storage

---

# 3. Phase 1 — Project Setup

## Frontend

* Initialize React application
* Configure TypeScript
* Configure Tailwind
* Configure routing
* Create application layout
* Create sidebar

## Backend

* Initialize FastAPI
* Create application structure
* Configure CORS
* Configure environment variables
* Create health endpoint

---

# 4. Phase 2 — Supabase Setup

Create Supabase project.

Configure:

* PostgreSQL
* pgvector
* Storage
* Database access
* Environment variables

Environment variables:

```env
SUPABASE_URL=
SUPABASE_KEY=
DATABASE_URL=
LLM_API_KEY=
```

Secrets must not be committed to Git.

---

# 5. Phase 3 — Database

Create tables for:

```text
users
evaluations
requirements
vendors
proposals
proposal_chunks
vendor_analysis
risks
recommendations
negotiation_strategies
```

Define relationships between tables.

---

# 6. Phase 4 — Evaluation Management

Implement:

* Create evaluation
* Retrieve evaluation
* Update evaluation
* Delete evaluation

Frontend:

* Evaluation list
* Evaluation creation form
* Evaluation details

---

# 7. Phase 5 — Requirements

Implement:

* Add requirement
* Edit requirement
* Delete requirement
* Set priority
* Set weight
* Set minimum value
* Set preferred value

---

# 8. Phase 6 — Proposal Upload

Implement:

* PDF upload
* File validation
* Vendor association
* Supabase Storage upload
* Proposal metadata creation

Test with multiple proposals.

---

# 9. Phase 7 — Document Processing

Implement:

```text
PDF
 ↓
Text Extraction
 ↓
Page Detection
 ↓
Chunking
 ↓
Metadata
```

Each chunk should retain:

```text
proposal_id
vendor_id
page_number
section
text
```

---

# 10. Phase 8 — RAG

Implement:

```text
Proposal Chunk
     ↓
Embedding
     ↓
pgvector
```

Implement semantic search.

Test questions:

```text
What is Vendor A's SLA?

What is the cancellation policy?

What are the implementation costs?

Does the vendor offer 24/7 support?
```

Every answer should return source information.

---

# 11. Phase 9 — Document Intelligence Agent

Implement the first LangGraph agent.

Responsibilities:

* Extract proposal data
* Identify vendor
* Extract pricing
* Extract features
* Extract contract terms
* Extract SLA
* Extract support
* Preserve evidence

---

# 12. Phase 10 — Requirement Agent

Implement:

* Requirement normalization
* Priority interpretation
* Requirement categorization
* Evaluation criteria generation

---

# 13. Phase 11 — Vendor Analysis Agent

Implement:

```text
Vendor
  +
Requirement
  ↓
Analysis
  ↓
Meets / Partial / Does Not Meet / Unknown
  ↓
Evidence
```

---

# 14. Phase 12 — Comparison Agent

Implement:

* Vendor normalization
* Feature comparison
* Pricing comparison
* SLA comparison
* Support comparison
* Weighted scoring
* Vendor ranking

Use deterministic Python functions for numerical calculations where possible.

Do not rely on the LLM for arithmetic.

---

# 15. Phase 13 — TCO Calculator

Implement a dedicated calculation tool.

Calculate:

```text
TCO =
Subscription
+
Implementation
+
Support
+
Usage
+
Additional Known Costs
```

Track:

* Known values
* Estimated values
* Unknown values

---

# 16. Phase 14 — Risk Agent

Implement detection of:

* Hidden charges
* Lock-in
* Auto-renewal
* Cancellation penalties
* SLA limitations
* Missing information
* Ambiguous terms

Each result must include evidence where available.

---

# 17. Phase 15 — Decision Agent

Combine:

```text
Requirements
+
Vendor Analysis
+
Comparison
+
TCO
+
Risks
```

Generate:

* Vendor ranking
* Recommended vendor
* Score
* Reasons
* Conditions
* Risks

---

# 18. Phase 16 — Frontend Results

Build:

* Comparison table
* TCO visualization
* Risk dashboard
* Recommendation page
* Evidence drawer
* Missing information section

---

# 19. Phase 17 — Negotiation Agent

After the MVP is stable, implement:

* Negotiation opportunity detection
* Competitive leverage
* Negotiation priorities
* Clarification questions
* Vendor email generation

---

# 20. Phase 18 — Testing

## Document Testing

Test:

* Normal PDFs
* Large PDFs
* Empty PDFs
* Scanned PDFs
* PDFs with tables
* PDFs with inconsistent formatting

---

## AI Testing

Test:

* Missing information
* Contradictory information
* Different pricing formats
* Ambiguous clauses
* Incorrect vendor names
* Unsupported claims

---

## Backend Testing

Test:

* API endpoints
* Database operations
* File uploads
* Agent execution
* Error handling

---

## Frontend Testing

Test:

* Forms
* Uploads
* Loading states
* Error states
* Empty states
* Results display

---

# 21. Demo Dataset

Prepare three realistic vendor proposals.

Example:

### Vendor A

* Strong technical offering
* Higher implementation cost
* Strong SLA
* Long contract

### Vendor B

* Lowest advertised price
* Usage-based charges
* Weak SLA

### Vendor C

* Moderate price
* Strong flexibility
* Missing support information

This dataset should create meaningful differences between vendors.

---

# 22. Hackathon Demo Flow

The final demo should follow:

```text
1. Create procurement evaluation

2. Define requirements

3. Upload three vendor proposals

4. Start AI analysis

5. Show extracted information

6. Show vendor comparison

7. Show TCO

8. Reveal hidden cost

9. Show risk analysis

10. Show missing information

11. Show recommended vendor

12. Click "View Evidence"

13. Generate negotiation strategy

14. Generate vendor questions

15. Generate email
```

---

# 23. MVP Priority

## P0 — Must Have

* Supabase setup
* Evaluation creation
* Requirements
* PDF upload
* PDF extraction
* Proposal analysis
* Vendor comparison
* Risk detection
* Basic TCO
* Vendor scoring
* Recommendation
* Evidence

---

## P1 — Should Have

* Missing information detection
* Advanced TCO
* Negotiation strategy
* Vendor questions
* Evidence viewer

---

## P2 — Nice to Have

* Email generation
* What-if simulation
* Historical vendors
* Collaboration
* Analytics
* Vendor Q&A

---

# 24. Git Workflow

Recommended branches:

```text
main
development

feature/frontend
feature/backend
feature/database
feature/document-processing
feature/agents
feature/rag
feature/negotiation
```

Each feature should be developed independently and merged after testing.

---

# 25. Definition of Done

A feature is complete when:

* Backend implementation exists.
* Frontend integration exists where required.
* Database integration works.
* Error handling exists.
* Loading states exist.
* Basic testing is complete.
* The feature works with the demo dataset.
* Code is committed to Git.

---

# 26. Development Principle

The team should prioritize:

> **One complete intelligent workflow over many incomplete AI features.**

The system must first successfully demonstrate:

```text
Requirements
      ↓
Vendor Proposals
      ↓
AI Analysis
      ↓
Comparison
      ↓
Risk Detection
      ↓
Evidence
      ↓
Recommendation
```

Only after this workflow is stable should advanced negotiation features be added.
