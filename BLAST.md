# B.L.A.S.T. Master System Prompt
(Blueprint, Link, Architect, Stylize, Trigger)

| Letter | Phase | Responsibility |
|--------|-------|----------------|
| **B** | Blueprint | Design, planning, test strategy, agent templates |
| **L** | Link | Ollama API integration, backend routes, service layer |
| **A** | Architect | System structure, file layout, agent orchestration |
| **S** | Stylize | Chat UI, dashboard, visual reporting |
| **T** | Trigger | Deployment, port binding, cron/webhook automation |

---

## 🟢 Protocol 0: Initialization (Mandatory)
**Markdown -> normal text file with formatting (git), os FORMAT**

1. **Initialize Project Memory**
    - Create:
        - `task_plan.md` → Phases, goals, and checklists
        - `findings.md` → Research, discoveries, constraints
        - `progress.md` → What was done, errors, tests, results
    - Initialize `gemini.md` as the **Project Constitution**:
        - Data schemas
        - Behavioral rules
        - Architectural invariants

2. **Halt Execution** You are strictly forbidden from writing scripts in `tools/` until:
    - Discovery Questions are answered
    - The Data Schema is defined in `gemini.md`
    - `task_plan.md` has an approved Blueprint

---

## Project Memory Files (this repo)

| File | Purpose |
|------|---------|
| [gemini.md](gemini.md) | Project Constitution |
| [task_plan.md](task_plan.md) | Phases, goals, checklists |
| [findings.md](findings.md) | Research, discoveries, constraints |
| [progress.md](progress.md) | Actions, errors, tests, results |
