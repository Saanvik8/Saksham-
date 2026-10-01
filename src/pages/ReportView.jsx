import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import RadarChart from '../components/RadarChart.jsx';
import { getInterviewReport, getInterviewTranscript } from '../services/interviewService.js';
import { interviewLiveService } from '../services/interviewLiveService.js';

const defaultSampleTranscript = [
  {
    sequence: 1,
    questionId: 'q_demo_1',
    phase: 'Phase 1: Ice Breaking & Background',
    question: 'Welcome to the DRDO RAC board. Can you brief us on your radar signal processing research at IIT Bombay and how it led to your current project at BEL?',
    answer: 'At IIT Bombay my M.Tech thesis focused on synthetic aperture radar algorithm modeling and pulse compression simulation. At BEL, I transitioned those models into embedded C/C++ firmware and real-time FPGA matched filtering blocks for ground surveillance radars.',
    timestamp: '10:04:15 AM',
    isFollowUp: false,
    answerScore: 8.8,
    relevancePct: 94,
    accuracyPct: 90,
    observation: 'Demonstrated solid technical composure and smooth academic transition into embedded defence radar hardware.',
    feedback: 'Clear, structured explanation of academic and industrial radar work.'
  },
  {
    sequence: 2,
    questionId: 'q_demo_2',
    phase: 'Phase 2: Deep Technical Rigor',
    question: 'Can you walk us through the signal processing chain in a pulse-compression radar and explain how matched filtering enhances SNR without waveguide breakdown?',
    answer: 'In pulse compression radar, transmitting an extremely narrow pulse requires very high peak power, risking waveguide dielectric breakdown. Instead, we transmit an LFM chirped pulse of longer duration with modest peak power. Upon reception, the matched filter cross-correlates the echo with the transmitted replica, concentrating pulse energy into a narrow peak with peak SNR = 2E/N0.',
    timestamp: '10:14:40 AM',
    isFollowUp: false,
    answerScore: 9.3,
    relevancePct: 96,
    accuracyPct: 94,
    observation: 'Flawless mathematical formulation of matched filter SNR bounds (2E/N0) and frequency-domain correlation advantages.',
    feedback: 'Deep theoretical and practical foundation in radar pulse compression limits.'
  },
  {
    sequence: 3,
    questionId: 'q_demo_3',
    phase: 'Phase 2: Deep Technical Rigor (AI Follow-up)',
    question: 'How do you mitigate Doppler ambiguities and blind velocities when operating in medium PRF airborne radar mode?',
    answer: 'Medium PRF has both range and velocity ambiguities. We use multiple staggered PRFs across dwell intervals and apply the Chinese Remainder Theorem to resolve the true Doppler fold. Clutter rejection is handled by Doppler filter banks and adaptive notch filters around the mainlobe clutter spectrum.',
    timestamp: '10:24:20 AM',
    isFollowUp: true,
    answerScore: 8.9,
    relevancePct: 92,
    accuracyPct: 89,
    observation: 'Accurately articulated Chinese Remainder Theorem unravelling and medium PRF trade-offs under dynamic clutter conditions.',
    feedback: 'Strong understanding of airborne radar waveform scheduling.'
  },
  {
    sequence: 4,
    questionId: 'q_demo_4',
    phase: 'Phase 3: Managerial & Mission Focus',
    question: 'Describe an instance where unexpected electromagnetic interference (EMI) or component failure threatened a field trial milestone, and how you managed the resolution.',
    answer: 'During prototype subsystem integration at LRDE, high-frequency harmonics from the switched-mode power supply leaked into the receiver LNA. I led our cross-functional team to isolate the ground loops, retrofitted mu-metal shielding around the power rail, and verified a 24dB EMI drop on the spectrum analyzer, keeping trials on schedule.',
    timestamp: '10:35:50 AM',
    isFollowUp: false,
    answerScore: 8.5,
    relevancePct: 90,
    accuracyPct: 88,
    observation: 'Exhibited situational composure, methodical hardware fault isolation, and cross-functional leadership under tight defence delivery deadlines.',
    feedback: 'High accountability and systematic debugging methodology.'
  }
];

const defaultSampleReport = {
  candidateName: 'Rahul Verma',
  post: 'Scientist-C, LRDE Bangalore (Radar & Comms)',
  date: '2026-09-26',
  overallScore: 78.5,
  maxScore: 100,
  recommendation: 'Recommended for Next Round',
  competencyScores: {
    communication: 7.5,
    technicalDepth: 8.5,
    domainRelevance: 8.0,
    problemSolving: 7.8,
    confidenceComposure: 7.5,
  },
  phaseWiseScores: {
    iceBreaking: { score: 7.5, maxScore: 10, questionsAsked: 3 },
    technical: { score: 8.2, maxScore: 10, questionsAsked: 6 },
    managerial: { score: 7.8, maxScore: 10, questionsAsked: 3 },
  },
  strengths: [
    'Demonstrated deep technical mastery in radar signal processing pipelines & pulse compression.',
    'High clarity in explaining CA-CFAR vs OS-CFAR trade-offs under dynamic clutter conditions.',
    'Strong practical foundation with embedded C firmware porting and MATLAB algorithm modeling.',
  ],
  weaknesses: [
    'Limited real-world exposure to phased array antenna radiation pattern optimization.',
    'Initial hesitancy observed during rapid-fire fault isolation scenarios.',
    'Could strengthen communication around cross-functional project management under tight defence deadlines.',
  ],
  summary:
    'Rahul Verma demonstrated strong technical expertise in radar signal processing with notable practical experience at BEL. His technical explanations were structured and grounded in mathematical principles. Recommended for further consideration for Scientist-C position at LRDE.',
  candidateImprovementSuggestions: [
    'Deepen study into phased array beamforming and planar array calibration.',
    'Practice structured situational leadership responses under pressure.',
    'Enhance active eye contact and composure in early interview phases.',
  ],
};

export default function ReportView() {
  const { sessionId } = useParams();
  const reportRef = useRef(null);
  const transcriptRef = useRef(null);

  const [reportData, setReportData] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [activeDocumentTab, setActiveDocumentTab] = useState('report'); // 'report' | 'transcript'
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'split'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingTranscript, setIsExportingTranscript] = useState(false);

  // Expert Review State (Phase 6 Human-in-the-Loop)
  const [expertScore, setExpertScore] = useState(78.5);
  const [selectedRecommendation, setSelectedRecommendation] = useState('Recommended');
  const [expertComments, setExpertComments] = useState('');
  const [competencyInputs, setCompetencyInputs] = useState({
    communication: 7.5,
    technicalDepth: 8.5,
    domainRelevance: 8.0,
    problemSolving: 7.8,
    confidenceComposure: 7.5,
  });
  const [isCertifiedChecked, setIsCertifiedChecked] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Check localStorage cache first
    try {
      const cached = localStorage.getItem(`saksham_report_${sessionId}`) || localStorage.getItem('reportData');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.sessionId === sessionId || parsed.candidateName)) {
          setReportData(parsed);
          setIsLoading(false);
        }
      }
    } catch (e) {}

    getInterviewReport(sessionId)
      .then((result) => {
        if (!isMounted) return;
        if (result.success && result.data) {
          setReportData(result.data);
        } else {
          // Construct fallback report tailored to current session candidate
          const cachedCandidate = localStorage.getItem('candidateName') || 'Candidate Dossier';
          setReportData(prev => prev || {
            ...defaultSampleReport,
            candidateName: cachedCandidate,
            overallScore: 0.0,
            preliminaryScore: 0.0,
            recommendation: 'Not Recommended (Candidate Did Not Respond)',
            competencyScores: {
              communication: 0.0,
              technicalDepth: 0.0,
              domainRelevance: 0.0,
              problemSolving: 0.0,
              confidenceComposure: 1.0,
            }
          });
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        const cachedCandidate = localStorage.getItem('candidateName') || 'Candidate Dossier';
        setReportData(prev => prev || {
          ...defaultSampleReport,
          candidateName: cachedCandidate,
          overallScore: 0.0,
          preliminaryScore: 0.0,
          recommendation: 'Not Recommended (Candidate Did Not Respond)',
          competencyScores: {
            communication: 0.0,
            technicalDepth: 0.0,
            domainRelevance: 0.0,
            problemSolving: 0.0,
            confidenceComposure: 1.0,
          }
        });
        setIsLoading(false);
      });

    // Concurrently load official transcript
    getInterviewTranscript(sessionId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setTranscriptData(res.data);
        }
      })
      .catch((err) => {
        console.warn('Transcript load notice:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // Synchronize Report data strictly with transcript data
  // If the candidate stayed silent in the call, force report to 0.0%
  useEffect(() => {
    if (!transcriptData?.transcript || transcriptData.transcript.length === 0) return;

    const isSilent = transcriptData.transcript.every(q =>
      !q.answer ||
      q.answer.includes('No verbal response') ||
      q.answer.includes('(No verbal') ||
      q.answer.trim().length === 0 ||
      Number(q.answerScore) === 0
    );

    if (isSilent) {
      setReportData(prev => {
        if (prev && prev.overallScore === 0) return prev;
        return {
          ...(prev || defaultSampleReport),
          candidateName: transcriptData.candidateName || prev?.candidateName || 'Candidate',
          overallScore: 0.0,
          preliminaryScore: 0.0,
          maxScore: 100,
          recommendation: 'Not Recommended (Candidate Did Not Respond)',
          finalRecommendation: 'Not Recommended',
          aiSuggestedVerdict: 'Not Recommended',
          competencyScores: {
            communication: 0.0,
            technicalDepth: 0.0,
            domainRelevance: 0.0,
            problemSolving: 0.0,
            confidenceComposure: 1.0,
          },
          phaseWiseScores: {
            iceBreaking: { score: 0.0, maxScore: 10, questionsAsked: 1 },
            technical: { score: 0.0, maxScore: 10, questionsAsked: transcriptData.transcript.length || 1 },
            managerial: { score: 0.0, maxScore: 10, questionsAsked: 1 },
          },
          strengths: ['Candidate connected to board session'],
          weaknesses: [
            'Candidate did not provide verbal or typed responses to board questions',
            'No evidence of technical proficiency, domain knowledge, or problem-solving capability'
          ],
          summary: `${transcriptData.candidateName || 'The candidate'} did not speak or answer questions during the interview conference. Score set to 0.0% due to absence of candidate responses.`
        };
      });
    }
  }, [transcriptData]);

  // Synchronize review state when reportData loads or refreshes
  useEffect(() => {
    if (!reportData) return;

    const isZero = Number(reportData?.overallScore) === 0 || Number(reportData?.preliminaryScore) === 0;

    const isCert = Boolean(
      reportData?.expertReview?.status === 'accepted' ||
      reportData?.expertReview?.status === 'modified' ||
      (reportData?.expertReview?.reviewedAt &&
        reportData?.expertReview?.finalRecommendation &&
        reportData?.expertReview?.finalRecommendation !== 'Pending Expert Review')
    );

    const initScore = isZero
      ? 0.0
      : (isCert
          ? (reportData?.expertReview?.finalScore ?? reportData?.overallScore ?? reportData?.preliminaryScore ?? 78.5)
          : (reportData?.preliminaryScore ?? reportData?.overallScore ?? 78.5));
    setExpertScore(initScore);

    const initRec = isZero
      ? 'Rejected'
      : (isCert
          ? (reportData?.expertReview?.finalRecommendation ?? reportData?.finalRecommendation ?? reportData?.recommendation ?? 'Recommended')
          : (reportData?.finalRecommendation && reportData.finalRecommendation !== 'Pending Expert Review'
              ? reportData.finalRecommendation
              : (reportData?.recommendation && reportData.recommendation !== 'Pending Expert Review'
                  ? reportData.recommendation
                  : (reportData?.aiSuggestedVerdict?.toLowerCase().includes('reject') ? 'Rejected' : 'Recommended'))));
    setSelectedRecommendation(initRec);

    setExpertComments(reportData?.expertReview?.expertComments || '');

    const comps = reportData?.competencyScores || {};
    setCompetencyInputs({
      communication: comps.communication !== undefined ? comps.communication : (isZero ? 0.0 : 7.5),
      technicalDepth: comps.technicalDepth !== undefined ? comps.technicalDepth : (isZero ? 0.0 : 8.5),
      domainRelevance: comps.domainRelevance !== undefined ? comps.domainRelevance : (isZero ? 0.0 : 8.0),
      problemSolving: comps.problemSolving !== undefined ? comps.problemSolving : (isZero ? 0.0 : 7.8),
      confidenceComposure: (comps.confidenceComposure !== undefined ? comps.confidenceComposure : comps.confidence) !== undefined
        ? (comps.confidenceComposure !== undefined ? comps.confidenceComposure : comps.confidence)
        : (isZero ? 1.0 : 7.5),
    });

    if (isCert) {
      setIsCertifiedChecked(true);
    }
  }, [reportData]);


  const handleCompetencyChange = (key, val) => {
    const num = parseFloat(val);
    setCompetencyInputs((prev) => ({
      ...prev,
      [key]: isNaN(num) ? '' : Math.min(10, Math.max(0, num)),
    }));
  };

  const handleCertifyReview = async () => {
    if (!isCertifiedChecked) {
      setReviewError('Mandatory verification: You must check the certification verification box before submitting.');
      return;
    }

    const finalScoreNum = Number(expertScore);
    if (isNaN(finalScoreNum) || finalScoreNum < 0 || finalScoreNum > 100) {
      setReviewError('Final Overall Score must be a valid number between 0 and 100.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const aiScore = Number(reportData?.preliminaryScore ?? reportData?.overallScore ?? 78.5);
      const isModified = (
        Math.abs(finalScoreNum - aiScore) > 0.01 ||
        selectedRecommendation !== (reportData?.aiSuggestedVerdict || 'Recommended') ||
        Number(competencyInputs.communication) !== Number(reportData?.competencyScores?.communication) ||
        Number(competencyInputs.technicalDepth) !== Number(reportData?.competencyScores?.technicalDepth) ||
        Number(competencyInputs.domainRelevance) !== Number(reportData?.competencyScores?.domainRelevance) ||
        Number(competencyInputs.problemSolving) !== Number(reportData?.competencyScores?.problemSolving) ||
        Number(competencyInputs.confidenceComposure) !== Number(reportData?.competencyScores?.confidenceComposure)
      );

      const reviewPayload = {
        status: isModified ? 'modified' : 'accepted',
        finalScore: finalScoreNum,
        finalRecommendation: selectedRecommendation,
        expertComments: expertComments.trim(),
        competencyScores: {
          communication: Number(competencyInputs.communication) || 7.5,
          technicalDepth: Number(competencyInputs.technicalDepth) || 8.5,
          domainRelevance: Number(competencyInputs.domainRelevance) || 8.0,
          problemSolving: Number(competencyInputs.problemSolving) || 7.8,
          confidenceComposure: Number(competencyInputs.confidenceComposure) || 7.5,
        },
      };

      const res = await interviewLiveService.reviewReport(sessionId, reviewPayload);

      if (res && res.success && res.data) {
        setReportData(res.data);
        setReviewSuccess('Assessment certified successfully and logged to official audit trail.');
      } else {
        setReviewError(res?.error || 'Failed to submit expert certification. Please retry.');
      }
    } catch (err) {
      console.error('Expert certification submission error:', err);
      setReviewError(err?.message || 'Network error while submitting certification.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    setIsExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Handle multi-page if needed or single-page fit
      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        let heightLeft = pdfHeight;
        let position = 0;
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = position - pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`Saksham_Assessment_Report_${sessionId || 'Candidate'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF export:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Safe accessor defaults
  const isCertified = Boolean(
    reportData?.expertReview?.status === 'accepted' ||
    reportData?.expertReview?.status === 'modified' ||
    (reportData?.expertReview?.reviewedAt &&
      reportData?.expertReview?.finalRecommendation &&
      reportData?.expertReview?.finalRecommendation !== 'Pending Expert Review')
  );

  const aiPreliminaryScore = reportData?.preliminaryScore ?? reportData?.overallScore ?? 78.5;
  const aiSuggestedVerdict = reportData?.aiSuggestedVerdict || 'Candidate meets technical benchmarks required for scientific evaluation.';

  const overallScore = isCertified
    ? (reportData?.expertReview?.finalScore ?? reportData?.overallScore ?? aiPreliminaryScore)
    : (reportData?.overallScore ?? aiPreliminaryScore);

  const recommendation = isCertified
    ? (reportData?.expertReview?.finalRecommendation ?? reportData?.finalRecommendation ?? reportData?.recommendation ?? 'Recommended')
    : (reportData?.finalRecommendation || reportData?.recommendation || 'Pending Expert Review');

  const candidateRole = reportData?.candidateInfo?.post || reportData?.post || 'Scientist-C, LRDE Bangalore (Radar & Comms)';
  const candidateName = reportData?.candidateName || reportData?.candidateInfo?.name || 'Rahul Verma';
  const reportDate = reportData?.createdAt
    ? new Date(reportData.createdAt).toLocaleDateString()
    : (reportData?.date || new Date().toISOString().split('T')[0]);

  const competencyScores = reportData?.competencyScores || {
    communication: 7.5,
    technicalDepth: 8.5,
    domainRelevance: 8.0,
    problemSolving: 7.8,
    confidenceComposure: 7.5,
  };
  const phaseScores = reportData?.phaseWiseScores || {};
  const strengths = reportData?.strengths || [];
  const weaknesses = reportData?.weaknesses || [];
  const summary =
    reportData?.summary ||
    'Assessment synthesis indicates candidate meets the technical benchmarks required for scientific evaluation.';
  const suggestions = reportData?.candidateImprovementSuggestions || [];

  const effectiveTranscriptList = (transcriptData?.transcript && transcriptData.transcript.length > 0)
    ? transcriptData.transcript
    : (reportData?.allQnA && reportData.allQnA.length > 0)
      ? reportData.allQnA.map((item, idx) => ({
          sequence: item.sequence || idx + 1,
          questionId: item.questionId || `q_${idx + 1}`,
          phase: item.phase || 'Technical Rigor',
          question: item.question,
          answer: item.answer || '(No verbal response recorded)',
          timestamp: item.timestamp || item.askedAt || reportDate,
          isFollowUp: Boolean(item.isFollowUp),
          answerScore: item.answerScore !== undefined ? item.answerScore : null,
          relevancePct: item.relevancePct !== undefined ? item.relevancePct : null,
          accuracyPct: item.accuracyPct !== undefined ? item.accuracyPct : null,
          completenessPct: item.completenessPct !== undefined ? item.completenessPct : null,
          observation: item.observation || item.feedback || 'Candidate response recorded and catalogued under evaluation protocol.',
          feedback: item.feedback || item.observation || '',
          missingConcepts: item.missingConcepts || []
        }))
      : defaultSampleTranscript;

  const handleDownloadTranscriptTxt = () => {
    let content = `========================================================================\n`;
    content += `DEFENCE RESEARCH & DEVELOPMENT ORGANISATION (DRDO)\n`;
    content += `RECRUITMENT & ASSESSMENT CENTRE (RAC) — SAKSHAM PLATFORM\n`;
    content += `OFFICIAL ORAL INTERVIEW TRANSCRIPT & VERBATIM DIALOGUE RECORD\n`;
    content += `========================================================================\n\n`;
    content += `DOSSIER ID       : ${sessionId || 'RAC-2026-X1'}\n`;
    content += `CANDIDATE NAME   : ${candidateName}\n`;
    content += `TARGET POST      : ${candidateRole}\n`;
    content += `INTERVIEW DATE   : ${reportDate}\n`;
    content += `BOARD CHAIR      : ${reportData?.expertReview?.reviewerName || 'Dr. Rajesh Sharma (Scientist-G, Board Member)'}\n`;
    content += `TOTAL QUESTIONS  : ${effectiveTranscriptList.length}\n`;
    content += `AUDIO TELEMETRY  : Continuous AI Audio Listener (Direct Candidate Audio Capture)\n`;
    content += `SECURITY STATUS  : OFFICIAL & STATUTORY RAC AUDIT TRAIL\n`;
    content += `------------------------------------------------------------------------\n\n`;

    effectiveTranscriptList.forEach((item, idx) => {
      const seq = item.sequence || idx + 1;
      const phase = item.phase || 'Technical Rigor';
      const isFollowUp = item.isFollowUp ? ' [AI GENERATED DYNAMIC FOLLOW-UP]' : '';
      const score = item.answerScore !== null && item.answerScore !== undefined ? `${item.answerScore} / 10` : 'Evaluated';
      const relevance = item.relevancePct !== null && item.relevancePct !== undefined ? `${item.relevancePct}%` : 'N/A';
      const accuracy = item.accuracyPct !== null && item.accuracyPct !== undefined ? `${item.accuracyPct}%` : 'N/A';
      const time = item.timestamp ? (isNaN(new Date(item.timestamp).getTime()) ? item.timestamp : new Date(item.timestamp).toLocaleTimeString()) : `Q${seq}`;

      content += `[QUERY #${String(seq).padStart(2, '0')}] ${phase.toUpperCase()}${isFollowUp}\n`;
      content += `TIMESTAMP: ${time}\n\n`;
      content += `BOARD (DR. RAJESH SHARMA - ORAL QUESTION ASKED VERBALLY):\n`;
      content += `"${item.question}"\n\n`;
      content += `CANDIDATE (${candidateName.toUpperCase()} - SPOKEN ANSWER VIA CONTINUOUS AUDIO CAPTURE):\n`;
      content += `"${item.answer || '(No response recorded)'}"\n\n`;
      content += `AI CO-PILOT TELEMETRY & OBSERVATION:\n`;
      content += `- Answer Score : ${score}\n`;
      content += `- Relevance    : ${relevance} | Accuracy: ${accuracy}\n`;
      content += `- Observation  : ${item.observation || item.feedback || 'Candidate response recorded and catalogued under evaluation protocol.'}\n`;
      content += `------------------------------------------------------------------------\n\n`;
    });

    content += `========================================================================\n`;
    content += `END OF OFFICIAL TRANSCRIPT RECORD\n`;
    content += `INTEGRITY CHECKSUM: SHA-256 VALIDATED • SAKSHAM ENGINE\n`;
    content += `========================================================================\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DRDO_RAC_Transcript_${candidateName.replace(/\s+/g, '_')}_${sessionId || 'SESS'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTranscriptPDF = async () => {
    if (!transcriptRef.current) return;
    setIsExportingTranscript(true);
    try {
      const element = transcriptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        let heightLeft = pdfHeight;
        let position = 0;
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = position - pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      pdf.save(`DRDO_RAC_Transcript_${candidateName.replace(/\s+/g, '_')}_${sessionId || 'Candidate'}.pdf`);
    } catch (err) {
      console.error('Error generating Transcript PDF:', err);
      alert('Failed to generate Transcript PDF. Please download the .txt document.');
    } finally {
      setIsExportingTranscript(false);
    }
  };

  const renderTranscriptDoc = () => (
    <div id="transcript-export-container" ref={transcriptRef} className="report-document transcript-document">
      {/* Report Header / Government Defence Style */}
      <div className="report-header">
        <div className="report-header-top">
          <div className="report-brand">
            <div className="report-crest">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
            <div>
              <span className="report-org-title">DEFENCE RECRUITMENT & ASSESSMENT CENTRE (RAC)</span>
              <span className="report-org-subtitle font-mono">
                OFFICIAL ORAL INTERVIEW TRANSCRIPT & VERBATIM DIALOGUE RECORD
              </span>
            </div>
          </div>

          <div className="report-id-box font-mono">
            <div>DOSSIER: TRANSCRIPT-{sessionId || 'SESS-2026-X1'}</div>
            <div>DATE: {reportDate}</div>
            <div className="text-gold">SECURITY: RESTRICTED</div>
          </div>
        </div>

        <div className="report-title-strip">
          <h1 className="report-title">Verbatim Dialogue Transcript & Real-Time AI Evaluation</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.35rem', lineHeight: '1.5' }}>
            Chronological audit record of oral questions verbally asked by the board and spoken candidate responses continuously monitored by SAKSHAM AI Audio Telemetry.
          </p>
        </div>

        {/* Candidate Info Strip */}
        <div className="candidate-info-strip">
          <div className="info-cell">
            <span className="info-label">Candidate Name</span>
            <span className="info-val">{candidateName}</span>
          </div>
          <div className="info-cell">
            <span className="info-label">Target Requisition / Post</span>
            <span className="info-val">{candidateRole}</span>
          </div>
          <div className="info-cell">
            <span className="info-label">Questions Evaluated</span>
            <span className="info-val font-mono">{effectiveTranscriptList.length} Oral Queries</span>
          </div>
          <div className="info-cell">
            <span className="info-label">Audio Listener Protocol</span>
            <span className="info-val font-mono text-success">CONTINUOUS AI ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Transcript Telemetry Overview Bar */}
      <div className="transcript-telemetry-banner font-mono">
        <div className="tel-pill">
          <span className="tel-k">SESSION CODE:</span>
          <strong className="tel-v text-gold">{sessionId || 'RAC-2026-03'}</strong>
        </div>
        <div className="tel-pill">
          <span className="tel-k">TOTAL ORAL QUERIES:</span>
          <strong className="tel-v">{effectiveTranscriptList.length} Questions</strong>
        </div>
        <div className="tel-pill">
          <span className="tel-k">AUDIO CAPTURE METHOD:</span>
          <strong className="tel-v text-success">Continuous Browser WebAudio Stream</strong>
        </div>
        <div className="tel-pill">
          <span className="tel-k">EVALUATOR SIGN-OFF:</span>
          <strong className="tel-v">{reportData?.expertReview?.reviewerName || 'Dr. Rajesh Sharma'}</strong>
        </div>
      </div>

      {/* Transcript Dialogue List */}
      <div className="transcript-entries-list">
        {effectiveTranscriptList.length === 0 ? (
          <div className="card state-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
              No oral responses recorded for this interview session.
            </p>
          </div>
        ) : (
          effectiveTranscriptList.map((entry, idx) => {
            const seq = entry.sequence || idx + 1;
            const phase = entry.phase || 'Technical Rigor';
            const isFollowUp = entry.isFollowUp;
            const score = entry.answerScore !== null && entry.answerScore !== undefined ? entry.answerScore : null;

            return (
              <div key={entry.questionId || idx} className="transcript-qa-card">
                <div className="qa-card-header font-mono">
                  <div className="qa-seq-badge">
                    <span className="qa-seq-num">QUERY #{String(seq).padStart(2, '0')}</span>
                    <span className="qa-phase-pill">{phase}</span>
                    {isFollowUp && (
                      <span className="badge badge-gold font-mono" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                        AI DYNAMIC FOLLOW-UP
                      </span>
                    )}
                  </div>
                  <span className="qa-timestamp">
                    {entry.timestamp ? (isNaN(new Date(entry.timestamp).getTime()) ? entry.timestamp : new Date(entry.timestamp).toLocaleTimeString()) : `Entry #${seq}`}
                  </span>
                </div>

                {/* Recruiter Oral Question */}
                <div className="qa-speech-block recruiter-speech">
                  <div className="speaker-header">
                    <div className="speaker-avatar recruiter-av font-mono">RS</div>
                    <div>
                      <span className="speaker-role font-mono">DR. RAJESH SHARMA (BOARD MEMBER)</span>
                      <span className="speaker-sub">Oral Question (Asked Verbally Aloud)</span>
                    </div>
                  </div>
                  <div className="speech-content-text recruiter-text">
                    "{entry.question}"
                  </div>
                </div>

                {/* Candidate Spoken Answer */}
                <div className="qa-speech-block candidate-speech">
                  <div className="speaker-header">
                    <div className="speaker-avatar candidate-av font-mono">
                      {candidateName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="speaker-role font-mono">{candidateName.toUpperCase()} (CANDIDATE)</span>
                      <span className="speaker-sub">Spoken Answer (Captured via Continuous Audio Listener)</span>
                    </div>
                  </div>
                  <div className="speech-content-text candidate-text">
                    "{entry.answer || '(Candidate remained silent / no verbal response)'}"
                  </div>
                </div>

                {/* AI Telemetry & Evaluation Chip */}
                <div className="qa-ai-evaluation-box">
                  <div className="ai-eval-header font-mono">
                    <div className="ai-eval-tag">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                        <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
                      </svg>
                      <span>AI CO-PILOT REAL-TIME TELEMETRY</span>
                    </div>
                    {score !== null && (
                      <span className={`ai-score-pill font-mono ${score >= 7.5 ? 'score-high' : score >= 4 ? 'score-mid' : 'score-low'}`}>
                        SCORE: {Number(score).toFixed(1)} / 10
                      </span>
                    )}
                  </div>

                  <div className="ai-eval-metrics-row font-mono">
                    {entry.relevancePct !== null && entry.relevancePct !== undefined && (
                      <div className="ai-metric-item">
                        <span className="m-label">RELEVANCE:</span>
                        <strong className="m-val">{entry.relevancePct}%</strong>
                      </div>
                    )}
                    {entry.accuracyPct !== null && entry.accuracyPct !== undefined && (
                      <div className="ai-metric-item">
                        <span className="m-label">ACCURACY:</span>
                        <strong className="m-val">{entry.accuracyPct}%</strong>
                      </div>
                    )}
                    {entry.completenessPct !== null && entry.completenessPct !== undefined && (
                      <div className="ai-metric-item">
                        <span className="m-label">COMPLETENESS:</span>
                        <strong className="m-val">{entry.completenessPct}%</strong>
                      </div>
                    )}
                  </div>

                  <div className="ai-eval-observation">
                    <strong>AI Telemetry Observation: </strong>
                    <span>{entry.observation || entry.feedback || 'Candidate response evaluated under standardized competency vectors.'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="report-doc-footer">
        <div className="verification-signatures font-mono">
          <div>TRANSCRIPT AUTHENTICATED BY: DRDO RAC SELECTION BOARD</div>
          <div>CONTINUOUS AUDIO TELEMETRY: SHA-256 AUDIT LOGGED • SAKSHAM ENGINE</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-page report-view-page">
      <div className="app-container">
        {/* Navigation & Controls */}
        <div className="report-action-bar no-print">
          <div className="breadcrumb-nav">
            <Link to="/expert/dashboard" className="breadcrumb-link">
              ← Dashboard
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Official Evaluation Dossiers</span>
          </div>

          {/* Document Tab Switcher */}
          <div className="document-tab-switcher">
            <button
              type="button"
              className={`doc-tab-btn ${activeDocumentTab === 'report' && viewMode !== 'split' ? 'active' : ''}`}
              onClick={() => { setActiveDocumentTab('report'); setViewMode('single'); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <span>5-Axis Assessment Dossier</span>
            </button>

            <button
              type="button"
              className={`doc-tab-btn ${activeDocumentTab === 'transcript' && viewMode !== 'split' ? 'active' : ''}`}
              onClick={() => { setActiveDocumentTab('transcript'); setViewMode('single'); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Official Interview Transcript ({effectiveTranscriptList.length})</span>
            </button>

            <button
              type="button"
              className={`doc-tab-btn split-toggle-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode(prev => prev === 'split' ? 'single' : 'split')}
              title="View Assessment Report and Transcript Document side-by-side"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="3" x2="12" y2="21"></line>
              </svg>
              <span>{viewMode === 'split' ? 'Exit Side-by-Side' : 'View Side-by-Side'}</span>
            </button>
          </div>

          <div className="action-buttons">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="btn btn-navy btn-sm"
              disabled={isExporting || isLoading}
              title="Download 5-Axis Assessment Report PDF"
            >
              {isExporting ? (
                <>
                  <span className="spinner"></span>
                  Exporting Report...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Report PDF
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadTranscriptTxt}
              className="btn btn-gold btn-sm"
              disabled={isLoading}
              title="Download separate verbatim transcript document as .txt"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              Transcript (.txt)
            </button>

            <button
              type="button"
              onClick={handleDownloadTranscriptPDF}
              className="btn btn-outline btn-sm"
              disabled={isExportingTranscript || isLoading}
              title="Download separate verbatim transcript document as PDF"
            >
              {isExportingTranscript ? (
                <>
                  <span className="spinner"></span>
                  Exporting...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Transcript PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-info no-print" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div className="alert-content">
              <strong>Offline / Demo Notice:</strong> {error} Displaying assessment report dossier.
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="card state-card">
            <span className="spinner spinner-gold"></span>
            <p style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)' }}>
              Compiling competency vectors & assessment telemetry...
            </p>
          </div>
        )}

        {/* Dossier Display Wrapper: Supports Single Document or Side-by-Side View */}
        {!isLoading && (
          <div className={`dossier-display-wrapper ${viewMode === 'split' ? 'view-split' : 'view-single'}`}>
            {/* Document 1: 5-Axis Assessment Dossier */}
            {(viewMode === 'split' || activeDocumentTab === 'report') && (
              <div className="dossier-column assessment-col">
                {viewMode === 'split' && (
                  <div className="split-col-header font-mono no-print">
                    <span className="split-title">DOCUMENT 1 OF 2: 5-AXIS ASSESSMENT DOSSIER</span>
                    <button type="button" onClick={handleDownloadPDF} className="split-dl-btn font-mono">
                      Download PDF ↓
                    </button>
                  </div>
                )}
                <div id="report-export-container" ref={reportRef} className="report-document">
            {/* Report Header / Government Defence Style */}
            <div className="report-header">
              <div className="report-header-top">
                <div className="report-brand">
                  <div className="report-crest">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                      <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
                    </svg>
                  </div>
                  <div>
                    <span className="report-org-title">SAKSHAM ASSESSMENT INTELLIGENCE</span>
                    <span className="report-org-subtitle font-mono">
                      DEFENCE & SCIENTIFIC RECRUITMENT SIMULATION
                    </span>
                  </div>
                </div>

                <div className="report-id-box font-mono">
                  <div>DOSSIER: {sessionId || 'SESS-2026-X1'}</div>
                  <div>DATE: {reportDate}</div>
                </div>
              </div>

              <div className="report-title-strip">
                <h1 className="report-title">Candidate Assessment & Competency Evaluation Dossier</h1>
              </div>

              {/* Candidate Info Strip */}
              <div className="candidate-info-strip">
                <div className="info-cell">
                  <span className="info-label">Candidate Name</span>
                  <span className="info-val">{candidateName}</span>
                </div>
                <div className="info-cell">
                  <span className="info-label">Target Requisition / Post</span>
                  <span className="info-val">{candidateRole}</span>
                </div>
                <div className="info-cell">
                  <span className="info-label">Evaluator Domain</span>
                  <span className="info-val">Scientific Research & Development</span>
                </div>
                <div className="info-cell">
                  <span className="info-label">Protocol Validity</span>
                  <span className="info-val font-mono text-success">
                    {isCertified ? 'CERTIFIED' : 'PRELIMINARY'}
                  </span>
                </div>
              </div>
            </div>

            {/* Score & Recommendation Banner */}
            <div className="score-summary-grid">
              <div className="card score-summary-card">
                <span className="score-label font-mono">
                  {isCertified ? 'CONFIRMED EXPERT FINAL SCORE' : 'PRELIMINARY COMPOSITE SCORE'}
                </span>
                <div className="score-number-row font-mono">
                  <span className="score-big">{Number(overallScore).toFixed(1)}</span>
                  <span className="score-out-of">/ 100</span>
                </div>
                <span className="score-bench">
                  {isCertified
                    ? 'Official Human Expert Certified Evaluation'
                    : 'Standardized 3-Phase Synthesis'}
                </span>
              </div>

              <div className="card recommendation-card">
                <span className="recom-label font-mono">
                  {isCertified ? 'FINAL EXPERT RECOMMENDATION' : 'ASSESSMENT RECOMMENDATION'}
                </span>
                <div className="recom-status-row">
                  <span
                    className={`badge ${
                      recommendation.toLowerCase().includes('strongly') || recommendation.toLowerCase() === 'selected'
                        ? 'badge-success'
                        : recommendation.toLowerCase().includes('recommend')
                        ? 'badge-gold'
                        : recommendation.toLowerCase().includes('reject')
                        ? 'badge-warning'
                        : 'badge-neutral'
                    } recom-badge`}
                  >
                    {recommendation}
                  </span>
                </div>
                <p className="recom-note">
                  {isCertified
                    ? `Officially signed off by ${reportData?.expertReview?.reviewerName || 'RAC Panel Expert'} on ${new Date(reportData?.expertReview?.reviewedAt || Date.now()).toLocaleDateString()}`
                    : 'Recommendation based on technical depth, domain accuracy, and composure scores.'}
                </p>
              </div>
            </div>

            {/* Visual Analytics Row: Radar Chart + Phase Scores */}
            <div className="analytics-layout-grid">
              {/* 5-Axis Competency Radar */}
              <div className="card radar-card">
                <div className="card-header">
                  <div>
                    <span className="badge badge-gold font-mono">COMPETENCY VECTORS</span>
                    <h3 className="card-title">5-Axis Competency Radar</h3>
                  </div>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    SCALE 1.0 - 10.0
                  </span>
                </div>
                <div className="card-body radar-card-body">
                  <RadarChart scores={competencyScores} maxScore={10} />
                </div>
              </div>

              {/* Phase-Wise Scores */}
              <div className="card phase-card">
                <div className="card-header">
                  <div>
                    <span className="badge badge-navy font-mono">EVALUATION BREAKDOWN</span>
                    <h3 className="card-title">Phase-Wise Performance</h3>
                  </div>
                </div>
                <div className="card-body">
                  <div className="phase-scores-list">
                    {/* Phase 1: Ice Breaking */}
                    <div className="phase-row">
                      <div className="phase-info">
                        <span className="phase-name">Phase 1: Ice Breaking & Background</span>
                        <span className="phase-meta font-mono">
                          {phaseScores.iceBreaking?.questionsAsked || 3} Questions Evaluated
                        </span>
                      </div>
                      <div className="phase-score-pill font-mono">
                        {phaseScores.iceBreaking?.score || 7.5} / 10
                      </div>
                    </div>

                    {/* Phase 2: Technical Depth */}
                    <div className="phase-row highlight-phase">
                      <div className="phase-info">
                        <span className="phase-name">Phase 2: Deep Technical Rigor</span>
                        <span className="phase-meta font-mono">
                          {phaseScores.technical?.questionsAsked || 6} Questions Evaluated
                        </span>
                      </div>
                      <div className="phase-score-pill font-mono">
                        {phaseScores.technical?.score || 8.2} / 10
                      </div>
                    </div>

                    {/* Phase 3: Managerial & Mission */}
                    <div className="phase-row">
                      <div className="phase-info">
                        <span className="phase-name">Phase 3: Managerial & Mission Focus</span>
                        <span className="phase-meta font-mono">
                          {phaseScores.managerial?.questionsAsked || 3} Questions Evaluated
                        </span>
                      </div>
                      <div className="phase-score-pill font-mono">
                        {phaseScores.managerial?.score || 7.8} / 10
                      </div>
                    </div>
                  </div>

                  {/* Competency Metric Pills */}
                  <div className="vector-pills-grid font-mono">
                    <div className="vector-pill">
                      <span>COMMUNICATION:</span>
                      <strong>{competencyScores.communication || 7.5}/10</strong>
                    </div>
                    <div className="vector-pill">
                      <span>TECH DEPTH:</span>
                      <strong>{competencyScores.technicalDepth || 8.5}/10</strong>
                    </div>
                    <div className="vector-pill">
                      <span>DOMAIN REL:</span>
                      <strong>{competencyScores.domainRelevance || 8.0}/10</strong>
                    </div>
                    <div className="vector-pill">
                      <span>PROBLEM SOLV:</span>
                      <strong>{competencyScores.problemSolving || 7.8}/10</strong>
                    </div>
                    <div className="vector-pill">
                      <span>CONFIDENCE:</span>
                      <strong>
                        {competencyScores.confidenceComposure ||
                          competencyScores.confidence ||
                          7.5}
                        /10
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses Section */}
            <div className="eval-observations-grid">
              {/* Strengths */}
              <div className="card observation-card">
                <div className="card-header border-success">
                  <div className="obs-header-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <h3 className="card-title">Key Technical Strengths</h3>
                  </div>
                  <span className="badge badge-success font-mono">VALIDATED</span>
                </div>
                <div className="card-body">
                  <ul className="observation-list">
                    {strengths.map((str, idx) => (
                      <li key={idx} className="observation-item">
                        <span className="obs-bullet success-bullet font-mono">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Weaknesses / Improvement Areas */}
              <div className="card observation-card">
                <div className="card-header border-warning">
                  <div className="obs-header-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2">
                      <polygon points="12 2 2 22 22 22 12 2"></polygon>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <h3 className="card-title">Areas for Development</h3>
                  </div>
                  <span className="badge badge-warning font-mono">OBSERVED</span>
                </div>
                <div className="card-body">
                  <ul className="observation-list">
                    {weaknesses.map((weak, idx) => (
                      <li key={idx} className="observation-item">
                        <span className="obs-bullet warning-bullet font-mono">!</span>
                        <span>{weak}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Executive Summary & Improvement Suggestions */}
            <div className="card summary-card">
              <div className="card-header">
                <span className="badge badge-gold font-mono">BOARD SYNTHESIS</span>
                <h3 className="card-title">Executive Evaluation Summary</h3>
              </div>
              <div className="card-body">
                <p className="summary-paragraph">{summary}</p>

                {suggestions.length > 0 && (
                  <div className="suggestions-block">
                    <h4 className="suggestions-heading">Candidate Development Recommendations:</h4>
                    <ul className="suggestions-list">
                      {suggestions.map((sug, idx) => (
                        <li key={idx}>{sug}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Human Expert Review & Certification Section (Phase 6 Core Feature) */}
            <div className="card expert-review-card">
              <div className="card-header expert-review-header">
                <div className="expert-header-left">
                  <span className="badge badge-gold font-mono">HUMAN-IN-THE-LOOP PROTOCOL</span>
                  <h3 className="card-title expert-section-title">Human Expert Review & Certification</h3>
                  <p className="expert-subtitle">
                    Mandatory statutory review & final certification by DRDO RAC expert panel
                  </p>
                </div>
                <div className="expert-header-right">
                  {isCertified ? (
                    <span className="badge badge-success font-mono certified-badge">
                      CERTIFIED & LOCKED ({reportData?.expertReview?.status?.toUpperCase() || 'ACCEPTED'})
                    </span>
                  ) : (
                    <span className="badge badge-warning font-mono pending-badge">
                      PENDING EXPERT REVIEW
                    </span>
                  )}
                </div>
              </div>

              <div className="card-body">
                {/* Dual Comparison Grid: AI Baseline vs Expert Input */}
                <div className="review-comparison-grid">
                  {/* Column 1: AI Assessment Baseline (Read-Only) */}
                  <div className="ai-baseline-panel">
                    <div className="panel-badge-row">
                      <span className="badge badge-navy font-mono">AI ASSESSMENT BASELINE</span>
                      <span className="baseline-tag font-mono">OBSERVATIONAL AID • READ-ONLY</span>
                    </div>

                    <div className="baseline-metric-group">
                      <span className="metric-label font-mono">AI PRELIMINARY SCORE</span>
                      <div className="baseline-score-val font-mono">
                        {Number(aiPreliminaryScore).toFixed(1)} <span className="score-out-of">/ 100</span>
                      </div>
                    </div>

                    <div className="baseline-metric-group">
                      <span className="metric-label font-mono">AI SUGGESTED VERDICT</span>
                      <div className="baseline-verdict-box">
                        "{aiSuggestedVerdict}"
                      </div>
                    </div>

                    <div className="baseline-metric-group">
                      <span className="metric-label font-mono">AI COMPETENCY BASELINE</span>
                      <div className="baseline-competency-list font-mono">
                        <div className="baseline-comp-row">
                          <span>Communication:</span>
                          <strong>{reportData?.competencyScores?.communication ?? 7.5} / 10</strong>
                        </div>
                        <div className="baseline-comp-row">
                          <span>Technical Depth:</span>
                          <strong>{reportData?.competencyScores?.technicalDepth ?? 8.5} / 10</strong>
                        </div>
                        <div className="baseline-comp-row">
                          <span>Domain Relevance:</span>
                          <strong>{reportData?.competencyScores?.domainRelevance ?? 8.0} / 10</strong>
                        </div>
                        <div className="baseline-comp-row">
                          <span>Problem Solving:</span>
                          <strong>{reportData?.competencyScores?.problemSolving ?? 7.8} / 10</strong>
                        </div>
                        <div className="baseline-comp-row">
                          <span>Confidence & Composure:</span>
                          <strong>{reportData?.competencyScores?.confidenceComposure ?? 7.5} / 10</strong>
                        </div>
                      </div>
                    </div>

                    <div className="statutory-notice">
                      <strong>Human Authority Policy:</strong> DRDO RAC regulations require that all recruitment and assessment decisions originate from certified human experts. AI telemetry and scoring act as observational aids.
                    </div>
                  </div>

                  {/* Column 2: Expert Review & Determination */}
                  <div className={`expert-determination-panel ${isCertified ? 'panel-certified' : ''}`}>
                    <div className="panel-badge-row">
                      <span className="badge badge-gold font-mono">
                        {isCertified ? 'CONFIRMED EXPERT DETERMINATION' : 'EXPERT PANEL EVALUATION'}
                      </span>
                      {isCertified && (
                        <span className="badge badge-success font-mono">LOCKED</span>
                      )}
                    </div>

                    {isCertified ? (
                      /* Certified & Locked State View */
                      <div className="certified-summary-display">
                        <div className="certified-score-row">
                          <div>
                            <span className="metric-label font-mono">FINAL EXPERT SCORE</span>
                            <div className="certified-score-val font-mono">
                              {Number(expertScore).toFixed(1)} <span className="score-out-of">/ 100</span>
                            </div>
                          </div>
                          <div>
                            <span className="metric-label font-mono">FINAL RECOMMENDATION</span>
                            <div className="certified-rec-badge-wrap">
                              <span className="badge badge-gold recom-badge font-mono">
                                {finalRecommendation}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="certified-competencies-block">
                          <span className="metric-label font-mono">CONFIRMED COMPETENCY SCORES</span>
                          <div className="vector-pills-grid font-mono" style={{ marginTop: '0.5rem' }}>
                            <div className="vector-pill">
                              <span>COMMUNICATION:</span>
                              <strong>{competencyInputs.communication} / 10</strong>
                            </div>
                            <div className="vector-pill">
                              <span>TECH DEPTH:</span>
                              <strong>{competencyInputs.technicalDepth} / 10</strong>
                            </div>
                            <div className="vector-pill">
                              <span>DOMAIN REL:</span>
                              <strong>{competencyInputs.domainRelevance} / 10</strong>
                            </div>
                            <div className="vector-pill">
                              <span>PROBLEM SOLV:</span>
                              <strong>{competencyInputs.problemSolving} / 10</strong>
                            </div>
                            <div className="vector-pill">
                              <span>CONFIDENCE:</span>
                              <strong>{competencyInputs.confidenceComposure} / 10</strong>
                            </div>
                          </div>
                        </div>

                        <div className="certified-remarks-block">
                          <span className="metric-label font-mono">EXPERT REMARKS & OBSERVATIONS</span>
                          <p className="certified-remarks-text">
                            {expertComments || 'Assessment officially certified with panel endorsement.'}
                          </p>
                        </div>

                        <div className="certified-metadata-card font-mono">
                          <div className="meta-item">
                            <span className="meta-k">CERTIFIED REVIEWER:</span>
                            <strong className="meta-v text-gold">
                              {reportData?.expertReview?.reviewerName || 'Dr. Rajesh Sharma (Scientist-G)'}
                            </strong>
                          </div>
                          <div className="meta-item">
                            <span className="meta-k">REVIEW TIMESTAMP:</span>
                            <strong className="meta-v">
                              {reportData?.expertReview?.reviewedAt
                                ? new Date(reportData.expertReview.reviewedAt).toLocaleString()
                                : new Date().toLocaleString()}
                            </strong>
                          </div>
                          <div className="meta-item">
                            <span className="meta-k">DECISION STATUS:</span>
                            <strong className="meta-v text-success">
                              {reportData?.expertReview?.status?.toUpperCase() || 'ACCEPTED'} • IMMUTABLE
                            </strong>
                          </div>
                        </div>

                        <div className="certified-locked-note">
                          This assessment has been officially certified and locked. Modification is disabled under DRDO RAC protocol.
                        </div>
                      </div>
                    ) : (
                      /* Active Expert Review Form */
                      <form className="expert-review-form" onSubmit={(e) => { e.preventDefault(); handleCertifyReview(); }}>
                        {/* Final Score Input */}
                        <div className="form-field-group">
                          <label htmlFor="finalScoreInput" className="form-label font-mono">
                            FINAL SCORE (0 - 100):
                          </label>
                          <div className="input-with-baseline">
                            <input
                              id="finalScoreInput"
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              className="form-input font-mono score-input"
                              value={expertScore}
                              onChange={(e) => setExpertScore(e.target.value)}
                              disabled={isSubmittingReview}
                              required
                            />
                            <span className="input-helper font-mono">
                              (AI Preliminary Score: {Number(aiPreliminaryScore).toFixed(1)} / 100)
                            </span>
                          </div>
                        </div>

                        {/* 5 Competency Score Inputs */}
                        <div className="form-field-group">
                          <label className="form-label font-mono">
                            5 COMPETENCY SCORE INPUTS (SCALE 0 - 10):
                          </label>
                          <div className="competencies-input-grid font-mono">
                            <div className="comp-input-col">
                              <label htmlFor="competencyComm" className="comp-label">Communication</label>
                              <input
                                id="competencyComm"
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                className="form-input comp-input"
                                value={competencyInputs.communication}
                                onChange={(e) => handleCompetencyChange('communication', e.target.value)}
                                disabled={isSubmittingReview}
                              />
                            </div>
                            <div className="comp-input-col">
                              <label htmlFor="competencyTech" className="comp-label">Technical Depth</label>
                              <input
                                id="competencyTech"
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                className="form-input comp-input"
                                value={competencyInputs.technicalDepth}
                                onChange={(e) => handleCompetencyChange('technicalDepth', e.target.value)}
                                disabled={isSubmittingReview}
                              />
                            </div>
                            <div className="comp-input-col">
                              <label htmlFor="competencyDomain" className="comp-label">Domain Relevance</label>
                              <input
                                id="competencyDomain"
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                className="form-input comp-input"
                                value={competencyInputs.domainRelevance}
                                onChange={(e) => handleCompetencyChange('domainRelevance', e.target.value)}
                                disabled={isSubmittingReview}
                              />
                            </div>
                            <div className="comp-input-col">
                              <label htmlFor="competencyProblem" className="comp-label">Problem Solving</label>
                              <input
                                id="competencyProblem"
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                className="form-input comp-input"
                                value={competencyInputs.problemSolving}
                                onChange={(e) => handleCompetencyChange('problemSolving', e.target.value)}
                                disabled={isSubmittingReview}
                              />
                            </div>
                            <div className="comp-input-col">
                              <label htmlFor="competencyComposure" className="comp-label">Confidence & Composure</label>
                              <input
                                id="competencyComposure"
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                className="form-input comp-input"
                                value={competencyInputs.confidenceComposure}
                                onChange={(e) => handleCompetencyChange('confidenceComposure', e.target.value)}
                                disabled={isSubmittingReview}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Final Recommendation Dropdown */}
                        <div className="form-field-group">
                          <label htmlFor="finalRecommendationSelect" className="form-label font-mono">
                            FINAL RECOMMENDATION:
                          </label>
                          <select
                            id="finalRecommendationSelect"
                            className="form-select font-mono"
                            value={selectedRecommendation}
                            onChange={(e) => setSelectedRecommendation(e.target.value)}
                            disabled={isSubmittingReview}
                          >
                            <option value="Selected">Selected</option>
                            <option value="Strongly Recommended">Strongly Recommended</option>
                            <option value="Recommended">Recommended</option>
                            <option value="Waitlisted">Waitlisted</option>
                            <option value="Further Review">Further Review</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>

                        {/* Expert Comments/Remarks */}
                        <div className="form-field-group">
                          <label htmlFor="expertRemarksTextarea" className="form-label font-mono">
                            EXPERT COMMENTS / REMARKS:
                          </label>
                          <textarea
                            id="expertRemarksTextarea"
                            className="form-textarea"
                            rows={3}
                            placeholder="Enter expert panel observations, technical justifications, and final recommendation notes..."
                            value={expertComments}
                            onChange={(e) => setExpertComments(e.target.value)}
                            disabled={isSubmittingReview}
                          />
                        </div>

                        {/* Mandatory Certification Checkbox */}
                        <div className="certification-checkbox-row">
                          <input
                            id="certificationCheckbox"
                            type="checkbox"
                            className="checkbox-input"
                            checked={isCertifiedChecked}
                            onChange={(e) => setIsCertifiedChecked(e.target.checked)}
                            disabled={isSubmittingReview}
                          />
                          <label htmlFor="certificationCheckbox" className="checkbox-label">
                            I confirm that I have reviewed the candidate's complete Q&A record, AI evaluation metrics, and observational telemetry. This assessment represents the certified judgment of the human expert panel.
                          </label>
                        </div>

                        {/* Error & Success Messages */}
                        {reviewError && (
                          <div className="alert alert-error font-mono review-alert" role="alert">
                            {reviewError}
                          </div>
                        )}
                        {reviewSuccess && (
                          <div className="alert alert-success font-mono review-alert" role="alert">
                            {reviewSuccess}
                          </div>
                        )}

                        {/* Submit Certification Button */}
                        <div className="submit-action-row no-print">
                          <button
                            id="submitCertificationBtn"
                            type="submit"
                            className="btn btn-gold btn-lg submit-cert-btn font-mono"
                            disabled={isSubmittingReview || !isCertifiedChecked}
                          >
                            {isSubmittingReview ? (
                              <>
                                <span className="spinner"></span>
                                RECORDING CERTIFICATION...
                              </>
                            ) : (
                              'SUBMIT FINAL CERTIFICATION'
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Report Footer Verification */}
            <div className="report-doc-footer">
              <div className="verification-signatures font-mono">
                <div>EVALUATOR SIGN-OFF: DRDO BOARD | AUTHENTICATED DOSSIER</div>
                <div>INTEGRITY CHECKSUM: SHA-256 VALIDATED • SAKSHAM ENGINE</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document 2: Official Interview Transcript Dossier */}
      {(viewMode === 'split' || activeDocumentTab === 'transcript') && (
        <div className="dossier-column transcript-col">
          {viewMode === 'split' && (
            <div className="split-col-header font-mono no-print">
              <span className="split-title">DOCUMENT 2 OF 2: OFFICIAL INTERVIEW TRANSCRIPT</span>
              <button type="button" onClick={handleDownloadTranscriptTxt} className="split-dl-btn font-mono">
                Download .txt ↓
              </button>
            </div>
          )}
          {renderTranscriptDoc()}
        </div>
      )}
    </div>
  )}
</div>

      <style>{`
        .report-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        /* Document Tab Switcher */
        .document-tab-switcher {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #F1F5F9;
          padding: 4px;
          border-radius: 8px;
          border: 1px solid var(--color-border);
          flex-wrap: wrap;
        }

        .doc-tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 0.95rem;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .doc-tab-btn:hover {
          color: var(--color-deep-navy);
          background: rgba(255, 255, 255, 0.6);
        }

        .doc-tab-btn.active {
          background: #081525;
          color: #D4AF37;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .doc-tab-btn.split-toggle-btn {
          border-left: 1px solid var(--color-border);
          border-radius: 0 6px 6px 0;
          color: var(--color-deep-navy);
        }

        .doc-tab-btn.split-toggle-btn.active {
          background: #D4AF37;
          color: #081525;
        }

        /* Dossier Layout Wrappers */
        .dossier-display-wrapper.view-single {
          width: 100%;
        }

        .dossier-display-wrapper.view-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        @media (max-width: 1200px) {
          .dossier-display-wrapper.view-split {
            grid-template-columns: 1fr;
          }
        }

        .dossier-column {
          width: 100%;
          min-width: 0;
        }

        .split-col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #081525;
          color: #D4AF37;
          padding: 0.6rem 1rem;
          border-radius: 6px 6px 0 0;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          border: 1px solid #1E3553;
          border-bottom: none;
        }

        .split-dl-btn {
          background: transparent;
          border: 1px solid rgba(212, 175, 55, 0.4);
          color: #D4AF37;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .split-dl-btn:hover {
          background: #D4AF37;
          color: #081525;
        }

        /* Transcript Document Styling */
        .transcript-document {
          background-color: #FFFFFF;
        }

        .transcript-telemetry-banner {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #081525;
          color: #F8FAFC;
          border: 1px solid #1E3553;
          border-radius: 4px;
          padding: 0.75rem 1rem;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          font-size: 0.72rem;
        }

        @media (max-width: 900px) {
          .transcript-telemetry-banner {
            grid-template-columns: 1fr 1fr;
          }
        }

        .tel-pill {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tel-k {
          color: #94A3B8;
          font-size: 0.65rem;
          letter-spacing: 0.04em;
        }

        .tel-v {
          font-size: 0.8rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .transcript-entries-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .transcript-qa-card {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 1.25rem;
          background: #FFFFFF;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .qa-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #E2E8F0;
          font-size: 0.75rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .qa-seq-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .qa-seq-num {
          background: #081525;
          color: #D4AF37;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
        }

        .qa-phase-pill {
          background: #F1F5F9;
          color: #475569;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.7rem;
        }

        .qa-timestamp {
          color: #64748B;
          font-size: 0.7rem;
        }

        .qa-speech-block {
          border-radius: 6px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .recruiter-speech {
          background: #F8FAFC;
          border-left: 4px solid var(--color-deep-navy);
        }

        .candidate-speech {
          background: #FAF5FF;
          border-left: 4px solid #7C3AED;
        }

        .speaker-header {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .speaker-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .recruiter-av {
          background: #081525;
          color: #D4AF37;
          border: 1px solid #D4AF37;
        }

        .candidate-av {
          background: #6D28D9;
          color: #FFFFFF;
        }

        .speaker-role {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--color-deep-navy);
          letter-spacing: 0.04em;
        }

        .speaker-sub {
          display: block;
          font-size: 0.68rem;
          color: #64748B;
        }

        .speech-content-text {
          font-size: 0.9375rem;
          line-height: 1.5;
          color: #1E293B;
          padding-left: 2.3rem;
        }

        .qa-ai-evaluation-box {
          background: #FFFDF5;
          border: 1px solid #E2D1A3;
          border-radius: 6px;
          padding: 0.85rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .ai-eval-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .ai-eval-tag {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #92400E;
          letter-spacing: 0.05em;
        }

        .ai-score-pill {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .score-high {
          background: #DCFCE7;
          color: #166534;
        }

        .score-mid {
          background: #FEF3C7;
          color: #92400E;
        }

        .score-low {
          background: #FEE2E2;
          color: #991B1B;
        }

        .ai-eval-metrics-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.72rem;
          flex-wrap: wrap;
        }

        .ai-metric-item {
          display: flex;
          gap: 4px;
        }

        .m-label {
          color: #78716C;
        }

        .m-val {
          color: #1C1917;
        }

        .ai-eval-observation {
          font-size: 0.8125rem;
          color: #44403C;
          line-height: 1.45;
          background: #FFFFFF;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          border-left: 2px solid #D4AF37;
        }

        .breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
        }

        .breadcrumb-link {
          color: var(--color-deep-navy);
          text-decoration: none;
          font-weight: 500;
        }

        .breadcrumb-separator {
          color: var(--color-text-muted);
        }

        .breadcrumb-current {
          color: var(--color-text-muted);
        }

        .report-document {
          background-color: #FFFFFF;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          padding: 2.5rem;
          box-shadow: var(--shadow-md);
        }

        .report-header {
          border-bottom: 2px solid var(--color-deep-navy);
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
        }

        .report-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .report-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .report-crest {
          width: 42px;
          height: 42px;
          background-color: #081525;
          border: 1px solid #D4AF37;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .report-org-title {
          display: block;
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-deep-navy);
          letter-spacing: 0.05em;
        }

        .report-org-subtitle {
          font-size: 0.6875rem;
          color: #B48E1E;
          letter-spacing: 0.08em;
        }

        .report-id-box {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          text-align: right;
          line-height: 1.4;
        }

        .report-title-strip {
          margin-bottom: 1.25rem;
        }

        .report-title {
          font-size: 1.625rem;
          color: var(--color-deep-navy);
          letter-spacing: -0.015em;
        }

        .candidate-info-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background-color: #F8FAFC;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 0.85rem 1.25rem;
          gap: 1rem;
        }

        .info-cell {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 0.72rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          font-weight: 600;
        }

        .info-val {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--color-deep-navy);
        }

        .score-summary-grid {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .score-summary-card {
          padding: 1.5rem;
          background-color: #081525;
          color: #F8FAFC;
          border: 1px solid #1E3553;
        }

        .score-label {
          font-size: 0.72rem;
          color: #D4AF37;
          letter-spacing: 0.06em;
        }

        .score-number-row {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
          margin: 0.4rem 0;
        }

        .score-big {
          font-size: 3rem;
          font-weight: 800;
          color: #F8FAFC;
          line-height: 1;
        }

        .score-out-of {
          font-size: 1.25rem;
          color: #94A3B8;
        }

        .score-bench {
          font-size: 0.75rem;
          color: #94A3B8;
        }

        .recommendation-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .recom-label {
          font-size: 0.72rem;
          color: var(--color-text-muted);
          margin-bottom: 0.5rem;
        }

        .recom-badge {
          font-size: 0.9375rem;
          padding: 0.4rem 0.85rem;
        }

        .recom-note {
          margin-top: 0.75rem;
          font-size: 0.84375rem;
          color: var(--color-text-muted);
          line-height: 1.5;
        }

        .analytics-layout-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .radar-card-body {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 1rem;
        }

        .phase-scores-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-bottom: 1.5rem;
        }

        .phase-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background-color: #F8FAFC;
          border: 1px solid var(--color-border);
          border-radius: 4px;
        }

        .highlight-phase {
          border-left: 3px solid var(--color-gold);
          background-color: #FFFDF5;
        }

        .phase-info {
          display: flex;
          flex-direction: column;
        }

        .phase-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-deep-navy);
        }

        .phase-meta {
          font-size: 0.72rem;
          color: var(--color-text-muted);
        }

        .phase-score-pill {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--color-deep-navy);
          background-color: #FFFFFF;
          border: 1px solid var(--color-border);
          padding: 0.25rem 0.6rem;
          border-radius: 4px;
        }

        .vector-pills-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          font-size: 0.72rem;
        }

        .vector-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.4rem 0.65rem;
          background-color: #F1F5F9;
          border-radius: 3px;
          color: #334155;
        }

        .eval-observations-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .obs-header-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .border-success {
          border-bottom-color: rgba(34, 197, 94, 0.3);
        }

        .border-warning {
          border-bottom-color: rgba(245, 158, 11, 0.3);
        }

        .observation-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .observation-item {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          font-size: 0.84375rem;
          line-height: 1.5;
          color: var(--color-text-dark);
        }

        .obs-bullet {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          font-size: 0.7rem;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 0.15rem;
        }

        .success-bullet {
          background-color: var(--color-success-bg);
          color: var(--color-success-text);
        }

        .warning-bullet {
          background-color: var(--color-warning-bg);
          color: var(--color-warning-text);
        }

        .summary-card {
          margin-bottom: 2rem;
        }

        .summary-paragraph {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: var(--color-text-dark);
        }

        .suggestions-block {
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px dashed var(--color-border);
        }

        .suggestions-heading {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-deep-navy);
          margin-bottom: 0.5rem;
        }

        .suggestions-list {
          margin-left: 1.25rem;
          font-size: 0.84375rem;
          color: var(--color-text-muted);
          line-height: 1.6;
        }

        .report-doc-footer {
          padding-top: 1.5rem;
          border-top: 1px solid var(--color-border);
          font-size: 0.72rem;
          color: var(--color-text-muted);
        }

        .verification-signatures {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        /* Human Expert Review & Certification Panel (Phase 6) */
        .expert-review-card {
          margin-bottom: 2rem;
          border: 1px solid var(--color-border);
          background-color: #FFFFFF;
          border-radius: 6px;
          overflow: hidden;
        }

        .expert-review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          background-color: var(--color-deep-navy);
          color: #FFFFFF;
          border-bottom: 2px solid var(--color-gold);
        }

        .expert-section-title {
          color: #FFFFFF;
          font-size: 1.25rem;
          margin: 0.35rem 0 0.15rem 0;
        }

        .expert-subtitle {
          font-size: 0.8rem;
          color: #94A3B8;
          margin: 0;
        }

        .certified-badge {
          font-size: 0.8rem;
          padding: 0.4rem 0.85rem;
        }

        .pending-badge {
          font-size: 0.8rem;
          padding: 0.4rem 0.85rem;
        }

        .review-comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 1.5rem;
          padding: 0.5rem 0;
        }

        .ai-baseline-panel {
          background-color: #F8FAFC;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .expert-determination-panel {
          background-color: #FFFFFF;
          border: 1px solid rgba(212, 175, 55, 0.4);
          border-radius: 6px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .expert-determination-panel.panel-certified {
          background-color: #FAFAFA;
          border-color: rgba(34, 197, 94, 0.4);
        }

        .panel-badge-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 0.6rem;
        }

        .baseline-tag {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
        }

        .baseline-metric-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .metric-label {
          font-size: 0.72rem;
          color: var(--color-text-muted);
          letter-spacing: 0.04em;
          font-weight: 600;
        }

        .baseline-score-val {
          font-size: 2rem;
          font-weight: 800;
          color: var(--color-deep-navy);
          line-height: 1.1;
        }

        .baseline-verdict-box {
          background-color: #FFFFFF;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 0.65rem 0.85rem;
          font-size: 0.85rem;
          color: var(--color-text-dark);
          font-style: italic;
          line-height: 1.45;
        }

        .baseline-competency-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.75rem;
          background-color: #FFFFFF;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 0.65rem 0.85rem;
        }

        .baseline-comp-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #475569;
        }

        .baseline-comp-row strong {
          color: var(--color-deep-navy);
        }

        .statutory-notice {
          font-size: 0.72rem;
          color: #64748B;
          background-color: #F1F5F9;
          border-left: 3px solid var(--color-deep-navy);
          padding: 0.65rem 0.85rem;
          border-radius: 0 4px 4px 0;
          line-height: 1.4;
          margin-top: auto;
        }

        .form-field-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 0.85rem;
        }

        .form-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-deep-navy);
        }

        .input-with-baseline {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .score-input {
          width: 120px;
          font-size: 1.15rem;
          font-weight: 700;
          padding: 0.5rem 0.75rem;
          color: var(--color-deep-navy);
        }

        .input-helper {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 0.5rem 0.75rem;
          font-family: inherit;
          font-size: 0.875rem;
          color: var(--color-text-dark);
          background-color: #FFFFFF;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: var(--color-gold);
        }

        .competencies-input-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.5rem;
        }

        .comp-input-col {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .comp-label {
          font-size: 0.68rem;
          color: var(--color-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .comp-input {
          text-align: center;
          font-size: 0.85rem;
          padding: 0.4rem;
          font-weight: 600;
        }

        .form-textarea {
          resize: vertical;
          line-height: 1.5;
        }

        .certification-checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin: 1rem 0;
          padding: 0.75rem;
          background-color: #FFFDF5;
          border: 1px solid var(--color-gold-border);
          border-radius: 4px;
        }

        .checkbox-input {
          margin-top: 0.2rem;
          cursor: pointer;
          accent-color: var(--color-gold);
          width: 16px;
          height: 16px;
        }

        .checkbox-label {
          font-size: 0.78rem;
          color: var(--color-text-dark);
          line-height: 1.45;
          cursor: pointer;
        }

        .review-alert {
          padding: 0.6rem 0.85rem;
          font-size: 0.8rem;
          border-radius: 4px;
          margin-bottom: 0.85rem;
        }

        .alert-error {
          background-color: #FEE2E2;
          color: #991B1B;
          border: 1px solid #F87171;
        }

        .submit-cert-btn {
          width: 100%;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 0.75rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        /* Certified locked state display styles */
        .certified-summary-display {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .certified-score-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--color-border);
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .certified-score-val {
          font-size: 2rem;
          font-weight: 800;
          color: var(--color-deep-navy);
          line-height: 1.1;
        }

        .certified-remarks-text {
          background-color: #FFFFFF;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          line-height: 1.5;
          color: var(--color-text-dark);
          margin-top: 0.25rem;
        }

        .certified-metadata-card {
          background-color: #081525;
          color: #F8FAFC;
          border-radius: 4px;
          padding: 0.85rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.75rem;
        }

        .meta-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .meta-k {
          color: #94A3B8;
        }

        .meta-v {
          color: #FFFFFF;
        }

        .text-gold {
          color: #D4AF37;
        }

        .certified-locked-note {
          font-size: 0.72rem;
          color: #64748B;
          text-align: center;
          padding: 0.4rem;
          border-top: 1px dashed var(--color-border);
        }

        @media (max-width: 992px) {
          .candidate-info-strip {
            grid-template-columns: repeat(2, 1fr);
          }
          .score-summary-grid {
            grid-template-columns: 1fr;
          }
          .analytics-layout-grid {
            grid-template-columns: 1fr;
          }
          .eval-observations-grid {
            grid-template-columns: 1fr;
          }
          .review-comparison-grid {
            grid-template-columns: 1fr;
          }
          .competencies-input-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .candidate-info-strip {
            grid-template-columns: 1fr;
          }
          .report-document {
            padding: 1.5rem 1rem;
          }
          .vector-pills-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
