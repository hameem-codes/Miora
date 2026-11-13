import React, { useMemo } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useClinicalData } from '../../dashboard/context/ClinicalContext.jsx';
import { getCurrentUser } from '../../auth/authService.js';
import { BrandWordmark } from '../../dashboard/components/BrandWordmark.jsx';
import './screening-results.css';

export function ScreeningResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clinical = useClinicalData();

  // Retrieve current authenticated user or fallback to reference patient "Sadiya"
  const currentUser = getCurrentUser();
  const patientName = currentUser?.name || 'Sadiya';
  const avatarLetter = patientName.trim().charAt(0).toUpperCase() || 'S';

  // Retrieve screening data dynamically without hardcoding
  // Priority: 1. query param ?score=.. / ?mother=..
  //           2. clinical context screening (e.g. M-108 which contains 0.64 / 64%)
  //           3. default model estimate (64%)
  const riskPercentage = useMemo(() => {
    const paramScore = searchParams.get('score');
    if (paramScore && !isNaN(Number(paramScore))) {
      const val = Number(paramScore);
      return val <= 1 ? Math.round(val * 100) : Math.round(val);
    }

    const motherParam = searchParams.get('mother') || 'M-108';
    const match = clinical?.screenings?.find(
      (s) => s.motherId?.toLowerCase() === motherParam.toLowerCase()
    );

    if (match) {
      if (Array.isArray(match.riskHistory) && match.riskHistory.length > 0) {
        const lastEntry = match.riskHistory[match.riskHistory.length - 1];
        if (typeof lastEntry.score === 'number') {
          return Math.round(lastEntry.score * 100);
        }
      }
      if (typeof match.combinedScore === 'number') {
        return Math.round(match.combinedScore * 100);
      }
    }

    return 64;
  }, [searchParams, clinical]);

  // SVG circular gauge calculation
  const gaugeRadius = 50;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius; // ~314.16
  const strokeOffset = gaugeCircumference * (1 - Math.min(Math.max(riskPercentage, 0), 100) / 100);

  return (
    <div className="miora-results-shell">
      {/* =========================================================================
          1. Left Sidebar: Logo, Tagline, Navigation & Footer Items
          ========================================================================= */}
      <aside className="miora-results-sidebar" aria-label="Miora Navigation">
        <div className="results-sidebar-brand">
          <NavLink to="/" className="results-brand-link" aria-label="Miora Home">
            <BrandWordmark className="results-brand-mark" />
          </NavLink>
          <div className="results-brand-tagline">
            Maternal Emotional<br />Intelligence
          </div>
          <div className="results-brand-divider" aria-hidden="true" />
        </div>

        <nav className="results-sidebar-nav">
          <ul className="results-nav-list">
            {/* Home */}
            <li className="results-nav-item">
              <NavLink to="/patient/dashboard" className="results-nav-link">
                <span className="results-nav-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
                    <path d="M9.5 21v-7h5v7" />
                  </svg>
                </span>
                <span className="results-nav-label">Home</span>
              </NavLink>
            </li>

            {/* Medical History */}
            <li className="results-nav-item">
              <NavLink to="/medical-history" className="results-nav-link">
                <span className="results-nav-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                </span>
                <span className="results-nav-label">Medical History</span>
              </NavLink>
            </li>

            {/* AI Screening (ACTIVE HIGHLIGHT) */}
            <li className="results-nav-item">
              <NavLink to="/screening-results" className="results-nav-link is-active" aria-current="page">
                <span className="results-nav-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z" />
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
                  </svg>
                </span>
                <span className="results-nav-label">AI Screening</span>
              </NavLink>
            </li>

            {/* Voice Assistant */}
            <li className="results-nav-item">
              <NavLink to="/ai-assistant" className="results-nav-link">
                <span className="results-nav-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <circle cx="8" cy="10" r="1" fill="currentColor" />
                    <circle cx="12" cy="10" r="1" fill="currentColor" />
                    <circle cx="16" cy="10" r="1" fill="currentColor" />
                  </svg>
                </span>
                <span className="results-nav-label">Voice Assistant</span>
              </NavLink>
            </li>

            {/* My Reports */}
            <li className="results-nav-item">
              <NavLink to="/patient/reports" className="results-nav-link">
                <span className="results-nav-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <span className="results-nav-label">My Reports</span>
              </NavLink>
            </li>

            {/* Care Suggestions */}
            <li className="results-nav-item">
              <NavLink to="/patient/care-suggestions" className="results-nav-link">
                <span className="results-nav-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </span>
                <span className="results-nav-label">Care Suggestions</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer: Profile, Settings */}
        <div className="results-sidebar-footer">
          <NavLink to="/patient/reports" className="results-nav-link">
            <span className="results-nav-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span className="results-nav-label">Profile</span>
          </NavLink>

          <NavLink to="/patient/reports" className="results-nav-link">
            <span className="results-nav-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span className="results-nav-label">Settings</span>
          </NavLink>
        </div>
      </aside>

      {/* =========================================================================
          2. Main Content Viewport
          ========================================================================= */}
      <main className="miora-results-viewport">
        {/* Top Header Row */}
        <header className="results-top-header">
          <div className="results-header-left">
            {/* Breadcrumb: Home > AI Screening > Results */}
            <nav className="results-breadcrumb" aria-label="Breadcrumb">
              <NavLink to="/" className="results-breadcrumb-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
                  <path d="M9.5 21v-7h5v7" />
                </svg>
                <span>Home</span>
              </NavLink>
              <span className="results-breadcrumb-sep" aria-hidden="true">›</span>
              <NavLink to="/screening-results" className="results-breadcrumb-link">
                <span>AI Screening</span>
              </NavLink>
              <span className="results-breadcrumb-sep" aria-hidden="true">›</span>
              <span className="results-breadcrumb-current" aria-current="page">Results</span>
            </nav>

            {/* Screen Title & Subtitle */}
            <h1 className="results-main-heading">Screening Results</h1>
            <p className="results-main-subtitle">
              Your AI screening has been analysed. Here's a simple overview of your result.
            </p>
          </div>

          <div className="results-header-right">
            {/* 4-Stage Progress Tracker */}
            <div className="results-progress-tracker" aria-label="Screening progress stages">
              {/* Stage 1: Medical History (Completed) */}
              <div className="results-tracker-step is-completed">
                <div className="results-tracker-circle">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="2.5 6 4.8 8.5 9.5 3.5" />
                  </svg>
                </div>
                <span className="results-tracker-label">Medical History</span>
              </div>

              {/* Connector line 1 -> 2 */}
              <div className="results-tracker-line is-active-line" aria-hidden="true" />

              {/* Stage 2: Screening (Completed) */}
              <div className="results-tracker-step is-completed">
                <div className="results-tracker-circle">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="2.5 6 4.8 8.5 9.5 3.5" />
                  </svg>
                </div>
                <span className="results-tracker-label">Screening</span>
              </div>

              {/* Connector line 2 -> 3 */}
              <div className="results-tracker-line is-active-line" aria-hidden="true" />

              {/* Stage 3: Analysis (Active ring with inner dot) */}
              <div className="results-tracker-step is-active">
                <div className="results-tracker-circle">
                  <span className="results-tracker-inner-dot" />
                </div>
                <span className="results-tracker-label">Analysis</span>
              </div>

              {/* Connector line 3 -> 4 */}
              <div className="results-tracker-line is-upcoming-line" aria-hidden="true" />

              {/* Stage 4: Results (Upcoming empty outline) */}
              <div className="results-tracker-step is-upcoming">
                <div className="results-tracker-circle" />
                <span className="results-tracker-label">Results</span>
              </div>
            </div>

            {/* Notification & User Profile Controls */}
            <div className="results-user-controls">
              {/* Bell Icon */}
              <button
                type="button"
                className="results-notif-btn"
                aria-label="Notifications"
                title="Notifications"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>

              {/* Patient Avatar Pill */}
              <div className="results-profile-pill">
                <span className="results-avatar-circle" aria-hidden="true">
                  {avatarLetter}
                </span>
                <span className="results-profile-name">{patientName}</span>
                <svg className="results-profile-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* Content Cards */}
        <div className="results-cards-container">
          {/* Card 1: About PPD (Left) + Estimated Risk of PPD (Right) */}
          <section className="results-top-card" aria-label="Screening Overview">
            {/* Left section: About PPD */}
            <div className="results-about-section">
              <span className="results-about-tag">About PPD</span>

              <p className="results-about-text">
                Postpartum Depression (PPD) is a common and treatable mood condition that can happen after childbirth. It can cause feelings of sadness, low energy, or feeling overwhelmed.
              </p>

              {/* Pink Reassurance Message Box */}
              <div className="results-reassurance-box" role="note">
                <svg className="results-heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

            {/* Right section: Estimated Risk of PPD */}
            <div className="results-risk-section">
              <h2 className="results-risk-heading">Estimated Risk of PPD</h2>

              {/* Compact Circular Progress Indicator */}
              <div className="results-circular-gauge" aria-label={`Estimated risk of PPD is ${riskPercentage} percent`}>
                <svg className="results-gauge-svg" viewBox="0 0 124 124">
                  {/* Background Track Circle */}
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
                <span className="results-gauge-value">{riskPercentage}%</span>
              </div>
            </div>
          </section>

          {/* Card 2: Key Insights */}
          <section className="results-insights-card" aria-label="Key Insights">
            <div className="results-insights-header">
              <svg className="results-insights-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <h2 className="results-insights-title">Key Insights</h2>
            </div>

            <div className="results-insights-grid">
              {/* Insight 1: Mood changes observed */}
              <div className="results-insight-item">
                <svg className="results-insight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                  <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
                  <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" />
                </svg>
                <div className="results-insight-desc">
                  Mood changes<br />observed
                </div>
              </div>

              {/* Divider */}
              <div className="results-insight-vdivider" aria-hidden="true" />

              {/* Insight 2: Sleep disturbances reported */}
              <div className="results-insight-item">
                <svg className="results-insight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  <circle cx="18.5" cy="6" r="0.75" fill="currentColor" stroke="none" />
                  <circle cx="20.5" cy="9.5" r="0.6" fill="currentColor" stroke="none" />
                </svg>
                <div className="results-insight-desc">
                  Sleep disturbances<br />reported
                </div>
              </div>

              {/* Divider */}
              <div className="results-insight-vdivider" aria-hidden="true" />

              {/* Insight 3: Higher emotional sensitivity noted */}
              <div className="results-insight-item">
                <svg className="results-insight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3c-1.5 3-4 6.5-7 8.5 2 1.5 4.5 2 7 2 2.5 0 5-.5 7-2-3-2-5.5-5.5-7-8.5z" />
                  <path d="M12 13.5c-2.5 3-5 5.5-9 6 3 1.5 6 1.5 9 1.5s6 0 9-1.5c-4-.5-6.5-3-9-6z" />
                  <path d="M7 11.5c-2.5 2.5-4 5.5-5 7.5 3 0 5.5-1 7-2.5" />
                  <path d="M17 11.5c2.5 2.5 4 5.5 5 7.5-3 0-5.5-1-7-2.5" />
                </svg>
                <div className="results-insight-desc">
                  Higher emotional<br />sensitivity noted
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 4. Bottom Action Buttons */}
        <div className="results-actions-row">
          {/* Retake Screening: Outlined Pink Button */}
          <button
            type="button"
            className="results-btn-retake"
            onClick={() => navigate('/screening')}
            aria-label="Retake Screening"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21.5 2v6h-6" />
              <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19" />
            </svg>
            <span>Retake Screening</span>
          </button>

          {/* View Care Plan: Secondary Pink Button */}
          <button
            type="button"
            className="results-btn-retake"
            onClick={() => navigate('/patient/care-suggestions')}
            aria-label="Explore Care Plan"
          >
            <span>Explore Care Plan</span>
          </button>

          {/* Consult a Doctor: Solid Raspberry-Pink Button */}
          <button
            type="button"
            className="results-btn-consult"
            onClick={() => navigate('/patient/reports?tab=consultations')}
            aria-label="Consult a Doctor"
          >
            <span>Consult a Doctor</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {/* 5. Bottom Decorative Waves */}
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

        {/* Bottom Corner Floral Decoration */}
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
