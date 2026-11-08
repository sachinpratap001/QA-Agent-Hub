# gemini.md — Project Constitution

> **STATUS: ACTIVE — BLUEPRINT LOCKED. Schema Defined. Awaiting Blueprint Approval to begin Execution.**
> Last Updated: 2026-11-08

---

## 1. Behavioral Rules (Mandatory)

- The QA Assistant MUST only assert facts traceable to provided input (PRD, API docs, logs, screenshots, test data).
- The QA Assistant MUST NOT invent features, error codes, APIs, UI elements, or system behavior.
- Missing or unclear information MUST be flagged as: `Insufficient information to determine.`
- Inferences MUST be explicitly labeled: `Inference (low confidence)`
- Output MUST be deterministic and repeatable.
- Scripts in `tools/` are FORBIDDEN until:
  - [x] Discovery Questions are answered  ← DONE 2026-11-08
  - [x] Data Schema is defined (Section 3 of this file)  ← DONE 2026-11-08
  - [ ] `task_plan.md` Blueprint is approved by user  ← PENDING USER SIGN-OFF

---

## 2. Architectural Invariants

| Invariant | Description | Source |
|-----------|-------------|--------|
| BLAST Framework | Master System Prompt: Blueprint → Link → Architect → Stylize → Trigger | User input 2026-11-08 |
| LLM Runtime | Ollama only. Model: llama3.2. No external LLM calls permitted. | User Prompt 2 |
| Integration | Ollama REST API only (localhost:11434). No external integrations. | User Prompt 2 |
| App Port | Single port: 3000. Ollama: 11434 (default). | User Q2 answer |
| Delivery | Web chat UI on port 3000. User input → Ollama → agent output displayed. | User Prompt 2 |
| SUT | Open-source eCommerce app. Business flow: Login → Browse → Cart → Checkout. | User Q8 answer |
| E2E Runner | Playwright (locked). | User Q5 answer |
| API Runner | Jest + supertest (locked). Groq API flagged as ambiguous — Ollama-only invariant maintained. | User Q6 + Invariant conflict |
| Performance | NOT required. Excluded from scope. | User Q7 answer |
| Dashboard | HTML + Chart.js (browser-based, local, no external deps). Rationale in Section 3.4. | User Q4 + QA Assistant |
| Execution Gate | Scripts in `tools/` FORBIDDEN until all 3 gate conditions met. | Protocol 0 |
| Testing Mandatory | API (≥15 tests), Functional/UI (≥10 E2E tests), Triage, Reporting. | User Prompt 3 |

---

## 3. Data Schema

> **DEFINED — 2026-11-08. Source: User Q answers + eCommerce domain knowledge (Medusa.js).** 
> SUT: Open-source eCommerce (Medusa.js). Flow: Login → Browse → Cart → Checkout.

### 3.1 Entities

| Entity | Description |
|--------|-------------|
| User | Customer account with credentials |
| Product | Sellable item with variants and pricing |
| Cart | Active shopping session, holds line items |
| LineItem | A product variant + quantity inside a cart |
| Order | Confirmed purchase record |
| Address | Shipping/billing address |
| PaymentSession | Payment method selection during checkout |

### 3.2 Field Definitions

| Entity | Field | Type | Required | Notes |
|--------|-------|------|----------|-------|
| User | email | string | Yes | Valid email format |
| User | password | string | Yes | Min 8 chars |
| User | first_name | string | No | |
| User | last_name | string | No | |
| Product | id | string | Yes | |
| Product | title | string | Yes | |
| Product | variants | array | Yes | At least 1 |
| Product | thumbnail | string | No | URL |
| Cart | id | string | Yes | |
| Cart | items | LineItem[] | No | Can be empty |
| Cart | region_id | string | Yes | |
| LineItem | variant_id | string | Yes | |
| LineItem | quantity | integer | Yes | Min: 1 |
| Order | id | string | Yes | |
| Order | status | enum | Yes | pending/processing/shipped/delivered/cancelled |
| Order | email | string | Yes | |
| Order | total | integer | Yes | In cents |
| Address | first_name | string | Yes | |
| Address | last_name | string | Yes | |
| Address | address_1 | string | Yes | |
| Address | city | string | Yes | |
| Address | country_code | string | Yes | ISO 2-letter |
| Address | postal_code | string | Yes | |
| Address | phone | string | No | |
| PaymentSession | provider_id | string | Yes | e.g. "manual", "stripe" |

### 3.3 Validation Rules

| Rule | Description |
|------|-------------|
| Email format | Must match RFC 5322 email pattern |
| Password length | Min 8 characters |
| Quantity | Must be integer ≥ 1 |
| country_code | Must be valid ISO 3166-1 alpha-2 |
| Order status | Must be one of: pending, processing, shipped, delivered, cancelled |
| Cart items | variant_id must reference a valid, in-stock product variant |
| Order total | Must be a positive integer (cents), never zero or negative |

### 3.4 Dashboard Platform — Rationale

**Chosen: HTML + Chart.js (browser-based, served locally)**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| HTML + Chart.js | No dependencies, runs on port 3000, zero setup, fully customizable | Manual HTML only | ✅ CHOSEN |
| Grafana | Professional, rich UI | Requires Docker + InfluxDB, heavy setup, external service | ❌ Conflicts with local-first invariant |
| Allure | Great for test reports | Requires Java runtime, file-based, no live data | ❌ Extra setup burden |

**Reason:** Aligns with the Ollama-local-first architectural invariant. No external services. 
Served from the same Express server on port 3000. Reads `results.json` output from test runs.
Chart.js gives bar charts (pass/fail), trend lines (multi-run), and severity pie charts — all needed for Deliverable 5.

---

## 4. Protocol Definitions (BLAST Mapped)

| Protocol | BLAST Phase | Name | Status |
|----------|------------|------|--------|
| Protocol 0 | Pre-BLAST | Initialization | ✅ COMPLETE |
| Protocol 1 | B — Blueprint | Discovery & Blueprint Design | ✅ COMPLETE — awaiting user sign-off |
| Protocol 2 | L — Link | Integration & Architecture | 🔒 LOCKED — awaiting Blueprint approval |
| Protocol 3 | A — Architect + S — Stylize | Build SUT + QA Suite | 🔒 LOCKED — awaiting Blueprint approval |
| Phase 4 | S — Stylize | Dashboard & Reporting | 🔒 LOCKED — awaiting Execution |
| Phase 5 | T — Trigger | Deployment & Automation | 🔒 LOCKED — awaiting Phase 4 |

---

## 5. Discovery Questions — RESOLVED

| # | Question | Answer | Status |
|---|----------|--------|--------|
| 1 | BLAST.md file? | Acronym framework, NOT a file | ✅ RESOLVED |
| 2 | Port numbers? | App: 3000, Ollama: 11434 | ✅ RESOLVED |
| 3 | Agent templates? | QA Assistant to define (see impl plan) | ✅ RESOLVED |
| 4 | Dashboard? | HTML + Chart.js — rationale in Section 3.4 | ✅ RESOLVED |
| 5 | E2E runner? | Playwright | ✅ RESOLVED |
| 6 | API runner? | Jest + supertest (Groq API answer flagged as ambiguous — Ollama-only maintained) | ⚠️ FLAGGED |
| 7 | Performance? | NOT required | ✅ RESOLVED |
| 8 | Prompt 1? | Initial BLAST kickoff message | ✅ RESOLVED |

---

## 6. BLAST Framework Reference

| Letter | Phase | Responsibility |
|--------|-------|----------------|
| **B** | Blueprint | Design, planning, test strategy, agent templates |
| **L** | Link | Ollama API integration, backend routes, service layer |
| **A** | Architect | System structure, file layout, agent orchestration |
| **S** | Stylize | Chat UI, dashboard, visual reporting |
| **T** | Trigger | Deployment, port binding, cron/webhook automation |

---

## 7. Amendment Log

| Date | Section Changed | Reason | Author |
|------|----------------|---------|--------|
| 2026-11-08 | Initial creation | Protocol 0 Initialization | QA Assistant |
| 2026-11-08 | Section 2, 4, 5, 6 | BLAST framework confirmed; invariants populated | QA Assistant |
| 2026-11-08 | Section 1 (gate), 2, 3, 4, 5 | All Discovery Q answered; Data Schema defined; Blueprint ready | QA Assistant |
