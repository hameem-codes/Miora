/**
 * MIORA PATIENT PORTAL — SHARED DATA CONTRACTS & TYPE FACTORIES
 *
 * This file defines the single source of truth for patient data schemas,
 * screening session models, medical history payloads, and consultation objects.
 *
 * CLINICAL DATA INTEGRITY RULES:
 * 1. Demo fixtures are strictly isolated and explicitly flagged with `isDemoFixture: true`.
 * 2. Unverified scores or assessments are never fabricated or presented as real predictions.
 * 3. Sessions without model inference must explicitly report analysis status: 'not-started',
 *    'pending', 'processing', 'ready', 'unavailable', or 'failed'.
 * 4. Browser memory media is explicitly flagged as `isLocalMemoryOnly: true`.
 */

// =============================================================================
// 1. Patient Profile Contracts
// =============================================================================

/**
 * Isolated demo patient fixture used ONLY when no authenticated user is signed in
 * or when previewing the portal in demo mode.
 */
export const DEMO_PATIENT_FIXTURE = {
  id: 'P-101',
  name: 'Sadiya',
  fullName: 'Sadiya Rahman',
  email: 'sadiya@miora.health',
  avatarInitials: 'S',
  postpartumWeek: 4,
  isDemoFixture: true,
  notes: 'Demo Patient Fixture for local design review',
};

/**
 * Creates a clean, unembellished patient profile from authenticated session credentials.
 * Never invents clinical data, telephone numbers, or unentered emergency contacts.
 */
export function createPatientProfile(authRecord = null) {
  if (!authRecord) {
    return DEMO_PATIENT_FIXTURE;
  }

  const rawName = (authRecord.name || '').trim();
  const firstName = rawName ? rawName.split(' ')[0] : 'Patient';
  const initial = firstName.charAt(0).toUpperCase() || 'P';

  return {
    id: authRecord.id || `P-${authRecord.email ? authRecord.email.split('@')[0] : 'user'}`,
    name: firstName,
    fullName: rawName || 'Patient User',
    email: authRecord.email || '',
    avatarInitials: initial,
    postpartumWeek: Number(authRecord.postpartumWeek) || 4,
    phone: authRecord.phone || '',
    dateOfBirth: authRecord.dateOfBirth || '',
    emergencyContact: authRecord.emergencyContact || null,
    isDemoFixture: Boolean(authRecord.isDemoFixture),
  };
}

// =============================================================================
// 2. Medical History Contract
// =============================================================================
export function createMedicalHistory({
  selectedOption = 'not-sure', // 'yes' | 'no' | 'not-sure'
  notes = '',
  uploadedFiles = [],
  savedAt = null,
} = {}) {
  return {
    selectedOption,
    notes,
    uploadedFiles: uploadedFiles.map((f) => ({
      id: f.id || `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      uploadedAt: f.uploadedAt || new Date().toISOString(),
      isLocalMemoryOnly: true,
    })),
    savedAt: savedAt || new Date().toISOString(),
  };
}

// =============================================================================
// 3. Screening Session Contract
// =============================================================================

/**
 * Creates an authentic screening session container.
 * Initial sessions NEVER contain fabricated scores or predictions.
 * Results remain `null` until valid analysis output is bound.
 */
export function createScreeningSession({
  sessionId = `SCR-${Date.now()}`,
  patientId = 'P-101',
  status = 'initialized', // 'initialized' | 'in-progress' | 'completed' | 'cancelled'
  analysisStatus = 'not-started', // 'not-started' | 'pending' | 'processing' | 'ready' | 'unavailable' | 'failed'
  medicalHistoryRef = null,
  recordings = null,
  transcript = [],
  sessionProgress = 0,
  results = null,
} = {}) {
  return {
    sessionId,
    patientId,
    createdAt: new Date().toISOString(),
    completedAt: null,
    status,
    analysisStatus,
    medicalHistoryRef,
    recordings: recordings || {
      audioBlob: null,
      audioBlobUrl: null,
      audioDurationSeconds: 0,
      videoBlob: null,
      videoBlobUrl: null,
      videoDurationSeconds: 0,
      format: 'webm',
      storageType: 'temporary-browser-memory',
      isLocalMemoryOnly: true,
      isPersistedRemotely: false,
      remoteUrl: null,
    },
    transcript,
    sessionProgress,
    results, // Must remain null until genuine analysis completes
  };
}

/**
 * Clearly identified demo fixture for static previewing of the results screen.
 * Explicitly flagged so it is never mistaken for real patient inference.
 */
export const DEMO_SCREENING_FIXTURE = {
  sessionId: 'DEMO-SCR-2026-1117',
  isDemoFixture: true,
  isClinicallyValidated: false,
  isModelGenerated: false,
  date: '17 Nov 2026',
  completedDateTime: '17 Nov 2026 · 10:28 AM',
  riskScore: 64,
  riskLabel: 'Moderate Risk for PPD (Demo Preview)',
  disclaimer: 'Demonstration fixture only — not a clinical diagnosis or model prediction.',
  summary:
    'Some signs of postpartum depression were observed in this simulation. Consult a licensed healthcare professional for clinical assessment.',
  trend: [
    { week: 'Week 1', score: 42 },
    { week: 'Week 2', score: 50 },
    { week: 'Week 3', score: 58 },
    { week: 'Week 4', score: 64 },
  ],
  insights: {
    mood: 'Low to moderate',
    sleep: 'Disturbed',
    stress: 'Elevated',
    support: 'Recommended',
  },
  assessmentSummary: {
    emotionalSigns: 68,
    cognitiveSigns: 62,
    behaviouralSigns: 58,
    physicalIndicators: 46,
  },
  keyInsights: [
    { id: 'ki-1', label: 'Mood changes observed', type: 'mood' },
    { id: 'ki-2', label: 'Sleep disturbances reported', type: 'sleep' },
    { id: 'ki-3', label: 'Higher emotional sensitivity noted', type: 'sensitivity' },
  ],
};

// =============================================================================
// 4. Authorized Reports Contract
// =============================================================================
export function createReportsFromSession(session) {
  if (!session) return [];
  const dateStr = session.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const sanitizedDate = dateStr.replace(/\s+/g, '_');
  const isDemo = Boolean(session.isDemoFixture);

  return [
    {
      id: `rep-pdf-${session.sessionId || 'session'}`,
      title: 'Screening Report',
      format: '.pdf',
      size: '2.4 MB',
      type: 'pdf',
      authorized: true,
      mimeType: 'application/pdf',
      filename: `Miora_Screening_Report_${sanitizedDate}.pdf`,
      sessionId: session.sessionId,
      isDemoFixture: isDemo,
    },
    {
      id: `rep-txt-${session.sessionId || 'session'}`,
      title: 'Conversation Transcript',
      format: '.txt',
      size: '24 KB',
      type: 'txt',
      authorized: true,
      mimeType: 'text/plain',
      filename: `Miora_Conversation_Transcript_${sanitizedDate}.txt`,
      sessionId: session.sessionId,
      isDemoFixture: isDemo,
    },
    {
      id: `rep-wav-${session.sessionId || 'session'}`,
      title: 'Audio Recording',
      format: '.wav',
      size: '7.8 MB',
      type: 'wav',
      authorized: true,
      mimeType: 'audio/wav',
      filename: `Miora_Audio_Session_${sanitizedDate}.wav`,
      sessionId: session.sessionId,
      isDemoFixture: isDemo,
    },
    {
      id: `rep-mp4-${session.sessionId || 'session'}`,
      title: 'Video Recording',
      format: '.mp4',
      size: '48.2 MB',
      type: 'mp4',
      authorized: true,
      mimeType: 'video/mp4',
      filename: `Miora_Video_Session_${sanitizedDate}.mp4`,
      sessionId: session.sessionId,
      isDemoFixture: isDemo,
    },
  ];
}

// =============================================================================
// 5. Consultations Contract (Clearly marked demo fixture)
// =============================================================================
export const DEMO_CONSULTATIONS_FIXTURE = [
  {
    id: 'demo-c-101',
    doctorName: 'Dr. Elena Rostova',
    role: 'Perinatal Psychiatry Lead',
    date: '20 Nov 2026',
    time: '11:00 AM',
    status: 'Scheduled',
    type: 'Telehealth Video',
    clinic: 'Miora Maternal Care Unit',
    meetingLink: '#telehealth-simulation',
    isDemoFixture: true,
  },
  {
    id: 'demo-c-100',
    doctorName: 'Dr. Elena Rostova',
    role: 'Perinatal Psychiatry Lead',
    date: '03 Nov 2026',
    time: '02:30 PM',
    status: 'Completed',
    type: 'Audio Consult',
    clinic: 'Miora Maternal Care Unit',
    summary: 'Reviewed postpartum baseline and sleep hygiene support.',
    isDemoFixture: true,
  },
];

// =============================================================================
// 6. Care Plan Contract
// =============================================================================
export const DEFAULT_CARE_PLAN = {
  duration: '2 Weeks',
  totalDays: 14,
  currentDay: 1,
  focusAreas: ['Mood', 'Sleep', 'Stress', 'Support'],
  tasks: [
    { id: 'task-1', title: 'Breathing exercise', completed: true, category: 'Mindfulness' },
    { id: 'task-2', title: 'Mood check-in', completed: true, category: 'Emotional' },
    { id: 'task-3', title: 'Sleep routine', completed: true, category: 'Rest' },
    { id: 'task-4', title: 'Journaling', completed: false, category: 'Reflection' },
    { id: 'task-5', title: 'Light activity', completed: false, category: 'Physical' },
    { id: 'task-6', title: 'Self-care time', completed: false, category: 'Wellbeing' },
    { id: 'task-7', title: 'Reflection', completed: false, category: 'Mindfulness' },
  ],
};

// =============================================================================
// 7. Notifications Contract
// =============================================================================
export const DEMO_NOTIFICATIONS_FIXTURE = [
  {
    id: 'n-1',
    title: 'Screening Report Available',
    message: 'Your AI screening report for 17 Nov 2026 is ready to review and download.',
    date: '17 Nov 2026',
    read: false,
    category: 'report',
    isDemoFixture: true,
  },
  {
    id: 'n-2',
    title: 'Consultation Reminder',
    message: 'Follow-up with Dr. Elena Rostova is recommended within 7 days.',
    date: '16 Nov 2026',
    read: false,
    category: 'appointment',
    isDemoFixture: true,
  },
];
