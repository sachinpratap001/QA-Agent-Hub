# eCommerce Test Strategy Document — Medusa.js QA Suite

> **Deliverable 3 — BLAST Framework Comprehensive Test Strategy**  
> Target Application: Medusa.js Headless eCommerce Platform  
> Core Business Journey: Customer Authentication → Product Discovery → Cart Management → Checkout Completion  
> Author: Lead QA Automation Engineer  
> Status: Approved & Active  

---

## 1. Executive Summary & Application Under Test

### 1.1 Application Selection
For this automated quality assurance project, **Medusa.js** was selected as the System Under Test (SUT). Medusa is a leading open-source, headless commerce platform licensed under the MIT License. It features a decoupled architecture composed of:
1. **Medusa Backend (`localhost:9000`):** An extensible Node.js REST API providing complete store domain logic, cart state machines, pricing engines, and order pipelines.
2. **Medusa Storefront (`localhost:8000`):** A modern Next.js/React storefront delivering the customer-facing user interface.

### 1.2 Target Business Journey
The testing suite focuses strictly on the canonical commerce conversion funnel:
$$\text{Customer Login} \longrightarrow \text{Browse \& Search Catalog} \longrightarrow \text{Manage Cart Items} \longrightarrow \text{Complete Checkout}$$

### 1.3 Rationale for Flow Selection
This specific user journey was chosen because:
- **Revenue Criticality:** This funnel represents 100% of the platform's direct transactional revenue path. Any regression in cart totals, authentication state, or checkout submission results in immediate transaction loss.
- **Highest Business & Technical Risk:** The flow combines complex state transitions—session creation, variant stock checks, tax calculations, shipping selection, and payment authorization.
- **Representative Multi-Layer Architecture:** It validates both backend REST endpoints (data integrity and validation rules) and frontend web components (DOM reactivity, form inputs, and state synchronization).

---

## 2. Test Scope Definition

### 2.1 In-Scope Components & Endpoints

| Area | Component | Endpoints / Pages | Testing Objectives |
|------|-----------|-------------------|-------------------|
| **Customer Authentication** | Store API & Storefront UI | `POST /store/auth`<br>`GET /store/customers/me`<br>`/login` page | Verify valid credential authentication, token issuance, session persistence, invalid credential rejection, and password length rules. |
| **Catalog & Product Discovery** | Store API & Storefront UI | `GET /store/products`<br>`GET /store/products/:id`<br>`/products` page | Assert catalog pagination, search filtering, product variant listings, stock availability flags, and pricing format integrity. |
| **Shopping Cart Operations** | Store API & Storefront UI | `POST /store/carts`<br>`POST /store/carts/:id/line-items`<br>`DELETE /store/carts/:id/line-items/:line_id`<br>Cart drawer & `/cart` page | Test cart creation, line item insertion with valid variant IDs, quantity increments/decrements (min 1), cart deletion, and subtotal calculations. |
| **Checkout Funnel** | Store API & Storefront UI | `POST /store/carts/:id/shipping-address`<br>`POST /store/carts/:id/payment-sessions`<br>`POST /store/orders`<br>`/checkout` page | Validate shipping address schema, country code formats, payment provider initialization (`manual`), order generation, and order confirmation receipt. |

### 2.2 Out-of-Scope Items
To ensure focused execution and rapid deterministic feedback, the following components are explicitly excluded:
- **Medusa Admin Dashboard:** Back-office product management, order fulfillment workflows, and store setting interfaces.
- **Live Third-Party Payment Gateways:** Real Stripe, PayPal, or Klarna gateways. Testing utilizes Medusa's built-in `manual` payment provider to avoid sandbox network dependencies.
- **Email & Notification Transports:** SendGrid, Mailchimp, or SMTP email dispatch triggers.
- **Mobile Native Applications:** Only web responsive browser views are covered.
- **Performance & Load Testing:** Excluded per project architectural invariant (Gemini Constitution Section 2) to concentrate compute power on deterministic functional and contract verification.

---

## 3. Risk Assessment & Mitigation Matrix

| Risk Factor | Impact | Severity | Mitigation Strategy |
|-------------|--------|----------|---------------------|
| **Ollama Model Hallucinations** | Agents generate invalid Medusa endpoints or syntactically invalid test code. | **High** | Strictly bounded system prompts (`templates.js`) containing pre-approved endpoint schemas; rigid JSON output formatting; regex and AST lint validation before test execution. |
| **Medusa Local Setup Complexity** | Database migrations, missing environment variables, or port collisions blocking SUT initialization. | **Medium** | Standardized `.env.example` configurations; idempotent test seed scripts; automated pre-flight health checks against `:9000/health` before test runner execution. |
| **Flaky E2E Tests on Slower Machines** | Asynchronous DOM hydration in Playwright tests timing out on resource-constrained development machines. | **Medium** | Replaced hardcoded sleep statements with Playwright auto-waiting assertions (`toBeVisible()`, `toHaveURL()`, `waitForResponse()`); configured automatic retry policy (1 retry) in `playwright.config.js`. |
| **Test State Pollution** | Leftover cart data or duplicate user records causing subsequent test runs to fail. | **Medium** | Unique timestamp-suffixed cart generation per test run (`cart-${Date.now()}`); isolated test user sessions; dedicated teardown hooks. |

---

## 4. Test Data Strategy & Pre-Requisites

### 4.1 Pre-Seeded Test Data
To ensure reliable, repeatable test execution without polluting external systems, the test suite operates against known static fixtures:
1. **Registered Customer Account:**
   - **Email:** `test@example.com`
   - **Password:** `testpassword123`
   - **First/Last Name:** `Test QA User`
2. **Product Catalog Fixtures:**
   - Pre-seeded Medusa store items (e.g., standard "Medusa T-Shirt", "Medusa Sweatshirt").
   - Known variant IDs linked to standard region (`reg_01...`) priced in cents ($20.00 = `2000`).
3. **Payment & Shipping Providers:**
   - Shipping: Standard flat-rate shipping method pre-configured in default region.
   - Payment: `manual` payment provider enabled to simulate immediate authorization.

---

## 5. Quality Gate Criteria

### 5.1 Entry Criteria
Automated testing may only commence when all of the following conditions are satisfied:
1. Medusa backend REST API responds with `200 OK` on `http://localhost:9000/health`.
2. Medusa storefront is reachable on `http://localhost:8000`.
3. Local Ollama daemon is active on `http://localhost:11434` with the `llama3.2` model loaded.
4. Database has been initialized with the base region, products, and default test customer.
5. Node.js environment has installed all dependencies (`npm install` complete).

### 5.2 Exit & Release Criteria (Go / No-Go Decision Gate)
A test execution run achieves a **GO** verdict when all the following criteria are met:
1. **Pass Rate Threshold:** Overall test pass rate across API and E2E suites must be **$\ge 90\%$** (with $\ge 80\%$ required for GO-WITH-RISKS).
2. **Defect Severity Gate:** **Zero** unresolved `Critical` or `High` severity defects.
3. **Core Journey Integrity:** 100% of Happy Path scenarios in the checkout funnel must pass.
4. **Artifact Delivery:** Automated test execution report generated in `dashboard/results/` and published to the QA Dashboard.

---

## 6. Multi-Agent Testing Responsibilities

| Agent | Responsibility in Strategy Execution | Deliverable Produced |
|-------|--------------------------------------|----------------------|
| **BlueprintAgent** | Reads schema definitions and maps complete positive, negative, and boundary scenarios for auth, cart, catalog, and checkout. | Structured test plan matrix (`test-plan.json`) |
| **SentinelAgent** | Translates API test cases into deterministic Jest and Supertest test suites asserting HTTP status codes, headers, and payload schemas. | `tests/api/*.test.js` executable suite |
| **NavigatorAgent** | Automates storefront user interactions via Playwright, validating selectors, visual element states, form inputs, and redirects. | `tests/e2e/*.spec.js` automated suite |
| **TriageAgent** | Inspects execution logs, stack traces, and failure screenshots to classify failures (`PRODUCT_BUG`, `TEST_ISSUE`, `ENVIRONMENT_ISSUE`). | Defect reports with root-cause and remediation |
| **VerdictAgent** | Computes overall suite pass rates, audits open defect severities, and issues the official Go / No-Go release verdict. | Executive release sign-off & dashboard metrics |
