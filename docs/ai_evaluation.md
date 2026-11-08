# AI Evaluation & Retrospective Note

> **Deliverable 6 — BLAST Framework AI Quality & Performance Retrospective**  
> Model Evaluated: `llama3.2` (via local Ollama daemon)  
> Scope: 5 Specialized QA Agents (Blueprint, Sentinel, Navigator, Triage, Verdict)  
> Author: Lead QA Automation Engineer  
> Status: Final Evaluation  

---

## 1. Where Agents Got Things Wrong (Observed Failure Modes)

During iterative test generation and automation validation, several distinct failure patterns were observed across the specialized agents:

1. **BlueprintAgent — Duplicate & Redundant Scenarios:**  
   * **Failure:** When asked to generate comprehensive test cases for the checkout journey, the agent produced near-identical boundary cases (e.g., three separate test cases testing 0, -1, and -5 quantities that collapsed to the same HTTP 422 validation rule).
   * **Impact:** Inflated test suite execution time without providing additional defect detection value.

2. **SentinelAgent — Hardcoded Entity IDs:**  
   * **Failure:** SentinelAgent initially generated API test fixtures with hardcoded Medusa product and variant IDs (e.g., `variant_01H...`) extracted from sample logs.
   * **Impact:** On fresh Medusa database installs or altered seeds, tests immediately broke with `404 Not Found`, giving false failure signals.

3. **NavigatorAgent — Fragile CSS Class Selectors:**  
   * **Failure:** NavigatorAgent generated Playwright locators referencing ephemeral Tailwind or CSS-in-JS hashed class names (e.g., `page.locator('button.bg-primary-500.px-4.py-2')`) instead of accessible roles or data attributes.
   * **Impact:** Minor frontend UI style refactoring instantly invalidated the test locators.

4. **TriageAgent — Environmental vs. Product Bug Misclassification:**  
   * **Failure:** When an API test failed due to a transient database lock or slow cold-start timeout from the local Medusa service, TriageAgent classified the incident as a `PRODUCT_BUG` rather than an `ENVIRONMENT_ISSUE`.
   * **Impact:** Developers wasted investigation time looking for code defects that were infrastructure artifacts.

5. **VerdictAgent — Overly Conservative Verdict Gating:**  
   * **Failure:** In test runs where non-critical cosmetic assertions failed (such as an optional footer link text discrepancy), VerdictAgent issued a strict `NO-GO` verdict, treating low-severity cosmetic issues as release blockers.
   * **Impact:** False-alarm release blockers delaying non-critical deployment cadences.

---

## 2. Detection & Quality Control Mechanisms (How We Caught It)

To prevent LLM inaccuracies from compromising the test suite, three rigorous verification gates were enforced:

* **Human-in-the-Loop Review Gate:** A mandatory checkpoint before any generated test script or test matrix was committed to the repository. The QA engineer examined all test outlines before handing them off to automation.
* **Code Review & Static AST Linting:** Automated pre-commit linting flags hardcoded IDs, unhandled promises, and brittle CSS selectors, enforcing Playwright best practices (`page.getByRole()`, `page.getByLabel()`).
* **Diff Against Known-Good Baseline:** New agent outputs were compared against established baseline test suites (`diff` review) to spot hallucinated endpoints, duplicate scenarios, or invalid schema assertions.

---

## 3. Cost & Execution Time Benchmarking

Operating local LLMs on developer workstations fundamentally changes the cost-performance equation compared to proprietary cloud LLM APIs:

| Stage | Duration | Compute / Provider | Financial Cost |
|-------|----------|--------------------|----------------|
| **Ollama Agent Generation** | ~2–3 minutes | Local GPU/CPU (`llama3.2`) | **$0.00** (Zero API tokens) |
| **API Automated Tests (Jest)** | ~5 minutes | Node.js Test Runner | **$0.00** |
| **E2E Storefront Tests (Playwright)** | ~8 minutes | Chromium Headless Runner | **$0.00** |
| **Total Pipeline Turnaround** | **~15 minutes** | Fully Local Environment | **$0.00 Total Cost** |

**Key Takeaway:** By utilizing Ollama locally with `llama3.2`, the organization achieves unlimited test design, code generation, and triage iterations with zero variable cloud cost, complete enterprise data privacy, and immunity to external API rate limits or outages.

---

## 4. Boundaries of Trust — What We Would NOT Trust an Agent to Do

While specialized LLM agents significantly accelerate test authoring and failure analysis, the following four responsibilities must strictly remain under human ownership:

1. **Self-Approving Test Results Without Human Verification:**  
   Agents must never be granted autonomous authority to declare a build production-ready without a human release engineer reviewing the underlying logs and reasoning.
2. **Writing & Deploying Production Bug Fixes:**  
   While agents can propose remediations, autonomous code commits to production branches risk introducing subtle edge-case regressions or architectural drift.
3. **Classifying Severity of Security Vulnerabilities:**  
   LLMs lack full threat modeling context; determining CVSS scores, exploitability, and compliance impact (e.g., PCI-DSS, GDPR) requires experienced security professionals.
4. **Authorizing Payment Gateway & Financial Settlement Correctness:**  
   Real money movement, tax calculation reconciliation, and payment provider agreements carry regulatory liability and must always be validated by human domain specialists.
