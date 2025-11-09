# 🚀 ProSolve  
### *AI-Driven Product Scenario Planner*

ProSolve is an AI-powered platform that helps product managers, founders, and strategy teams **instantly evaluate ideas**, predict outcomes, and make data-driven decisions.

Instead of spending days debating assumptions, ProSolve uses **LLM reasoning**, **scenario modeling**, and **real-time scoring** to deliver:

✅ Feasibility  
✅ Impact  
✅ Risks  
✅ Opportunities  
✅ Time to Market  
✅ Strategic Recommendations  
✅ Task History & Archiving  
✅ Visual Insights & Comparison Tools  

All backed by a **FastAPI + SQLite** backend and a fully modular frontend.

---

# 🌟 Elevator Pitch

**ProSolve turns product intuition into AI-backed strategy.**  
Submit any idea — new feature, business plan, market move — and ProSolve transforms it into:

- A complete scenario analysis  
- Feasibility & impact scores  
- Key metrics  
- Risks & opportunities  
- Strategic recommendation  
- Stored task that updates automatically  

It is the fastest way for product teams to **compare ideas**, **prioritize intelligently**, and **move forward with confidence**.

---

# 🔥 Core Features

### ✅ **AI Scenario Evaluation**
Automatically generates:
- Overall Feasibility
- Impact Score
- Time to Market
- Customer & Competitive Analysis
- Risks (with mitigation)
- Opportunities (with upside)
- AI Recommendation & rationale

### ✅ **Task Management (SQLite-Powered)**
- Save scenario as a task  
- Auto-group tasks by date  
- Delete & archive tasks  
- Persistent local database  
- "Today’s Work" view + history view  

### ✅ **Comparison Mode**
- Select multiple scenarios  
- Side-by-side table:
  - Feasibility  
  - Impact  
  - Metrics  
  - Risks  
  - Opportunities  
  - Winner Highlight  

### ✅ **AI Insights Dashboard**
Shows:
- Average feasibility  
- Average impact  
- Top risks  
- Top opportunities  
- Priority recommendations  

### ✅ **Beautiful Frontend**
- Optimized UX  
- Modern scenario cards  
- Smooth animations  
- Tailwind integrated  
- Toast system  

---

# 🧱 Tech Stack

## **Frontend**
- HTML + Vanilla JavaScript
- TailwindCSS (CDN + custom theme)
- Modular UI components in `ui.js`
- State management in `app.js`
- API client abstraction in `api.js`
- Dynamic rendering without frameworks

## **Backend**
- **FastAPI** (Python)
- SQLite + SQLModel ORM
- Modular LLM client (Groq)
- Built-in `/simulate`, `/tasks`, `/tasks/today`, `/tasks/history`
- Debug middleware with full trace logs
- Automatic DB setup on startup

## **Database**
- SQLite (`prosolve.db`)
- SQLModel + Pydantic validation
- JSON columns for AI analysis + assumptions

## **AI Layer**
- Modular LLM client:
  - Groq
  - Automatic JSON schema generation  
  - Mock fallback mode  
- Strong system prompts  
- Structured AI output  

---

# 📂 Project Structure

prosolve/
│
├── frontend/
│ ├── index.html
│ ├── styles.css
│ ├── app.js
│ ├── api.js
│ ├── ui.js
│ └── assets/
│
├── backend/
│ ├── app.py
│ ├── utils/
│ │ └── llm_client.py
│ ├── prompts/
│ │ └── templates.py
│ ├── storage/
│ └── prosolve.db (auto-created)
│
└── README.md


---

# ⚙️ Installation & Setup

## ✅ 1. Backend Setup

### Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt

**RUN FASTAPI**
uvicorn app:app --reload --port 8000
✅ SQLite ready at sqlite:///./prosolve.db

**RUN FRONTEND**

frontend/index.html
Right click → "Open with Live Server"


**How ProSolve Works**
[User] 
   ↓ enters scenario
[Frontend App.js]
   ↓ builds text + payload
[API /simulate]
   ↓ calls LLM (Groq)
[LLM JSON Output]
   ↓ Scores + Risks + Metrics
[FastAPI Backend]
   ↓ Saves to SQLite
[Frontend]
   ↓ Renders scenario card
   ↓ Updates Today’s Work

The LLM request includes:

  System prompt template
  Scenario text
  Context object
  Required JSON schema
  Backend guarantees:
  Always returns structured JSON
  Automatically logs errors
  Mock fallback enabled
