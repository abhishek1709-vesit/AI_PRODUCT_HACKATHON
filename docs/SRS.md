# Software Requirements Specification (SRS)

## AI Procurement Decision & Negotiation Agent

**Version:** 1.0

---

# 1. Introduction

## 1.1 Purpose

This document defines the functional and non-functional requirements of the AI Procurement Decision & Negotiation Agent.

The system will process vendor proposals, compare them against procurement requirements, identify risks, calculate costs, and generate explainable vendor recommendations.

---

# 2. System Scope

The system shall provide:

* Procurement evaluation management
* Requirement management
* Vendor proposal upload
* PDF processing
* Structured information extraction
* Retrieval-augmented analysis
* Requirement matching
* Vendor comparison
* TCO calculation
* Risk detection
* Vendor scoring
* Recommendation generation
* Evidence retrieval
* Negotiation assistance

---

# 3. User Roles

## 3.1 Procurement User

Can:

* Create evaluations
* Define requirements
* Upload proposals
* Run analysis
* View comparison
* View risks
* View recommendations
* Generate negotiation content

---

# 4. Functional Requirements

## FR-01: Create Evaluation

The system shall allow a user to create a procurement evaluation.

Required fields:

* Name
* Category
* Description

The system shall generate a unique evaluation ID.

---

## FR-02: Manage Requirements

The system shall allow users to create requirements.

Each requirement shall contain:

* Name
* Description
* Category
* Priority
* Weight
* Minimum acceptable value
* Preferred value

---

## FR-03: Upload Proposal

The system shall allow users to upload vendor proposals in PDF format.

The system shall:

1. Validate the file.
2. Store the file.
3. Create proposal metadata.
4. Associate the proposal with an evaluation.
5. Associate the proposal with a vendor.

---

## FR-04: Validate Files

The system shall reject:

* Unsupported formats
* Corrupted files
* Empty files
* Files exceeding the configured size limit

The system shall return a user-readable error.

---

## FR-05: Process Documents

The system shall:

1. Extract text from PDFs.
2. Preserve page boundaries.
3. Split text into chunks.
4. Generate embeddings.
5. Store chunks and metadata.
6. Make chunks available for retrieval.

Metadata shall include:

* Evaluation ID
* Proposal ID
* Vendor ID
* Page number
* Section information

---

## FR-06: Extract Vendor Information

The system shall extract:

* Vendor name
* Pricing
* Features
* SLA
* Support
* Contract terms
* Implementation
* Compliance
* Additional charges
* Limitations

The system shall not fabricate unavailable information.

---

## FR-07: Requirement Matching

The system shall compare each vendor against defined requirements.

Each requirement shall have one of:

* Meets
* Partially Meets
* Does Not Meet
* Information Missing

The result shall include an explanation and evidence where available.

---

## FR-08: Cost Calculation

The system shall calculate:

* Annual cost
* Implementation cost
* Additional known costs
* Estimated TCO

The system shall distinguish between known and estimated values.

If required information is unavailable, the system shall indicate the missing information instead of inventing a value.

---

## FR-09: Risk Detection

The system shall detect potential:

* Hidden fees
* Contract lock-in
* Auto-renewal
* Cancellation penalties
* SLA limitations
* Missing guarantees
* Unclear terms
* Missing information

Each risk shall contain:

* Vendor
* Type
* Severity
* Description
* Impact
* Evidence
* Page number

---

## FR-10: Vendor Scoring

The system shall calculate a weighted vendor score based on configurable criteria.

Possible scoring dimensions:

* Requirement fit
* Cost
* Technical fit
* Support
* SLA
* Compliance
* Risk

Weights shall be configurable.

---

## FR-11: Vendor Ranking

The system shall rank vendors according to their calculated scores.

The ranking shall be explainable.

---

## FR-12: Recommendation

The system shall generate a recommended vendor.

The recommendation shall contain:

* Selected vendor
* Overall score
* Key reasons
* Advantages
* Risks
* Conditions
* Supporting evidence

---

## FR-13: Evidence Retrieval

The system shall retrieve relevant sections of source documents.

Each evidence record shall contain:

* Proposal ID
* Page number
* Section
* Extracted text

---

## FR-14: Missing Information Detection

The system shall identify information required for evaluation but not found in the proposal.

Examples:

* Missing SLA compensation
* Missing data residency
* Missing cancellation terms
* Missing usage charges

---

## FR-15: Negotiation Strategy

The system shall generate negotiation opportunities.

Each negotiation item shall contain:

* Priority
* Issue
* Reason
* Suggested request
* Supporting evidence
* Competitive leverage where available

---

## FR-16: Vendor Questions

The system shall generate clarification questions based on missing or ambiguous information.

---

## FR-17: Email Generation

The system shall generate editable vendor communication based on:

* Vendor
* Questions
* Negotiation points
* Required confirmations

---

# 5. API Requirements

## POST /evaluations

Create an evaluation.

---

## GET /evaluations/{evaluation_id}

Retrieve an evaluation.

---

## POST /evaluations/{evaluation_id}/requirements

Create a requirement.

---

## GET /evaluations/{evaluation_id}/requirements

Retrieve requirements.

---

## POST /evaluations/{evaluation_id}/proposals

Upload a vendor proposal.

---

## GET /evaluations/{evaluation_id}/proposals

Retrieve proposals.

---

## POST /evaluations/{evaluation_id}/analyze

Start proposal analysis.

---

## GET /evaluations/{evaluation_id}/analysis

Retrieve analysis results.

---

## GET /evaluations/{evaluation_id}/comparison

Retrieve vendor comparison.

---

## GET /evaluations/{evaluation_id}/risks

Retrieve detected risks.

---

## GET /evaluations/{evaluation_id}/recommendation

Retrieve recommendation.

---

## POST /evaluations/{evaluation_id}/negotiation

Generate negotiation strategy.

---

## POST /evaluations/{evaluation_id}/email

Generate vendor email.

---

# 6. Non-Functional Requirements

## NFR-01: Performance

The system should provide progress feedback during long-running proposal analysis.

---

## NFR-02: Reliability

The system shall handle:

* Invalid PDFs
* Missing information
* LLM failures
* Retrieval failures
* Database failures

gracefully.

---

## NFR-03: Explainability

Important AI-generated findings shall contain supporting evidence whenever evidence exists.

---

## NFR-04: Security

The system shall:

* Protect uploaded documents.
* Restrict access to authorized users.
* Keep API keys in environment variables.
* Avoid exposing secrets to the frontend.

---

## NFR-05: Data Integrity

Evaluation results must remain associated with the correct:

* Evaluation
* Vendor
* Proposal
* Requirement

---

## NFR-06: Scalability

The architecture should allow additional vendors and evaluations without major architectural changes.

---

# 7. Error Handling

## Invalid Proposal

Display:

> The uploaded file could not be processed.

---

## Missing Information

Display:

> Information not found in the proposal.

---

## Insufficient Evidence

Display:

> Insufficient evidence to make a reliable assessment.

---

## AI Failure

Display:

> Analysis could not be completed. Please retry.

---

# 8. Constraints

* Initial document format: PDF
* AI-generated outputs require human review.
* Vendor recommendations are decision support, not autonomous purchasing decisions.
* Unknown values must not be fabricated.

---

# 9. Acceptance Criteria

The system is accepted when:

* Users can upload multiple proposals.
* Requirements can be defined.
* Proposal information is extracted.
* Vendors can be compared.
* Risks are detected.
* TCO is calculated where data is available.
* Recommendations are generated.
* Evidence can be inspected.
