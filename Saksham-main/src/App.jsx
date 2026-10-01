import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import LandingPage from './pages/LandingPage.jsx';
import ExpertLogin from './pages/ExpertLogin.jsx';
import CandidateJoin from './pages/CandidateJoin.jsx';
import ExpertDashboard from './pages/ExpertDashboard.jsx';
import InterviewSetup from './pages/InterviewSetup.jsx';
import SessionCreated from './pages/SessionCreated.jsx';
import ReportView from './pages/ReportView.jsx';
import InterviewRoomExpert from './pages/InterviewRoomExpert.jsx';
import InterviewRoomCandidate from './pages/InterviewRoomCandidate.jsx';

function AppLayout() {
  const location = useLocation();
  const isMeeting = location.pathname.startsWith('/interview/');

  if (isMeeting) {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#131314', margin: 0, padding: 0 }}>
        <Routes>
          <Route
            path="/interview/expert/:sessionId"
            element={
              <ProtectedRoute>
                <InterviewRoomExpert />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/candidate/:sessionId"
            element={<InterviewRoomCandidate />}
          />
        </Routes>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/expert/login" element={<ExpertLogin />} />
          <Route path="/candidate/join" element={<CandidateJoin />} />

          {/* Protected Expert Assessment Routes */}
          <Route
            path="/expert/dashboard"
            element={
              <ProtectedRoute>
                <ExpertDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expert/setup"
            element={
              <ProtectedRoute>
                <InterviewSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expert/session/:sessionId"
            element={
              <ProtectedRoute>
                <SessionCreated />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expert/report/:sessionId"
            element={
              <ProtectedRoute>
                <ReportView />
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
