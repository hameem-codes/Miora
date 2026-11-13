import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import { PatientIcon } from '../components/PatientIcons.jsx';
import './reports.css';

export function PatientReportsPage() {
  const navigate = useNavigate();
  const {
    patient,
    screening,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    consultations,
    downloadReport,
    downloadToast,
  } = usePatient();

  const [activeTab, setActiveTab] = useState('overview');
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isEmptyStateDemo, setIsEmptyStateDemo] = useState(false);

  const unreadNotifs = (notifications || []).filter((n) => !n.read);

  // Gauge calculations for 64% risk circle (circumference = 2 * PI * r = 2 * PI * 38 = 238.76)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = isEmptyStateDemo || !screening ? 0 : screening.riskScore;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  // Trend chart points data
  const trendData = (!isEmptyStateDemo && screening?.trend) || [
    { week: 'Week 1', score: 42 },
    { week: 'Week 2', score: 50 },
    { week: 'Week 3', score: 58 },
    { week: 'Week 4', score: 64 },
  ];

  // SVG Chart sizing & mapping:
  const chartWidth = 265;
  const chartHeight = 115;
  const plotLeft = 24;
  const plotRight = 250;
  const plotTop = 10;
  const plotBottom = 92;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const points = trendData.map((d, i) => {
    const x = plotLeft + (i / (trendData.length - 1)) * plotW;
    const y = plotBottom - (d.score / 100) * plotH;
    return { ...d, x, y };
  });

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (pt.x - prev.x) / 2;
    const cpy1 = prev.y;
    const cpx2 = prev.x + (pt.x - prev.x) / 2;
    const cpy2 = pt.y;
    return `${acc} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${plotBottom} L ${points[0].x} ${plotBottom} Z`;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'bar-chart' },
    { id: 'screening', label: 'Screening Reports', icon: 'clipboard' },
    { id: 'consultations', label: 'Doctor Consultations', icon: 'calendar' },
    { id: 'mood', label: 'Mood Tracking', icon: 'trending-up' },
    { id: 'all-reports', label: 'All Reports', icon: 'file-text' },
  ];

  return (
    <div className="miora-reports-shell">
      {/* =========================================================================
          1. Left Sidebar (Matching other patient screens & Image 2)
          ========================================================================= */}
      <aside className="miora-reports-sidebar" aria-label="Patient Navigation">
        {/* Brand Header */}
        <div className="reports-sidebar-brand">
          <NavLink to="/patient/home" className="reports-brand-link">
            <span className="reports-brand-script">Miora</span>
          </NavLink>
          <span className="reports-brand-tagline">
            Maternal Emotional<br />Intelligence
          </span>
        </div>

        {/* Main Navigation */}
        <nav className="reports-sidebar-nav" aria-label="Main Menu">
          <ul className="reports-nav-list">
            <li className="reports-nav-item">
              <NavLink
                to="/patient/home"
                className={({ isActive }) =>
                  `reports-nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="reports-nav-icon">
                  <PatientIcon name="home" size={16} />
                </span>
                <span className="reports-nav-label">Home</span>
              </NavLink>
            </li>
            <li className="reports-nav-item">
              <NavLink
                to="/patient/medical-history"
                className={({ isActive }) =>
                  `reports-nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="reports-nav-icon">
                  <PatientIcon name="medical-history" size={16} />
                </span>
                <span className="reports-nav-label">Medical History</span>
              </NavLink>
            </li>
            <li className="reports-nav-item">
              <NavLink
                to="/patient/ai-screening"
                className={({ isActive }) =>
                  `reports-nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="reports-nav-icon">
                  <PatientIcon name="ai-screening" size={16} />
                </span>
                <span className="reports-nav-label">AI Screening</span>
              </NavLink>
            </li>
            <li className="reports-nav-item">
              <NavLink
                to="/patient/ai-assistant"
                className={({ isActive }) =>
                  `reports-nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="reports-nav-icon">
                  <PatientIcon name="ai-assistant" size={16} />
                </span>
                <span className="reports-nav-label">AI Assistant</span>
              </NavLink>
            </li>
            <li className="reports-nav-item">
              <NavLink
                to="/patient/connect-doctor"
                className={({ isActive }) =>
                  `reports-nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="reports-nav-icon">
                  <PatientIcon name="connect-doctor" size={16} />
                </span>
                <span className="reports-nav-label">Connect to a Doctor</span>
              </NavLink>
            </li>
            {/* My Reports (Active Highlight in Pink Rounded Background) */}
            <li className="reports-nav-item">
              <NavLink
                to="/patient/reports"
                className="reports-nav-link is-active"
                aria-current="page"
              >
                <span className="reports-nav-icon">
                  <PatientIcon name="reports" size={16} color="#d6336c" />
                </span>
                <span className="reports-nav-label">My Reports</span>
              </NavLink>
            </li>
            <li className="reports-nav-item">
              <NavLink
                to="/patient/care-suggestions"
                className={({ isActive }) =>
                  `reports-nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="reports-nav-icon">
                  <PatientIcon name="care-suggestions" size={16} />
                </span>
                <span className="reports-nav-label">Care Suggestions</span>
              </NavLink>
            </li>
          </ul>

          {/* Bottom links: Profile, Settings */}
          <div className="reports-sidebar-footer">
            <ul className="reports-nav-list">
              <li className="reports-nav-item">
                <NavLink
                  to="/patient/profile"
                  className={({ isActive }) =>
                    `reports-nav-link ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span className="reports-nav-icon">
                    <PatientIcon name="profile" size={16} />
                  </span>
                  <span className="reports-nav-label">Profile</span>
                </NavLink>
              </li>
              <li className="reports-nav-item">
                <NavLink
                  to="/patient/settings"
                  className={({ isActive }) =>
                    `reports-nav-link ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span className="reports-nav-icon">
                    <PatientIcon name="settings" size={16} />
                  </span>
                  <span className="reports-nav-label">Settings</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* =========================================================================
          2. Main Content Viewport
          ========================================================================= */}
      <main className="miora-reports-viewport" id="reports-content">
        {/* Header: Breadcrumb, Heading, Subtitle, Mother Illustration & User Profile */}
        <header className="reports-header-row">
          <div className="reports-header-text">
            {/* Breadcrumb: Home > My Reports */}
            <nav className="reports-breadcrumb" aria-label="Breadcrumb">
              <NavLink to="/patient/home" className="reports-breadcrumb-link">
                <PatientIcon name="home" size={12} color="#6c5a62" />
                <span>Home</span>
              </NavLink>
              <span className="reports-breadcrumb-sep" aria-hidden="true">›</span>
              <span className="reports-breadcrumb-current">My Reports</span>
            </nav>

            {/* Main Editorial Serif Heading & Subtitle */}
            <h1 className="reports-title">My Reports</h1>
            <p className="reports-subtitle">
              Track your screenings, consultations, and emotional well-being over time.
            </p>
          </div>

          {/* Mother and Baby Illustration Banner in Upper-Right Corner */}
          <div className="reports-header-illustration-wrap" aria-hidden="true">
            <img
              src="/assets/mother-baby-header-crop.png"
              alt=""
              className="reports-header-illustration"
            />
          </div>

          {/* Top-Right User Controls: Bell & Profile */}
          <div className="reports-header-actions">
            {/* Bell Icon Button */}
            <button
              type="button"
              className="reports-icon-btn"
              onClick={() => {
                setNotifDropdownOpen((prev) => !prev);
                setProfileDropdownOpen(false);
              }}
              aria-label={`Notifications ${unreadNotifs.length > 0 ? `(${unreadNotifs.length} unread)` : ''}`}
            >
              <PatientIcon name="bell" size={15} color="#3b2830" />
              {unreadNotifs.length > 0 && <span className="reports-notif-dot" />}
            </button>

            {/* Notifications Dropdown */}
            {notifDropdownOpen && (
              <div className="screening-dropdown-menu" style={{ right: 80, top: 44, width: 220 }}>
                <div className="screening-dropdown-header">
                  <span>Notifications</span>
                  {unreadNotifs.length > 0 && (
                    <button
                      type="button"
                      className="screening-link-btn"
                      onClick={markAllNotificationsRead}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="screening-notif-list">
                  {(notifications || []).map((n) => (
                    <div
                      key={n.id}
                      className={`screening-notif-item ${n.read ? 'is-read' : 'is-unread'}`}
                      onClick={() => markNotificationRead(n.id)}
                    >
                      <div className="screening-notif-title-row">
                        <strong>{n.title}</strong>
                        <small>{n.date}</small>
                      </div>
                      <p>{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Patient Profile Pill */}
            <button
              type="button"
              className="reports-profile-btn"
              onClick={() => {
                setProfileDropdownOpen((prev) => !prev);
                setNotifDropdownOpen(false);
              }}
              aria-expanded={profileDropdownOpen}
            >
              <span className="reports-avatar-badge">
                {patient?.avatarInitials || patient?.name?.[0] || 'S'}
              </span>
              <span className="reports-profile-name">{patient?.name || 'Sadiya'}</span>
              <PatientIcon name="chevron-down" size={11} color="#604e55" />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="screening-dropdown-menu" style={{ right: 0, top: 44, width: 200 }}>
                <div className="screening-profile-menu-info">
                  <strong>{patient?.fullName || 'Sadiya Rahman'}</strong>
                  <small>{patient?.email || 'sadiya@miora.health'}</small>
                </div>
                <hr className="screening-menu-divider" />
                <button
                  type="button"
                  className="screening-link-btn"
                  style={{ textAlign: 'left', padding: '6px 8px', width: '100%' }}
                  onClick={() => setIsEmptyStateDemo((prev) => !prev)}
                >
                  {isEmptyStateDemo ? 'Show Sample Reports' : 'Simulate Empty State'}
                </button>
                <NavLink to="/patient/profile" className="screening-menu-link">
                  Profile Settings
                </NavLink>
                <NavLink to="/dashboard" className="screening-menu-link">
                  Doctor Portal
                </NavLink>
                <NavLink to="/login" className="screening-menu-link">
                  Sign Out
                </NavLink>
              </div>
            )}
          </div>
        </header>

        {/* =========================================================================
            3. Exactly Five Navigation Tabs in One Horizontal Row
            ========================================================================= */}
        <div className="reports-tabs-bar" role="tablist" aria-label="Reports categories">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`reports-tab-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="reports-tab-icon">
                  <PatientIcon
                    name={tab.icon}
                    size={14}
                    color={isActive ? '#ffffff' : '#d6336c'}
                  />
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            4. Dashboard Cards Layout Matching Image 2
            ========================================================================= */}
        {activeTab === 'overview' && (
          <>
            {isEmptyStateDemo ? (
              <div className="reports-empty-state">
                <div className="empty-state-icon">
                  <PatientIcon name="clipboard" size={24} color="#d6336c" />
                </div>
                <h2 className="empty-state-title">No Screening Reports Yet</h2>
                <p className="empty-state-desc">
                  You haven't completed any emotional wellbeing screenings yet. Complete a gentle 5-minute
                  conversational session with Miora AI to generate your first detailed assessment.
                </p>
                <button
                  type="button"
                  className="empty-state-btn"
                  onClick={() => navigate('/patient/ai-screening')}
                >
                  Start AI Screening Session
                </button>
              </div>
            ) : (
              <div className="reports-dashboard-body">
                {/* Left & Centre Main Columns (Top row: Card 1 + Card 2; Bottom row: Card 4 + Card 5 + Card 6) */}
                <div className="reports-left-column">
                  {/* Top Row: Left (Latest Screening Result) + Centre (Emotional Well-being Trend) */}
                  <div className="reports-row-1">
                    {/* Card 1: Latest Screening Result */}
                    <section className="reports-card card-latest-screening" aria-label="Latest Screening Result">
                      <div className="reports-card-header">
                        <h2 className="reports-card-title">Latest Screening Result</h2>
                        <p className="reports-card-subtitle">
                          Completed on {screening?.date || '17 Nov 2026'}
                        </p>
                      </div>

                      <div className="latest-screening-content">
                        {/* Circular Pink Progress Indicator */}
                        <div className="screening-gauge-wrap" aria-label={`Risk score: ${scorePercent}%`}>
                          <svg className="screening-gauge-svg" viewBox="0 0 100 100">
                            <defs>
                              <linearGradient id="screeningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#e72c73" />
                                <stop offset="100%" stopColor="#f06292" />
                              </linearGradient>
                            </defs>
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              className="screening-gauge-track"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              className="screening-gauge-fill"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                            />
                          </svg>
                          <div className="screening-gauge-center">
                            <span className="screening-score-num">{scorePercent}%</span>
                            <span className="screening-score-label">Risk Score</span>
                          </div>
                        </div>

                        {/* Details Beside Circle */}
                        <div className="screening-details-wrap">
                          <span className="screening-risk-pill">
                            {screening?.riskLabel || 'Moderate Risk for PPD'}
                          </span>
                          <p className="screening-desc-text">
                            {screening?.summary ||
                              'Some signs of postpartum depression were observed. We recommend consulting a healthcare professional.'}
                          </p>
                          <button
                            type="button"
                            className="screening-discuss-btn"
                            onClick={() => navigate('/patient/connect-doctor')}
                          >
                            <PatientIcon name="stethoscope" size={13} color="#ffffff" />
                            <span>Discuss with a Doctor</span>
                            <PatientIcon name="arrow-right" size={12} color="#ffffff" />
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* Card 2: Emotional Well-being Trend (Centre Card) */}
                    <section className="reports-card card-trend" aria-label="Emotional Well-being Trend">
                      <div className="reports-card-header">
                        <h2 className="reports-card-title">Emotional Well-being Trend</h2>
                      </div>

                      <div className="trend-chart-wrap">
                        <svg className="trend-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#f8bbd0" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Vertical Scale (0 to 100) & Gridlines */}
                          {[100, 80, 60, 40, 20, 0].map((val) => {
                            const y = plotBottom - (val / 100) * plotH;
                            return (
                              <g key={val}>
                                <text x={plotLeft - 6} y={y + 3} textAnchor="end" className="trend-axis-label">
                                  {val}
                                </text>
                                <line
                                  x1={plotLeft}
                                  y1={y}
                                  x2={plotRight}
                                  y2={y}
                                  className="trend-grid-line"
                                />
                              </g>
                            );
                          })}

                          {/* Subtle Pink Chart Shading */}
                          <path d={areaD} fill="url(#trendGradient)" />

                          {/* Thin Pink Trend Line */}
                          <path d={pathD} className="trend-line" />

                          {/* Circular Markers and Week Labels */}
                          {points.map((pt, idx) => (
                            <g key={pt.week}>
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={hoveredPoint === idx ? 5 : 3.5}
                                className="trend-point"
                                onMouseEnter={() => setHoveredPoint(idx)}
                                onMouseLeave={() => setHoveredPoint(null)}
                              />
                              <text
                                x={pt.x}
                                y={plotBottom + 14}
                                textAnchor="middle"
                                className="trend-axis-label"
                                style={{ fontWeight: hoveredPoint === idx ? 700 : 500 }}
                              >
                                {pt.week}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    </section>
                  </div>

                  {/* Bottom Row: Key Insights (Left) + Assessment Summary (Centre) + Next Steps (Right) */}
                  <div className="reports-row-2">
                    {/* Card 4: Key Insights */}
                    <section className="reports-card card-key-insights" aria-label="Key Insights">
                      <div className="reports-card-header">
                        <div className="reports-card-title-row">
                          <span className="reports-card-title-icon">
                            <PatientIcon name="target" size={15} color="#d6336c" />
                          </span>
                          <h2 className="reports-card-title">Key Insights</h2>
                        </div>
                      </div>

                      <div className="insights-list">
                        <div className="insight-row">
                          <span className="insight-icon">
                            <PatientIcon name="frown" size={14} color="#d6336c" />
                          </span>
                          <div className="insight-text-group">
                            <strong className="insight-label">Mood:</strong>
                            <span className="insight-val">
                              {screening?.insights?.mood || 'Low to moderate'}
                            </span>
                          </div>
                        </div>

                        <div className="insight-row">
                          <span className="insight-icon">
                            <PatientIcon name="moon" size={14} color="#d6336c" />
                          </span>
                          <div className="insight-text-group">
                            <strong className="insight-label">Sleep:</strong>
                            <span className="insight-val">
                              {screening?.insights?.sleep || 'Disturbed'}
                            </span>
                          </div>
                        </div>

                        <div className="insight-row">
                          <span className="insight-icon">
                            <PatientIcon name="lightning" size={14} color="#d6336c" />
                          </span>
                          <div className="insight-text-group">
                            <strong className="insight-label">Stress:</strong>
                            <span className="insight-val">
                              {screening?.insights?.stress || 'Elevated'}
                            </span>
                          </div>
                        </div>

                        <div className="insight-row">
                          <span className="insight-icon">
                            <PatientIcon name="heart" size={14} color="#d6336c" />
                          </span>
                          <div className="insight-text-group">
                            <strong className="insight-label">Support:</strong>
                            <span className="insight-val">
                              {screening?.insights?.support || 'Recommended'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Card 5: Assessment Summary */}
                    <section className="reports-card card-assessment-summary" aria-label="Assessment Summary">
                      <div className="reports-card-header">
                        <div className="reports-card-title-row">
                          <span className="reports-card-title-icon">
                            <PatientIcon name="clipboard" size={15} color="#d6336c" />
                          </span>
                          <h2 className="reports-card-title">Assessment Summary</h2>
                        </div>
                      </div>

                      <div className="summary-bars-list">
                        <div className="summary-bar-row">
                          <span className="summary-bar-label">Emotional Signs</span>
                          <div className="summary-bar-track">
                            <div
                              className="summary-bar-fill"
                              style={{
                                width: `${screening?.assessmentSummary?.emotionalSigns || 68}%`,
                              }}
                            />
                          </div>
                          <span className="summary-bar-val">
                            {screening?.assessmentSummary?.emotionalSigns || 68}%
                          </span>
                        </div>

                        <div className="summary-bar-row">
                          <span className="summary-bar-label">Cognitive Signs</span>
                          <div className="summary-bar-track">
                            <div
                              className="summary-bar-fill"
                              style={{
                                width: `${screening?.assessmentSummary?.cognitiveSigns || 62}%`,
                              }}
                            />
                          </div>
                          <span className="summary-bar-val">
                            {screening?.assessmentSummary?.cognitiveSigns || 62}%
                          </span>
                        </div>

                        <div className="summary-bar-row">
                          <span className="summary-bar-label">Behavioural Signs</span>
                          <div className="summary-bar-track">
                            <div
                              className="summary-bar-fill"
                              style={{
                                width: `${screening?.assessmentSummary?.behaviouralSigns || 58}%`,
                              }}
                            />
                          </div>
                          <span className="summary-bar-val">
                            {screening?.assessmentSummary?.behaviouralSigns || 58}%
                          </span>
                        </div>

                        <div className="summary-bar-row">
                          <span className="summary-bar-label">Physical Indicators</span>
                          <div className="summary-bar-track">
                            <div
                              className="summary-bar-fill"
                              style={{
                                width: `${screening?.assessmentSummary?.physicalIndicators || 46}%`,
                              }}
                            />
                          </div>
                          <span className="summary-bar-val">
                            {screening?.assessmentSummary?.physicalIndicators || 46}%
                          </span>
                        </div>
                      </div>
                    </section>

                    {/* Card 6: Next Steps */}
                    <section className="reports-card card-next-steps" aria-label="Next Steps">
                      <div className="reports-card-header">
                        <div className="reports-card-title-row">
                          <span className="reports-card-title-icon">
                            <PatientIcon name="flag" size={15} color="#d6336c" />
                          </span>
                          <h2 className="reports-card-title">Next Steps</h2>
                        </div>
                      </div>

                      <div className="next-steps-list">
                        <NavLink to="/patient/connect-doctor" className="next-step-item">
                          <div className="next-step-left">
                            <span className="next-step-icon">
                              <PatientIcon name="calendar" size={13} color="#d6336c" />
                            </span>
                            <span>Book a follow-up consultation</span>
                          </div>
                          <span className="next-step-chevron">
                            <PatientIcon name="chevron-right" size={12} color="#948088" />
                          </span>
                        </NavLink>

                        <NavLink to="/patient/care-suggestions" className="next-step-item">
                          <div className="next-step-left">
                            <span className="next-step-icon">
                              <PatientIcon name="sprout" size={13} color="#d6336c" />
                            </span>
                            <span>Try recommended self-care plan</span>
                          </div>
                          <span className="next-step-chevron">
                            <PatientIcon name="chevron-right" size={12} color="#948088" />
                          </span>
                        </NavLink>

                        <NavLink to="/patient/ai-screening" className="next-step-item">
                          <div className="next-step-left">
                            <span className="next-step-icon">
                              <PatientIcon name="bell" size={13} color="#d6336c" />
                            </span>
                            <span>Retake screening (in 2 weeks)</span>
                          </div>
                          <span className="next-step-chevron">
                            <PatientIcon name="chevron-right" size={12} color="#948088" />
                          </span>
                        </NavLink>
                      </div>
                    </section>
                  </div>
                </div>

                {/* Right Column: Card 3 Download Reports (Narrower right-side column) */}
                <aside className="reports-right-column">
                  <section className="reports-card card-download-reports" aria-label="Download Reports">
                    <div className="reports-card-header">
                      <h2 className="reports-card-title">Download Reports</h2>
                    </div>

                    <div className="download-reports-list">
                      {(screening?.reports || []).map((rep) => {
                        let iconName = 'file-text';
                        if (rep.type === 'wav') iconName = 'waveform';
                        if (rep.type === 'mp4') iconName = 'video';

                        return (
                          <div key={rep.id} className="download-report-item">
                            <div className="report-file-left">
                              <span className="report-icon-box">
                                <PatientIcon name={iconName} size={14} color="#c73566" />
                              </span>
                              <div className="report-text-info">
                                <span className="report-file-title">{rep.title}</span>
                                <span className="report-file-meta">
                                  {rep.format} ({rep.size})
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="report-download-btn"
                              onClick={() => downloadReport(rep)}
                              aria-label={`Download ${rep.title}`}
                              title={`Download ${rep.title}`}
                            >
                              <PatientIcon name="download" size={14} color="#c73566" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </aside>
              </div>
            )}
          </>
        )}

        {/* =========================================================================
            5. Tab Content: Screening Reports
            ========================================================================= */}
        {activeTab === 'screening' && (
          <div className="reports-tab-view">
            <h2 className="tab-view-heading">Screening Reports History</h2>
            <p className="tab-view-sub">
              Access and download full diagnostic screening summaries, risk analyses, and multimodal transcripts.
            </p>

            <div className="download-reports-list" style={{ maxWidth: 600 }}>
              {(screening?.reports || []).map((rep) => (
                <div key={rep.id} className="download-report-item" style={{ border: '1px solid #f2dde4', padding: '10px 14px' }}>
                  <div className="report-file-left">
                    <span className="report-icon-box" style={{ width: 30, height: 30 }}>
                      <PatientIcon name={rep.type === 'wav' ? 'waveform' : rep.type === 'mp4' ? 'video' : 'clipboard'} size={16} />
                    </span>
                    <div className="report-text-info">
                      <strong className="report-file-title" style={{ fontSize: 12.5 }}>{rep.title}</strong>
                      <span className="report-file-meta">
                        Generated on {screening.date} · {rep.format.toUpperCase()} ({rep.size}) · Authorized
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="screening-discuss-btn"
                    style={{ margin: 0, padding: '5px 12px' }}
                    onClick={() => downloadReport(rep)}
                  >
                    <PatientIcon name="download" size={13} color="#ffffff" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            6. Tab Content: Doctor Consultations
            ========================================================================= */}
        {activeTab === 'consultations' && (
          <div className="reports-tab-view">
            <h2 className="tab-view-heading">Doctor Consultations &amp; Care Notes</h2>
            <p className="tab-view-sub">
              Direct telehealth consultations and clinical summaries coordinated with Dr. Elena Rostova.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
              {(consultations || []).map((c) => (
                <div key={c.id} style={{ border: '1px solid #f2dde4', borderRadius: 10, padding: 14, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontSize: 13 }}>{c.doctorName}</strong>
                    <span className="screening-risk-pill" style={{ background: c.status === 'Scheduled' ? '#e8f5e9' : '#fce4ec', color: c.status === 'Scheduled' ? '#2e7d32' : '#c73566' }}>
                      {c.status}
                    </span>
                  </div>
                  <p style={{ margin: '3px 0', fontSize: 12, color: '#5f4d54' }}>
                    {c.clinic} · {c.date} at {c.time} ({c.type})
                  </p>
                  {c.summary && (
                    <p style={{ margin: '6px 0 0 0', fontSize: 11.5, color: '#332228', background: '#fdf5f7', padding: '6px 10px', borderRadius: 6 }}>
                      Note: {c.summary}
                    </p>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="screening-discuss-btn"
                style={{ alignSelf: 'flex-start', marginTop: 6 }}
                onClick={() => navigate('/patient/connect-doctor')}
              >
                <PatientIcon name="calendar" size={13} color="#ffffff" />
                <span>Schedule New Consultation</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            7. Tab Content: Mood Tracking
            ========================================================================= */}
        {activeTab === 'mood' && (
          <div className="reports-tab-view">
            <h2 className="tab-view-heading">Mood &amp; Emotional State Tracking</h2>
            <p className="tab-view-sub">
              Continuous trend observations across acoustic prosody, conversational markers, and self-checkins.
            </p>

            <div style={{ maxWidth: 550 }}>
              <div className="reports-card" style={{ marginBottom: 14 }}>
                <h3 className="reports-card-title" style={{ marginBottom: 10 }}>Weekly Wellbeing Progress</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #fae2eb', paddingBottom: 6, fontSize: 11.5, fontWeight: 600 }}>
                  <span>Check-in Period</span>
                  <span>Distress Score</span>
                  <span>Status</span>
                </div>
                {trendData.map((d) => (
                  <div key={d.week} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fdf0f4', fontSize: 12 }}>
                    <span>{d.week}</span>
                    <strong style={{ color: '#d6336c' }}>{d.score}%</strong>
                    <span style={{ color: d.score > 60 ? '#c73566' : '#2e7d32' }}>
                      {d.score > 60 ? 'Moderate Alert' : 'Mild Strain'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            8. Tab Content: All Reports
            ========================================================================= */}
        {activeTab === 'all-reports' && (
          <div className="reports-tab-view">
            <h2 className="tab-view-heading">All Authorized Clinical Documents</h2>
            <p className="tab-view-sub">
              Complete archive of secure reports, transcripts, and multimedia recordings for patient {patient.name}.
            </p>

            <div className="download-reports-list" style={{ maxWidth: 650 }}>
              {(screening?.reports || []).map((rep) => (
                <div key={rep.id} className="download-report-item" style={{ border: '1px solid #f2dde4', padding: '10px 14px' }}>
                  <div className="report-file-left">
                    <span className="report-icon-box" style={{ width: 30, height: 30 }}>
                      <PatientIcon name={rep.type === 'wav' ? 'waveform' : rep.type === 'mp4' ? 'video' : 'clipboard'} size={16} />
                    </span>
                    <div className="report-text-info">
                      <strong className="report-file-title" style={{ fontSize: 12.5 }}>{rep.title}</strong>
                      <span className="report-file-meta">
                        {rep.filename} · {rep.size} · Access: Confidential (Patient Authorized)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="screening-discuss-btn"
                    style={{ margin: 0, padding: '5px 12px' }}
                    onClick={() => downloadReport(rep)}
                  >
                    <PatientIcon name="download" size={13} color="#ffffff" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom floral accent wave */}
        <div className="reports-bottom-wave" aria-hidden="true" />

        {/* Toast Notification */}
        {downloadToast && (
          <div
            className={`reports-toast-banner ${
              downloadToast.type === 'success' ? 'is-success' : 'is-error'
            }`}
            role="status"
          >
            <span>{downloadToast.message}</span>
          </div>
        )}
      </main>
    </div>
  );
}

export default PatientReportsPage;
