# 🖥️ README — Person 3: PPT & Documentation

> **Your job**: Create the presentation, record demo videos, write documentation.
> You also help with testing and final polish.

---

## 🎯 What You Own

| Deliverable | Description |
|-------------|-------------|
| Full PPT (12-15 slides) | The main presentation for judges |
| Demo Video/Screenshots | Record the app in action for the PPT |
| Project README.md | Main project readme for GitHub |
| Testing | Test the complete app flow end-to-end |
| Presentation Script | Write what each member says during presentation |

---

## 📊 PPT Structure — Slide by Slide

### Design Rules
- **Template**: Dark navy (#0a1628) background + gold (#c9a84c) accents + white text
- **Font**: Use clean fonts (Outfit, Inter, or Montserrat)
- **Tool**: Use Canva / PowerPoint / Google Slides
- **Consistency**: Same color scheme as the website
- **Animations**: Subtle transitions — don't overdo it
- **Every slide MUST have**: Title + visual (diagram/screenshot/chart). No text-only walls.

---

### Slide Breakdown

#### Slide 1 — Cover
- Project name: **"SAKSHAM"** (or whatever team decides)
- Subtitle: "AI-Powered Selector-Applicant Interview Simulation"
- Team name + member names
- DRDO / Ministry of Defence logo
- Hackathon name/logo

#### Slide 2 — Problem Statement
- Title: "The Challenge"
- 3-4 bullet points:
  - DRDO interviews thousands of scientists every year
  - Interview quality depends on individual interviewer's skill
  - No standardized method to ensure unbiased, relevant questioning
  - No quantifiable scoring of candidate suitability
- Add a visual: frustrated interviewer / messy process illustration

#### Slide 3 — Current Pain Points
- Title: "What's Broken Today?"
- Visual comparison table:

| Today ❌ | With Our Solution ✅ |
|----------|---------------------|
| Random questions | AI generates resume-specific questions |
| Subjective scoring | Quantified 0-10 scores per answer |
| No expression insight | Real-time confidence & emotion tracking |
| No standardized report | 5-Axis Competency Radar Chart |
| Bias possible | AI bias detection & fair questioning |

#### Slide 4 — Our Solution (One Slide Overview)
- Title: "Introducing SAKSHAM"
- One-liner: "A video-conference-style platform where AI co-pilots the interviewer"
- 3 key points with icons:
  - 🧠 AI generates & grades questions in real-time
  - 👁️ Expression analysis monitors candidate confidence
  - 📊 5-Axis competency score for objective assessment
- Screenshot of the board room (expert view)

#### Slide 5 — Architecture Diagram
- Title: "System Architecture"
- Create a diagram showing:
```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend     │────▶│  Gemini API  │
│  (React)     │◀────│  (Node.js)    │◀────│  (Google AI) │
│              │     │               │     │              │
│ - Landing    │     │ - Auth        │     │ - Questions  │
│ - Board Room │     │ - Interview   │     │ - Grading    │
│ - Reports    │     │ - Reports     │     │ - Analysis   │
└──────────────┘     └───────────────┘     └──────────────┘
        │                                         │
        ▼                                         ▼
  ┌──────────┐                            ┌──────────────┐
  │ Webcam   │                            │ face-api.js  │
  │ Browser  │                            │ TensorFlow   │
  └──────────┘                            └──────────────┘
```
- Use a clean diagram tool (draw.io / Excalidraw / Canva)

#### Slide 6 — How It Works (Flow)
- Title: "Interview Flow"
- Visual flow diagram:
  1. Expert logs in → uploads resume + JD
  2. AI generates question bank
  3. Expert shares code with candidate
  4. Candidate joins → sees video call
  5. 3-phase interview with AI assistance
  6. Final 5-axis competency report
- Use arrows, icons, numbered steps

#### Slide 7 — Landing Page Demo
- Title: "Professional Landing Experience"
- Full screenshot of the landing page
- Call out key elements: DRDO branding, dual login, trust bar

#### Slide 8 — Board Room UI
- Title: "The Interview Room"
- Two screenshots side by side:
  - Left: "What the Candidate sees" — clean video call
  - Right: "What the Expert sees" — video + AI panel + scores
- Arrow pointing to AI panel: "AI co-pilot — invisible to candidate"
- This is the KEY differentiator slide — make it big and impressive

#### Slide 9 — AI Engine in Action
- Title: "Intelligent Question Generation & Grading"
- Show example:
  - Resume snippet → AI-generated question
  - Candidate answer → AI score breakdown (relevance, depth, accuracy)
- Show how follow-up questions are generated
- Maybe a flowchart: Resume → Parse → Question → Answer → Score → Follow-up

#### Slide 10 — Expression Analysis
- Title: "Real-time Expression & Confidence Tracking"
- Screenshot of the expression overlay on candidate video
- Show: confidence meter, emotion indicator
- Explain: runs in browser using TensorFlow.js/face-api.js — no data sent to cloud
- Show a mini timeline graph: confidence over time

#### Slide 11 — 5-Axis Radar Chart
- Title: "Quantifiable Competency Assessment"
- Big radar chart in the center
- Label each axis:
  1. Communication (7.5)
  2. Technical Depth (8.5)
  3. Domain Relevance (8.0)
  4. Problem Solving (7.8)
  5. Confidence & Composure (7.5)
- Show overall score: 78.5/100
- Recommendation: "Recommended for next round"

#### Slide 12 — Live Demo / Demo Video
- Title: "Live Demo"
- Either do a live demo OR play a recorded video
- **Recording tip**: Use OBS Studio or browser screen recording to capture the full flow:
  1. Landing page
  2. Expert login
  3. Upload resume
  4. Board room with AI suggestions
  5. Final radar chart report

#### Slide 13 — What Makes Us Different
- Title: "Why SAKSHAM?"
- Comparison with other approaches:

| Feature | ChatGPT Wrapper | Generic HR Tool | PARIKSHA ✅ |
|---------|----------------|-----------------|------------|
| Board Room Experience | ❌ | ❌ | ✅ |
| Resume-Based Questions | ❌ | Partial | ✅ |
| Expression Analysis | ❌ | ❌ | ✅ |
| 5-Axis Scoring | ❌ | ❌ | ✅ |
| Candidate can't see AI | ❌ | N/A | ✅ |
| Anti-Bias Detection | ❌ | ❌ | ✅ |

#### Slide 14 — Future Scope
- Title: "Road Ahead"
- Points:
  - Real WebRTC video calling for remote interviews
  - Panel interview support (multiple experts)
  - Integration with DRDO HR systems
  - Candidate comparison dashboard for batch hiring
  - Multi-language support (Hindi + regional)
  - Voice tone analysis
  - Proctoring & anti-cheating for remote interviews

#### Slide 15 — Thank You
- "Thank You"
- Team name + member names
- GitHub repo link
- QR code to the live demo (if hosted)
- "Questions?"

---

## 📝 Project README.md (for GitHub)

Create this file at the root of the project:

```markdown
# 🛡️ PARIKSHA — AI-Powered Interview Simulation Platform

> Built for DRDO Recruitment & Assessment Centre (RAC)

## What is this?
A web-based interview simulation platform where AI assists interviewers
with intelligent question generation, real-time answer grading, and
candidate expression analysis — providing a fair, quantifiable assessment.

## Features
- 🎥 Video conference-style board room
- 🧠 AI question generation from resume & job description
- 📊 Real-time answer scoring (0-10)
- 👁️ Expression & confidence analysis
- 📈 5-Axis Competency Radar Chart
- 🔒 Role-separated views (expert vs candidate)
- 📄 PDF report download

## Tech Stack
- Frontend: React (Vite)
- Backend: Node.js + Express
- AI: Google Gemini API
- Expression: face-api.js
- Charts: Chart.js

## Setup
(Person 1 fills this after project is ready)

## Team
- Member 1 — Frontend A (Pages & Navigation)
- Member 2 — Frontend B (Board Room)
- Member 3 — PPT & Documentation
- Member 4 — Backend & AI Engine
```

---

## 🎬 Demo Recording Guide

### What to Record (in order):
1. **Landing page** — scroll through features (10 sec)
2. **Expert login** — fill form, submit (10 sec)
3. **Interview setup** — upload resume, fill JD (15 sec)
4. **Code generated** — show interview code (5 sec)
5. **Candidate join** — enter code, join (10 sec)
6. **Board room — candidate view** — show clean video (10 sec)
7. **Board room — expert view** — show AI panel suggesting questions (20 sec)
8. **Grade an answer** — show score appearing (10 sec)
9. **Expression overlay** — show confidence indicator (10 sec)
10. **Final report** — radar chart + scores (15 sec)

**Total: ~2 minutes**

### Recording Tools:
- **OBS Studio** (free) — best quality
- **Browser extension**: Loom or Screen Recorder
- **Windows**: Win + G (Game Bar) for quick recording

---

## 🧪 Testing Responsibilities

Before the final presentation, test these flows:

| Flow | What to Test |
|------|-------------|
| Expert Login | Valid email works, invalid email shows error |
| Interview Setup | PDF upload extracts text, questions are generated |
| Code Sharing | Generated code is displayed, copyable |
| Candidate Join | Valid code joins, invalid code shows error |
| Board Room — Candidate | Webcam works, clean view, no AI visible |
| Board Room — Expert | AI panel shows questions, grades work, expression shows |
| Phase Transition | Phase 1 → 2 → 3 works smoothly |
| End Interview | Report generates, radar chart displays correctly |
| PDF Download | Downloads properly with all data |

---

## 🚫 What You Do NOT Touch

- ❌ Any code (frontend or backend)
- ❌ Component building
- ❌ API integration
- ❌ Styling / CSS

---

## ⏰ Your Timeline

| Day | Task |
|-----|------|
| Day 1 | Start PPT structure (slides 1-6), draft README.md |
| Day 2 | Fill in content as teammates show progress, take screenshots |
| Day 3 | Record demo video, finalize slides 7-15, test full flow |
| Day 4 | Final polish, practice presentation timing, backup everything |

---

## ✅ Checklist

- [ ] PPT has 12-15 slides with consistent dark theme
- [ ] Every slide has a visual (no text-only walls)
- [ ] Architecture diagram is clear and professional
- [ ] Demo video is recorded (2 min max)
- [ ] Comparison table shows our advantages clearly
- [ ] GitHub README.md is complete
- [ ] Tested full flow end-to-end
- [ ] Presentation script written for each member
- [ ] Backup of PPT saved in multiple places
