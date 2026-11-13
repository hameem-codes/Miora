import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import { PatientIcon } from '../components/PatientIcons.jsx';
import './care-suggestions.css';

export function CareSuggestionsPage() {
  const navigate = useNavigate();
  const {
    patient,
    screening,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    carePlan,
    toggleCareTask,
  } = usePatient();

  const [activeTab, setActiveTab] = useState('care-plan');
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Modals for interactive actions
  const [activeModal, setActiveModal] = useState(null); // 'breathing' | 'sleep' | 'journaling'
  const [journalEntry, setJournalEntry] = useState('');

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const unreadNotifs = (notifications || []).filter((n) => !n.read);

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

  // Tasks from patient context
  const tasks = carePlan?.tasks || [
    { id: 'task-1', title: 'Breathing exercise', completed: true },
    { id: 'task-2', title: 'Mood check-in', completed: true },
    { id: 'task-3', title: 'Sleep routine', completed: true },
    { id: 'task-4', title: 'Journaling', completed: false },
    { id: 'task-5', title: 'Light activity', completed: false },
    { id: 'task-6', title: 'Self-care time', completed: false },
    { id: 'task-7', title: 'Reflection', completed: false },
  ];

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  // Circular gauge calculations
  // radius = 36, circumference = 2 * PI * 36 = 226.19
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalTasks > 0 ? completedCount / totalTasks : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Tabs configuration
  const tabs = [
    { id: 'care-plan', label: 'My Care Plan', icon: 'feather-leaf' },
    { id: 'self-care', label: 'Self-Care', icon: 'lotus' },
    { id: 'mood-support', label: 'Mood Support', icon: 'smile-face' },
    { id: 'lifestyle', label: 'Lifestyle', icon: 'apple' },
    { id: 'resources', label: 'Resources', icon: 'book-open' },
  ];

  const handleStartBreathing = () => {
    setActiveModal('breathing');
  };

  const handleCompleteBreathing = () => {
    const breathingTask = tasks.find((t) => t.id === 'task-1');
    if (breathingTask && !breathingTask.completed) {
      toggleCareTask('task-1');
    }
    setActiveModal(null);
  };

  const handleSaveJournal = () => {
    if (journalEntry.trim()) {
      const journalTask = tasks.find((t) => t.id === 'task-4');
      if (journalTask && !journalTask.completed) {
        toggleCareTask('task-4');
      }
    }
    setActiveModal(null);
    setJournalEntry('');
  };

  const riskDisplay = screening?.riskLabel
    ? screening.riskLabel.replace(' for PPD', '')
    : 'Moderate Risk';

  return (
    <div className="miora-care-shell">
      {/* =========================================================================
          1. Left Sidebar (160px width)
          ========================================================================= */}
      <aside className="miora-care-sidebar" aria-label="Patient Navigation">
        {/* Brand Header */}
        <div className="care-sidebar-brand">
          <NavLink to="/patient/home" className="care-brand-link">
            <span className="care-brand-script">Miora</span>
          </NavLink>
          <span className="care-brand-tagline">Maternal Emotional<br />Intelligence</span>
        </div>

        {/* Main Navigation */}
        <nav className="care-sidebar-nav" aria-label="Main Menu">
          <ul className="care-nav-list">
            <li className="care-nav-item">
              <NavLink
                to="/patient/home"
                className={({ isActive }) =>
                  `care-nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="care-nav-icon">
                  <PatientIcon name="home" size={17} />
                </span>
                <span className="care-nav-label">Home</span>
              </NavLink>
            </li>
            <li className="care-nav-item">
              <NavLink
                to="/patient/medical-history"
                className={({ isActive }) =>
                  `care-nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="care-nav-icon">
                  <PatientIcon name="medical-history" size={17} />
                </span>
                <span className="care-nav-label">Medical History</span>
              </NavLink>
            </li>
            <li className="care-nav-item">
              <NavLink
                to="/patient/screening"
                className={({ isActive }) =>
                  `care-nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="care-nav-icon">
                  <PatientIcon name="ai-screening" size={17} />
                </span>
                <span className="care-nav-label">AI Screening</span>
              </NavLink>
            </li>
            <li className="care-nav-item">
              <NavLink
                to="/patient/ai-assistant"
                className={({ isActive }) =>
                  `care-nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="care-nav-icon">
                  <PatientIcon name="ai-assistant" size={17} />
                </span>
                <span className="care-nav-label">AI Assistant</span>
              </NavLink>
            </li>
            <li className="care-nav-item">
              <NavLink
                to="/patient/connect-doctor"
                className={({ isActive }) =>
                  `care-nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="care-nav-icon">
                  <PatientIcon name="connect-doctor" size={17} />
                </span>
                <span className="care-nav-label">Connect to a Doctor</span>
              </NavLink>
            </li>
            <li className="care-nav-item">
              <NavLink
                to="/patient/reports"
                className={({ isActive }) =>
                  `care-nav-link ${isActive ? 'is-active' : ''}`
                }
              >
                <span className="care-nav-icon">
                  <PatientIcon name="reports" size={17} />
                </span>
                <span className="care-nav-label">My Reports</span>
              </NavLink>
            </li>
            {/* Care Suggestions (Active) */}
            <li className="care-nav-item">
              <NavLink
                to="/patient/care-suggestions"
                className="care-nav-link is-active"
                aria-current="page"
              >
                <span className="care-nav-icon">
                  <PatientIcon name="care-suggestions" size={17} />
                </span>
                <span className="care-nav-label">Care Suggestions</span>
              </NavLink>
            </li>
          </ul>

          {/* Bottom links: Profile, Settings */}
          <div className="care-sidebar-footer">
            <ul className="care-nav-list">
              <li className="care-nav-item">
                <NavLink
                  to="/patient/profile"
                  className={({ isActive }) =>
                    `care-nav-link ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span className="care-nav-icon">
                    <PatientIcon name="profile" size={17} />
                  </span>
                  <span className="care-nav-label">Profile</span>
                </NavLink>
              </li>
              <li className="care-nav-item">
                <NavLink
                  to="/patient/settings"
                  className={({ isActive }) =>
                    `care-nav-link ${isActive ? 'is-active' : ''}`
                  }
                >
                  <span className="care-nav-icon">
                    <PatientIcon name="settings" size={17} />
                  </span>
                  <span className="care-nav-label">Settings</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* =========================================================================
          2. Main Content Viewport
          ========================================================================= */}
      <main className="miora-care-viewport">
        {/* Soft bottom wave decoration spanning full screen */}
        <svg
          className="care-shell-wave"
          viewBox="0 0 1024 48"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 0,22 C 90,14 160,12 260,30 C 390,48 530,40 680,20 C 820,6 940,16 1024,20 L 1024,48 L 0,48 Z"
            fill="#fae0ea"
            opacity="0.65"
          />
        </svg>

        {/* -----------------------------------------------------------------------
            Header Row: Breadcrumb, Title, Subtitle, User Actions & Artwork
            ----------------------------------------------------------------------- */}
        <header className="care-header-row">
          <div className="care-header-text">
            <nav className="care-breadcrumb" aria-label="Breadcrumb">
              <NavLink to="/patient/home" className="care-breadcrumb-link">
                <PatientIcon name="home" size={13} />
                <span>Home</span>
              </NavLink>
              <span className="care-breadcrumb-sep">&gt;</span>
              <span className="care-breadcrumb-current">Care Suggestions</span>
            </nav>
            <h1 className="care-title">Care Suggestions</h1>
            <p className="care-subtitle">
              Personalised, evidence-based care to support your emotional well-being
              during your postpartum journey.
            </p>
          </div>

          {/* Mother and Baby Header Artwork */}
          <div className="care-header-illustration-wrap" aria-hidden="true">
            <img
              src="/assets/care-mother-feathered.png"
              alt="Mother gently holding baby"
              className="care-header-illustration"
            />
          </div>

          {/* Top Right Actions (Bell + Profile) */}
          <div className="care-header-actions">
            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="care-icon-btn"
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                aria-label="Notifications"
                title="Notifications"
              >
                <PatientIcon name="bell" size={16} />
                {unreadNotifs.length > 0 && <span className="care-notif-dot" />}
              </button>

              {notifDropdownOpen && (
                <div className="care-dropdown-menu" role="menu">
                  <div className="care-dropdown-header">
                    <span>Notifications ({unreadNotifs.length} new)</span>
                  </div>
                  {notifications && notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="care-dropdown-item"
                        onClick={() => markNotificationRead(n.id)}
                      >
                        <strong style={{ fontSize: '11px', color: '#200f16' }}>{n.title}</strong>
                        <span style={{ fontSize: '10px', color: '#6c5963' }}>{n.message}</span>
                      </div>
                    ))
                  ) : (
                    <div className="care-dropdown-item">No new notifications</div>
                  )}
                  {unreadNotifs.length > 0 && (
                    <div
                      className="care-dropdown-item"
                      style={{ color: '#d93c75', fontWeight: 600, textAlign: 'center', marginTop: '4px' }}
                      onClick={markAllNotificationsRead}
                    >
                      Mark all as read
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="care-profile-pill"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-label="User menu"
              >
                <div className="care-avatar">
                  {patient?.avatarInitials || 'S'}
                </div>
                <span className="care-profile-name">{patient?.name || 'Sadiya'}</span>
                <span className="care-profile-chevron">∨</span>
              </button>

              {profileDropdownOpen && (
                <div className="care-dropdown-menu" role="menu">
                  <div className="care-dropdown-header">
                    Signed in as <strong>{patient?.fullName || 'Sadiya Rahman'}</strong>
                  </div>
                  <div className="care-dropdown-item" onClick={() => navigate('/patient/profile')}>
                    My Profile
                  </div>
                  <div className="care-dropdown-item" onClick={() => navigate('/patient/settings')}>
                    Settings
                  </div>
                  <div
                    className="care-dropdown-item"
                    style={{ color: '#d93c75' }}
                    onClick={() => navigate('/login')}
                  >
                    Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* -----------------------------------------------------------------------
            3. Five Navigation Tabs
            ----------------------------------------------------------------------- */}
        <nav className="care-tabs-nav" aria-label="Care Suggestion Categories">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`care-tab-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="care-tab-icon">
                  <PatientIcon name={tab.icon} size={15} color={isActive ? '#ffffff' : '#c73566'} />
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* -----------------------------------------------------------------------
            4. Main Two-Column Grid (Left: 549px, Right: 250px)
            ----------------------------------------------------------------------- */}
        <div className="care-main-grid">
          {/* ================= Left Column ================= */}
          <div className="care-main-left">
            {/* Personalised Care Plan Card */}
            <section className="care-card-plan" aria-label="Personalised Care Plan">
              <div className="plan-info-left">
                <div className="plan-badge-icon" aria-hidden="true">
                  <PatientIcon name="clipboard" size={20} color="#dc266e" />
                </div>
                <div className="plan-text-content">
                  <h2 className="plan-title">Your Personalised Care Plan</h2>
                  <p className="plan-desc">
                    Based on your screening results ({riskDisplay.includes('Moderate') ? 'Moderate\u00A0Risk' : riskDisplay}), here's a plan to help you feel better, stronger and more supported.
                  </p>
                </div>
              </div>

              <div className="plan-info-right">
                <div className="plan-meta-row">
                  <div className="plan-meta-icon">
                    <PatientIcon name="calendar" size={16} color="#dc266e" />
                  </div>
                  <div className="plan-meta-text">
                    <span className="plan-meta-label">Plan Duration</span>
                    <span className="plan-meta-value">{carePlan?.duration || '2 Weeks'}</span>
                  </div>
                </div>

                <div className="plan-meta-row">
                  <div className="plan-meta-icon">
                    <PatientIcon name="target" size={16} color="#dc266e" />
                  </div>
                  <div className="plan-meta-text">
                    <span className="plan-meta-label">Focus Areas</span>
                    <span className="plan-meta-value">
                      {(carePlan?.focusAreas || ['Mood', 'Sleep', 'Stress', 'Support']).join(' • ')}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Today's Care Suggestions */}
            <section className="care-suggestions-section" aria-label="Today's Care Suggestions">
              <div className="suggestions-header-row">
                <h2 className="suggestions-section-title">Today's Care Suggestions</h2>
                <div className="day-progress-badge">
                  <PatientIcon name="calendar" size={12} color="#dc266e" />
                  <span>Day {carePlan?.currentDay || 1} of {carePlan?.totalDays || 14}</span>
                </div>
              </div>

              <div className="suggestions-cards-grid">
                {/* Card 1: Breathing Exercise */}
                <article className="suggestion-card">
                  <div className="suggestion-img-wrap">
                    <img
                      src="/assets/care-breathing.png"
                      alt="Breathing Exercise"
                      className="suggestion-img"
                    />
                  </div>
                  <h3 className="suggestion-card-title">Breathing Exercise</h3>
                  <p className="suggestion-card-desc">A 5-minute exercise to calm your mind.</p>
                  <button
                    type="button"
                    className="suggestion-action-btn is-primary"
                    onClick={handleStartBreathing}
                  >
                    <span className="suggestion-btn-play">
                      <PatientIcon name="play-circle" size={14} color="#dc266e" />
                    </span>
                    <span>Start (5 min)</span>
                  </button>
                </article>

                {/* Card 2: Better Sleep */}
                <article className="suggestion-card">
                  <div className="suggestion-img-wrap">
                    <img
                      src="/assets/care-sleep.png"
                      alt="Better Sleep"
                      className="suggestion-img"
                    />
                  </div>
                  <h3 className="suggestion-card-title">Better Sleep</h3>
                  <p className="suggestion-card-desc">Simple steps to improve your sleep quality.</p>
                  <button
                    type="button"
                    className="suggestion-action-btn"
                    onClick={() => setActiveModal('sleep')}
                  >
                    <span>View Tips</span>
                    <PatientIcon name="arrow-right" size={12} color="#241118" />
                  </button>
                </article>

                {/* Card 3: Mood Journaling */}
                <article className="suggestion-card">
                  <div className="suggestion-img-wrap">
                    <img
                      src="/assets/care-journaling.png"
                      alt="Mood Journaling"
                      className="suggestion-img"
                    />
                  </div>
                  <h3 className="suggestion-card-title">Mood Journaling</h3>
                  <p className="suggestion-card-desc">Reflect on your feelings for a few minutes.</p>
                  <button
                    type="button"
                    className="suggestion-action-btn"
                    onClick={() => setActiveModal('journaling')}
                  >
                    <span>Start Journaling</span>
                    <PatientIcon name="arrow-right" size={12} color="#241118" />
                  </button>
                </article>
              </div>
            </section>
          </div>

          {/* ================= Right Column ================= */}
          <div className="care-main-right">
            {/* Your Progress Card */}
            <section className="care-card-progress" aria-label="Your Progress">
              <h2 className="progress-card-title">Your Progress</h2>
              <div className="progress-body-row">
                {/* Circular Gauge Ring */}
                <div className="progress-gauge-wrap">
                  <svg className="progress-gauge-svg" viewBox="0 0 90 90">
                    <circle
                      className="progress-gauge-track"
                      cx="45"
                      cy="45"
                      r={radius}
                    />
                    <circle
                      className="progress-gauge-bar"
                      cx="45"
                      cy="45"
                      r={radius}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                    />
                  </svg>
                  <div className="progress-gauge-text">
                    <span className="gauge-fraction">
                      {completedCount}/{totalTasks}
                    </span>
                    <span className="gauge-subtext">Care Tasks<br />Completed</span>
                  </div>
                </div>

                {/* Checklist */}
                <ul className="progress-tasks-list">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className={`progress-task-item ${task.completed ? 'is-completed' : ''}`}
                      onClick={() => toggleCareTask(task.id)}
                      title="Click to toggle status"
                    >
                      <span className={`task-check-circle ${task.completed ? 'completed' : 'pending'}`}>
                        {task.completed && <PatientIcon name="check" size={10} color="#ffffff" />}
                      </span>
                      <span className="task-name">{task.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Need More Support? Card */}
            <section className="care-card-support" aria-label="Need More Support?">
              <div className="support-header-row">
                <div className="support-icon-wrap" aria-hidden="true">
                  <PatientIcon name="headset-support" size={18} color="#dc266e" />
                </div>
                <div className="support-text-wrap">
                  <h2 className="support-title">Need More Support?</h2>
                  <p className="support-desc">
                    Talk to a maternal mental health professional for personalised guidance.
                  </p>
                </div>
              </div>

              <NavLink to="/patient/connect-doctor" className="support-action-btn">
                <span>Connect to a Doctor</span>
                <PatientIcon name="arrow-right" size={12} color="#241118" />
              </NavLink>
            </section>
          </div>
        </div>
      </main>

      {/* =========================================================================
          Interactive Modals
          ========================================================================= */}
      {/* 1. Breathing Exercise Modal */}
      {activeModal === 'breathing' && (
        <div className="care-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="care-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="care-modal-close"
              onClick={() => setActiveModal(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="care-modal-title">Box Breathing Exercise</h3>
            <p className="care-modal-desc">
              Take a slow breath in as the circle expands, hold gently, and breathe out slowly as it relaxes.
            </p>
            <div className="breathing-circle-wrap">
              <div className="breathing-bubble">Breathe</div>
            </div>
            <button
              type="button"
              className="care-modal-submit-btn"
              onClick={handleCompleteBreathing}
            >
              Complete Exercise &amp; Mark Done
            </button>
          </div>
        </div>
      )}

      {/* 2. Better Sleep Tips Modal */}
      {activeModal === 'sleep' && (
        <div className="care-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="care-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="care-modal-close"
              onClick={() => setActiveModal(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="care-modal-title">Postpartum Sleep Hygiene Tips</h3>
            <p className="care-modal-desc">
              Sleep is essential for your emotional recovery. Here are gentle, evidence-based steps:
            </p>
            <ul style={{ paddingLeft: '18px', fontSize: '11.5px', color: '#4a3640', lineHeight: '1.6', margin: '0 0 16px 0' }}>
              <li><strong>Nap when baby rests:</strong> Short 20-minute restorative naps replenish mental focus.</li>
              <li><strong>Dim warm lighting:</strong> Use warm amber lamps 1 hour before bed to support melatonin.</li>
              <li><strong>Partner shift sharing:</strong> Divide night feeds so you get at least 4 hours uninterrupted rest.</li>
              <li><strong>Gentle wind-down:</strong> 5 minutes of mindful quiet without phone screens.</li>
            </ul>
            <button
              type="button"
              className="care-modal-submit-btn"
              onClick={() => setActiveModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 3. Mood Journaling Modal */}
      {activeModal === 'journaling' && (
        <div className="care-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="care-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="care-modal-close"
              onClick={() => setActiveModal(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="care-modal-title">Daily Mood Reflection</h3>
            <p className="care-modal-desc">
              Write down whatever is on your mind today — there are no right or wrong words.
            </p>
            <textarea
              className="journal-textarea"
              placeholder="How are you feeling right now? What is one thing you need today?..."
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
            />
            <button
              type="button"
              className="care-modal-submit-btn"
              onClick={handleSaveJournal}
            >
              Save Reflection &amp; Mark Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
