const Groq = require('groq-sdk');

let groq = null;

if (process.env.GROQ_API_KEY) {
  try {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  } catch (err) {
    console.warn('[WARN] Failed to initialize Groq:', err.message);
  }
}

const MODEL = 'openai/gpt-oss-20b';

async function callGroq(prompt) {
  if (!groq || !process.env.GROQ_API_KEY) {
    return null;
  }

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2
    });

    const text = completion.choices?.[0]?.message?.content || '';

    if (!text) {
      return null;
    }

    let cleanText = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const jsonMatch = cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return JSON.parse(cleanText);

  } catch (error) {
    console.warn(
      `[WARN] Groq AI failed: ${error.message?.slice(0, 150)}`
    );

    return null;
  }
}


// ============================================================
// HEURISTIC INTELLIGENCE ENGINE
// ============================================================

function heuristicExtractSkills(text = '') {
  const commonTech = [
    'Radar Systems',
    'Signal Processing',
    'Phased Arrays',
    'CFAR Detection',
    'Doppler Processing',
    'Embedded C',
    'MATLAB',
    'Python',
    'C++',
    'FPGA',
    'DSP',
    'RF Systems',
    'Telecommunications',
    'Machine Learning',
    'Computer Vision',
    'Deep Learning',
    'PyTorch',
    'TensorFlow',
    'Linux',
    'Microservices',
    'Distributed Systems',
    'Kafka',
    'Docker',
    'Kubernetes',
    'Cybersecurity'
  ];

  const lower = text.toLowerCase();

  const found = commonTech.filter(skill =>
    lower.includes(skill.toLowerCase())
  );

  if (found.length === 0) {
    return [
      'Signal Processing',
      'Systems Engineering',
      'Applied Mathematics',
      'Algorithm Design'
    ];
  }

  return found;
}


function heuristicParseResume(resumeText = '') {
  const clean = (resumeText || '')
    .replace(/---\s*\*Page\s*\*\d+\s*\*---/gi, '')
    .trim();

  const lines = clean
    .split('\n')
    .map(l => l.trim())
    .filter(
      l =>
        l &&
        !l.toLowerCase().startsWith('page ')
    );

  const candidateNameMatch = lines.find(
    l =>
      l.length > 2 &&
      l.length < 40 &&
      !/^(resume|curriculum|cv|biodata|personal)/i.test(l)
  );

  const name = candidateNameMatch || 'Candidate';

  let education = 'B.Tech in Electronics & Communication';
  let experience =
    '3-5 years engineering experience in specialized systems';

  const eduMatch = resumeText.match(
    /(B\.Tech|M\.Tech|B\.E\.|Ph\.D|Bachelor|Master)[^\n,.]+/i
  );

  if (eduMatch) {
    education = eduMatch[0].trim();
  }

  const expMatch = resumeText.match(
    /(\d+\+?\s+years?(?:\s+of)?\s+experience[^\n,.]*)/i
  );

  if (expMatch) {
    experience = expMatch[0].trim();
  }

  const skills = heuristicExtractSkills(resumeText);

  return {
    name,
    education,
    experience,
    skills,
    highlights: [
      `Demonstrated proficiency in ${skills.slice(0, 2).join(' and ')}`,
      'Proven track record in high-reliability system engineering',
      'Solid foundations in system modeling and hardware-software integration'
    ]
  };
}


function heuristicAnalyzeAlignment(candidateProfile, jobDescription) {
  const skills =
    candidateProfile?.skills || [
      'Engineering',
      'Signal Processing'
    ];

  return {
    matchedSkills: skills.slice(
      0,
      Math.min(4, skills.length)
    ),

    skillsRequiringValidation: skills.slice(
      Math.min(4, skills.length),
      6
    ),

    roleRelevantQuestionAreas: [
      'System Architecture & Signal Chain',
      'Algorithm Trade-offs',
      'Operational Reliability'
    ],

    alignmentSummary: `${candidateProfile.name || 'Candidate'
      } exhibits high alignment with core technical requisites, with domain depth to be validated in board evaluation.`
  };
}


function heuristicGenerateQuestionBank(
  candidateProfile,
  jobDescription,
  interviewType,
  candidateLevel
) {
  const skills =
    candidateProfile?.skills || [
      'Engineering',
      'Signal Processing'
    ];

  const topSkill = skills[0] || 'Signal Processing';
  const secondSkill = skills[1] || 'Radar Systems';

  return {
    iceBreaking: [
      {
        id: 'q_ice_1',
        question: `Welcome, ${candidateProfile.name || 'candidate'
          }. Could you summarize your background and what motivated you to specialize in ${topSkill}?`,
        relevanceScore: 9.1,
        category: 'Ice Breaking',
        difficulty: 'Easy'
      },
      {
        id: 'q_ice_2',
        question:
          'In your recent projects, what was the most demanding technical hurdle you faced and how did you overcome it?',
        relevanceScore: 8.8,
        category: 'Ice Breaking',
        difficulty: 'Easy'
      },
      {
        id: 'q_ice_3',
        question:
          'How do you stay up-to-date with emerging defence technologies and international research papers?',
        relevanceScore: 8.5,
        category: 'Ice Breaking',
        difficulty: 'Easy'
      }
    ],

    technical: [
      {
        id: 'q_tech_1',
        question: `Can you walk us through the architectural pipeline for ${topSkill} and explain how you optimize for signal-to-noise ratio and latency?`,
        relevanceScore: 9.7,
        category: 'Technical',
        difficulty: 'Hard'
      },
      {
        id: 'q_tech_2',
        question: `When deploying ${secondSkill} under dynamic operational interference or jamming, what algorithmic mitigations do you recommend?`,
        relevanceScore: 9.5,
        category: 'Technical',
        difficulty: 'Hard'
      },
      {
        id: 'q_tech_3',
        question:
          'Explain the practical trade-offs between computational complexity and detection probability in CFAR/matched-filter algorithms.',
        relevanceScore: 9.2,
        category: 'Technical',
        difficulty: 'Medium'
      },
      {
        id: 'q_tech_4',
        question:
          'How do you design beamforming or array processing algorithms when channel characteristics vary dynamically in real-time?',
        relevanceScore: 9.3,
        category: 'Technical',
        difficulty: 'Hard'
      },
      {
        id: 'q_tech_5',
        question:
          'In embedded hardware implementations (FPGA / DSP), how do you resolve memory bandwidth bottlenecks during real-time data streaming?',
        relevanceScore: 9.0,
        category: 'Technical',
        difficulty: 'Medium'
      }
    ],

    managerial: [
      {
        id: 'q_mgr_1',
        question:
          'Describe a situation where unexpected hardware delays threatened a delivery schedule. How did you realign verification milestones?',
        relevanceScore: 8.6,
        category: 'Managerial',
        difficulty: 'Medium'
      },
      {
        id: 'q_mgr_2',
        question:
          'In defence R&D, peer scientists may have conflicting technical philosophies on architecture. How do you reach consensus under strict deadlines?',
        relevanceScore: 8.8,
        category: 'Managerial',
        difficulty: 'Medium'
      },
      {
        id: 'q_mgr_3',
        question:
          'How do you ensure strict compliance with quality assurance and security protocols without compromising R&D innovation speed?',
        relevanceScore: 8.4,
        category: 'Managerial',
        difficulty: 'Medium'
      }
    ]
  };
}


function heuristicGradeAnswer(
  questionText = '',
  answerText = '',
  currentPhase = 'Technical'
) {
  const cleanAns = (answerText || '').trim();
  const aLower = cleanAns.toLowerCase();

  const ansWords = cleanAns
    .split(/\s+/)
    .filter(Boolean);

  const ansLen = ansWords.length;

  // Case 1: Empty or negligible answer (< 3 words)

  if (!cleanAns || ansLen < 3) {
    return {
      answerScore: 0.0,
      score: 0.0,
      relevancePct: 0,
      accuracyPct: 0,
      completenessPct: 0,

      observation:
        'No response or negligible answer received from candidate.',

      evidence:
        cleanAns || '(No response recorded)',

      missingConcepts: [
        'No substantive answer provided',
        'Candidate remained silent or skipped'
      ],

      feedback:
        'Candidate did not attempt to answer the question.',

      suggestedFollowUps: [
        'Would you like to pass or attempt an alternative question on this topic?',
        'Could you explain the high-level concept in simple terms?'
      ],

      followUpQuestions: [
        'Would you like to pass or attempt an alternative question on this topic?',
        'Could you explain the high-level concept in simple terms?'
      ]
    };
  }

  // Case 2: Conversational filler, audio remarks,
  // requests to repeat, or admissions of uncertainty

  const fillerPhrases = [
    'cannot see',
    'can hear you',
    'cannot hear',
    'not visible',
    'audible',
    'mike testing',
    'mic testing',
    'hello hello',
    'repeat the question',
    'pardon',
    'could you repeat',
    'please repeat',
    'not sure',
    'not really sure',
    'do not know',
    "don't know",
    'will do my research',
    'alternative question',
    'thank you sir',
    'am i audible',
    'can you hear me'
  ];

  const hasFiller = fillerPhrases.some(
    phrase => aLower.includes(phrase)
  );

  const techKeywords = [
    'matched filter',
    'snr',
    'compression',
    'chirp',
    'radar',
    'cfar',
    'doppler',
    'pulse',
    'frequency',
    'latency',
    'kafka',
    'dsp',
    'fpga',
    'beamforming',
    'clutter',
    'bandwidth',
    'sampling',
    'fft',
    'algorithm',
    'architecture',
    'pipeline',
    'throughput',
    'buffer',
    'event-driven',
    'microservices',
    'c++',
    'matlab',
    'signal processing',
    'antenna',
    'receiver',
    'transmitter',
    'modulation',
    'filter',
    'attenuation',
    'phase',
    'noise'
  ];

  const matchedTech = techKeywords.filter(
    k => aLower.includes(k)
  );

  if (hasFiller && matchedTech.length === 0) {
    return {
      answerScore: 0.0,
      score: 0.0,
      relevancePct: 0,
      accuracyPct: 0,
      completenessPct: 0,

      observation:
        'Candidate made conversational remarks or stated uncertainty; did not provide a substantive technical answer.',

      evidence: cleanAns,

      missingConcepts: [
        'Technical explanation',
        'Domain methodology',
        'Engineering principles'
      ],

      feedback:
        'Candidate did not address the technical subject matter of the question.',

      suggestedFollowUps: [
        'Could you address the specific technical methodology asked in the question?',
        'Let us move to another topic: can you describe your experience with digital signal processing?'
      ],

      followUpQuestions: [
        'Could you address the specific technical methodology asked in the question?',
        'Let us move to another topic: can you describe your experience with digital signal processing?'
      ]
    };
  }

  // Case 3: Brief answer without technical domain concepts
  // (< 14 words & 0 technical terms)

  if (ansLen < 14 && matchedTech.length === 0) {
    return {
      answerScore: 1.5,
      score: 1.5,
      relevancePct: 15,
      accuracyPct: 15,
      completenessPct: 15,

      observation:
        'Candidate provided a vague non-technical statement lacking scientific depth.',

      evidence: cleanAns,

      missingConcepts: [
        'Engineering formulation',
        'Mathematical parameters',
        'Operational trade-offs'
      ],

      feedback:
        'Answer lacks technical substance. Inquire on concrete engineering implementation.',

      suggestedFollowUps: [
        'Can you elaborate on the specific technical details and formulas involved?',
        'What specific algorithms or components did you implement?'
      ],

      followUpQuestions: [
        'Can you elaborate on the specific technical details and formulas involved?',
        'What specific algorithms or components did you implement?'
      ]
    };
  }

  // Case 4: Technical evaluation with strict domain relevance & accuracy

  const qWords = questionText
    .toLowerCase()
    .split(/\s+/)
    .filter(
      w =>
        w.length > 3 &&
        ![
          'what',
          'when',
          'which',
          'could',
          'describe',
          'explain'
        ].includes(w)
    );

  const matchedQWords = qWords.filter(
    w => aLower.includes(w)
  );

  const relevanceRatio =
    qWords.length > 0
      ? matchedQWords.length /
      Math.max(1, qWords.length * 0.4)
      : 0.5;

  const technicalDensity = matchedTech.length;

  let relevancePct = 0;
  let accuracyPct = 0;
  let completenessPct = 0;
  let answerScore = 0;

  if (technicalDensity === 0) {
    // Spoke with conversational fluency or confidence,
    // but ZERO technical domain concepts

    relevancePct = Math.min(
      15,
      Math.round(relevanceRatio * 15)
    );

    accuracyPct = 10;

    completenessPct = Math.min(
      25,
      Math.round(ansLen * 0.5)
    );

    answerScore = Number(
      (
        (
          relevancePct * 0.35 +
          accuracyPct * 0.45 +
          completenessPct * 0.2
        ) / 10
      ).toFixed(1)
    );

    if (answerScore < 1.0 && ansLen >= 5) {
      answerScore = 1.5;
    }

  } else if (
    technicalDensity < 3 ||
    matchedQWords.length === 0
  ) {
    // Superficial mention or single isolated keyword
    // without domain depth

    relevancePct = Math.min(
      45,
      Math.round(20 + relevanceRatio * 25)
    );

    accuracyPct = Math.min(
      40,
      Math.round(15 + technicalDensity * 10)
    );

    completenessPct = Math.min(
      45,
      Math.round(ansLen * 0.8)
    );

    answerScore = Number(
      (
        (
          relevancePct * 0.35 +
          accuracyPct * 0.45 +
          completenessPct * 0.2
        ) / 10
      ).toFixed(1)
    );

    if (answerScore > 4.2) {
      answerScore = 4.2;
    }

  } else {
    // Substantive, articulate technical explanation
    // with 3+ domain principles addressing question

    relevancePct = Math.min(
      95,
      Math.round(
        60 + Math.min(1, relevanceRatio) * 35
      )
    );

    accuracyPct = Math.min(
      96,
      Math.round(
        65 + Math.min(3, technicalDensity) * 10
      )
    );

    completenessPct = Math.min(
      94,
      Math.round(
        40 + Math.min(40, ansLen * 1.2)
      )
    );

    answerScore = Number(
      (
        (
          relevancePct * 0.35 +
          accuracyPct * 0.45 +
          completenessPct * 0.2
        ) / 10
      ).toFixed(1)
    );

    if (answerScore > 9.6) {
      answerScore = 9.6;
    }
  }

  // Dynamic follow-ups generated specifically
  // from candidate's actual reply

  const followUps = [];

  if (
    aLower.includes('kafka') ||
    aLower.includes('stream') ||
    aLower.includes('telemetry')
  ) {
    followUps.push(
      'In that telemetry stream, how did you guarantee zero message loss during peak radar sensor bursts?'
    );
  }

  if (
    aLower.includes('matched filter') ||
    aLower.includes('snr') ||
    aLower.includes('compression')
  ) {
    followUps.push(
      'How did the matched filter pulse compression ratio affect your minimum detectable range and blind zone?'
    );
  }

  if (
    aLower.includes('fpga') ||
    aLower.includes('dsp') ||
    aLower.includes('embedded')
  ) {
    followUps.push(
      'What were the clock cycle constraints and resource utilization on the FPGA for that DSP pipeline?'
    );
  }

  if (
    aLower.includes('cfar') ||
    aLower.includes('clutter')
  ) {
    followUps.push(
      'Under severe non-homogeneous clutter boundaries, how did you prevent target masking in your CFAR detector?'
    );
  }

  if (followUps.length < 2) {
    followUps.push(
      'Regarding your implementation, what primary trade-off did you face between computational latency and detection accuracy?'
    );

    followUps.push(
      'How would this design behave if dynamic noise or active electronic jamming increases by 15 dB?'
    );
  }

  return {
    answerScore,
    score: answerScore,
    relevancePct,
    accuracyPct,
    completenessPct,

    observation:
      answerScore >= 7.0
        ? 'Candidate demonstrated articulate technical command, citing specific engineering parameters.'
        : answerScore >= 3.5
          ? 'Candidate demonstrated foundational understanding with moderate technical detail.'
          : 'Candidate response lacked substantive technical accuracy and domain depth.',

    evidence:
      cleanAns.slice(0, 180) +
      (cleanAns.length > 180 ? '...' : ''),

    missingConcepts:
      answerScore < 7.0
        ? [
          'Rigorous mathematical formulation',
          'Operational edge-case verification'
        ]
        : [],

    feedback:
      answerScore >= 7.0
        ? 'Clear technical articulation. Good understanding of system trade-offs.'
        : 'Candidate should provide concrete engineering methodology and parameters.',

    suggestedFollowUps: followUps,
    followUpQuestions: followUps
  };
}


function heuristicGenerateFollowUp(
  conversationHistory = [],
  currentPhase = 'Technical',
  candidateSkills = []
) {
  const lastAns = [...conversationHistory]
    .reverse()
    .find(
      m => m.role?.toLowerCase() === 'candidate'
    )?.text || '';

  const aLower = lastAns.toLowerCase();

  let suggested = [];

  if (
    aLower.includes('kafka') ||
    aLower.includes('pipeline') ||
    aLower.includes('stream')
  ) {
    suggested.push({
      id: `fq_${Date.now()}_kafka`,
      question:
        'How did you handle consumer group rebalancing in Kafka without dropping high-rate radar telemetry packets?',
      relevanceScore: 9.7,
      difficulty: 'Hard'
    });
  }

  if (
    aLower.includes('matched filter') ||
    aLower.includes('chirp') ||
    aLower.includes('pulse')
  ) {
    suggested.push({
      id: `fq_${Date.now()}_pulse`,
      question:
        'When implementing matched filter pulse compression, how did you suppress range sidelobes to avoid false target detection?',
      relevanceScore: 9.6,
      difficulty: 'Hard'
    });
  }

  if (
    aLower.includes('fpga') ||
    aLower.includes('dsp') ||
    aLower.includes('hardware')
  ) {
    suggested.push({
      id: `fq_${Date.now()}_hw`,
      question:
        'What pipelining depth did you use for the real-time FFT on FPGA to meet the radar PRF timing constraints?',
      relevanceScore: 9.4,
      difficulty: 'Hard'
    });
  }

  if (suggested.length < 2) {
    suggested.push(
      {
        id: `fq_${Date.now()}_1`,
        question:
          'Under severe operational jamming or clutter edge conditions, what adaptive algorithmic mitigations would you deploy?',
        relevanceScore: 9.3,
        difficulty: 'Hard'
      },
      {
        id: `fq_${Date.now()}_2`,
        question:
          'Could you specify the exact mathematical trade-off you accepted between latency and computational overhead in that design?',
        relevanceScore: 9.1,
        difficulty: 'Medium'
      }
    );
  }

  return {
    suggestedQuestions: suggested,
    followUpQuestions: suggested
  };
}


function heuristicGenerateReport(
  candidateInfo,
  allQnA = [],
  expressionData = {}
) {
  // Filter for actual substantive candidate answers

  const validAnswers = allQnA.filter(
    q =>
      q.answer &&
      q.answer.trim().length > 15 &&
      Number(q.answerScore) > 0
  );

  // Strict check: if no substantive answers were given

  if (validAnswers.length === 0) {
    return {
      overallScore: 0.0,
      preliminaryScore: 0.0,

      recommendation:
        'Not Recommended (Candidate Did Not Respond)',

      finalRecommendation: 'Not Recommended',

      aiSuggestedVerdict: 'Not Recommended',

      competencyScores: {
        communication: 0.0,
        technicalDepth: 0.0,
        domainRelevance: 0.0,
        problemSolving: 0.0,
        confidenceComposure: 1.0
      },

      phaseWiseScores: {
        iceBreaking: {
          score: 0.0,
          maxScore: 10,
          questionsAsked: 1
        },

        technical: {
          score: 0.0,
          maxScore: 10,
          questionsAsked: allQnA.length || 1
        },

        managerial: {
          score: 0.0,
          maxScore: 10,
          questionsAsked: 1
        }
      },

      strengths: [
        'Candidate initialized connection to the board room'
      ],

      weaknesses: [
        'Candidate did not speak or submit technical answers to board questions',
        'Zero verification of domain knowledge, system fundamentals, or problem-solving capability'
      ],

      summary: `${candidateInfo.name || 'Candidate'
        } did not provide any spoken or typed answers to questions posed by the board. Assessment failed due to lack of response.`,

      candidateImprovementSuggestions: [
        'Must actively communicate and answer questions during technical evaluations',
        'Review basic radar, telemetry, and signal processing principles before re-applying'
      ]
    };
  }

  // Calculate realistic score strictly based on valid answers

  const avgQScore =
    (
      validAnswers.reduce(
        (sum, q) =>
          sum + (Number(q.answerScore) || 5),
        0
      ) / validAnswers.length
    ) * 10;

  const confScore =
    expressionData.averageConfidence || 75;

  const overallScore = Number(
    (
      avgQScore * 0.8 +
      confScore * 0.2
    ).toFixed(1)
  );

  let verdict = 'Recommended for Appointment';

  if (overallScore < 50) {
    verdict = 'Not Recommended';
  } else if (overallScore < 75) {
    verdict = 'Secondary Review Recommended';
  }

  return {
    overallScore,
    preliminaryScore: overallScore,

    recommendation: verdict,

    finalRecommendation:
      'Pending Expert Review',

    aiSuggestedVerdict: verdict,

    competencyScores: {
      communication: Number(
        Math.min(
          9.5,
          Math.max(
            3.5,
            (avgQScore / 10) * 0.95 + 0.3
          )
        ).toFixed(1)
      ),

      technicalDepth: Number(
        Math.min(
          9.8,
          Math.max(
            3.0,
            avgQScore / 10
          )
        ).toFixed(1)
      ),

      domainRelevance: Number(
        Math.min(
          9.6,
          Math.max(
            3.5,
            (avgQScore / 10) * 0.98
          )
        ).toFixed(1)
      ),

      problemSolving: Number(
        Math.min(
          9.5,
          Math.max(
            3.0,
            (avgQScore / 10) * 0.92 + 0.5
          )
        ).toFixed(1)
      ),

      confidenceComposure: Number(
        (confScore / 10).toFixed(1)
      )
    },

    phaseWiseScores: {
      iceBreaking: {
        score: 8.0,
        maxScore: 10,
        questionsAsked: 2
      },

      technical: {
        score: Number(
          (avgQScore / 10).toFixed(1)
        ),
        maxScore: 10,
        questionsAsked: validAnswers.length
      },

      managerial: {
        score: 7.8,
        maxScore: 10,
        questionsAsked: 2
      }
    },

    strengths: [
      'Articulated technical principles matching core domain requirements',
      'Demonstrated practical problem solving on specialized system architectures',
      'Maintained consistent composure during technical board questioning'
    ],

    weaknesses: [
      'Can cite more quantitative benchmarks when detailing design trade-offs',
      'Deepen cross-functional integration examples under tight deadlines'
    ],

    summary: `${candidateInfo.name || 'The candidate'
      } provided technical responses with verified domain understanding. Overall score reflects evaluation of responses submitted during the session.`,

    candidateImprovementSuggestions: [
      'Deepen study into low-level execution pipelines and micro-benchmarking',
      'Practice structured situational leadership responses under time constraints'
    ]
  };
}


// ============================================================
// EXPORTED SERVICES
// Groq AI + Heuristic Fallback
// ============================================================


async function parseResume(resumeText) {
  const prompt = `You are an expert HR analyst. Parse this resume and extract structured information.

Resume text:

${resumeText}

Return ONLY valid JSON (no markdown):

{
  "name": "Full Name",
  "education": "Highest degree, College/University",
  "experience": "X years at Company1, Company2",
  "skills": ["skill1", "skill2", "skill3"],
  "highlights": ["highlight1", "highlight2", "highlight3"]
}`;

  try {
    const aiRes = await callGroq(prompt);

    if (aiRes && aiRes.skills) {
      return aiRes;
    }

  } catch (err) {
    console.warn(
      '[AI] Groq parseResume unavailable, using heuristic.'
    );
  }

  return heuristicParseResume(resumeText);
}


async function analyzeRoleAlignment(
  candidateProfile,
  jobDescription
) {
  const candSkills =
    (candidateProfile.skills || []).join(', ');

  const prompt = `Analyze alignment between candidate profile and DRDO job description.

Candidate Skills: ${candSkills}

Job Description: ${jobDescription}

Return ONLY valid JSON (no markdown):

{
  "matchedSkills": ["skill1", "skill2"],
  "skillsRequiringValidation": ["skill3", "skill4"],
  "roleRelevantQuestionAreas": ["area1", "area2"],
  "alignmentSummary": "Candidate demonstrates good foundation in core requirements."
}`;

  try {
    const aiRes = await callGroq(prompt);

    if (
      aiRes &&
      Array.isArray(aiRes.matchedSkills)
    ) {
      return aiRes;
    }

  } catch (err) {
    console.warn(
      '[AI] Groq analyzeRoleAlignment unavailable, using heuristic.'
    );
  }

  return heuristicAnalyzeAlignment(
    candidateProfile,
    jobDescription
  );
}


async function generateQuestionBank(
  candidateProfile,
  jobDescription,
  interviewType,
  candidateLevel
) {
  const prompt = `You are a DRDO RAC interview panel expert. Generate interview questions for this candidate.

Candidate Profile:

- Name: ${candidateProfile.name}
- Skills: ${(candidateProfile.skills || []).join(', ')}
- Experience: ${candidateProfile.experience}
- Education: ${candidateProfile.education}

Job Description: ${jobDescription}

Interview Type: ${interviewType}

Candidate Level: ${candidateLevel}

Return ONLY valid JSON with iceBreaking (3 items), technical (5 items), managerial (3 items).

Each item must have: id, question, relevanceScore (0-10), category, difficulty (Easy/Medium/Hard).`;

  try {
    const aiRes = await callGroq(prompt);

    if (
      aiRes &&
      aiRes.technical &&
      Array.isArray(aiRes.technical)
    ) {
      return aiRes;
    }

  } catch (err) {
    console.warn(
      '[AI] Groq generateQuestionBank unavailable, using heuristic.'
    );
  }

  return heuristicGenerateQuestionBank(
    candidateProfile,
    jobDescription,
    interviewType,
    candidateLevel
  );
}


async function gradeAnswer(
  questionText,
  answerText,
  currentPhase = 'Technical'
) {
  const prompt = `You are an expert DRDO interview evaluator. Evaluate this candidate answer.

Question: ${questionText}

Answer: ${answerText}

Phase: ${currentPhase}

Return ONLY valid JSON:

{
  "answerScore": 8.5,
  "relevancePct": 90,
  "accuracyPct": 85,
  "completenessPct": 80,
  "observation": "Short observation of answer quality",
  "evidence": "Brief quoted evidence from answer",
  "missingConcepts": ["concept1"],
  "feedback": "Actionable feedback for candidate",
  "suggestedFollowUps": ["Follow up question 1", "Follow up question 2"]
}`;

  try {
    const aiRes = await callGroq(prompt);

    if (
      aiRes &&
      aiRes.answerScore !== undefined
    ) {
      return {
        ...aiRes,
        score: aiRes.answerScore,
        followUpQuestions:
          aiRes.suggestedFollowUps || []
      };
    }

  } catch (err) {
    console.warn(
      '[AI] Groq gradeAnswer unavailable, using heuristic.'
    );
  }

  return heuristicGradeAnswer(
    questionText,
    answerText,
    currentPhase
  );
}


async function generateFollowUp(
  conversationHistory,
  currentPhase = 'Technical',
  candidateSkills = []
) {
  const recentHistory =
    conversationHistory
      .slice(-4)
      .map(
        m => `${m.role}: ${m.text}`
      )
      .join('\n');

  const prompt = `You are a DRDO panel expert. Suggest 2-3 follow up questions based on recent exchange:

${recentHistory}

Phase: ${currentPhase}

Candidate Skills: ${candidateSkills.join(', ')}

Return ONLY valid JSON:

{
  "suggestedQuestions": [
    {
      "id": "fq_1",
      "question": "...",
      "relevanceScore": 9.2,
      "difficulty": "Hard"
    }
  ]
}`;

  try {
    const aiRes = await callGroq(prompt);

    if (
      aiRes &&
      Array.isArray(aiRes.suggestedQuestions) &&
      aiRes.suggestedQuestions.length > 0
    ) {
      return aiRes;
    }

  } catch (err) {
    console.warn(
      '[AI] Groq generateFollowUp unavailable, using heuristic.'
    );
  }

  return heuristicGenerateFollowUp(
    conversationHistory,
    currentPhase,
    candidateSkills
  );
}


async function generateReport(
  candidateInfo,
  allQnA = [],
  expressionData = {}
) {
  const validAnswers = (allQnA || []).filter(
    q =>
      q.answer &&
      q.answer.trim().length > 15 &&
      Number(q.answerScore) > 0
  );

  if (validAnswers.length === 0) {
    console.log(
      '[AI REPORT] No substantive answers found in session. Assigning 0 score failed report.'
    );

    return heuristicGenerateReport(
      candidateInfo,
      allQnA,
      expressionData
    );
  }

  const qnaSummary = allQnA
    .map(
      q =>
        `Q: ${q.question} | Ans: ${q.answer} | Score: ${q.answerScore}/10`
    )
    .join('\n');

  const prompt = `Generate final 5-axis competency assessment report for DRDO interview.

Candidate: ${candidateInfo.name}

Role: ${candidateInfo.post}

Q&A Record:

${qnaSummary}

CRITICAL RULES:

- Base scores STRICTLY on the actual candidate answers in the Q&A Record.
- If answers were missing or empty, score is 0.
- If answers were average, score proportionally between 50-70.
- If answers were technically excellent, score 80-92.

Return ONLY valid JSON:

{
  "overallScore": 82.0,
  "aiSuggestedVerdict": "Recommended for Appointment",
  "competencyScores": {
    "communication": 8.0,
    "technicalDepth": 8.5,
    "domainRelevance": 8.5,
    "problemSolving": 8.0,
    "confidenceComposure": 8.0
  },
  "phaseWiseScores": {
    "iceBreaking": {
      "score": 8.0,
      "maxScore": 10,
      "questionsAsked": 1
    },
    "technical": {
      "score": 8.5,
      "maxScore": 10,
      "questionsAsked": 2
    },
    "managerial": {
      "score": 8.0,
      "maxScore": 10,
      "questionsAsked": 1
    }
  },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "summary": "2-3 sentence executive assessment."
}`;

  try {
    const aiRes = await callGroq(prompt);

    if (
      aiRes &&
      aiRes.competencyScores
    ) {
      return {
        ...aiRes,
        preliminaryScore:
          aiRes.overallScore,

        recommendation:
          aiRes.aiSuggestedVerdict,

        finalRecommendation:
          'Pending Expert Review'
      };
    }

  } catch (err) {
    console.warn(
      '[AI] Groq generateReport unavailable, using heuristic.'
    );
  }

  return heuristicGenerateReport(
    candidateInfo,
    allQnA,
    expressionData
  );
}


// ============================================================
// MODULE EXPORTS
// ============================================================

module.exports = {
  parseResume,
  analyzeRoleAlignment,
  generateQuestionBank,
  gradeAnswer,
  generateFollowUp,
  generateReport
};
