# Saksham — Project Progress & Next Tasks Handoff

> **Date**: September 28, 2026  
> **Status**: Handoff Document for Next Agent / Developer  
> **Core Concept**: An AI co-pilot for technical recruiters during live 2-person video interviews (Google Meet style). The candidate sees a clean, professional video conference interface (zero AI prompts or distracting text), while the recruiter has an intelligent AI assistant that continuously monitors the candidate's spoken answers, grades them in real-time across a 5-Axis competency model, and dynamically generates relevant follow-up questions.

---

## 1. Quick Start & Environment Setup

### Servers & Ports
- **Frontend**: Vite React running on `http://127.0.0.1:5173/`
  ```bash
  npm run dev
  ```
- **Backend**: Node.js Express running on `http://localhost:5000/`
  ```bash
  cd server && node server.js
  ```

### Key Credentials & Roles
- **Recruiter / Expert Portal**: `http://127.0.0.1:5173/login`
  - **Email**: `expert@rac-demo.in`
  - **Board Passkey**: `RAC-2026-BOARD`
- **Candidate Meeting Link**: `http://127.0.0.1:5173/interview/candidate/:sessionId`
  - Example: `http://127.0.0.1:5173/interview/candidate/RAC-2026-03`
- **Recruiter Cockpit Link**: `http://127.0.0.1:5173/interview/expert/:sessionId`
  - Example: `http://127.0.0.1:5173/interview/expert/RAC-2026-03`
- **Post-Interview Dossier & Transcript Link**: `http://127.0.0.1:5173/expert/report/:sessionId`
  - Example: `http://127.0.0.1:5173/expert/report/RAC-2026-01`

---

## 2. What Has Been Completed So Far

1. **Role-Gated Authentication & Boardroom Protection**:
   - Only authorized evaluators with government/board passkey (`RAC-2026-BOARD`) can access candidate resumes, interview setup, and assessment reports.
   - Candidates enter directly via clean conference room links without accessing admin settings.

2. **Google Meet Clean Candidate Interface** (`src/pages/InterviewRoomCandidate.jsx`):
   - Removed all question text banners, subtitles, input boxes, and submit buttons.
   - Candidate sees only a clean Google Meet-style conference screen: Recruiter video tile, candidate webcam picture-in-picture, active audio pulse indicator, and bottom toolbar (Mute, Camera toggle, Leave Call).

3. **Recruiter AI Co-Pilot Cockpit** (`src/pages/InterviewRoomExpert.jsx`):
   - Google Meet layout with recruiter & candidate video tiles.
   - Right-hand side AI Co-Pilot panel (replaces standard chat):
     - Displays Candidate Profile & Resume context.
     - Starter questions suggested based on candidate resume.
     - Live 5-Axis scoring & evaluation telemetry (Relevance %, Accuracy %, Score /10).
     - Dynamic follow-up question suggestions generated after candidate answers.

4. **Dedicated Official Interview Transcript & 5-Axis Dossier** (`src/pages/ReportView.jsx`):
   - Implemented a two-document tab switcher:
     1. **5-Axis Assessment Dossier**: Radar chart, competency breakdown, hiring recommendation, and key strengths/flags.
     2. **Official Interview Transcript**: Chronological record of questions asked, candidate spoken answers, AI relevance/accuracy, and telemetry notes.
   - **Side-by-Side View Toggle**: Allows comparing the assessment score and the verbatim transcript side-by-side.
   - **Dual Exports**: Buttons for "Export Report PDF", "Export Transcript (.txt)", and "Export Transcript PDF".
   - Backend endpoint `GET /api/interview/transcript/:sessionId` implemented in `server/routes/interview.js`.

5. **Fixed 'End Call' / 'Leave Call' Buttons (100% Reliable)**:
   - **Recruiter Side** (`src/pages/InterviewRoomExpert.jsx`): Removed blocking `window.confirm`. Added guaranteed compilation with fallback caching and unconditional `finally { navigate('/expert/report/' + sessionId) }`.
   - **Candidate Side** (`src/pages/InterviewRoomCandidate.jsx`): Added Google Meet style *"You left the meeting"* screen with Rejoin and Return Home actions.

6. **Continuous AI Live Audio Monitoring & Real Voice Pipeline**:
   - Shortened candidate voice silence detection to 1.4s for immediate synchronization without button clicks.
   - Added live speech indicator in candidate bottom bar (`Voice Streaming to Board...` / `Audio Connected`).
   - Added active `AI Live Audio Monitor Active` badge in Recruiter AI Cockpit and collapsed demo simulator buttons into an optional developer drawer.
   - Spoken answers are automatically saved to `session.qnaHistory` on the backend so transcripts are never lost.

7. **Complete Transferability & Setup Documentation**:
   - Created comprehensive [SETUP_GUIDE.md](file:///c:/Users/Jayendra/OneDrive/Desktop/Saksham/SETUP_GUIDE.md) detailing exact 2-minute setup, dual-window demo steps, and offline fallback instructions for the person receiving the codebase.

---

## 3. Demo Verification Checklist for Presentation

1. **Window 1 (Recruiter)**:
   - Login: `http://127.0.0.1:5173/login` with `expert@rac-demo.in` / `RAC-2026-BOARD`.
   - Open Session: `RAC-2026-03` (Candidate: Rohan Mehra).
   - Recruiter asks question aloud over microphone.
2. **Window 2 (Candidate)**:
   - Open: `http://127.0.0.1:5173/interview/candidate/RAC-2026-03` in Google Chrome (Incognito or separate device).
   - Candidate speaks verbally into their microphone.
   - Clean Google Meet interface; voice streams to recruiter within 1.5 seconds.
3. **AI Co-Pilot Live Evaluation**:
   - Recruiter sees candidate's transcribed speech, Score /10, Relevance %, Accuracy %, and 2–3 dynamically generated follow-up questions.
4. **End Call & Reports**:
   - Recruiter clicks "End & Generate Report" -> directly opens 5-Axis Dossier & Official Transcript (side-by-side view with PDF & .txt exports).
   - Candidate clicks "Leave Call" -> smoothly transitions to "You left the meeting".

---

## 4. Key File Architecture & References

| File | Purpose |
|------|---------|
## 5. Latest Major Fixes & Enhancements (September 28, 2026)

1. **WebRTC Video & Audio Stream Stabilization across Networks**:
   - **Autoplay Unlock**: Added `muted` to `<video ref={remoteVideoRef} />` elements so mobile Safari & Chrome never block video frames from streaming, while `<audio ref={remoteAudioRef} />` independently handles 2-way live audio with a prominent "Tap to unmute" banner if blocked by browser policy.
   - **Ready-for-Offer Handshake**: Candidate emits a `ready_for_offer` signal on mounting, prompting Recruiter to generate a fresh SDP offer regardless of who joins first or if either party refreshes their browser.
   - **Multi-Server STUN/TURN**: Configured STUN + OpenRelay TURN servers across UDP and TCP port 443 to bypass cellular symmetric NAT.
   - **Removed Loop Watchdog**: Eliminated aggressive renegotiation timers that previously caused offer/answer storms and disrupted media connections.

2. **Question Tracking & Candidate Display**:
   - **Recruiter Cockpit**: Top bar prominently tracks the active question: `TRACKING QUESTION: [Question]` with live status `🟡 Awaiting Candidate Reply...` and `🟢 Answer Graded`.
   - **Recruiter Live Speech**: Recruiter speech is continuously transcribed via Web Speech API (`Board Voice: "..."`) with a 1-click `[Track as Board Question]` button.
   - **Candidate Screen Subtitle Prompt**: Candidate interface now polls the active board question and displays a sleek Google Meet-style floating subtitle card (`💬 DRDO Board Question: [Question]`) at the bottom of their video tile so they always know what is being asked.

3. **Rigorous Technical Evaluation & Anti-Fluff Engine**:
   - **Conversational Remarks / Fillers**: Phrases like *"cannot see/hear you"*, *"could you repeat"*, *"not sure"*, *"hello hello"* strictly receive **0.0/10** (0% relevance, 0% accuracy).
   - **Confident Non-Technical Fluff**: Answers with high conversational fluency but zero technical domain parameters receive **1.5/10** with explicit observation: *"Candidate response lacked substantive technical accuracy and domain depth."*
   - **Passing Scores**: Only answers demonstrating substantive technical depth (3+ domain principles like chirp modulation, matched filter SNR, CA-CFAR thresholding, Doppler ambiguity, FPGA latency) achieve passing grades (7.5 to 9.5/10).

4. **Meeting Leave Synchronization**:
   - Added `POST /api/interview/session/:sessionId/leave` endpoint and client `leaveCall` helper.
   - When either participant leaves (via button or tab close), the server immediately emits a `peer_left` signal and resets presence.
   - **Candidate Screen**: Displays a full-screen Google Meet modal: *"The DRDO RAC Assessment Board Member has ended the interview."*
   - **Recruiter Screen**: Displays a top banner: *"Candidate has left the meeting"* with a direct button `[Conclude & View Report]`.


---

## 5. Live Audio / Video & Scoring Resolutions (September 28, 2026)

1. **True 2-Way P2P WebRTC Live Audio/Video Stream**:
   - Both Recruiter and Candidate now capture local microphone and camera streams.
   - Incoming audio is explicitly piped to dedicated `<audio autoPlay playsInline />` and `<video autoPlay playsInline />` elements so recruiter's voice plays crystal-clear through candidate's speakers, and vice-versa.
   - Built with resilient fallback: if the camera is locked or busy on Windows, the system gracefully falls back to pure audio without dropping connection.
   - Normalized room keys between session codes (`RAC-2026-03`) and MongoDB IDs (`sess_rac_2026_03`) so signaling exchanges match seamlessly.

2. **Presence Detection ("Waiting for Recruiter / Candidate" State)**:
   - When candidate joins before the recruiter, a clean *"Waiting for Recruiter to join..."* placeholder is rendered instead of a mock avatar.
   - When recruiter joins before the candidate, a clean *"Waiting for Candidate to join..."* card is rendered with the room code.
   - Once both peers are active, live camera and microphone streams activate automatically.

3. **0% Silent Candidate Scoring Anomaly Resolved**:
   - Fixed report fallback logic: when a candidate stays silent or gives no verbal response, the report strictly reflects `0.0%` overall score, all 5 competencies set to `0.0`, and recommendation *"Not Recommended (Candidate Did Not Respond)"*.
   - Synchronized `ReportView.jsx`, `interviewService.js`, and `demoData.js` so neither sample reports (Rahul Verma 78.5%) nor demo presets override actual call results.

4. **Cross-Device Sync & Auto-Bridge (Phone to Laptop)**:
   - Fixed `isDemoMode()` defaulting to `true`: previously, phones connecting to the platform would default to isolated demo mode and join a local dummy room (`sess_demo_abc123`), leaving both recruiter and candidate waiting in separate rooms.
   - Set `isDemoMode()` to `false` and prioritized live backend routes in `authService.js` and `interviewService.js`.
   - Added smart recruiter auto-bridge in `server/data/store.js` and `server/routes/auth.js`: when a candidate joins from a phone, the server automatically bridges them into the active waiting recruiter's session.
   - Added 1-click **"Copy Direct Candidate Link"** and **"Copy Invite Link"** buttons on both the Session Authorization page (`SessionCreated.jsx`) and the recruiter's waiting screen (`InterviewRoomExpert.jsx`).

| `SETUP_GUIDE.md` | Full beginner-friendly instructions to run on any computer |


