# System Architecture

## AI Procurement Decision & Negotiation Agent

**Version:** 1.0

---

# 1. Architecture Overview

The application follows a layered architecture:

```text
React Frontend
       ↓
FastAPI Backend
       ↓
LangGraph Orchestrator
       ↓
AI Agents + Tools
       ↓
Supabase
 ┌───────────────┬───────────────┐
 │ PostgreSQL    │ Storage       │
 │ + pgvector    │ Vendor PDFs   │
 └───────────────┴───────────────┘
```

---

# 2. Technology Stack

| Layer             | Technology               |
| ----------------- | ------------------------ |
| Frontend          | React                    |
| Frontend Language | TypeScript               |
| Styling           | Tailwind CSS             |
| Backend           | FastAPI                  |
| Backend Language  | Python                   |
| Agent Framework   | LangGraph                |
| Database          | Supabase PostgreSQL      |
| Vector Search     | pgvector                 |
| File Storage      | Supabase Storage         |
| LLM               | Configurable LLM API     |
| Deployment        | Vercel + Backend Hosting |

---

# 3. System Components

## 3.1 Frontend

The React frontend is responsible for:

* Evaluation creation
* Requirement entry
* Proposal upload
* Analysis progress
* Vendor comparison
* Risk visualization
* Recommendation display
* Evidence inspection
* Negotiation interface
* Email generation

---

# 4. Backend

FastAPI provides:

* REST APIs
* File upload handling
* Authentication/authorization
* Evaluation management
* Database operations
* Agent execution
* Analysis result delivery

---

# 5. LangGraph Orchestration

LangGraph manages the multi-agent workflow.

The orchestrator maintains shared state and determines which agent should execute next.

---

# 6. Multi-Agent Architecture

## 6.1 Document Intelligence Agent

### Responsibilities

* Read proposal documents
* Extract relevant content
* Identify vendor information
* Structure extracted data
* Preserve source references

### Input

Vendor proposal

### Output

Structured proposal data

---

# 6.2 Requirement Agent

### Responsibilities

* Understand user requirements
* Normalize requirements
* Categorize requirements
* Assign priorities
* Prepare evaluation criteria

### Output

Structured requirements

---

# 6.3 Vendor Analysis Agent

### Responsibilities

* Evaluate each vendor against requirements
* Determine requirement status
* Retrieve evidence
* Explain mismatches

### Output

Requirement-level vendor analysis

---

# 6.4 Comparison Agent

### Responsibilities

* Normalize vendor information
* Compare pricing
* Compare features
* Compare support
* Compare SLA
* Calculate weighted scores

### Output

Vendor comparison and scores

---

# 6.5 Risk Agent

### Responsibilities

Detect:

* Hidden charges
* Lock-in
* Auto-renewal
* Cancellation penalties
* Weak SLA terms
* Missing information
* Ambiguous conditions

### Output

Structured risk records

---

# 6.6 Decision Agent

### Responsibilities

* Aggregate vendor analysis
* Consider user priorities
* Consider cost
* Consider risks
* Rank vendors
* Generate recommendation

### Output

Evidence-backed recommendation

---

# 6.7 Negotiation Agent

### Responsibilities

* Identify negotiation opportunities
* Analyze competitive leverage
* Prioritize negotiation points
* Generate clarification questions
* Generate vendor communication

### Output

Negotiation strategy

---

# 7. Agent Workflow

```text
                    User
                      ↓
             Create Evaluation
                      ↓
             Define Requirements
                      ↓
             Upload Proposals
                      ↓
              Document Agent
                      ↓
             Requirement Agent
                      ↓
          Vendor Analysis Agent
                      ↓
             Comparison Agent
                      ↓
                Risk Agent
                      ↓
              Decision Agent
                      ↓
             Recommendation
                      ↓
            Negotiation Agent
                      ↓
          Questions / Email
```

---

# 8. Shared Agent State

Agents should communicate through structured state.

Example:

```python
state = {
    "evaluation_id": "",
    "requirements": [],
    "proposals": [],
    "extracted_data": {},
    "vendor_analysis": {},
    "comparison": {},
    "risks": [],
    "scores": {},
    "recommendation": {},
    "negotiation_strategy": {}
}
```

The system should avoid uncontrolled agent-to-agent communication.

---

# 9. Document Processing Pipeline

```text
PDF Upload
    ↓
Supabase Storage
    ↓
PDF Parser
    ↓
Text Extraction
    ↓
Page Separation
    ↓
Chunking
    ↓
Embedding Generation
    ↓
Supabase PostgreSQL + pgvector
```

---

# 10. RAG Architecture

When an agent needs evidence:

```text
Agent Query
     ↓
Embedding
     ↓
pgvector Search
     ↓
Relevant Proposal Chunks
     ↓
LLM
     ↓
Answer + Evidence
```

Each chunk should contain metadata:

```text
evaluation_id
proposal_id
vendor_id
page_number
section
chunk_text
embedding
```

---

# 11. Evidence Architecture

Important findings must maintain a relationship with the source document.

Example:

```json
{
  "finding": "Vendor A requires a three-year commitment",
  "proposal_id": "prop_001",
  "page_number": 14,
  "evidence": "Contract term: 36 months"
}
```

This enables the UI to show the original evidence.

---

# 12. Supabase Architecture

## PostgreSQL Tables

The database schema defines the following core tables with UUID primary keys and relationship integrity:

* `users`: Stores user identities (id, email).
* `evaluations`: High-level procurement analysis (id, user_id, name, status).
* `requirements`: Evaluation criteria (id, evaluation_id, name, priority).
* `vendors`: Vendor entities (id, evaluation_id, name, contact_info).
* `proposals`: Proposal metadata, without PDF binaries (id, vendor_id, evaluation_id, file_name, storage_path, processing_status).
* `proposal_chunks`: Split proposal text for RAG (id, proposal_id, chunk_text, embedding).
* `vendor_analysis`: Requirements check per vendor (status, explanation, evidence).
* `risks`: Identified vendor risks (risk_type, severity).
* `recommendations`: Final AI decisions (recommended_vendor_id, reasoning).
* `negotiation_strategies`: Negotiation points (clarification_questions, leverage_points).

---

## pgvector Usage

We use the `pgvector` extension to enable semantic search on proposal documents:
* `proposal_chunks` table contains an `embedding` column of type `vector(1536)`.
* This enables cosine similarity search for the RAG pipeline when Agents query proposal evidence.

---

## Supabase Storage Usage

Stores:
* Uploaded PDF files (`.pdf`)

The actual binary content resides in Supabase Storage. The PostgreSQL `proposals` table only stores the `storage_path` reference.

---

# 13. Database Relationship

```text
User
 │
 └── Evaluation
       │
       ├── Requirements
       │
       └── Vendors
             │
             └── Proposals
                    │
                    ├── Chunks
                    │
                    ├── Analysis
                    │
                    └── Risks
```

---

# 14. Security

The system shall:

* Store secrets in environment variables.
* Protect Supabase credentials.
* Use appropriate database access policies.
* Restrict evaluation access to authorized users.
* Validate uploaded files.
* Avoid sending unnecessary sensitive information to external AI services.

---

# 15. Deployment Architecture

```text
                  Internet
                     │
                     ▼
              Vercel / Frontend
                     │
                  HTTPS
                     │
                     ▼
              FastAPI Backend
                     │
          ┌──────────┼───────────┐
          ▼          ▼           ▼
      Supabase    LLM API    LangGraph
          │
     ┌────┴─────┐
     ▼          ▼
PostgreSQL   Storage
 + pgvector     │
     │           ▼
     │        Vendor PDFs
     │
     └── Proposal embeddings
```

---

# 16. Design Principles

1. Agents should have clear responsibilities.
2. Structured state should be used between agents.
3. Evidence should be preserved throughout the workflow.
4. Unknown information must not be fabricated.
5. Human approval should remain part of the procurement process.
6. Deterministic calculations should use tools/functions instead of relying on LLM arithmetic.
7. The system should separate document retrieval from reasoning.
