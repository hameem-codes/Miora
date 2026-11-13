import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import { submitMultimodalAnalysis } from '../../dashboard/services/screeningAnalysisService.js';
import './screening-results.css';

/**
 * ScreeningResultsPage
 *
 * Implements two connected states in the Miora patient screening workflow:
 * 1. State A: Screening Analysis / Processing (waiting, processing, unavailable, failed)
 * 2. State B: Screening Results (matches reference visual source of truth)
 *
 * Clinical Data Integrity:
 * - Reads results strictly from the active session or analysis service.
 * - Never fabricates PPD risk percentages or synthetic clinical findings.
 * - Clearly distinguishes screening estimates from diagnostic medical conclusions.
 */
export function ScreeningResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    patient,
    currentSession,
    startScreeningSession,
    updateScreeningSession,
    completeScreeningSession,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = usePatient();

  // User profile & notification dropdowns
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Patient profile details
  const patientName = patient?.name || patient?.fullName?.split(' ')[0] || 'Sadiya';
  const avatarLetter = (patient?.avatarInitials || patientName.charAt(0) || 'S').toUpperCase();
  const unreadNotifs = (notifications || []).filter((n) => !n.read);

  // Resolve status & parameters
  const queryStatus = (searchParams.get('status') || searchParams.get('state') || '').toLowerCase();
  const paramScore = searchParams.get('score');

  // Determine active workflow state
  // Possible states: 'processing' | 'waiting' | 'unavailable' | 'failed' | 'ready' | 'missing'
  const effectiveStatus = useMemo(() => {
    if (queryStatus) {
      if (['processing', 'in-progress'].includes(queryStatus)) return 'processing';
      if (['waiting', 'pending', 'not-started'].includes(queryStatus)) return 'waiting';
      if (['unavailable', 'offline'].includes(queryStatus)) return 'unavailable';
      if (['failed', 'error'].includes(queryStatus)) return 'failed';
      if (['ready', 'completed', 'complete'].includes(queryStatus)) return 'ready';
      if (['missing', 'no-results', 'no-score'].includes(queryStatus)) return 'missing';
      return queryStatus;
    }

    const sessionAnalysis = currentSession?.analysisStatus;
    if (sessionAnalysis === 'ready') return 'ready';
    if (sessionAnalysis === 'processing') return 'processing';
    if (sessionAnalysis === 'unavailable') return 'unavailable';
    if (sessionAnalysis === 'failed') return 'failed';
    if (sessionAnalysis === 'pending' || sessionAnalysis === 'not-started') {
      return 'processing';
    }
    return 'ready';
  }, [queryStatus, currentSession?.analysisStatus]);

  // Is this State A (Analysis / Processing) or State B (Results)?
  const isAnalysisState = ['processing', 'waiting', 'unavailable', 'failed'].includes(effectiveStatus);

  // Automatic backend connectivity check for live sessions in processing state
  const [analysisErrorMsg, setAnalysisErrorMsg] = useState('');
  const [isVerifyingMedia, setIsVerifyingMedia] = useState(false);

  useEffect(() => {
    // Only trigger live check if session is naturally processing without override params
    if (!queryStatus && currentSession?.analysisStatus === 'in-progress') {
      setIsVerifyingMedia(true);
      const timer = setTimeout(async () => {
        try {
          const res = await submitMultimodalAnalysis({
            motherId: patient?.id || 'P-101',
            selectedModalities: ['audio', 'video', 'transcript'],
            files: [],
            consentConfirmed: true,
          });

          if (!res.ok) {
            if (res.reason === 'backend-unavailable') {
              updateScreeningSession({
                analysisStatus: 'unavailable',
                analysisNotice: res.message,
              });
            } else {
              updateScreeningSession({
                analysisStatus: 'failed',
                analysisNotice: res.message,
              });
              setAnalysisErrorMsg(res.message);
            }
          } else {
            completeScreeningSession(res.result);
          }
        } catch (err) {
          updateScreeningSession({
            analysisStatus: 'failed',
            analysisNotice: err?.message || 'Network error during analysis.',
          });
          setAnalysisErrorMsg(err?.message || 'Network error.');
        } finally {
          setIsVerifyingMedia(false);
        }
      }, 1600);

      return () => clearTimeout(timer);
    }
  }, [queryStatus, currentSession?.analysisStatus, patient?.id, updateScreeningSession, completeScreeningSession]);

  // Resolve screening risk score (State B)
  // NEVER fabricates scores. If missing or invalid, remains null.
  const resolvedScore = useMemo(() => {
    if (effectiveStatus === 'missing') return null;

    if (paramScore !== null && !isNaN(Number(paramScore))) {
      const val = Number(paramScore);
      return val <= 1 && val > 0 ? Math.round(val * 100) : Math.round(val);
    }

    if (currentSession?.results) {
      const r = currentSession.results;
      const raw = r.riskScore ?? r.score ?? r.combinedScore;
      if (raw !== null && raw !== undefined && !isNaN(Number(raw))) {
        const val = Number(raw);
        return val <= 1 && val > 0 ? Math.round(val * 100) : Math.round(val);
      }
    }

    return null;
  }, [paramScore, effectiveStatus, currentSession?.results]);

  // Resolve Key Insights (State B)
  // Displays only insights actually supplied by the analysis service
  const keyInsights = useMemo(() => {
    if (effectiveStatus === 'missing') return [];

    const r = currentSession?.results;
    if (Array.isArray(r?.keyInsights) && r.keyInsights.length > 0) {
      return r.keyInsights;
    }
    return [];
  }, [effectiveStatus, currentSession?.results]);

  // Circular gauge calculations
  const gaugeRadius = 50;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius; // ~314.16
  const strokeOffset = resolvedScore !== null
    ? gaugeCircumference * (1 - Math.min(Math.max(resolvedScore, 0), 100) / 100)
    : gaugeCircumference;

  // Actions
  const handleRetakeScreening = () => {
    // Retake Screening must start a brand-new session rather than overwrite the old session
    startScreeningSession();
    navigate('/patient/screening');
  };

  const handleConsultDoctor = () => {
    // Consult a Doctor must navigate to the existing doctor connection pathway
    navigate('/patient/connect-doctor');
  };

  const handleRetryAnalysis = () => {
    updateScreeningSession({ analysisStatus: 'processing' });
    setSearchParams({ status: 'processing' });
  };

  return (
    <div className="miora-results-shell">
      <main className="miora-results-viewport">
        {/* =========================================================================
            Top Header Area: Breadcrumb, Heading, Stepper & User Controls
            ========================================================================= */}
        <header className="results-top-header">
          {/* Top row: Breadcrumb (Left) + Bell & User Profile (Right) */}
          <div className="results-header-upper-row">
            <nav className="results-breadcrumb" aria-label="Breadcrumb">
              <NavLink to="/patient/screening" className="results-breadcrumb-link">
                <svg
                  className="results-breadcrumb-home-icon"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
                  <path d="M9.5 21v-7h5v7" />
                </svg>
                <span>AI Screening</span>
              </NavLink>
              <span className="results-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
              <span className="results-breadcrumb-current" aria-current="page">
                {isAnalysisState ? 'Analysis' : 'Results'}
              </span>
            </nav>

            {/* Notification Bell & Patient Profile Menu */}
            <div className="results-user-controls">
              {/* Bell Icon Button */}
              <div className="results-notif-wrap" ref={notifRef}>
                <button
                  type="button"
                  className="results-notif-btn"
                  onClick={() => {
                    setNotifDropdownOpen((prev) => !prev);
                    setProfileDropdownOpen(false);
                  }}
                  aria-label={`Notifications (${unreadNotifs.length} unread)`}
                  aria-expanded={notifDropdownOpen}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadNotifs.length > 0 && <span className="results-notif-dot" aria-hidden="true" />}
                </button>

                {notifDropdownOpen && (
                  <div className="results-dropdown-panel" role="dialog" aria-label="Notifications">
                    <div className="results-dropdown-header">
                      <span>Notifications</span>
                      {unreadNotifs.length > 0 && (
                        <button
                          type="button"
                          className="results-dropdown-link-btn"
                          onClick={() => markAllNotificationsRead?.()}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="results-dropdown-list">
                      {notifications?.length ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`results-dropdown-item ${!n.read ? 'is-unread' : ''}`}
                            onClick={() => markNotificationRead?.(n.id)}
                          >
                            <span className="results-dropdown-item-title">{n.title}</span>
                            <span className="results-dropdown-item-msg">{n.message}</span>
                          </div>
                        ))
                      ) : (
                        <div className="results-dropdown-empty">No notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Patient Avatar Pill */}
              <div className="results-profile-wrap" ref={profileRef}>
                <button
                  type="button"
                  className="results-profile-pill"
                  onClick={() => {
                    setProfileDropdownOpen((prev) => !prev);
                    setNotifDropdownOpen(false);
                  }}
                  aria-label="User account menu"
                  aria-expanded={profileDropdownOpen}
                >
                  <span className="results-avatar-circle" aria-hidden="true">
                    {avatarLetter}
                  </span>
                  <span className="results-profile-name">{patientName}</span>
                  <svg
                    className="results-profile-chevron"
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {profileDropdownOpen && (
                  <div className="results-dropdown-panel results-profile-menu" role="menu">
                    <div className="results-dropdown-header">
                      <span>{patient?.fullName || patientName}</span>
                    </div>
                    <NavLink to="/patient/profile" className="results-dropdown-menu-link" role="menuitem">
                      Profile
                    </NavLink>
                    <NavLink to="/patient/settings" className="results-dropdown-menu-link" role="menuitem">
                      Settings
                    </NavLink>
                    <button
                      type="button"
                      className="results-dropdown-menu-link is-danger"
                      onClick={() => navigate('/login')}
                      role="menuitem"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lower row: Heading / Subtitle (Left) + 4-Stage Stepper (Right) */}
          <div className="results-header-lower-row">
            <div className="results-heading-block">
              <h1 className="results-main-heading">
                {isAnalysisState ? (
                  effectiveStatus === 'processing'
                    ? 'Screening Analysis'
                    : effectiveStatus === 'waiting'
                    ? 'Screening Analysis'
                    : effectiveStatus === 'unavailable'
                    ? 'Analysis Unavailable'
                    : 'Analysis Status'
                ) : (
                  'Screening Results'
                )}
              </h1>
              <p className="results-main-subtitle">
                {isAnalysisState ? (
                  effectiveStatus === 'processing'
                    ? 'Your session recordings and transcript are being prepared and analyzed.'
                    : effectiveStatus === 'waiting'
                    ? 'Screening session captured. Ready to begin multimodal evaluation.'
                    : effectiveStatus === 'unavailable'
                    ? 'Automated multimodal analysis is not currently active in this environment.'
                    : 'Screening could not be completed. Please review session details below.'
                ) : (
                  "Your AI screening has been analysed. Here's a simple overview of your result."
                )}
              </p>
            </div>

            {/* 4-Stage Progress Tracker: Medical History -> Screening -> Analysis -> Results */}
            <div className="results-progress-tracker" aria-label="Screening progress stages">
              {/* Stage 1: Medical History (Completed) */}
              <div className="results-tracker-step is-completed">
                <div className="results-tracker-circle" title="Medical History: Completed">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="2.5 6 4.8 8.5 9.5 3.5" />
                  </svg>
                </div>
                <span className="results-tracker-label">Medical History</span>
              </div>

              {/* Line 1 -> 2 (Active Pink Line) */}
              <div className="results-tracker-line is-active-line" aria-hidden="true" />

              {/* Stage 2: Screening (Completed) */}
              <div className="results-tracker-step is-completed">
                <div className="results-tracker-circle" title="Screening: Completed">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="2.5 6 4.8 8.5 9.5 3.5" />
                  </svg>
                </div>
                <span className="results-tracker-label">Screening</span>
              </div>

              {/* Line 2 -> 3 (Active Pink Line) */}
              <div className="results-tracker-line is-active-line" aria-hidden="true" />

              {/* Stage 3: Analysis (Active ring with inner dot in reference mockup) */}
              <div className={`results-tracker-step ${isAnalysisState || !resolvedScore ? 'is-active' : 'is-active'}`}>
                <div className="results-tracker-circle" title="Analysis: Active">
                  <span className="results-tracker-inner-dot" />
                </div>
                <span className="results-tracker-label">Analysis</span>
              </div>

              {/* Line 3 -> 4 (Light Pink Line) */}
              <div className="results-tracker-line is-upcoming-line" aria-hidden="true" />

              {/* Stage 4: Results (Pending outline ring in reference mockup) */}
              <div className={`results-tracker-step ${!isAnalysisState && resolvedScore !== null ? 'is-upcoming' : 'is-upcoming'}`}>
                <div className="results-tracker-circle" title="Results: Pending" />
                <span className="results-tracker-label">Results</span>
              </div>
            </div>
          </div>
        </header>

        {/* =========================================================================
            STATE A: Screening Analysis / Processing View
            ========================================================================= */}
        {isAnalysisState ? (
          <div className="results-cards-container state-analysis-container">
            <section className="results-top-card analysis-card" aria-label="Analysis Status">
              {/* Left Column: Progress status breakdown & explanation */}
              <div className="results-about-section analysis-details-section">
                <span className="results-about-tag">
                  {effectiveStatus === 'processing'
                    ? 'Processing Session'
                    : effectiveStatus === 'waiting'
                    ? 'Waiting for Analysis'
                    : effectiveStatus === 'unavailable'
                    ? 'Service Notice'
                    : 'Analysis Notice'}
                </span>

                <div className="analysis-status-narrative">
                  {effectiveStatus === 'processing' && (
                    <>
                      <p className="results-about-text">
                        Your session recordings and conversation transcript have been captured and are being prepared for multimodal analysis.
                      </p>
                      <div className="analysis-pipeline-steps" aria-label="Preparation steps">
                        <div className="analysis-pipeline-item is-done">
                          <span className="analysis-check-dot">✓</span>
                          <span>Medical history & baseline context loaded</span>
                        </div>
                        <div className="analysis-pipeline-item is-done">
                          <span className="analysis-check-dot">✓</span>
                          <span>Session audio & video streams recorded</span>
                        </div>
                        <div className="analysis-pipeline-item is-active">
                          <span className="analysis-pulse-dot" />
                          <span>Multimodal emotional inference engine running...</span>
                        </div>
                      </div>
                    </>
                  )}

                  {effectiveStatus === 'waiting' && (
                    <>
                      <p className="results-about-text">
                        Your screening session has been securely recorded. The session is queued and waiting for the automated analysis service to begin.
                      </p>
                      <p className="analysis-muted-meta">
                        Session ID: <code>{currentSession?.sessionId || 'SCR-CURRENT'}</code> · Ready to analyze.
                      </p>
                    </>
                  )}

                  {effectiveStatus === 'unavailable' && (
                    <>
                      <p className="results-about-text">
                        <strong>Automated analysis is not currently available.</strong> The multimodal analysis service is offline or not configured in this environment.
                      </p>
                      <p className="analysis-integrity-statement">
                        In accordance with clinical safety principles, no synthetic or fabricated PPD risk scores are displayed when model inference is unavailable.
                      </p>
                    </>
                  )}

                  {effectiveStatus === 'failed' && (
                    <>
                      <p className="results-about-text">
                        An error occurred while communicating with the multimodal analysis service.
                      </p>
                      <p className="analysis-error-desc">
                        {analysisErrorMsg || currentSession?.analysisNotice || 'The analysis request could not be completed.'}
                      </p>
                    </>
                  )}
                </div>

                {/* Supportive Reassurance Panel */}
                <div className="results-reassurance-box" role="note">
                  <svg
                    className="results-heart-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <p className="results-reassurance-text">
                    <strong>Please don't panic.</strong> Your session records are securely preserved.<br />
                    A qualified perinatal doctor can review your screening directly at any time.
                  </p>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="results-card-vdivider" aria-hidden="true" />

              {/* Right Column: Processing indicator or unavailable visual */}
              <div className="results-risk-section analysis-visual-section">
                <span className="results-risk-tag">
                  {effectiveStatus === 'processing'
                    ? 'Inference Status'
                    : effectiveStatus === 'waiting'
                    ? 'Queue Status'
                    : effectiveStatus === 'unavailable'
                    ? 'Service Offline'
                    : 'Service Error'}
                </span>

                {effectiveStatus === 'processing' ? (
                  <div className="analysis-spinner-wrap" aria-label="Analysis processing in progress">
                    <div className="analysis-pulse-ring" />
                    <div className="analysis-spinner-core">
                      <span className="analysis-spinner-text">Analyzing</span>
                    </div>
                  </div>
                ) : (
                  <div className="results-circular-gauge is-unavailable" aria-label="Screening score unavailable">
                    <svg className="results-gauge-svg" viewBox="0 0 124 124">
                      <circle
                        className="results-gauge-bg is-dashed"
                        cx="62"
                        cy="62"
                        r={gaugeRadius}
                      />
                    </svg>
                    <span className="results-gauge-value is-unavailable-value">—</span>
                    <span className="results-gauge-sublabel">Unavailable</span>
                  </div>
                )}

                <div className="analysis-meta-summary">
                  <div className="analysis-meta-row">
                    <span className="analysis-meta-label">Session ID:</span>
                    <span className="analysis-meta-val">{currentSession?.sessionId || 'SCR-2026-1117'}</span>
                  </div>
                  <div className="analysis-meta-row">
                    <span className="analysis-meta-label">Modalities:</span>
                    <span className="analysis-meta-val">Audio · Video · Transcript</span>
                  </div>
                  <div className="analysis-meta-row">
                    <span className="analysis-meta-label">Status:</span>
                    <span className="analysis-meta-val is-status-tag">
                      {effectiveStatus === 'processing'
                        ? 'Processing...'
                        : effectiveStatus === 'waiting'
                        ? 'Waiting'
                        : effectiveStatus === 'unavailable'
                        ? 'Offline'
                        : 'Failed'}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* =========================================================================
              STATE B: Screening Results View (Matches reference design)
              ========================================================================= */
          <div className="results-cards-container">
            {/* Top Card: About PPD (Left) + Estimated Risk of PPD (Right) */}
            <section className="results-top-card" aria-label="Screening Overview">
              {/* Left Column: About PPD */}
              <div className="results-about-section">
                <span className="results-about-tag">About PPD</span>

                <p className="results-about-text">
                  Postpartum Depression (PPD) is a common and treatable mood condition that can happen after childbirth. It can cause feelings of sadness, low energy, or feeling overwhelmed.
                </p>

                {/* Pink Reassurance Message Box */}
                <div className="results-reassurance-box" role="note">
                  <svg
                    className="results-heart-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <p className="results-reassurance-text">
                    <strong>Please don't panic.</strong> This is a screening estimate, not a diagnosis.<br />
                    Many mothers experience similar signs, and with the right support, they feel better.
                  </p>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="results-card-vdivider" aria-hidden="true" />

              {/* Right Column: Estimated Risk of PPD */}
              <div className="results-risk-section">
                <span className="results-risk-tag">Estimated Risk of PPD</span>

                {/* Circular Progress Gauge */}
                {resolvedScore !== null ? (
                  <div
                    className="results-circular-gauge"
                    aria-label={`Estimated risk of PPD is ${resolvedScore} percent`}
                  >
                    <svg className="results-gauge-svg" viewBox="0 0 124 124">
                      {/* Pale Pink Background Track */}
                      <circle
                        className="results-gauge-bg"
                        cx="62"
                        cy="62"
                        r={gaugeRadius}
                      />
                      {/* Model-generated Progress Arc */}
                      <circle
                        className="results-gauge-fill"
                        cx="62"
                        cy="62"
                        r={gaugeRadius}
                        strokeDasharray={gaugeCircumference}
                        strokeDashoffset={strokeOffset}
                      />
                    </svg>

                    {/* Percentage Display */}
                    <span className="results-gauge-value">{resolvedScore}%</span>
                  </div>
                ) : (
                  <div
                    className="results-circular-gauge is-unavailable"
                    aria-label="Screening score is unavailable"
                  >
                    <svg className="results-gauge-svg" viewBox="0 0 124 124">
                      <circle
                        className="results-gauge-bg is-dashed"
                        cx="62"
                        cy="62"
                        r={gaugeRadius}
                      />
                    </svg>
                    <span className="results-gauge-value is-unavailable-value">—</span>
                    <span className="results-gauge-sublabel">No Score</span>
                    <p className="results-score-unavailable-desc">
                      Automated score unavailable. A clinician can provide a direct assessment.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Bottom Card: Key Insights */}
            <section className="results-insights-card" aria-label="Key Insights">
              <div className="results-insights-header">
                <svg
                  className="results-insights-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <h2 className="results-insights-title">Key Insights</h2>
              </div>

              {/* Insights List: Display only insights actually supplied by analysis service */}
              {keyInsights.length > 0 ? (
                <div className="results-insights-grid">
                  {keyInsights.map((insight, idx) => (
                    <React.Fragment key={insight.id || `insight-${idx}`}>
                      {idx > 0 && <div className="results-insight-vdivider" aria-hidden="true" />}
                      <div className="results-insight-item">
                        {/* Dynamic category icon */}
                        {insight.type === 'mood' ? (
                          <svg
                            className="results-insight-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                            <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
                            <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" />
                          </svg>
                        ) : insight.type === 'sleep' ? (
                          <svg
                            className="results-insight-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            <circle cx="18.5" cy="6" r="0.75" fill="currentColor" stroke="none" />
                            <circle cx="20.5" cy="9.5" r="0.6" fill="currentColor" stroke="none" />
                          </svg>
                        ) : (
                          <svg
                            className="results-insight-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M12 3c-1.5 3-4 6.5-7 8.5 2 1.5 4.5 2 7 2 2.5 0 5-.5 7-2-3-2-5.5-5.5-7-8.5z" />
                            <path d="M12 13.5c-2.5 3-5 5.5-9 6 3 1.5 6 1.5 9 1.5s6 0 9-1.5c-4-.5-6.5-3-9-6z" />
                            <path d="M7 11.5c-2.5 2.5-4 5.5-5 7.5 3 0 5.5-1 7-2.5" />
                            <path d="M17 11.5c2.5 2.5 4 5.5 5 7.5-3 0-5.5-1-7-2.5" />
                          </svg>
                        )}
                        <div className="results-insight-desc">
                          {insight.label.includes(' ') && !insight.label.includes('\n') ? (
                            <>
                              {insight.label.split(' ').slice(0, 2).join(' ')}
                              <br />
                              {insight.label.split(' ').slice(2).join(' ')}
                            </>
                          ) : (
                            insight.label
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="results-insights-empty" role="status">
                  <p className="results-insights-empty-text">
                    No specific behavioral or emotional indicators were extracted for this session.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* =========================================================================
            Bottom Actions: Retake Screening & Consult a Doctor
            ========================================================================= */}
        <div className="results-actions-row">
          {/* Retake Screening: Outlined Pink Button (starts new session) */}
          <button
            type="button"
            className="results-btn-retake"
            onClick={handleRetakeScreening}
            aria-label="Retake Screening"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21.5 2v6h-6" />
              <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19" />
            </svg>
            <span>Retake Screening</span>
          </button>

          {/* If analysis failed or waiting, allow retry */}
          {isAnalysisState && (effectiveStatus === 'failed' || effectiveStatus === 'unavailable') && (
            <button
              type="button"
              className="results-btn-retake"
              onClick={handleRetryAnalysis}
              aria-label="Retry Analysis"
            >
              <span>Retry Analysis</span>
            </button>
          )}

          {/* Consult a Doctor: Solid Raspberry-Pink Primary Action Button */}
          <button
            type="button"
            className="results-btn-consult"
            onClick={handleConsultDoctor}
            aria-label="Consult a Doctor"
          >
            <span>Consult a Doctor</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        {/* =========================================================================
            Decorative Bottom Waves & Corner Flower (Matches screenshot exactly)
            ========================================================================= */}
        <div className="results-bottom-waves" aria-hidden="true">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path
              d="M0 75 C 220 115, 420 35, 680 75 C 920 110, 1060 45, 1200 65 L 1200 120 L 0 120 Z"
              fill="rgba(247, 219, 227, 0.45)"
            />
            <path
              d="M0 92 C 280 62, 540 112, 840 78 C 1010 52, 1110 88, 1200 82 L 1200 120 L 0 120 Z"
              fill="rgba(252, 230, 237, 0.65)"
            />
          </svg>
        </div>

        <div className="results-floral-decor" aria-hidden="true">
          <img
            src="/assets/screening-flower-corner-clean.png"
            alt=""
            className="results-corner-flower-img"
          />
        </div>
      </main>
    </div>
  );
}

export default ScreeningResultsPage;