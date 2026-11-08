# Project Structure — Local LLM QA Agent Orchestrator (BLAST)

> Generated: 2026-11-08 · Excludes: node_modules, .git, .venv, venv, __pycache__, test-results, playwright-report

```
project6/
│
├── gemini.md                     # Project Constitution: rules, invariants, data schema
├── task_plan.md                  # BLAST phases, goals, checklists
├── findings.md                   # Research, discoveries, constraints
├── progress.md                   # Chronological log: actions, errors, results
├── README.md                     # Setup & run instructions
├── PROJECT_STRUCTURE.md          # This file
├── project-structure.txt         # Flat listing (Method 2 output)
│
├── app/                          # [L+A+S] Express server — port 3000
│   ├── server.js                 # Entry point: routes, static files, startup banner
│   ├── package.json              # express, cors, dotenv, axios (+ nodemon dev)
│   ├── package-lock.json
│   ├── .env                      # Local config (PORT, OLLAMA_URL, MEDUSA URLs, test creds)
│   ├── .env.example              # Config template
│   │
│   ├── agents/
│   │   └── templates.js          # AGENT_TEMPLATES: 5 agents (system prompts + trigger keywords)
│   │                             #   BlueprintAgent  [B] Test design
│   │                             #   SentinelAgent   [L] API tests (Jest + supertest)
│   │                             #   NavigatorAgent  [A] E2E tests (Playwright)
│   │                             #   TriageAgent     [S] Failure classification / defects
│   │                             #   VerdictAgent    [T] GO / NO-GO release verdict
│   │
│   ├── services/
│   │   ├── ollama.js             # Ollama REST client (localhost:11434, llama3.2)
│   │   └── orchestrator.js       # Routes user input to the matching agent
│   │
│   ├── routes/
│   │   ├── chat.js               # Chat API (user input → agent → Ollama)
│   │   └── results.js            # /api/results — serves test-run JSON
│   │
│   └── public/                   # [S] Chat UI served at http://localhost:3000/
│       ├── index.html
│       ├── style.css
│       └── app.js
│
├── dashboard/                    # [S] HTML + Chart.js dashboard (/dashboard)
│   ├── index.html
│   └── results/
│       ├── run-001.json          # Sample test-run result
│       └── run-002.json          # Sample test-run result
│
├── tests/                        # QA suite against Medusa.js (API :9000, Storefront :8000)
│   ├── package.json
│   ├── .env.test
│   ├── playwright.config.js
│   │
│   ├── api/                      # Jest + supertest (32 tests)
│   │   ├── setup.js
│   │   ├── auth.test.js          # Login / customer auth
│   │   ├── products.test.js      # Browse products
│   │   ├── cart.test.js          # Cart + line items
│   │   └── checkout.test.js      # Address, payment, order
│   │
│   └── e2e/                      # Playwright (21 tests)
│       ├── playwright.config.js
│       ├── auth.spec.js          # Login
│       ├── shop.spec.js          # Browse
│       ├── cart.spec.js          # Cart
│       └── checkout.spec.js      # Checkout
│
├── tools/                        # [T] Automation scripts (unlocked after gate)
│   ├── .gitkeep
│   └── run-tests.js              # Runs suites, writes results JSON for dashboard
│
└── docs/
    ├── architecture.md           # System architecture
    ├── test_strategy.md          # Test strategy
    └── ai_evaluation.md          # AI evaluation note
```

## Runtime Ports

| Service | URL |
|---------|-----|
| Chat UI / Server | http://localhost:3000 |
| Dashboard | http://localhost:3000/dashboard |
| Health | http://localhost:3000/api/health |
| Agents | http://localhost:3000/api/agents |
| Results | http://localhost:3000/api/results |
| Ollama (llama3.2) | http://localhost:11434 |
| Medusa API (SUT) | http://localhost:9000 |
| Medusa Storefront (SUT) | http://localhost:8000 |
