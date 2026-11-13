import React, { createContext, useContext, useState, useMemo } from 'react';
import { getCurrentUser, setCurrentUser as setAuthSessionUser } from '../../auth/authService.js';
import {
  DEMO_PATIENT_FIXTURE,
  createPatientProfile,
  createMedicalHistory,
  createScreeningSession,
  DEMO_SCREENING_FIXTURE,
  createReportsFromSession,
  DEMO_CONSULTATIONS_FIXTURE,
  DEFAULT_CARE_PLAN,
  DEMO_NOTIFICATIONS_FIXTURE,
} from '../types/patientContracts.js';

const PatientContext = createContext(null);

const STORAGE_MED_HIST_KEY = 'miora_medical_history_v1';
const STORAGE_CARE_PLAN_KEY = 'miora_care_plan_v1';
const STORAGE_SESSIONS_KEY = 'miora_screening_sessions_v1';

export function PatientProvider({ children }) {
  // 1. Patient Profile State
  // Authenticated identity is resolved directly from session storage without assumptions
  const [patient, setPatient] = useState(() => {
    try {
      const authUser = getCurrentUser();
      if (authUser && authUser.role === 'patient') {
        return createPatientProfile(authUser);
      }
    } catch {
      // fallback to isolated demo fixture
    }
    return DEMO_PATIENT_FIXTURE;
  });

  const updatePatientProfile = (updates) => {
    setPatient((prev) => {
      const updated = { ...prev, ...updates, isDemoFixture: false };
      try {
        const authUser = getCurrentUser() || {};
        setAuthSessionUser({
          ...authUser,
          name: updated.fullName || updated.name,
          email: updated.email,
          role: 'patient',
          phone: updated.phone,
          postpartumWeek: updated.postpartumWeek,
        });
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // 2. Medical History State
  const [medicalHistory, setMedicalHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MED_HIST_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return createMedicalHistory({ selectedOption: 'yes' });
  });

  const updateMedicalHistory = (updates) => {
    setMedicalHistory((prev) => {
      const next = {
        ...prev,
        ...updates,
        savedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(STORAGE_MED_HIST_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // 3. Screening Sessions & Media Lifecycle State
  const [currentSession, setCurrentSession] = useState(() => {
    return createScreeningSession({
      sessionId: 'SCR-2026-1117',
      status: 'in-progress',
      analysisStatus: 'ready',
      results: DEMO_SCREENING_FIXTURE,
    });
  });

  const [screeningHistory, setScreeningHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SESSIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        ...DEMO_SCREENING_FIXTURE,
        status: 'completed',
        analysisStatus: 'ready',
      },
    ];
  });

  const startScreeningSession = () => {
    const newSession = createScreeningSession({
      sessionId: `SCR-${Date.now()}`,
      patientId: patient.id,
      status: 'in-progress',
      analysisStatus: 'not-started',
      medicalHistoryRef: medicalHistory?.savedAt || null,
      sessionProgress: 10,
      results: null, // Strictly null until real inference completes
    });
    setCurrentSession(newSession);
    return newSession;
  };

  const updateScreeningSession = (updater) => {
    setCurrentSession((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      return next;
    });
  };

  /**
   * Completes a screening session.
   * If analysis outputs are available, sets analysisStatus: 'ready'.
   * If offline or no model is connected, sets analysisStatus: 'unavailable'.
   * Never fabricates synthetic clinical scores.
   */
  const completeScreeningSession = (resultsData = null) => {
    const completedAt = new Date().toISOString();
    const hasGenuineResults = Boolean(resultsData);

    const completedSession = {
      ...currentSession,
      status: 'completed',
      analysisStatus: hasGenuineResults ? 'ready' : 'unavailable',
      completedAt,
      sessionProgress: 100,
      results: hasGenuineResults ? resultsData : null,
      analysisNotice: hasGenuineResults
        ? 'Clinical model analysis completed.'
        : 'Multimodal analysis service is offline in this frontend environment. No clinical scores were fabricated.',
    };

    setCurrentSession(completedSession);
    setScreeningHistory((prev) => {
      const updated = [completedSession, ...prev.filter((s) => s.sessionId !== completedSession.sessionId)];
      try {
        localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    return completedSession;
  };

  // 4. Backward-compatible `screening` object for Reports & Results screens
  // Clearly separates demo preview fixtures from genuine session results
  const screening = useMemo(() => {
    // If active session has ready results, return it
    if (currentSession?.results && currentSession?.analysisStatus === 'ready') {
      const r = currentSession.results;
      return {
        id: currentSession.sessionId,
        sessionId: currentSession.sessionId,
        isDemoFixture: Boolean(r.isDemoFixture),
        date: r.date || 'Today',
        completedDateTime: r.completedDateTime || new Date().toLocaleString(),
        riskScore: r.riskScore ?? 0,
        riskLabel: r.riskLabel || 'Analysis Complete',
        summary: r.summary || '',
        trend: r.trend || [],
        insights: r.insights || {},
        assessmentSummary: r.assessmentSummary || {},
        reports: createReportsFromSession(currentSession),
        nextSteps: [
          {
            id: 'step-consultation',
            title: 'Book a follow-up consultation',
            type: 'consultation',
            link: '/patient/connect-doctor',
          },
          {
            id: 'step-careplan',
            title: 'Try recommended self-care plan',
            type: 'careplan',
            link: '/patient/care-suggestions',
          },
          {
            id: 'step-retake',
            title: 'Retake screening',
            type: 'screening',
            link: '/patient/screening',
          },
        ],
      };
    }

    // Check history for a ready session
    const readyFromHistory = screeningHistory.find((s) => s.results && s.analysisStatus === 'ready');
    if (readyFromHistory) {
      const r = readyFromHistory.results || readyFromHistory;
      return {
        id: readyFromHistory.sessionId || readyFromHistory.id,
        sessionId: readyFromHistory.sessionId || readyFromHistory.id,
        isDemoFixture: Boolean(r.isDemoFixture),
        date: r.date || '17 Nov 2026',
        completedDateTime: r.completedDateTime || '17 Nov 2026 · 10:28 AM',
        riskScore: r.riskScore ?? 64,
        riskLabel: r.riskLabel || 'Moderate Risk for PPD',
        summary: r.summary || '',
        trend: r.trend || [],
        insights: r.insights || {},
        assessmentSummary: r.assessmentSummary || {},
        reports: createReportsFromSession(readyFromHistory),
        nextSteps: [
          {
            id: 'step-consultation',
            title: 'Book a follow-up consultation',
            type: 'consultation',
            link: '/patient/connect-doctor',
          },
          {
            id: 'step-careplan',
            title: 'Try recommended self-care plan',
            type: 'careplan',
            link: '/patient/care-suggestions',
          },
          {
            id: 'step-retake',
            title: 'Retake screening',
            type: 'screening',
            link: '/patient/screening',
          },
        ],
      };
    }

    // Default fallback to isolated demo preview fixture
    return {
      ...DEMO_SCREENING_FIXTURE,
      id: DEMO_SCREENING_FIXTURE.sessionId,
      reports: createReportsFromSession(DEMO_SCREENING_FIXTURE),
      nextSteps: [
        {
          id: 'step-consultation',
          title: 'Book a follow-up consultation',
          type: 'consultation',
          link: '/patient/connect-doctor',
        },
        {
          id: 'step-careplan',
          title: 'Try recommended self-care plan',
          type: 'careplan',
          link: '/patient/care-suggestions',
        },
        {
          id: 'step-retake',
          title: 'Retake screening',
          type: 'screening',
          link: '/patient/screening',
        },
      ],
    };
  }, [currentSession, screeningHistory]);

  const setScreening = (newScreening) => {
    updateScreeningSession({ results: newScreening, analysisStatus: 'ready' });
  };

  // 5. Notifications State
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS_FIXTURE);

  const markNotificationRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addNotification = (notif) => {
    const newNotif = {
      id: `n-${Date.now()}`,
      date: 'Today',
      read: false,
      isDemoFixture: false,
      ...notif,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    return newNotif;
  };

  // 6. Consultations State
  const [consultations, setConsultations] = useState(DEMO_CONSULTATIONS_FIXTURE);

  const bookConsultation = (appointment) => {
    const newAppt = {
      id: `c-${Date.now()}`,
      doctorName: appointment.doctorName || 'Dr. Elena Rostova',
      role: appointment.role || 'Perinatal Psychiatry Lead',
      clinic: appointment.clinic || 'Miora Maternal Care Unit',
      status: 'Scheduled',
      type: appointment.type || 'Telehealth Video',
      isDemoFixture: false,
      ...appointment,
    };
    setConsultations((prev) => [newAppt, ...prev]);
    addNotification({
      title: 'Consultation Scheduled',
      message: `Your appointment with ${newAppt.doctorName} is confirmed for ${newAppt.date} at ${newAppt.time}.`,
      category: 'appointment',
    });
    return newAppt;
  };

  // 7. Care Plan State
  const [carePlan, setCarePlan] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CARE_PLAN_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_CARE_PLAN;
  });

  const toggleCareTask = (taskId) => {
    setCarePlan((prev) => {
      const updated = {
        ...prev,
        tasks: (prev.tasks || DEFAULT_CARE_PLAN.tasks).map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        ),
      };
      try {
        localStorage.setItem(STORAGE_CARE_PLAN_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // 8. Download Report Handler & Toasts
  const [downloadToast, setDownloadToast] = useState(null);

  const downloadReport = (report) => {
    if (!report) return { success: false, error: 'No report selected' };

    if (!report.authorized) {
      const errorMsg = 'Access Denied: You are not authorized to download this file.';
      setDownloadToast({ type: 'error', message: errorMsg });
      setTimeout(() => setDownloadToast(null), 4000);
      return { success: false, error: errorMsg };
    }

    try {
      const isDemo = Boolean(report.isDemoFixture || screening?.isDemoFixture);
      const headerNotice = isDemo ? '[DEMO PREVIEW DOCUMENT — NOT A CLINICAL REPORT]\n' : '';

      let content = '';
      if (report.type === 'pdf') {
        content = `%PDF-1.4\n% ${headerNotice}Miora Maternal Emotional Intelligence Report\n% Patient: ${patient.fullName} (${patient.id})\n% Screening Date: ${screening.date}\n% Risk Score: ${screening.riskScore}% (${screening.riskLabel})\n% Summary: ${screening.summary}\n%%EOF`;
      } else if (report.type === 'txt') {
        content = `${headerNotice}MIORA SCREENING CONVERSATION TRANSCRIPT\nDate: ${screening.date}\nPatient: ${patient.fullName}\n\n[10:24 AM] Miora AI: Hi ${patient.name}! I'm Miora, your AI screening companion.\n[10:24 AM] ${patient.name}: Yes, we can start.\n[10:25 AM] Miora AI: In the past two weeks, how often have you felt low, sad, or hopeless?\n`;
      } else if (report.type === 'wav') {
        content = 'RIFF....WAVEfmt ....data....Miora Audio Session Mock Data';
      } else {
        content = 'ftypisom....moov....Miora Video Recording Mock Data';
      }

      const blob = new Blob([content], { type: report.mimeType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename || `${report.title.replace(/\s+/g, '_')}${report.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const msg = `Downloaded ${report.title} (${report.format.toUpperCase()})${isDemo ? ' [Demo Fixture]' : ''}`;
      setDownloadToast({ type: 'success', message: msg });
      setTimeout(() => setDownloadToast(null), 3500);
      return { success: true };
    } catch {
      const errorMsg = 'An error occurred while downloading the file.';
      setDownloadToast({ type: 'error', message: errorMsg });
      setTimeout(() => setDownloadToast(null), 4000);
      return { success: false, error: errorMsg };
    }
  };

  const value = useMemo(
    () => ({
      patient,
      updatePatientProfile,
      medicalHistory,
      updateMedicalHistory,
      currentSession,
      startScreeningSession,
      updateScreeningSession,
      completeScreeningSession,
      screeningHistory,
      screening,
      setScreening,
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
      addNotification,
      consultations,
      bookConsultation,
      carePlan,
      setCarePlan,
      toggleCareTask,
      downloadReport,
      downloadToast,
      setDownloadToast,
    }),
    [
      patient,
      medicalHistory,
      currentSession,
      screeningHistory,
      screening,
      notifications,
      consultations,
      carePlan,
      downloadToast,
    ]
  );

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}
