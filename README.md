# QA Agent Hub — BLAST Framework

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-llama3.2-black?style=flat-square&logo=ollama&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=flat-square&logo=playwright&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-API_Testing-C21325?style=flat-square&logo=jest&logoColor=white)

> A local-first, privacy-preserving multi-agent QA automation platform for eCommerce applications powered by Ollama (`llama3.2`) and governed by the BLAST Framework.

---

## 🏛️ Architecture Overview

The QA Agent Hub orchestrates five specialized AI agents locally via Ollama to automate test design, API contract verification, storefront browser automation, defect triage, and release gating for a Medusa.js eCommerce platform. All LLM inference occurs on your local machine with zero external cloud dependencies and zero API costs.

```text
User  ──►  Web Chat UI (:3000)  ──►  Agent Orchestrator
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
             Ollama Engine (:11434)                 QA Dashboard (:3000)
                 (llama3.2)                                   ▲
                        │                                     │
       ┌────────────────┼────────────────┐                    │
       ▼                ▼                ▼                    │
BlueprintAgent    SentinelAgent   NavigatorAgent              │
 (Test Design)     (Jest APIs)     (Playwright)               │
                        │                │                    │
                        └───────┬────────┘                    │
                                ▼                             │
                       Medusa.js SUT (:9000/:8000)            │
                                │                             │
                                ▼                             │
                        TriageAgent & VerdictAgent ───────────┘
```

For full details, see [docs/architecture.md](docs/architecture.md).

---

## 📋 Prerequisites

Ensure your workstation meets the following prerequisites before starting:
- **Node.js:** v18.0.0 or higher (`node -v`)
- **npm:** v9.0.0 or higher (`npm -v`)
- **Ollama:** Installed and running locally on port 11434 (`ollama --version`)
- **Llama 3.2 Model:** Pulled into Ollama (`ollama pull llama3.2`)
- **Medusa.js SUT:** Locally running Medusa backend on port 9000 and storefront on port 8000

---

## 🚀 Quick Start Guide

Follow these numbered steps to set up and run the entire QA Agent Hub:

### Step 1: Clone or Open the Repository
```bash
cd project6
```

### Step 2: Install Ollama & Pull the Llama 3.2 Model
Download Ollama from [ollama.com](https://ollama.com/) if not already installed. Then download the local LLM:
```bash
ollama pull llama3.2
```
Verify the model is ready:
```bash
ollama list
```

### Step 3: Set Up Medusa.js eCommerce (SUT)
Install and start a local Medusa instance following the [Medusa.js Quickstart Guide](https://docs.medusajs.com/):
```bash
npx create-medusa-app@latest
```
Follow the CLI prompts to initialize the database and start the backend service on port `9000` and storefront on port `8000`.

### Step 4: Seed Test Data
Ensure the Medusa instance contains base eCommerce fixtures:
- A registered customer account:
  - **Email:** `test@example.com`
  - **Password:** `testpassword123`
- Default region configured with currency (USD / EUR) and the `manual` payment provider.
- At least one published product with sellable variants in stock.

### Step 5: Configure Environment Variables
Copy `.env.example` into `.env` within the `backend` directory:
```bash
cp backend/.env.example backend/.env
```
Ensure the parameters point to your local services:
```env
PORT=3000
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
MEDUSA_API_URL=http://localhost:9000
MEDUSA_STOREFRONT_URL=http://localhost:8000
TEST_CUSTOMER_EMAIL=test@example.com
TEST_CUSTOMER_PASSWORD=testpassword123
```

### Step 6: Install Dependencies & Start the Agent Hub
```bash
cd backend
npm install
npm start
```
> Use `127.0.0.1` (not `localhost`) for Ollama — Node 17+ resolves `localhost` to IPv6 `::1`, which Ollama does not listen on.

### Step 7: Access the Web Chat UI
Open your web browser and navigate to:
```text
http://localhost:3000
```
Chat directly with the 5 QA agents to generate test plans, review code, or request triage analysis.

### Step 8: View the QA Dashboard
Open the interactive quality dashboard:
```text
http://localhost:3000/dashboard
```
Or open `dashboard/index.html` directly in your browser.

### Step 9: Run Automated Tests
In a new terminal window, execute the automated test pipeline:
```bash
cd tests
npm install
node ../tools/run-tests.js
```

---

## 🤖 Specialized QA Agents

The system features five purpose-built agents defined in `backend/agents/templates.js`:

| Agent | Role | Primary Responsibility | Trigger Keywords |
|-------|------|------------------------|------------------|
| **BlueprintAgent** | Test Design | Generates structured positive, negative, and boundary test scenarios for customer journeys. | `design`, `test case`, `scenario`, `blueprint`, `plan` |
| **SentinelAgent** | API Testing | Generates and executes Jest and Supertest suites targeting Medusa REST endpoints (`/store/*`). | `api`, `endpoint`, `request`, `response`, `sentinel`, `rest` |
| **NavigatorAgent** | UI/E2E Testing | Generates and executes Playwright browser tests covering Storefront user interactions. | `ui`, `e2e`, `playwright`, `browser`, `navigator`, `cart` |
| **TriageAgent** | Failure Classification | Analyzes execution logs and classifies defects (`PRODUCT_BUG`, `TEST_ISSUE`, `ENVIRONMENT_ISSUE`). | `triage`, `failure`, `error`, `bug`, `defect`, `classify` |
| **VerdictAgent** | Release Governance | Aggregates pass rates and defect severities to issue authoritative `GO` / `NO-GO` decisions. | `verdict`, `release`, `ready`, `report`, `go no-go` |

---

## 📦 Deliverables Checklist

| # | Deliverable | Location |
|---|-------------|----------|
| 1 | Source repo + README | This repo, `README.md` |
| 2 | Architecture diagram (Mermaid + agent matrix) | [docs/architecture.md](docs/architecture.md) |
| 3 | Test strategy | [docs/test_strategy.md](docs/test_strategy.md) |
| 4 | Test artifacts | [docs/test_cases.md](docs/test_cases.md), `tests/api/` (32), `tests/e2e/` (21), [docs/defects/](docs/defects/) |
| 5 | QA dashboard | `http://localhost:3000/dashboard` (`dashboard/`) |
| 6 | AI evaluation note | [docs/ai_evaluation.md](docs/ai_evaluation.md) |
| 7 | Demo recording | Submitted separately |

> ⚠️ `dashboard/results/run-001.json` / `run-002.json` and `docs/defects/DEF-00x.md` are **sample data** (flagged `sampleData: true`). Replace with real runs via `node tools/run-tests.js` once Medusa is running.

---

## ⚡ The BLAST Framework

The project is structured according to the **BLAST Framework**:

| Phase | BLAST Letter | Name | Description |
|:-----:|:------------:|------|-------------|
| **1** | **B** | **Blueprint** | Define test scope, business journeys, schemas, and agent system prompts. |
| **2** | **L** | **Link** | Integrate local Ollama REST API endpoints, routing logic, and SUT connections. |
| **3** | **A** | **Architect** | Build directory structure, test runners, and multi-agent orchestration pipelines. |
| **4** | **S** | **Stylize** | Craft intuitive Chat UI, dark-mode Chart.js dashboard, and executive reports. |
| **5** | **T** | **Trigger** | Automate test execution via CLI scripts, cron jobs, and release gate webhooks. |

---

## 📂 Project Directory Structure

```text
project6/
├── frontend/                 # Chat UI (index.html, style.css, app.js)
├── backend/                  # Express server :3000
│   ├── server.js
│   ├── agents/templates.js   # 5 agent system prompts + trigger keywords
│   ├── services/             # ollama.js, orchestrator.js
│   ├── routes/               # chat.js, results.js
│   └── .env.example
├── dashboard/                # Chart.js dashboard + results/run-*.json
├── tests/
│   ├── api/                  # Jest + supertest (32 tests)
│   ├── e2e/                  # Playwright (21 tests)
│   └── playwright.config.js
├── tools/run-tests.js        # Unified test runner → results JSON
├── docs/                     # architecture, test_strategy, test_cases, defects/, ai_evaluation
└── BLAST.md, gemini.md, task_plan.md, findings.md, progress.md
```

---

## 📄 License
This project is licensed under the MIT License.
