# Saksham — Complete Setup & Presentation Guide

> **Project Name**: Saksham (AI-Powered Board Interview Simulation Platform)  
> **Target Audience**: Technical Recruiters, Assessment Boards (DRDO RAC Style), and Candidates.  
> **Key Architecture**: Clean Google Meet video interface for the candidate; Intelligent AI Co-Pilot sidebar for the recruiter with real-time continuous speech monitoring, live 5-Axis scoring, dynamic follow-up question generation, and post-interview assessment & verbatim transcript reports.

---

## 1. Prerequisites & System Requirements

- **Operating System**: Windows, macOS, or Linux.
- **Node.js**: v18.0.0 or higher.
- **Package Manager**: `npm` (comes with Node.js).
- **Supported Browsers**: **Google Chrome** or **Microsoft Edge** (recommended for native Speech Recognition API).
- **Hardware**: Working microphone and webcam (grant browser permissions when prompted).

---

## 2. Fast 2-Minute Installation

### Step 1: Install Root & Server Dependencies
Open a terminal in the project root directory:

```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd server
npm install
cd ..
```

### Step 2: Environment Configuration (Optional)
The system is equipped with a **SAKSHAM Heuristic Intelligence Engine** that operates **100% offline out-of-the-box** without any API keys or databases!

If you want to use live Google Gemini AI models:
1. Open or create `.env` in the `server/` directory:
   ```env
   PORT=5000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
2. *Note: If `GEMINI_API_KEY` is not provided or quota is exceeded, the server automatically and seamlessly falls back to the built-in heuristic AI grading engine.*

---

## 3. Starting the Application

You will need **two terminal tabs**:

### Terminal 1 — Start the Backend Server
```bash
cd server
node server.js
```
*Expected output*: `Server running on port 5000` & `SAKSHAM Memory Store initialized with sample RAC data`.

### Terminal 2 — Start the Frontend Dev Server
```bash
npm run dev
```
*Expected output*: Vite server running on `http://127.0.0.1:5173/` (or `http://localhost:5173/`).

---

## 4. How to Present Tomorrow (2-Person Live Demo)

### Setup: Open Two Browser Windows (Side-by-Side or Two Laptops)

#### Window 1: Recruiter / Board Member
1. Open Google Chrome: `http://127.0.0.1:5173/login`
2. Enter Evaluator Credentials:
   - **Email**: `expert@rac-demo.in`
   - **Board Passkey**: `RAC-2026-BOARD`
3. Click **"Authenticate Board Member"**.
4. In the Expert Dashboard, click **"Enter Board Room"** on session `RAC-2026-03` (Candidate: Rohan Mehra).
5. You are now in the **Recruiter AI Cockpit** with:
   - Video stage with recruiter & candidate tiles.
   - Right-side AI Co-Pilot with starter questions grounded in the candidate's resume.
   - Top banner indicating `AI Live Audio Monitor Active`.

#### Window 2: Candidate
1. Open Google Chrome (Incognito or on a 2nd laptop on the same local network):
   `http://127.0.0.1:5173/interview/candidate/RAC-2026-03`
2. Allow microphone and camera permissions when prompted.
3. Observe:
   - The candidate sees a **100% pure Google Meet conference screen**.
   - **Zero on-screen question banners or text hints**.
   - **Zero input boxes or submit buttons**.
   - A subtle green `Audio Connected` indicator in the bottom bar confirms their voice is live.

---

### Running the Live Interview:
1. **Recruiter Asks**: The recruiter clicks one of the suggested starter questions (e.g. *Pulse-Compression Radar* or *CFAR Detection*) or reads it aloud over their microphone.
2. **Candidate Answers Verbally**: The candidate speaks naturally into their microphone explaining their answer.
3. **Continuous AI Monitoring**: 
   - Within 1.5 seconds of the candidate pausing, the candidate's speech is automatically transcribed in the background.
   - The recruiter's AI Co-Pilot displays the answer, grades it (Score /10, Relevance %, Technical Accuracy %), and generates **2–3 dynamic follow-up questions** tailored to what the candidate just said.
4. **End Call**:
   - **Candidate**: Clicking red **"Leave Call"** cleanly stops audio streaming and shows the Google Meet *"You left the meeting"* screen with options to Rejoin or Return Home.
   - **Recruiter**: Clicking red **"End & Generate Report"** automatically compiles the evaluation data and takes you directly to the comprehensive post-interview dossier.

---

## 5. Post-Interview Assessment & Transcript

Once the call ends, the recruiter arrives at `http://127.0.0.1:5173/expert/report/RAC-2026-03`:
- **Document 1 (5-Axis Assessment Dossier)**:
  - Technical Prowess, Problem Solving, System Design, Communication, and Research Aptitude.
  - Interactive Radar Chart & Hiring Recommendation.
- **Document 2 (Official Interview Transcript)**:
  - Chronological Q&A dialogue with timestamps, relevance scores, and telemetry notes.
- **Side-by-Side View**: Toggle between single document view or compare both documents side-by-side.
- **Export Options**:
  - `Export Report PDF`
  - `Export Transcript (.txt)`
  - `Export Transcript PDF`

---

## 6. Project Architecture Overview

```
Saksham/
├── src/
│   ├── pages/
│   │   ├── InterviewRoomExpert.jsx     # Recruiter Google Meet UI + AI Co-Pilot Cockpit
│   │   ├── InterviewRoomCandidate.jsx  # Candidate Pure Google Meet UI + Voice Streaming
│   │   ├── ReportView.jsx              # 5-Axis Dossier + Official Transcript (Side-by-Side)
│   │   ├── ExpertDashboard.jsx         # Board room interview management & requisitions
│   │   ├── Login.jsx                   # Role-gated passkey authentication
│   │   └── LandingPage.jsx             # Public platform entry point
│   ├── services/
│   │   ├── interviewLiveService.js     # Live session synchronization & answer submission
│   │   └── api.js                      # Base Axios client (calls http://localhost:5000)
│   └── components/
│       └── interview/VideoFeed.jsx     # WebRTC/Mock webcam video feed component
├── server/
│   ├── server.js                       # Express server entry point (Port 5000)
│   ├── routes/
│   │   ├── interview.js                # Session state, answer submission, transcript API
│   │   └── auth.js                     # Board passkey verification
│   ├── services/
│   │   └── geminiService.js            # Gemini 1.5/2.0 Flash + Heuristic Fallback Engine
│   └── data/
│       └── store.js                    # In-memory session store & initial sample sessions
└── SETUP_GUIDE.md                      # This guide
```

---

## 7. Troubleshooting & FAQs

| Issue | Resolution |
|-------|------------|
| **Microphone not transcribing** | Ensure you are using **Google Chrome** or **Edge**, and that you granted microphone access in the browser address bar icon. |
| **Port 5000 already in use** | Run `kill-port 5000` or change `PORT=5001` in `server/.env` and update `src/services/api.js` with the new port. |
| **Candidate joining from another laptop on same Wi-Fi** | Use your computer's local IP address (e.g. `http://192.168.1.5:5173/interview/candidate/RAC-2026-03`). |
| **Candidate joining remotely from another city/location** | See Section 8 below for free 1-command tunneling (`localtunnel` / `ngrok`). |
| **No Gemini API Key available** | The system automatically uses the internal Heuristic Intelligence Engine; no API key is required for a flawless demo. |

---

## 8. Remote Testing Across Different Locations (Laptop as Public Server)

If your test partner or candidate is in another location/city, you can make your laptop a secure server with free HTTPS so they can join directly from their device.

### Option A: LocalTunnel (Fastest — Zero Signup Required)
Run this command in a new terminal tab:
```bash
npx localtunnel --port 5173
```
- It outputs a public URL like: `https://modern-zebra-12.loca.lt`
- Send your partner the candidate link:
  `https://modern-zebra-12.loca.lt/interview/candidate/RAC-2026-03`
- *(If localtunnel asks your partner for a tunnel password on first load, provide your public IP from [loca.lt/mytunnelpassword](https://loca.lt/mytunnelpassword)).*

### Option B: ngrok (Industry Standard)
Run this command:
```bash
npx ngrok http 5173
```
- It gives an HTTPS forwarding URL (e.g., `https://abc-123.ngrok-free.app`).
- Send your partner:
  `https://abc-123.ngrok-free.app/interview/candidate/RAC-2026-03`
- Microphone and camera permissions will work automatically because ngrok uses trusted HTTPS!

