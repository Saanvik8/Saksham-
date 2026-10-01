require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const Expert = require('./models/Expert');
const Session = require('./models/Session');
const Report = require('./models/Report');

// Sanitize MongoDB URI
let mongoUri = process.env.MONGODB_URI || '';
const uriMatch = mongoUri.match(/^(mongodb(?:\+srv)?:\/\/[^:]+:)<([^>]+)>(@.+)$/);
if (uriMatch) {
  mongoUri = uriMatch[1] + uriMatch[2] + uriMatch[3];
}

async function seedDatabase() {
  try {
    if (!mongoUri) {
      console.error('[ERROR] MONGODB_URI is not set in .env');
      process.exit(1);
    }

    console.log('[INFO] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[SUCCESS] Connected to MongoDB');

    // Clear existing sample collections
    console.log('[INFO] Clearing previous sample data...');
    await Expert.deleteMany({});
    await Session.deleteMany({});
    await Report.deleteMany({});

    // 1. Create Experts with simulation demo accounts
    console.log('[INFO] Creating RAC panel experts with demo access...');
    const expert1 = await Expert.create({
      name: 'Dr. Rajesh Sharma',
      email: 'expert@rac-portal.demo',
      designation: 'Scientist-G, Board Member',
      domain: 'Radar Systems',
      token: uuidv4()
    });

    const expert2 = await Expert.create({
      name: 'Dr. Priya Verma',
      email: 'interviewer@rac-portal.demo',
      designation: 'Scientist-F, Joint Director',
      domain: 'Missile Systems',
      token: uuidv4()
    });

    console.log(`[SUCCESS] Created 2 RAC panel experts: ${expert1.name} (${expert1.email}), ${expert2.name} (${expert2.email})`);

    // 2. Create Completed Session 1 + Structured Assessment Report
    console.log('[INFO] Creating Session 1 (Completed interview with Structured Report)...');
    const session1 = await Session.create({
      expertId: expert1._id,
      candidateName: 'Vikramaditya Patel',
      interviewCode: 'RAC-2026-01',
      interviewType: 'Technical',
      candidateLevel: 'Senior',
      duration: 45,
      status: 'completed',
      candidateJoined: true,
      candidateJoinedAt: new Date(Date.now() - 3600000 * 24 * 2),
      jobDescription: 'Scientist-C, Radar Signal Processing, DRDO LRDE Bangalore',
      resumeText: 'Vikramaditya Patel. M.Tech Signal Processing, IIT Bombay. 4 years at ISRO Satellite Centre. Skills: Radar Systems, Signal Processing, FPGA, C++, MATLAB, Phased Array.',
      candidateProfile: {
        name: 'Vikramaditya Patel',
        education: 'M.Tech Signal Processing, IIT Bombay',
        experience: '4 years at ISRO Satellite Centre',
        skills: ['Radar Systems', 'Signal Processing', 'FPGA', 'C++', 'MATLAB', 'Phased Array'],
        highlights: [
          'Designed pulse Doppler signal processing pipeline for space radar',
          'Authored 2 IEEE papers on phased array beamforming',
          'Recipient of ISRO Young Scientist Commendation'
        ]
      },
      candidateRoleAlignment: {
        matchedSkills: ['Radar Systems', 'Signal Processing', 'FPGA', 'C++', 'MATLAB'],
        skillsRequiringValidation: ['Phased Array Calibration', 'Digital Beamforming', 'Thermal Drift Handling'],
        roleRelevantQuestionAreas: ['Pulse Compression & Range Resolution', 'Doppler Ambiguity Mitigation', 'Hardware Fault Tolerance'],
        alignmentSummary: 'Candidate has direct hands-on aerospace radar background with strong signal processing fundamentals. Calibration and beamforming depth to be verified.'
      },
      auditTrail: [
        {
          event: 'SESSION_CREATED',
          description: 'Interview session configured and radar question bank generated for Vikramaditya Patel',
          actor: expert1.name,
          timestamp: new Date(Date.now() - 3600000 * 24 * 2 - 300000)
        },
        {
          event: 'CANDIDATE_JOINED',
          description: 'Candidate Vikramaditya Patel joined interview room',
          actor: 'Vikramaditya Patel',
          timestamp: new Date(Date.now() - 3600000 * 24 * 2)
        },
        {
          event: 'ANSWER_EVALUATED',
          description: 'Evaluated answer for "Tell us about your transition from IIT Bombay..." (Score: 8.8/10)',
          actor: 'AI Assessment System',
          timestamp: new Date(Date.now() - 3600000 * 24 * 2 + 120000)
        },
        {
          event: 'ANSWER_EVALUATED',
          description: 'Evaluated answer for "Explain how pulse compression improves range..." (Score: 9.3/10)',
          actor: 'AI Assessment System',
          timestamp: new Date(Date.now() - 3600000 * 24 * 2 + 600000)
        },
        {
          event: 'ANSWER_EVALUATED',
          description: 'Evaluated answer for "How do you mitigate Doppler ambiguities in..." (Score: 8.9/10)',
          actor: 'AI Assessment System',
          timestamp: new Date(Date.now() - 3600000 * 24 * 2 + 1200000)
        },
        {
          event: 'ANSWER_EVALUATED',
          description: 'Evaluated answer for "Describe a situation where hardware failure..." (Score: 8.7/10)',
          actor: 'AI Assessment System',
          timestamp: new Date(Date.now() - 3600000 * 24 * 2 + 1800000)
        },
        {
          event: 'REPORT_GENERATED',
          description: 'Preliminary AI assessment compiled (Score: 88.5/100, Suggested: Meets high technical standard)',
          actor: 'AI Assessment System',
          timestamp: new Date(Date.now() - 3600000 * 24 * 2 + 2700000)
        },
        {
          event: 'EXPERT_REVIEW_SUBMITTED',
          description: 'Expert review submitted: Status=accepted, Decision=Strongly Recommended, Final Score=89',
          actor: expert1.name,
          timestamp: new Date(Date.now() - 3600000 * 24)
        }
      ],
      questionBank: {
        iceBreaking: [
          { id: 'q1', question: 'Tell us about your transition from IIT Bombay to the ISRO radar lab.', category: 'Ice Breaking', difficulty: 'Easy', relevanceScore: 8.5 }
        ],
        technical: [
          { id: 'q2', question: 'Explain how pulse compression improves range resolution in synthetic aperture radar.', category: 'Technical', difficulty: 'Hard', relevanceScore: 9.6 },
          { id: 'q3', question: 'How do you mitigate Doppler ambiguities in medium PRF radar systems?', category: 'Technical', difficulty: 'Hard', relevanceScore: 9.4 }
        ],
        managerial: [
          { id: 'q4', question: 'Describe a situation where hardware failure threatened a project milestone and how you handled it.', category: 'Managerial', difficulty: 'Medium', relevanceScore: 8.7 }
        ]
      },
      qnaHistory: [
        {
          questionId: 'q1',
          question: 'Tell us about your transition from IIT Bombay to the ISRO radar lab.',
          phase: 'Ice Breaking',
          answer: 'At IIT Bombay my thesis focused on synthetic aperture radar simulation, which smoothly translated into hardware implementation when I joined the sensor development division at ISRO.',
          answerScore: 8.8,
          relevancePct: 94,
          accuracyPct: 90,
          completenessPct: 88,
          feedback: 'Confident and clear overview of academic transition into defence/space hardware.',
          askedAt: new Date(Date.now() - 3600000 * 24 * 2 + 120000)
        },
        {
          questionId: 'q2',
          question: 'Explain how pulse compression improves range resolution in synthetic aperture radar.',
          phase: 'Technical',
          answer: 'Pulse compression transmits a chirped wideband pulse with high energy while maintaining the range resolution of a short pulse through matched filtering at receiver baseband.',
          answerScore: 9.3,
          relevancePct: 96,
          accuracyPct: 94,
          completenessPct: 90,
          feedback: 'Excellent explanation of matched filtering trade-offs and energy preservation.',
          askedAt: new Date(Date.now() - 3600000 * 24 * 2 + 600000)
        },
        {
          questionId: 'q3',
          question: 'How do you mitigate Doppler ambiguities in medium PRF radar systems?',
          phase: 'Technical',
          answer: 'We use multiple PRF switching and Chinese Remainder Theorem based unravelling to decouple velocity and range blind zones.',
          answerScore: 8.9,
          relevancePct: 92,
          accuracyPct: 89,
          completenessPct: 86,
          feedback: 'Solid mathematical understanding of PRF staggering.',
          askedAt: new Date(Date.now() - 3600000 * 24 * 2 + 1200000)
        },
        {
          questionId: 'q4',
          question: 'Describe a situation where hardware failure threatened a project milestone and how you handled it.',
          phase: 'Managerial',
          answer: 'During payload qualification, an ADC interface showed clock jitter under thermal stress. I led a 3-engineer swat team to route an alternate differential clock, recovering the testing window within 48 hours.',
          answerScore: 8.7,
          relevancePct: 90,
          accuracyPct: 88,
          completenessPct: 84,
          feedback: 'Decisive leadership and problem mitigation during thermal vacuum testing.',
          askedAt: new Date(Date.now() - 3600000 * 24 * 2 + 1800000)
        }
      ],
      expressionHistory: [
        { confidence: 88, engagement: 92, eyeContact: 85, nervousness: 12, timestamp: new Date() }
      ]
    });

    const report1 = await Report.create({
      sessionId: session1._id,
      candidateName: session1.candidateName,

      // 1. Candidate Information
      candidateInfo: {
        name: 'Vikramaditya Patel',
        post: 'Scientist-C (Radar Signal Processing)',
        experience: '4 years (ISRO Satellite Centre)',
        expertise: ['Radar Systems', 'Signal Processing', 'FPGA', 'Phased Array', 'C++']
      },

      // Candidate-Role Alignment
      candidateRoleAlignment: {
        matchedSkills: ['Radar Systems', 'Signal Processing', 'FPGA', 'C++', 'MATLAB'],
        skillsRequiringValidation: ['Phased Array Calibration', 'Digital Beamforming', 'Thermal Drift Handling'],
        roleRelevantQuestionAreas: ['Pulse Compression & Range Resolution', 'Doppler Ambiguity Mitigation', 'Hardware Fault Tolerance'],
        alignmentSummary: 'Candidate has direct hands-on aerospace radar background with strong signal processing fundamentals. Calibration and beamforming depth to be verified.'
      },

      // 2. Interview Summary
      interviewSummary: {
        questionsAsked: 4,
        technicalCount: 2,
        situationalCount: 1,
        managerialCount: 1,
        duration: 45,
        followUpsCount: 1,
        phasesCovered: ['Ice Breaking', 'Technical', 'Managerial']
      },

      // 3. Technical Assessment
      technicalAssessment: {
        relevancePct: 94,
        accuracyPct: 91,
        completenessPct: 88,
        missingConcepts: [
          'Digital beamforming',
          'Blind speed calculation'
        ],
        knowledgeGaps: [
          'Needs more detailed understanding of digital beamforming algorithms',
          'Could explain automated target classification in greater detail'
        ],
        summary: 'The candidate knows radar fundamentals very well and has practical hands-on experience, but needs more study in newer digital beamforming methods.'
      },

      // 4. Communication Analysis / Delivery Indicators
      communicationIndicators: {
        deliveryScore: 8.8,
        cameraEngagement: 92,
        eyeContact: 85,
        speakingPace: 'Moderate',
        fillerWords: 'Low',
        pauses: 'Moderate'
      },

      // 5. Strengths
      strengths: [
        'Explains radar concepts like pulse compression clearly and accurately',
        'Has direct experience testing and building real space hardware',
        'Communicates in a calm, structured, and easy-to-follow manner'
      ],

      // 6. Areas for Improvement
      weaknesses: [
        'Study digital beamforming methods in greater depth',
        'Explain practical calculations rather than only high-level concepts',
        'Learn more about standard defence testing rules and lab procedures'
      ],

      // 7. Question-wise Breakdown Table
      questionWiseBreakdown: [
        {
          question: 'Tell us about your transition from IIT Bombay to the ISRO radar lab.',
          phase: 'Ice Breaking',
          relevancePct: 94,
          accuracyPct: 90,
          completenessPct: 88,
          observation: 'The candidate gave a clear, relevant background of their work at IIT Bombay and ISRO.',
          evidence: 'Explained their master project and how it directly prepared them for ISRO sensor work.',
          missingConcepts: [],
          feedback: 'Clear and confident introduction.'
        },
        {
          question: 'Explain how pulse compression improves range resolution in synthetic aperture radar.',
          phase: 'Technical',
          relevancePct: 96,
          accuracyPct: 94,
          completenessPct: 90,
          observation: 'The candidate correctly explained how pulse compression gives both high power and sharp range detail.',
          evidence: 'Walked through chirp signals and matched filters accurately.',
          missingConcepts: [],
          feedback: 'Very good explanation with accurate technical terms.'
        },
        {
          question: 'How do you mitigate Doppler ambiguities in medium PRF radar systems?',
          phase: 'Technical',
          relevancePct: 92,
          accuracyPct: 89,
          completenessPct: 86,
          observation: 'The candidate answered how to solve speed ambiguities correctly, but skipped details on blind speed calculation.',
          evidence: 'Mentioned multiple pulse frequencies correctly, but did not show the formula for blind speeds.',
          missingConcepts: ['Blind speed calculation'],
          feedback: 'Good answer. Remember to show the exact calculations when discussing pulse switching.'
        },
        {
          question: 'Describe a situation where hardware failure threatened a project milestone and how you handled it.',
          phase: 'Managerial',
          relevancePct: 90,
          accuracyPct: 88,
          completenessPct: 84,
          observation: 'The candidate gave a genuine example of solving a hardware crisis under tight deadlines.',
          evidence: 'Described leading a 3-engineer team to fix a clock jitter issue in 48 hours.',
          missingConcepts: [],
          feedback: 'Strong example of calm leadership during a hardware crisis.'
        }
      ],

      // 8. Expert Review (Human-in-the-Loop Final Decision)
      // Panel expert reviewed the AI report and confirmed the decision
      aiSuggestedVerdict: 'Meets high technical standard; recommended for appointment',
      finalRecommendation: 'Strongly Recommended',
      recommendation: 'Strongly Recommended',
      preliminaryScore: 88.5,
      overallScore: 89.0,
      maxScore: 100,

      expertReview: {
        reviewedBy: expert1._id,
        reviewerName: expert1.name,
        status: 'accepted',
        finalScore: 89.0,
        finalRecommendation: 'Strongly Recommended',
        expertComments: 'The panel agrees with the AI assessment. Candidate has solid hands-on experience and will be a valuable addition to the radar team.',
        reviewedAt: new Date(Date.now() - 3600000 * 24)
      },

      // 5-Axis Competency Radar Scores
      competencyScores: {
        communication: 8.8,
        technicalDepth: 9.4,
        domainRelevance: 9.2,
        problemSolving: 8.8,
        confidenceComposure: 8.5
      },
      phaseWiseScores: {
        iceBreaking: { score: 8.8, maxScore: 10, questionsAsked: 1 },
        technical: { score: 9.1, maxScore: 10, questionsAsked: 2 },
        managerial: { score: 8.7, maxScore: 10, questionsAsked: 1 }
      },
      summary: 'Candidate exhibits top-tier domain expertise in phased array radar systems. Demonstrated outstanding technical clarity and composure. Highly recommended for Scientist-C appointment at LRDE.',
      candidateImprovementSuggestions: [
        'Explore hybrid deep-learning beamforming architectures',
        'Review standard defence test protocols (MIL-STD-810)'
      ],
      allQnA: session1.qnaHistory,
      expressionSummary: {
        averageConfidence: 88,
        averageEngagement: 92,
        averageEyeContact: 85,
        averageNervousness: 12
      },
      interviewDuration: 45,
      totalQuestions: 4
    });

    console.log(`[SUCCESS] Created Session 1 (${session1.interviewCode}) + Assessment Report (${report1.overallScore}/100)`);

    // 3. Create Completed Session 2 + Structured Report (Pending Expert Review)
    console.log('[INFO] Creating Session 2 (Completed interview with Report - Pending Review)...');
    const session2 = await Session.create({
      expertId: expert1._id,
      candidateName: 'Ananya Sen',
      interviewCode: 'RAC-2026-02',
      interviewType: 'Technical',
      candidateLevel: 'Mid',
      duration: 45,
      status: 'completed',
      candidateJoined: true,
      candidateJoinedAt: new Date(Date.now() - 3600000 * 18),
      jobDescription: 'Scientist-B, Autonomous Vision Systems, DRDO CAIR Bangalore',
      resumeText: 'Ananya Sen. B.Tech Computer Science, IIT Madras. 3 years AI/ML Engineer at Bharat Electronics Limited (BEL). Skills: Computer Vision, PyTorch, C++, TensorRT, Drone Autonomy.',
      candidateProfile: {
        name: 'Ananya Sen',
        education: 'B.Tech Computer Science, IIT Madras',
        experience: '3 years AI/ML Engineer at BEL',
        skills: ['Computer Vision', 'PyTorch', 'C++', 'TensorRT', 'Drone Autonomy'],
        highlights: [
          'Deployed edge object detection on NVIDIA Jetson for surveillance UAVs',
          'Optimized real-time tracking latency from 45ms to 18ms using TensorRT FP16 quantization'
        ]
      },
      candidateRoleAlignment: {
        matchedSkills: ['Computer Vision', 'PyTorch', 'TensorRT', 'Drone Autonomy', 'C++'],
        skillsRequiringValidation: ['Thermal Drift Calibration', 'Multi-Sensor Fusion Failure Recovery'],
        roleRelevantQuestionAreas: ['Embedded GPU Optimization', 'Dual-Stream Thermal IR Fusion', 'Real-Time Edge Inference'],
        alignmentSummary: 'Candidate exhibits strong edge AI and drone perception skills. Sensor calibration under changing weather conditions requires probing.'
      },
      auditTrail: [
        {
          event: 'SESSION_CREATED',
          description: 'Interview session configured and autonomous vision question bank generated for Ananya Sen',
          actor: expert1.name,
          timestamp: new Date(Date.now() - 3600000 * 18 - 300000)
        },
        {
          event: 'CANDIDATE_JOINED',
          description: 'Candidate Ananya Sen joined interview room',
          actor: 'Ananya Sen',
          timestamp: new Date(Date.now() - 3600000 * 18)
        },
        {
          event: 'ANSWER_EVALUATED',
          description: 'Evaluated answer for "What drew your interest towards defence..." (Score: 8.2/10)',
          actor: 'AI Assessment System',
          timestamp: new Date(Date.now() - 3600000 * 18 + 100000)
        },
        {
          event: 'ANSWER_EVALUATED',
          description: 'Evaluated answer for "How do you handle severe lighting variance..." (Score: 8.5/10)',
          actor: 'AI Assessment System',
          timestamp: new Date(Date.now() - 3600000 * 18 + 700000)
        },
        {
          event: 'REPORT_GENERATED',
          description: 'Preliminary AI assessment compiled (Score: 82.0/100, Suggested: Meets core technical requirements)',
          actor: 'AI Assessment System',
          timestamp: new Date(Date.now() - 3600000 * 18 + 2700000)
        }
      ],
      questionBank: {
        iceBreaking: [
          { id: 'q1', question: 'What drew your interest towards defence autonomous vision systems?', category: 'Ice Breaking', difficulty: 'Easy', relevanceScore: 8.0 }
        ],
        technical: [
          { id: 'q2', question: 'How do you handle severe lighting variance and thermal IR fusion in drone vision?', category: 'Technical', difficulty: 'Hard', relevanceScore: 9.3 }
        ],
        managerial: [
          { id: 'q3', question: 'How do you balance strict security compliance with modern open-source AI tooling?', category: 'Managerial', difficulty: 'Medium', relevanceScore: 8.2 }
        ]
      },
      qnaHistory: [
        {
          questionId: 'q1',
          question: 'What drew your interest towards defence autonomous vision systems?',
          phase: 'Ice Breaking',
          answer: 'Working on edge vision for drones showed me how critical perception is in contested airspace. I wanted to apply my skills directly to national security challenges.',
          answerScore: 8.2,
          relevancePct: 91,
          accuracyPct: 88,
          completenessPct: 82,
          feedback: 'Genuine motivation and clear alignment with defence applications.',
          askedAt: new Date(Date.now() - 3600000 * 18 + 100000)
        },
        {
          questionId: 'q2',
          question: 'How do you handle severe lighting variance and thermal IR fusion in drone vision?',
          phase: 'Technical',
          answer: 'We utilize dual-stream convolutional backbones with spatial attention feature fusion before the detection neck, alongside contrastive normalization for thermal drift.',
          answerScore: 8.5,
          relevancePct: 93,
          accuracyPct: 87,
          completenessPct: 84,
          feedback: 'Strong understanding of multi-modal feature fusion on embedded GPUs.',
          askedAt: new Date(Date.now() - 3600000 * 18 + 700000)
        }
      ],
      expressionHistory: [
        { confidence: 76, engagement: 82, eyeContact: 78, nervousness: 22, timestamp: new Date() }
      ]
    });

    const report2 = await Report.create({
      sessionId: session2._id,
      candidateName: session2.candidateName,

      candidateInfo: {
        name: 'Ananya Sen',
        post: 'Scientist-B (Autonomous Vision Systems)',
        experience: '3 years (BEL)',
        expertise: ['Computer Vision', 'PyTorch', 'TensorRT', 'Drone Autonomy', 'C++']
      },

      // Candidate-Role Alignment
      candidateRoleAlignment: {
        matchedSkills: ['Computer Vision', 'PyTorch', 'TensorRT', 'Drone Autonomy', 'C++'],
        skillsRequiringValidation: ['Thermal Drift Calibration', 'Multi-Sensor Fusion Failure Recovery'],
        roleRelevantQuestionAreas: ['Embedded GPU Optimization', 'Dual-Stream Thermal IR Fusion', 'Real-Time Edge Inference'],
        alignmentSummary: 'Candidate exhibits strong edge AI and drone perception skills. Sensor calibration under changing weather conditions requires probing.'
      },

      interviewSummary: {
        questionsAsked: 2,
        technicalCount: 1,
        situationalCount: 0,
        managerialCount: 1,
        duration: 45,
        followUpsCount: 0,
        phasesCovered: ['Ice Breaking', 'Technical']
      },

      technicalAssessment: {
        relevancePct: 92,
        accuracyPct: 88,
        completenessPct: 83,
        missingConcepts: [
          'Thermal drift calibration',
          'Error handling'
        ],
        knowledgeGaps: [
          'Needs more detailed understanding of sensor calibration under weather changes',
          'Could explain error recovery when a camera feed fails'
        ],
        summary: 'The candidate has a solid understanding of drone vision and model speed-up, but needs more practice explaining multi-sensor integration and hardware error handling.'
      },

      communicationIndicators: {
        deliveryScore: 8.0,
        cameraEngagement: 82,
        eyeContact: 78,
        speakingPace: 'Moderate',
        fillerWords: 'Low',
        pauses: 'Moderate'
      },

      strengths: [
        'Hands-on experience running AI models on small drone computers',
        'Answers were directly related to the questions with clear explanations',
        'Strong interest and dedication to indigenous defence technology'
      ],

      weaknesses: [
        'Explain practical recovery steps when camera sensors fail',
        'Learn more about multi-sensor calibration methods',
        'Reduce pauses when discussing complex design choices'
      ],

      questionWiseBreakdown: [
        {
          question: 'What drew your interest towards defence autonomous vision systems?',
          phase: 'Ice Breaking',
          relevancePct: 91,
          accuracyPct: 88,
          completenessPct: 82,
          observation: 'The candidate clearly explained why they want to work on defence drones.',
          evidence: 'Mentioned hands-on work with camera sensors and national security interest.',
          missingConcepts: [],
          feedback: 'Good motivation and clear personal interest.'
        },
        {
          question: 'How do you handle severe lighting variance and thermal IR fusion in drone vision?',
          phase: 'Technical',
          relevancePct: 93,
          accuracyPct: 87,
          completenessPct: 84,
          observation: 'The candidate explained thermal and visible camera combination well, but did not explain calibration drift.',
          evidence: 'Described spatial attention layers correctly, but did not mention how to recalibrate when temperatures change.',
          missingConcepts: ['Thermal drift calibration', 'Error handling'],
          feedback: 'Good answer on neural networks. Remember to mention sensor recalibration under changing weather.'
        }
      ],

      // Human-in-the-loop: Still pending expert review
      aiSuggestedVerdict: 'Meets core technical requirements; recommended for expert panel review',
      finalRecommendation: 'Pending Expert Review',
      recommendation: 'Pending Expert Review',
      preliminaryScore: 82.0,
      overallScore: 82.0,
      maxScore: 100,

      expertReview: {
        reviewedBy: expert1._id,
        reviewerName: 'Pending Panel Review',
        status: 'pending_review',
        finalScore: null,
        finalRecommendation: 'Pending Expert Review',
        expertComments: ''
      },

      competencyScores: {
        communication: 7.8,
        technicalDepth: 8.4,
        domainRelevance: 8.6,
        problemSolving: 7.8,
        confidenceComposure: 7.6
      },
      phaseWiseScores: {
        iceBreaking: { score: 8.2, maxScore: 10, questionsAsked: 1 },
        technical: { score: 8.5, maxScore: 10, questionsAsked: 1 },
        managerial: { score: 7.8, maxScore: 10, questionsAsked: 0 }
      },
      summary: 'The candidate demonstrated good knowledge of computer vision for drones with clear communication. Ready for review by the expert panel.',
      candidateImprovementSuggestions: [
        'Study Kalman-filter based multi-sensor tracking',
        'Practice structured leadership responses for project management'
      ],
      allQnA: session2.qnaHistory,
      expressionSummary: {
        averageConfidence: 76,
        averageEngagement: 82,
        averageEyeContact: 78,
        averageNervousness: 22
      },
      interviewDuration: 45,
      totalQuestions: 2
    });

    console.log(`[SUCCESS] Created Session 2 (${session2.interviewCode}) + Report (${report2.overallScore}/100)`);

    // 4. Create Active Session 3 (Ready for Live Candidate Demo)
    console.log('[INFO] Creating Session 3 (Active session ready for demo)...');
    const session3 = await Session.create({
      expertId: expert1._id,
      candidateName: 'Rohan Mehra',
      interviewCode: 'RAC-2026-03',
      interviewType: 'Technical',
      candidateLevel: 'Mid',
      duration: 45,
      status: 'created',
      candidateJoined: false,
      jobDescription: 'Scientist-B, Cyber Security & Cryptography, SAG Delhi',
      resumeText: 'Rohan Mehra. B.Tech CSE, IIT Roorkee. 2 years at CERT-In. Skills: Cryptography, Network Security, Rust, Reverse Engineering, Post-Quantum Cryptography.',
      candidateProfile: {
        name: 'Rohan Mehra',
        education: 'B.Tech CSE, IIT Roorkee',
        experience: '2 years at CERT-In',
        skills: ['Cryptography', 'Network Security', 'Rust', 'Reverse Engineering', 'Post-Quantum Cryptography'],
        highlights: [
          'Analyzed state-sponsored malware families and published advisories',
          'Implemented lattice-based post-quantum signature verification in Rust'
        ]
      },
      candidateRoleAlignment: {
        matchedSkills: ['Cryptography', 'Network Security', 'Rust', 'Reverse Engineering'],
        skillsRequiringValidation: ['Lattice-Based Post-Quantum Schemes', 'Kernel-Level Memory Forensics'],
        roleRelevantQuestionAreas: ['Kyber & Dilithium Key Exchange', 'Memory Forensics on Compromised Kernel Modules', 'Memory Safety in Cryptographic Protocols'],
        alignmentSummary: 'Candidate matches national cybersecurity focus areas with rare post-quantum cryptography expertise. Practical incident triage to be tested.'
      },
      auditTrail: [
        {
          event: 'SESSION_CREATED',
          description: 'Interview session configured and cryptography question bank generated for Rohan Mehra',
          actor: expert1.name,
          timestamp: new Date()
        }
      ],
      questionBank: {
        iceBreaking: [
          { id: 'q1', question: 'What inspired your focus on post-quantum cryptography?', category: 'Ice Breaking', difficulty: 'Easy', relevanceScore: 8.5 },
          { id: 'q2', question: 'How was your experience working with incident response teams at CERT-In?', category: 'Ice Breaking', difficulty: 'Easy', relevanceScore: 8.2 }
        ],
        technical: [
          { id: 'q3', question: 'Explain how Kyber and Dilithium algorithms achieve quantum resistance.', category: 'Technical', difficulty: 'Hard', relevanceScore: 9.7 },
          { id: 'q4', question: 'Walk us through how you would conduct memory forensics on a compromised Linux kernel module.', category: 'Technical', difficulty: 'Hard', relevanceScore: 9.3 },
          { id: 'q5', question: 'Why is Rust gaining adoption for writing security-critical defence protocols over C/C++?', category: 'Technical', difficulty: 'Medium', relevanceScore: 8.9 }
        ],
        managerial: [
          { id: 'q6', question: 'How do you handle a suspected security breach when stakeholders resist taking systems offline?', category: 'Managerial', difficulty: 'Hard', relevanceScore: 9.0 }
        ]
      },
      qnaHistory: [],
      expressionHistory: []
    });

    console.log(`[SUCCESS] Created Session 3 (${session3.interviewCode}) - Ready for live candidate join`);

    console.log('\n======================================================');
    console.log('[SUCCESS] Database seeding completed successfully!');
    console.log('Portal: Recruitment & Assessment Centre (RAC) Simulation');
    console.log('Demo Credentials:');
    console.log('- Expert: expert@rac-portal.demo');
    console.log('- Interviewer: interviewer@rac-portal.demo');
    console.log('Sample Sessions:');
    console.log('- RAC-2026-01: Completed + Certified Report (Vikramaditya Patel)');
    console.log('- RAC-2026-02: Completed + Pending Expert Review (Ananya Sen)');
    console.log('- RAC-2026-03: Ready for live candidate join (Rohan Mehra)');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[ERROR] Database seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
