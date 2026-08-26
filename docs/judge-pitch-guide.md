# Deep Age — Hackathon Pitch & Judge Walkthrough Guide

## 🎯 1-Sentence Pitch
> **Deep Age is the Google Lighthouse & DevTools for AI Agents — test-driving websites with real headless Chromium to diagnose agent friction and generate Chrome WebMCP fixes.**

---

## 💡 The Problem (Why Judges Care)

1. **The Web Was Built for Human Eyeballs, Not AI Agents**:
   When AI agents (like ChatGPT, Claude, Operator, Gemini Auto-Browse) browse the web today, they rely on fragile DOM scraping, hallucinated clicks, and vision models guessing which button to press.
2. **Result = High Agent Friction**:
   Shopping carts fail, forms break, checkout flows stall, and developers have zero visibility into *why* an AI agent failed on their website.

---

## ⚡ The Breakthrough: Chrome's WebMCP Standard

Google Chrome and the W3C WebMachineLearning group recently introduced **[WebMCP](https://developer.chrome.com/docs/ai/webmcp)** — a standard allowing websites to expose declarative tools directly inside the browser via `document.modelContext.registerTool({...})`.

---

## 🚀 What Deep Age Does (The Solution)

Just as **Google Lighthouse** audits web performance and **Wireshark** inspects network packets, **Deep Age** is the **observability layer for AI agents**:

```
[ Target Website / App ]  ──▶  [ Deep Age Real Chromium Engine ]
                                            │
           ┌────────────────────────────────┼────────────────────────────────┐
           ▼                                ▼                                ▼
[ 1. Live Browser Viewport ]      [ 2. WebMCP Inspection ]         [ 3. Agent Friction Radar ]
Real screenshot & DOM controls   Discovers document.modelContext  Diagnoses missing capabilities &
intercepted in headless browser   and calls in-page tools live     generates 1-click code fixes
```

---

## 🏆 The 30-Second Judge Demo Flow

If a judge visits Deep Age, here is the exact 4-step story:

### Step 1: Trigger the Friction Scenario
- In the UI, click **`[1] Trigger Missing add_to_cart (Friction)`** and hit **`RUN TEST DRIVE`**.
- **What the judge sees**:
  - Headless Chromium launches and navigates to the target website.
  - The live viewport shows the real store rendering.
  - Deep Age discovers `search_products` and `filter_products`, but detects that the agent cannot complete purchase because **`add_to_cart` is missing from `document.modelContext`**.
  - Deep Age marks the task **INCOMPLETE** and highlights the exact **Friction Point**.

### Step 2: Inspect the 1-Click Code Fix
- The judge opens the **`[02] FRICTION & FIXES`** tab.
- Deep Age displays the exact code fix:
  ```javascript
  document.modelContext.registerTool({
    name: 'add_to_cart',
    description: 'Add a specified product item to the user shopping cart',
    inputSchema: { product_id: { type: 'string' } },
    execute: async (input) => { ... }
  });
  ```
- The judge clicks **`[ COPY FIX ]`**.

### Step 3: Verify the Fix
- Click **`[2] Expose add_to_cart (Pass)`** and hit **`RUN TEST DRIVE`**.
- **What the judge sees**:
  - Live Chromium re-test-drives the site.
  - Deep Age discovers all 4 WebMCP tools, executes `search_products()` (10ms) and `add_to_cart()` (14ms).
  - Status switches to **COMPLETED with 0 FRICTION**.

### Step 4: The 3 User Modes
Show judges how the same evidence is translated for 3 different stakeholders:
1. **`01_EXPLORE` (Normal User)**: Non-technical plain English explanations (*"Everything worked smoothly"*, visual action cards).
2. **`02_DEBUG` (Developer / PM)**: Full JSON schemas, HTTP latencies, DOM selectors, and interactive WebMCP REPL simulator.
3. **`03_INSPECT` (Security Auditor)**: Privacy audit score (0-100), third-party tracker radar, and unencrypted transmission detection.

---

## 🏅 Why Deep Age Wins

| Criteria | Deep Age Implementation |
|---|---|
| **Novelty & Standard Alignment** | Built from day 1 for Google Chrome's brand-new WebMCP standard (`document.modelContext`). |
| **100% Real Execution** | Zero mock data. Launches real headless Chromium, intercepts real network streams, and takes real viewport screenshots. |
| **Developer Value** | Diagnoses root causes and writes the exact WebMCP code snippet to make any website AI-agent-ready. |
| **Polished UX** | High-density developer cockpit, live browser viewport, timeline graph, and 3 stakeholder modes. |
