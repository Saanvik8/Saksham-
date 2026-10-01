# SAKSHAM (PSWB01 — Web-Based Selector-Applicant Simulation Software)

> **"AI-assisted interview intelligence, with the expert always in control."**
>
> SAKSHAM transforms a conventional interview into a **structured, adaptive, AI-assisted board-room simulation** by analyzing candidate responses, identifying knowledge gaps, generating contextual follow-ups, and providing a structured report for expert review.

---

## 🛡️ What is SAKSHAM?

SAKSHAM is a web-based defence interview simulation platform designed around a **Human-in-the-Loop AI assessment model**.

Instead of replacing the interviewer, SAKSHAM provides AI-generated insights alongside the live interview:

```text
Candidate
    ⟶ Live Interview
    ⟶ Answer Analysis
    ⟶ Knowledge Gap Detection
    ⟶ Adaptive Follow-Up
    ⟶ AI Assessment
    ⟶ Expert Review
    ⟶ Final Interview Report
```

The interview is divided into three structured phases:

* **Ice Breaking**
* **Technical**
* **Managerial**

---

## 🌟 Key Differentiators

1. **AI-Assisted, Not AI-Decided**: AI provides assessment insights, while the expert retains control over the final evaluation and certification.

2. **Real-Time Answer Intelligence**: Candidate responses are evaluated for **relevance, technical accuracy, and completeness**, with supporting observations and evidence.

3. **Adaptive Follow-Up Engine**: Identifies missing concepts and generates contextual follow-up questions based on the candidate's previous response and interview history.

4. **Live Interview Intelligence Panel**: During the interview, the expert can view the candidate video, transcript, AI observations, answer analysis, and suggested follow-ups without leaving the interview screen.

5. **Expression & Behaviour Indicators**: Provides supporting indicators such as confidence, nervousness, engagement, eye contact, and dominant emotion.

6. **Separated AI & Expert Assessment**: AI-generated scores and observations are stored separately from the expert's score, verdict, and remarks.

7. **Structured Interview Report**: Converts the complete interview into a clean report containing candidate details, phase-wise assessment, competency analysis, strengths, improvement areas, and question-level evaluation.

---

## 🏗️ Architecture & AI Pipeline

```text
Candidate / Expert
        │
        ▼
React Interview Interface
        │
        ▼
Node.js + Express REST API
        │
        ├───────────────┐
        ▼               ▼
   Groq API          MongoDB
        │               │
        ▼               ▼
Answer Analysis     Session / QnA
        │            History / Reports
        ▼
Knowledge Gap Detection
        │
        ▼
Adaptive Follow-Up Generation
        │
        ▼
AI Assessment
        │
        ▼
Expert Review
        │
        ▼
Final Interview Report
```

### AI Processing

The AI layer uses the **Groq API** to assist with:

* Candidate answer evaluation
* Relevance, accuracy and completeness analysis
* Missing concept identification
* Follow-up question generation
* Interview conversation analysis

The AI output is treated as **decision-support information**, while the final assessment remains with the authorized expert.

---

## 📊 Assessment Model

### AI Assessment

```text
Answer
 ├── Relevance %
 ├── Technical Accuracy %
 ├── Completeness %
 ├── Observation
 ├── Evidence
 ├── Missing Concepts
 └── Suggested Follow-Up Questions
```

### Expert Assessment

```text
AI Assessment
      ↓
Expert Review
 ├── Accept
 ├── Modify
 └── Add Remarks
      ↓
Final Certification
```

The default interview status is:

```text
PENDING_EXPERT_REVIEW
```

---

## 🛠️ Tech Stack

| Layer           | Technologies                                  |
| --------------- | --------------------------------------------- |
| **Frontend**    | React.js, React Router, JavaScript, HTML, CSS |
| **Backend**     | Node.js, Express.js, REST APIs                |
| **AI**          | Groq API                                      |
| **Database**    | MongoDB, Mongoose                             |
| **Development** | Git, GitHub, Claude Code, Codex, Antigravity  |

---

## 🔌 Core API Endpoints

### Grade Candidate Answer

```http
POST /api/interview/grade-answer
```

Analyzes the candidate's response and returns scoring, observations, missing concepts and possible follow-up questions.

### Generate Follow-Up

```http
POST /api/interview/generate-followup
```

Generates contextual follow-up questions using the interview conversation history.

### Analyze Expression

```http
POST /api/interview/analyze-expression
```

Processes expression-related indicators including confidence, nervousness, engagement and eye contact.

### Generate Report

```http
POST /api/interview/generate-report
```

Generates the structured post-interview assessment report.

---

## 📁 Project Structure

```text
SAKSHAM/
│
├── frontend-boardroom/
│   └── src/
│       ├── InterviewRoomExpert.jsx
│       ├── InterviewRoomCandidate.jsx
│       ├── AIPanel.jsx
│       ├── VideoFeed.jsx
│       ├── ExpressionOverlay.jsx
│       ├── PhaseBar.jsx
│       ├── InterviewControls.jsx
│       └── TranscriptPanel.jsx
│
├── server/
│   ├── routes/
│   │   ├── interview.js
│   │   └── auth.js
│   ├── models/
│   │   ├── Session.js
│   │   └── Report.js
│   ├── geminiService.js
│   └── server.js
│
└── README.md
```

---

## Environment Configuration

### Backend — `server/.env`

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
```

> **Never commit API keys or `.env` files to GitHub.**

---

## 🚀 Running Locally

### 1. Backend

```bash
cd server
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend-boardroom
npm install
npm run dev
```

The frontend and backend URLs will be displayed in the terminal after starting the development servers.

---

## 🎯 Interview Workflow

1. **Candidate joins** using the interview code.
2. **Expert starts** the board-room interview.
3. Interview progresses through **Ice Breaking → Technical → Managerial** phases.
4. Candidate answers are captured and analyzed.
5. AI displays **relevance, accuracy, completeness, observations and missing concepts**.
6. The system generates **adaptive follow-up questions**.
7. Expression indicators provide additional interview observations.
8. AI generates the overall assessment.
9. Expert **accepts, modifies, or comments** on the assessment.
10. The system generates the **final structured interview report**.

---

##  Known Limitations

* AI-generated assessments are intended as decision-support and require expert review.
* Expression indicators can be affected by camera quality, lighting and environmental conditions.
* AI responses depend on the availability and limits of the configured AI provider.
* The current implementation is a hackathon prototype and is not an official recruitment or defence selection system.

---

## 🔮 Future Scope

* Real-time speech-to-text improvements
* More advanced multimodal candidate analysis
* Role-specific question banks
* Interview analytics and candidate history
* Additional AI model providers
* Secure institutional deployment
* Multilingual interview support

---

## 👥 Project

**SAKSHAM — Defence Interview Intelligence Platform**

Built as a hackathon project to explore how **AI-assisted analysis can support structured defence-style interviews while keeping human experts in control of the final assessment.**
