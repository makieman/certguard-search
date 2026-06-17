# CertGuard 🛡️👨‍💻
### *Deliberative Multi-Agent Certification Readiness Advisor*

> **Submission for the Microsoft AI Skills Fest 2026 Agents League Hackathon**  
> **Track:** Reasoning Agents

---

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/python-3.10%20%7C%203.11-brightgreen.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg?logo=react&logoColor=white)](https://react.dev)
[![Azure AI Search](https://img.shields.io/badge/Knowledge%20Base-Azure%20AI%20Search-0089D6.svg?logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/en-us/products/ai-services/cognitive-search)

---



## 🚀 Executive Summary

**CertGuard** is an enterprise-grade, multi-agent certification readiness advisor designed to help organizations determine if an employee is truly prepared to sit for high-stakes Microsoft certification exams.

> "CertGuard implements all three Microsoft IQ layers: **Foundry IQ** via Azure AI Search with 9 grounded knowledge documents and live Microsoft Learn MCP integration, **Fabric IQ** via a semantic certification ontology encoding role-to-skill-to-threshold relationships, and **Work IQ** via per-employee work schedule signals that personalize study plan scheduling. The deliberative agent architecture follows Microsoft Agent Framework reasoning patterns including Planner, Executor, Critic, Verifier, and Judge roles with explicit conflict resolution and abstention logic."

Instead of relying on a single AI model to summarize a learner's profile—which often suffers from overconfidence, hallucinated alignments, and generic recommendations—CertGuard introduces a **deliberative multi-agent framework**. Five specialist agents debate, challenge assumptions, cite official Azure documentation, audit discrepancies, and must reach a high-confidence consensus before granting a certification "Ready" verdict. If the evidence is weak, the system safely abstains and generates a personalized, week-by-week study plan mapped to the learner's schedule and cognitive peak hours.

Our biggest competitive differentiator is the **live Microsoft Learn MCP Server Integration**: rather than relying purely on static, synthetic documentation, our Verifier agent queries the official Microsoft Learn endpoint in real-time, fetching authentic up-to-date certification guides.

---

## 💡 The Core Innovation: Deliberative Reasoning & Disagreement

Traditional AI assistants function as single-threaded synthesis engines: they take input and immediately summarize it into a flat verdict. In high-stakes enterprise training, this leads to expensive failures (failed exam fees, wasted study hours, and lost partner certification status).

CertGuard changes this paradigm by modeling its reasoning pipeline on a **judicial chamber**:

```
                  ┌───────────────────────┐
                  │ Learner Profile & IQ  │
                  └───────────┬───────────┘
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
   ┌───────────────────┐             ┌───────────────────┐
   │   Gap Extractor   │             │     Verifier      │
   │   (Fabric IQ)     │             │   (Foundry IQ)    │
   └─────────┬─────────┘             └─────────┬─────────┘
             │                                 │
             │       ┌─────────────────┐       │
             ├──────►│     Critic      │◄──────┤  [Challenge Loop]
             │       │ (Audits Claims) │       │
             │       └────────┬────────┘       │
             │                │                │
             ▼                ▼                ▼
   ┌───────────────────────────────────────────┐
   │                   Judge                   │
   │    (Weighs Evidence vs. Critic Claims)     │
   └──────────────────┬────────────────────────┘
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
    [High Confidence]    [Low Confidence / Not Ready]
     Pass Verdict         Safe Abstention
            │                   │
            └─────────┬─────────┘
                      ▼
            ┌───────────────────┐
            │     Explainer     │ ◄── [Integrates Work IQ]
            │  (Personalized)   │
            └───────────────────┘
```

1. **Thesis Generation**: The *Gap Extractor* and *Verifier* construct a case for readiness based on structured metrics and semantic documentation.
2. **Antithesis**: The *Critic* attempts to break this case, scanning for edge cases, borderline scores, missing prerequisites, or overconfident assertions.
3. **Synthesis**: The *Judge* reviews the structured transcripts of the debate, evaluates confidence metrics, and delivers the final judgment. If the debate reveals deep uncertainty, the Judge **abstains** rather than guessing.

---

## 🛠️ The 5 Specialist Agents

Each agent has a highly defined prompt system, targeted inputs, and distinct behavioral personas:

- **Gap Extractor (Fabric IQ)**: Reads the learner JSON profile and the `certs.json` model to calculate skill gaps against pass thresholds.
- **Verifier (Foundry IQ & Live MCP)**: Performs RAG against both the local/Azure vector index and queries the live **Microsoft Learn MCP Server** (`https://learn.microsoft.com/api/mcp`) to retrieve live, official documentation to ground its verification.
- **Critic**: Performs adversarial analysis. Specifically challenges the Gap Extractor and Verifier to expose false-positives or overconfidence.
- **Judge**: Synthesizes the debate logs and outputs either `Ready`, `Needs More Study`, or `Abstain` along with a confidence rating. If confidence is below `0.55`, it abstains.
- **Explainer (Work IQ)**: Takes scheduling constraints from `work_signals.json` and creates a customized study calendar mapped around work hours.

---

## 🌐 Microsoft IQ Layers Integration

CertGuard directly implements three distinct Microsoft-inspired intelligence layers to ground its reasoning:

1. **Foundry IQ (Knowledge Base & Live Documentation)**: Managed via **Azure AI Search** vector indexes and the **Microsoft Learn MCP Server**. It indexes and references 9 official Microsoft Azure certification guides:
   - `azure_fundamentals.md` (AZ-900)
   - `azure_administrator.md` (AZ-104)
   - `azure_developer.md` (AZ-204)
   - `azure_architect.md` (AZ-305)
   - `azure_devops.md` (AZ-400)
   - `azure_security.md` (AZ-500)
   - `azure_data_engineer.md` (DP-203)
   - `cosmos_db_developer.md` (DP-420)
   - `azure_ai_engineer.md` (AI-102)
2. **Fabric IQ (Semantic Cert Model)**: Stored in `data/certs.json`, defining the schema of the 9 Microsoft certifications, mapping domains to prerequisite skills and thresholds.
3. **Work IQ (Activity & Scheduling Signals)**: Stored in `data/work_signals.json`, tracking active meeting hours, dedicated focus hours, and preferred learning slots per employee for 10 distinct learner profiles.

---

## ⚙️ Tech Stack & Architecture Details

- **Large Language Models (LLM)**:
  - **Primary**: `GitHub Models GPT-4o-mini`.
- **Microsoft Learn MCP Server**: Live JSON-RPC tools interface (`microsoft_docs_search`) called over HTTP stream.
- **Agent Orchestration**: Native Python state machine tracking debate history and arguments.
- **Backend API**: **FastAPI** serving endpoints for evaluation and logging.
- **Database**: **SQLite** (`sessions.db`) stores detailed transcripts for manager audits.
- **Frontend**: **React** + **Vite** web app with Study Plan, Manager Dashboard, and Agent Debate Trace views.

---

## 📂 Project Directory Structure

```
certguard/
├── agents/
│   ├── gap_extractor.py       # Extract Fabric IQ skill gaps
│   ├── verifier.py            # live MCP + Azure AI Search verification
│   ├── critic.py              # Counter-argument & quality control agent
│   ├── judge.py               # Final verdict arbiter with abstention threshold
│   ├── explainer.py           # Schedule builder using Work IQ
│   ├── orchestrator.py        # Multi-agent debate state management
│   └── llm.py                 # Unified LLM provider & fallback manager
├── api/
│   └── main.py                # FastAPI route controllers
├── data/
│   ├── learners.json          # 10 synthetic learner profiles
│   ├── work_signals.json      # Work schedule constraints (Work IQ)
│   └── certs.json             # Cert structures & requirements (Fabric IQ)
├── docs/                      # Foundry IQ Knowledge Documents
│   ├── azure_fundamentals.md  (AZ-900)
│   ├── azure_administrator.md (AZ-104)
│   ├── azure_developer.md     (AZ-204)
│   ├── azure_architect.md     (AZ-305)
│   ├── azure_devops.md        (AZ-400)
│   ├── azure_security.md      (AZ-500)
│   ├── azure_data_engineer.md (DP-203)
│   ├── cosmos_db_developer.md (DP-420)
│   └── azure_ai_engineer.md   (AI-102)
├── frontend/                  # React & Vite client interface
├── tests/                     # Test suites for agent orchestration
├── config.py                  # Environment variable configuration loading
├── setup_search_index.py      # Azure AI Search indexing script
└── verify_project.py          # E2E health validation script
```

---

## 💻 Local Development & Setup

### 1. Setup Virtual Environment
```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file from the example:
```bash
cp .env.example .env
```

### 3. Build the Search Index & Launch Servers
```bash
# Setup search index
python setup_search_index.py

# Run backend API
uvicorn api.main:app --reload

# Run frontend (in another terminal)
cd frontend
npm install
npm run dev
```

---

## 🛡️ Responsible AI & Safety Guardrails

- **Safe Abstention (Confidence Threshold)**: The Judge agent is strictly prohibited from guessing. If its calculated confidence score drops below `0.55`, it issues an `abstain` status, flags the profile for manual HR review, and directs the learner to specific resources to bridge the gap.
- **100% Synthetic Data**: To guarantee privacy compliance, all learner profiles, emails, performance statistics, and company workload descriptions inside `data/` and `docs/` are synthetically generated. No Personally Identifiable Information (PII) is present.
- **Auditability**: Every chat, token, fallback event, and conflict resolution transcript is logged into `sessions.db` to ensure all AI decisions are transparent and auditable.

---

## 🏆 Hackathon Judging Criteria Alignment

- **Accuracy & Relevance (25%)**: Implements an enterprise readiness advisor grounded in three distinct Microsoft IQ layers (Foundry, Fabric, Work) with live Microsoft Learn MCP document verification.
- **Reasoning & Multi-step Thinking (25%)**: Incorporates a 5-stage deliberative pipeline where agents critique and verify claims instead of summarizing immediately.
- **Creativity & Originality (15%)**: Features a live Microsoft Learn MCP Server interface dynamically querying official certification criteria, alongside a visual Debate Trace tab showcasing the real-time dialogue and critique timeline.
- **User Experience (15%)**: Premium React dark mode dashboard with Microsoft Fluent design styling, templates for 10 learners, and interactive debate logging.
- **Reliability & Safety (20%)**: Implements Judge abstention, multi-model fallback routines, and SQLite persistence.
