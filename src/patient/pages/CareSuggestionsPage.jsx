import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import { PatientIcon } from '../components/PatientIcons.jsx';
import './care-suggestions.css';

const JOURNAL_STORAGE_KEY = 'miora_patient_journal_entries_v1';

export function CareSuggestionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    patient,
    screening,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    carePlan,
    toggleCareTask,
  } = usePatient();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('care-plan');
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Simulation/testing toggle for empty care-plan state
  const isQueryEmpty = searchParams.get('empty') === 'true';
  const [forceEmptyState, setForceEmptyState] = useState(isQueryEmpty);

  // Modals for interactive actions
  // 'breathing' | 'sleep' | 'journaling' | 'muscle-relax' | 'grounding' | 'reframing' | 'nutrition'
  const [activeModal, setActiveModal] = useState(null);

  // Journaling state
  const [journalMood, setJournalMood] = useState('Tired but Grateful');
  const [journalEntry, setJournalEntry] = useState('');
  const [savedJournalEntries, setSavedJournalEntries] = useState(() => {
    try {
      const stored = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [
      {
        id: 'entry-1',
        date: 'Yesterday at 8:45 PM',
        mood: 'Emotionally Sensitive',
        text: 'Feeling overwhelmed by the feeding routine today. Taking deep breaths and remembering to be gentle with myself.',
      },
    ];
  });

  // Breathing exercise interactive state machine
  // phase: 'inhale' | 'hold-in' | 'exhale' | 'hold-out'
  const [breathingStatus, setBreathingStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'completed'
  const [breathPhase, setBreathPhase] = useState('inhale');
  const [breathCountdown, setBreathCountdown] = useState(4);
  const [breathCycle, setBreathCycle] = useState(1);
  const totalBreathingCycles = 4;
  const breathingTimerRef = useRef(null);

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

  // Sync query param for empty state testing
  useEffect(() => {
    if (searchParams.get('empty') === 'true') {
      setForceEmptyState(true);
    }
  }, [searchParams]);

  // Breathing timer lifecycle
  useEffect(() => {
    if (breathingStatus !== 'running') {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
      return;
    }

    breathingTimerRef.current = setInterval(() => {
      setBreathCountdown((prev) => {
        if (prev > 1) return prev - 1;

        // Transition phases: inhale (4s) -> hold-in (4s) -> exhale (4s) -> hold-out (4s)
        setBreathPhase((currentPhase) => {
          if (currentPhase === 'inhale') return 'hold-in';
          if (currentPhase === 'hold-in') return 'exhale';
          if (currentPhase === 'exhale') return 'hold-out';

          // Completed one full 16-second box cycle
          setBreathCycle((cycle) => {
            if (cycle >= totalBreathingCycles) {
              setBreathingStatus('completed');
              return cycle;
            }
            return cycle + 1;
          });
          return 'inhale';
        });

        return 4;
      });
    }, 1000);

    return () => {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    };
  }, [breathingStatus]);

  // Handle breathing controls
  const handleStartBreathing = () => {
    setActiveModal('breathing');
    setBreathingStatus('running');
    setBreathPhase('inhale');
    setBreathCountdown(4);
    setBreathCycle(1);
  };

  const handlePauseBreathing = () => {
    setBreathingStatus('paused');
  };

  const handleResumeBreathing = () => {
    setBreathingStatus('running');
  };

  const handleResetBreathing = () => {
    setBreathingStatus('idle');
    setBreathPhase('inhale');
    setBreathCountdown(4);
    setBreathCycle(1);
  };

  const handleCompleteBreathing = () => {
    const breathingTask = carePlan?.tasks?.find((t) => t.id === 'task-1');
    if (breathingTask && !breathingTask.completed) {
      toggleCareTask('task-1');
    }
    setBreathingStatus('idle');
    setActiveModal(null);
  };

  // Handle Journal entry save
  const handleSaveJournal = (e) => {
    if (e) e.preventDefault();
    if (!journalEntry.trim()) return;

    const newEntry = {
      id: `entry-${Date.now()}`,
      date: 'Just now',
      mood: journalMood,
      text: journalEntry.trim(),
    };

    const updated = [newEntry, ...savedJournalEntries];
    setSavedJournalEntries(updated);
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Toggle task 4 ("Journaling")
    const journalTask = carePlan?.tasks?.find((t) => t.id === 'task-4');
    if (journalTask && !journalTask.completed) {
      toggleCareTask('task-4');
    }

    setJournalEntry('');
    setActiveModal(null);
  };

  // Handle sleep routine task completion
  const handleMarkSleepDone = () => {
    const sleepTask = carePlan?.tasks?.find((t) => t.id === 'task-3');
    if (sleepTask && !sleepTask.completed) {
      toggleCareTask('task-3');
    }
    setActiveModal(null);
  };

  // Determine whether plan is effectively available
  const hasCarePlan = !forceEmptyState && Boolean(carePlan && carePlan.tasks && carePlan.tasks.length > 0);

  // Tasks from patient context
  const tasks = useMemo(() => {
    if (!hasCarePlan) return [];
    return carePlan.tasks;
  }, [hasCarePlan, carePlan]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  // Circular gauge calculations
  // radius = 38, circumference = 2 * PI * 38 = 238.76
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalTasks > 0 ? completedCount / totalTasks : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Category Tabs
  const tabs = [
    { id: 'care-plan', label: 'My Care Plan', icon: 'feather-leaf' },
    { id: 'self-care', label: 'Self-Care', icon: 'lotus' },
    { id: 'mood-support', label: 'Mood Support', icon: 'smile-face' },
    { id: 'lifestyle', label: 'Lifestyle', icon: 'apple' },
    { id: 'resources', label: 'Resources', icon: 'book-open' },
  ];

  // Risk label derived from clinical screening context
  const riskDisplay = screening?.riskLabel
    ? screening.riskLabel.replace(' for PPD', '').replace(' (Demo Preview)', '')
    : 'Moderate Risk';

  return (
    <div className="miora-care-shell">
      {/* =========================================================================
          Main Content Viewport (Unified PatientSidebar is provided by PatientLayout)
          ========================================================================= */}
      <main className="miora-care-viewport">
        {/* Soft bottom wave decoration matching reference */}
        <div className="care-bottom-wave-container" aria-hidden="true">
          <svg
            className="care-shell-wave-svg"
            viewBox="0 0 1024 54"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M 0,26 C 140,10 240,40 390,28 C 550,14 690,44 840,24 C 930,12 990,20 1024,24 L 1024,54 L 0,54 Z"
              fill="#fce1eb"
              opacity="0.85"
            />
          </svg>
        </div>

        {/* -----------------------------------------------------------------------
            Header Row: Breadcrumb, Title, Subtitle, Artwork, Notification & Profile
            ----------------------------------------------------------------------- */}
        <header className="care-header-row">
          <div className="care-header-text">
            {/* Breadcrumb with Heart outline matching reference */}
            <div className="care-breadcrumb" aria-label="Breadcrumb">
              <span className="care-breadcrumb-heart" aria-hidden="true">
                <PatientIcon name="heart" size={13} color="#271218" />
              </span>
              <span className="care-breadcrumb-title">Care Suggestions</span>
            </div>

            <h1 className="care-title">Care Suggestions</h1>
            <p className="care-subtitle">
              Personalised, evidence-based care to support your emotional well-being
              during your postpartum journey.
            </p>
          </div>

          {/* Maternal Illustration on right header (matches reference) */}
          <div className="care-header-illustration-wrap" aria-hidden="true">
            <img
              src="/assets/care-header-mother-baby.png"
              alt="Mother gently holding baby"
              className="care-header-illustration"
            />
          </div>

          {/* Top Right Actions (Bell + Profile) */}
          <div className="care-header-actions">
            {/* Notification Bell */}
            <div className="care-notif-container" ref={notifRef}>
              <button
                type="button"
                className="care-icon-btn"
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                aria-label={`Notifications (${unreadNotifs.length} unread)`}
                aria-expanded={notifDropdownOpen}
              >
                <PatientIcon name="bell" size={17} color="#271218" />
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
                        <strong style={{ fontSize: '11px', color: '#200f16', display: 'block' }}>
                          {n.title}
                        </strong>
                        <span style={{ fontSize: '10px', color: '#6c5963' }}>{n.message}</span>
                      </div>
                    ))
                  ) : (
                    <div className="care-dropdown-item">No new notifications</div>
                  )}
                  {unreadNotifs.length > 0 && (
                    <div
                      className="care-dropdown-item care-dropdown-action"
                      onClick={markAllNotificationsRead}
                    >
                      Mark all as read
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="care-profile-container" ref={profileRef}>
              <button
                type="button"
                className="care-profile-pill"
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotifDropdownOpen(false);
                }}
                aria-label="User menu"
                aria-expanded={profileDropdownOpen}
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
                  <div
                    className="care-dropdown-item"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/patient/profile');
                    }}
                  >
                    My Profile
                  </div>
                  <div
                    className="care-dropdown-item"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/patient/settings');
                    }}
                  >
                    Settings
                  </div>
                  <div
                    className="care-dropdown-item care-dropdown-danger"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/login');
                    }}
                  >
                    Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* -----------------------------------------------------------------------
            3. Navigation Tabs (My Care Plan, Self-Care, Mood Support, Lifestyle, Resources)
            ----------------------------------------------------------------------- */}
        <nav className="care-tabs-nav" aria-label="Care Suggestion Categories">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`tab-${tab.id}`}
                className={`care-tab-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="care-tab-icon">
                  <PatientIcon
                    name={tab.icon}
                    size={15}
                    color={isActive ? '#ffffff' : '#d8286a'}
                  />
                </span>
                <span className="care-tab-label">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* -----------------------------------------------------------------------
            4. Two-Column Content Grid
            ----------------------------------------------------------------------- */}
        <div className="care-main-grid">
          {/* ================= Left Column ================= */}
          <div className="care-main-left">
            {/* TAB 1: MY CARE PLAN */}
            {activeTab === 'care-plan' && (
              <>
                {/* Personalised Care Plan Card */}
                {hasCarePlan ? (
                  <section
                    className="care-card-plan"
                    data-testid="personalised-care-plan-card"
                    aria-label="Personalised Care Plan"
                  >
                    <div className="plan-info-left">
                      <div className="plan-badge-icon" aria-hidden="true">
                        <PatientIcon name="clipboard" size={20} color="#dc266e" />
                      </div>
                      <div className="plan-text-content">
                        <h2 className="plan-title">Your Personalised Care Plan</h2>
                        <p className="plan-desc">
                          Based on your screening results ({riskDisplay}), here's a plan to help you feel
                          better, stronger and more supported.
                        </p>
                      </div>
                    </div>

                    <div className="plan-info-right">
                      <div className="plan-meta-row">
                        <div className="plan-meta-icon" aria-hidden="true">
                          <PatientIcon name="calendar" size={15} color="#dc266e" />
                        </div>
                        <div className="plan-meta-text">
                          <span className="plan-meta-label">Plan Duration</span>
                          <span className="plan-meta-value">{carePlan?.duration || '2 Weeks'}</span>
                        </div>
                      </div>

                      <div className="plan-meta-row">
                        <div className="plan-meta-icon" aria-hidden="true">
                          <PatientIcon name="target" size={15} color="#dc266e" />
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
                ) : (
                  /* Honest Empty State when no care plan is available */
                  <section
                    className="care-card-plan is-empty-state"
                    data-testid="empty-care-plan-card"
                    aria-label="Care Plan Not Yet Available"
                  >
                    <div className="plan-info-left">
                      <div className="plan-badge-icon is-neutral" aria-hidden="true">
                        <PatientIcon name="clipboard" size={20} color="#8a737f" />
                      </div>
                      <div className="plan-text-content">
                        <h2 className="plan-title">Care Recommendations Not Yet Available</h2>
                        <p className="plan-desc">
                          You do not have an active care plan yet. Complete an AI screening session or
                          consult with your maternal care provider to generate personalised,
                          evidence-based recommendations tailored to your postpartum needs.
                        </p>
                      </div>
                    </div>
                    <div className="plan-empty-actions">
                      <NavLink to="/patient/screening" className="plan-action-screening-btn">
                        <span>Take AI Screening</span>
                        <PatientIcon name="arrow-right" size={13} color="#ffffff" />
                      </NavLink>
                    </div>
                  </section>
                )}

                {/* Today's Care Suggestions Grid */}
                <section className="care-suggestions-section" aria-label="Today's Care Suggestions">
                  <div className="suggestions-header-row">
                    <h2 className="suggestions-section-title">Today's Care Suggestions</h2>
                    {hasCarePlan && (
                      <div className="day-progress-badge">
                        <PatientIcon name="calendar" size={13} color="#dc266e" />
                        <span>Day {carePlan?.currentDay || 1} of {carePlan?.totalDays || 14}</span>
                      </div>
                    )}
                  </div>

                  <div className="suggestions-cards-grid">
                    {/* Card 1: Breathing Exercise */}
                    <article className="suggestion-card" data-testid="card-breathing-exercise">
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
                        data-testid="btn-start-breathing"
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
                    <article className="suggestion-card" data-testid="card-better-sleep">
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
                        data-testid="btn-view-sleep-tips"
                        className="suggestion-action-btn"
                        onClick={() => setActiveModal('sleep')}
                      >
                        <span>View Tips</span>
                        <PatientIcon name="arrow-right" size={12} color="#271218" />
                      </button>
                    </article>

                    {/* Card 3: Mood Journaling */}
                    <article className="suggestion-card" data-testid="card-mood-journaling">
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
                        data-testid="btn-start-journaling"
                        className="suggestion-action-btn"
                        onClick={() => setActiveModal('journaling')}
                      >
                        <span>Start Journaling</span>
                        <PatientIcon name="arrow-right" size={12} color="#271218" />
                      </button>
                    </article>
                  </div>
                </section>
              </>
            )}

            {/* TAB 2: SELF-CARE */}
            {activeTab === 'self-care' && (
              <section className="care-tab-content-panel" aria-label="Self-Care Practices">
                <div className="tab-panel-intro">
                  <h2 className="tab-panel-title">Self-Care Practices</h2>
                  <p className="tab-panel-desc">
                    Gentle, restorative routines designed to help you release postpartum physical
                    tension and nurture emotional resilience.
                  </p>
                </div>

                <div className="suggestions-cards-grid">
                  <article className="suggestion-card">
                    <div className="suggestion-img-wrap">
                      <img src="/assets/care-breathing.png" alt="Muscle Relaxation" className="suggestion-img" />
                    </div>
                    <h3 className="suggestion-card-title">Progressive Muscle Relaxation</h3>
                    <p className="suggestion-card-desc">Release physical tension in neck, shoulders, and lower back.</p>
                    <button
                      type="button"
                      className="suggestion-action-btn is-primary"
                      onClick={() => setActiveModal('muscle-relax')}
                    >
                      <PatientIcon name="play-circle" size={14} color="#dc266e" />
                      <span>Start (8 min)</span>
                    </button>
                  </article>

                  <article className="suggestion-card">
                    <div className="suggestion-img-wrap">
                      <img src="/assets/care-sleep.png" alt="Gentle Postpartum Movement" className="suggestion-img" />
                    </div>
                    <h3 className="suggestion-card-title">Gentle Body Restoration</h3>
                    <p className="suggestion-card-desc">Low-impact pelvic floor alignment and diaphragmatic breathing.</p>
                    <button
                      type="button"
                      className="suggestion-action-btn"
                      onClick={() => {
                        const task = carePlan?.tasks?.find((t) => t.id === 'task-6');
                        if (task && !task.completed) toggleCareTask('task-6');
                        setActiveModal('sleep');
                      }}
                    >
                      <span>Explore Guidance</span>
                      <PatientIcon name="arrow-right" size={12} color="#271218" />
                    </button>
                  </article>

                  <article className="suggestion-card">
                    <div className="suggestion-img-wrap">
                      <img src="/assets/care-journaling.png" alt="Nourishing Tea Break" className="suggestion-img" />
                    </div>
                    <h3 className="suggestion-card-title">Mindful Tea &amp; Hydration</h3>
                    <p className="suggestion-card-desc">A designated 5-minute pause for hydration and gentle grounding.</p>
                    <button
                      type="button"
                      className="suggestion-action-btn"
                      onClick={() => {
                        const task = carePlan?.tasks?.find((t) => t.id === 'task-6');
                        if (task && !task.completed) toggleCareTask('task-6');
                      }}
                    >
                      <span>Log Self-Care Time</span>
                      <PatientIcon name="check" size={12} color="#dc266e" />
                    </button>
                  </article>
                </div>
              </section>
            )}

            {/* TAB 3: MOOD SUPPORT */}
            {activeTab === 'mood-support' && (
              <section className="care-tab-content-panel" aria-label="Mood Support Tools">
                <div className="tab-panel-intro">
                  <h2 className="tab-panel-title">Mood Support &amp; Emotional Coping</h2>
                  <p className="tab-panel-desc">
                    Evidence-based cognitive and somatic tools to help you navigate emotional fluctuations,
                    maternal guilt, and postpartum sensitivity.
                  </p>
                </div>

                <div className="suggestions-cards-grid">
                  <article className="suggestion-card">
                    <div className="suggestion-img-wrap">
                      <img src="/assets/care-journaling.png" alt="Mood Reflection" className="suggestion-img" />
                    </div>
                    <h3 className="suggestion-card-title">Daily Mood Reflection</h3>
                    <p className="suggestion-card-desc">Acknowledge today's emotions in a private, compassionate space.</p>
                    <button
                      type="button"
                      className="suggestion-action-btn is-primary"
                      onClick={() => setActiveModal('journaling')}
                    >
                      <span>Write in Journal</span>
                      <PatientIcon name="arrow-right" size={12} color="#271218" />
                    </button>
                  </article>

                  <article className="suggestion-card">
                    <div className="suggestion-img-wrap">
                      <img src="/assets/care-breathing.png" alt="Grounding Technique" className="suggestion-img" />
                    </div>
                    <h3 className="suggestion-card-title">5-4-3-2-1 Sensory Grounding</h3>
                    <p className="suggestion-card-desc">De-escalate acute overwhelm by re-engaging your senses.</p>
                    <button
                      type="button"
                      className="suggestion-action-btn"
                      onClick={() => setActiveModal('grounding')}
                    >
                      <span>Begin Grounding</span>
                      <PatientIcon name="arrow-right" size={12} color="#271218" />
                    </button>
                  </article>

                  <article className="suggestion-card">
                    <div className="suggestion-img-wrap">
                      <img src="/assets/care-sleep.png" alt="Thought Reframing" className="suggestion-img" />
                    </div>
                    <h3 className="suggestion-card-title">Thought Reframing</h3>
                    <p className="suggestion-card-desc">Gentle perspective shifts to untangle intrusive maternal self-criticism.</p>
                    <button
                      type="button"
                      className="suggestion-action-btn"
                      onClick={() => setActiveModal('reframing')}
                    >
                      <span>View Reframing</span>
                      <PatientIcon name="arrow-right" size={12} color="#271218" />
                    </button>
                  </article>
                </div>
              </section>
            )}

            {/* TAB 4: LIFESTYLE */}
            {activeTab === 'lifestyle' && (
              <section className="care-tab-content-panel" aria-label="Lifestyle Guidance">
                <div className="tab-panel-intro">
                  <h2 className="tab-panel-title">Postpartum Lifestyle &amp; Rhythms</h2>
                  <p className="tab-panel-desc">
                    Practical guidance on newborn sleep alignment, nourishing postpartum nutrition,
                    and setting protective boundaries with visitors.
                  </p>
                </div>

                <div className="suggestions-cards-grid">
                  <article className="suggestion-card">
                    <div className="suggestion-img-wrap">
                      <img src="/assets/care-sleep.png" alt="Sleep Hygiene" className="suggestion-img" />
                    </div>
                    <h3 className="suggestion-card-title">Newborn Sleep Windows</h3>
                    <p className="suggestion-card-desc">How to safeguard your REM sleep while meeting infant feeding demands.</p>
                    <button
                      type="button"
                      className="suggestion-action-btn"
                      onClick={() => setActiveModal('sleep')}
                    >
                      <span>Read Strategy</span>
                      <PatientIcon name="arrow-right" size={12} color="#271218" />
                    </button>
                  </article>

                  <article className="suggestion-card">
                    <div className="suggestion-img-wrap">
                      <img src="/assets/care-journaling.png" alt="Postpartum Nutrition" className="suggestion-img" />
                    </div>
                    <h3 className="suggestion-card-title">Postpartum Nutrition</h3>
                    <p className="suggestion-card-desc">Hormone-supportive, warm meals and easy hydration benchmarks.</p>
                    <button
                      type="button"
                      className="suggestion-action-btn"
                      onClick={() => setActiveModal('nutrition')}
                    >
                      <span>View Nutrition Tips</span>
                      <PatientIcon name="arrow-right" size={12} color="#271218" />
                    </button>
                  </article>

                  <article className="suggestion-card">
                    <div className="suggestion-img-wrap">
                      <img src="/assets/care-breathing.png" alt="Gentle Fresh Air" className="suggestion-img" />
                    </div>
                    <h3 className="suggestion-card-title">Gentle Fresh Air Walk</h3>
                    <p className="suggestion-card-desc">10–15 minutes of natural sunlight to support circadian synchronization.</p>
                    <button
                      type="button"
                      className="suggestion-action-btn"
                      onClick={() => {
                        const task = carePlan?.tasks?.find((t) => t.id === 'task-5');
                        if (task && !task.completed) toggleCareTask('task-5');
                      }}
                    >
                      <span>Mark Activity Done</span>
                      <PatientIcon name="check" size={12} color="#dc266e" />
                    </button>
                  </article>
                </div>
              </section>
            )}

            {/* TAB 5: RESOURCES */}
            {activeTab === 'resources' && (
              <section className="care-tab-content-panel" aria-label="Evidence-Based Resources">
                <div className="tab-panel-intro">
                  <h2 className="tab-panel-title">Maternal Mental Health Resources</h2>
                  <p className="tab-panel-desc">
                    Curated, verified psychoeducational guides, crisis helplines, and perinatal
                    mental health specialist contact networks.
                  </p>
                </div>

                <div className="resources-cards-list">
                  <article className="resource-list-item">
                    <div className="resource-item-icon">
                      <PatientIcon name="headset-support" size={20} color="#dc266e" />
                    </div>
                    <div className="resource-item-body">
                      <h3 className="resource-item-title">Postpartum Support International (PSI)</h3>
                      <p className="resource-item-desc">
                        Direct helpline: Call or text 1-800-944-4773. Confidential, multilingual support
                        for mothers and families experiencing perinatal mood and anxiety disorders.
                      </p>
                    </div>
                    <a
                      href="https://www.postpartum.net/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resource-external-link"
                    >
                      <span>Visit PSI</span>
                      <PatientIcon name="arrow-right" size={12} color="#dc266e" />
                    </a>
                  </article>

                  <article className="resource-list-item">
                    <div className="resource-item-icon">
                      <PatientIcon name="doctor" size={20} color="#dc266e" />
                    </div>
                    <div className="resource-item-body">
                      <h3 className="resource-item-title">National Maternal Mental Health Hotline</h3>
                      <p className="resource-item-desc">
                        24/7 free, confidential hotline: Call or text 1-833-TLC-MAMA (1-833-852-6262) for
                        immediate empathetic maternal emotional counseling.
                      </p>
                    </div>
                    <NavLink to="/patient/connect-doctor" className="resource-external-link">
                      <span>Connect via Miora</span>
                      <PatientIcon name="arrow-right" size={12} color="#dc266e" />
                    </NavLink>
                  </article>

                  <article className="resource-list-item">
                    <div className="resource-item-icon">
                      <PatientIcon name="book-open" size={20} color="#dc266e" />
                    </div>
                    <div className="resource-item-body">
                      <h3 className="resource-item-title">Postpartum Recovery Care Guide (.pdf)</h3>
                      <p className="resource-item-desc">
                        Evidence-based educational overview distinguishing baby blues, postpartum
                        depression, and perinatal anxiety.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="resource-download-btn"
                      onClick={() => alert('Downloaded Postpartum Recovery Guide (.pdf)')}
                    >
                      <PatientIcon name="download" size={13} color="#271218" />
                      <span>Download Guide</span>
                    </button>
                  </article>
                </div>
              </section>
            )}

            {/* Clinical Disclaimer Notice */}
            <div className="care-clinical-disclaimer" role="note">
              <span className="disclaimer-icon" aria-hidden="true">ℹ</span>
              <span>
                <strong>Clinical Note:</strong> Miora self-care suggestions and mindfulness tools
                are supportive resources for daily emotional well-being. They do not constitute medical
                advice, psychiatric diagnosis, or a cure for postpartum depression (PPD). If you feel
                persistent distress, consult a licensed healthcare professional.
              </span>
            </div>
          </div>

          {/* ================= Right Column ================= */}
          <div className="care-main-right">
            {/* Your Progress Card */}
            <section
              className="care-card-progress"
              data-testid="your-progress-card"
              aria-label="Your Progress"
            >
              <h2 className="progress-card-title">Your Progress</h2>

              {hasCarePlan ? (
                <div className="progress-body-row">
                  {/* Circular Gauge Ring matching reference */}
                  <div className="progress-gauge-wrap" aria-label={`Progress: ${completedCount} of ${totalTasks} care tasks completed`}>
                    <svg className="progress-gauge-svg" viewBox="0 0 96 96">
                      <circle
                        className="progress-gauge-track"
                        cx="48"
                        cy="48"
                        r={radius}
                      />
                      <circle
                        className="progress-gauge-bar"
                        cx="48"
                        cy="48"
                        r={radius}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                      />
                    </svg>
                    <div className="progress-gauge-text">
                      <span className="gauge-fraction" data-testid="gauge-fraction">
                        {completedCount}/{totalTasks}
                      </span>
                      <span className="gauge-subtext">
                        Care Tasks<br />Completed
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Interactive Checklist */}
                  <ul className="progress-tasks-list" role="list">
                    {tasks.map((task) => (
                      <li
                        key={task.id}
                        data-testid={`task-item-${task.id}`}
                        className={`progress-task-item ${task.completed ? 'is-completed' : ''}`}
                        onClick={() => toggleCareTask(task.id)}
                        role="button"
                        tabIndex={0}
                        aria-pressed={task.completed}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleCareTask(task.id);
                          }
                        }}
                      >
                        <span
                          className={`task-check-circle ${task.completed ? 'completed' : 'pending'}`}
                          aria-hidden="true"
                        >
                          {task.completed && (
                            <PatientIcon name="check" size={10} color="#ffffff" />
                          )}
                        </span>
                        <span className="task-name">{task.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                /* Empty state for Progress card */
                <div className="progress-empty-body" data-testid="progress-empty-state">
                  <div className="progress-gauge-wrap is-empty">
                    <svg className="progress-gauge-svg" viewBox="0 0 96 96">
                      <circle
                        className="progress-gauge-track"
                        cx="48"
                        cy="48"
                        r={radius}
                        strokeDasharray="4 4"
                      />
                    </svg>
                    <div className="progress-gauge-text">
                      <span className="gauge-fraction">0/0</span>
                      <span className="gauge-subtext">No Active Tasks</span>
                    </div>
                  </div>
                  <p className="progress-empty-msg">
                    No active care plan tasks. Complete a screening or consult a clinician to begin
                    tracking recovery goals.
                  </p>
                </div>
              )}
            </section>

            {/* Need More Support? Card */}
            <section
              className="care-card-support"
              data-testid="need-more-support-card"
              aria-label="Need More Support?"
            >
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

              <NavLink
                to="/patient/connect-doctor"
                data-testid="btn-connect-doctor"
                className="support-action-btn"
              >
                <span>Connect to a Doctor</span>
                <PatientIcon name="arrow-right" size={13} color="#271218" />
              </NavLink>
            </section>
          </div>
        </div>
      </main>

      {/* =========================================================================
          Interactive Modals
          ========================================================================= */}
      {/* 1. Guided Breathing Exercise Modal with Start / Pause / Reset / Complete */}
      {activeModal === 'breathing' && (
        <div className="care-modal-overlay" onClick={() => setActiveModal(null)}>
          <div
            className="care-modal-card is-breathing"
            data-testid="breathing-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="care-modal-close"
              onClick={() => setActiveModal(null)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <h3 className="care-modal-title">Box Breathing Exercise</h3>
            <p className="care-modal-desc">
              Diaphragmatic box breathing gently activates your vagus nerve to calm postpartum anxiety.
            </p>

            {/* Breathing Animation Canvas */}
            <div className="breathing-stage-container">
              <div className={`breathing-circle-outer ${breathPhase} ${breathingStatus}`}>
                <div className="breathing-circle-inner">
                  <span className="breathing-phase-label">
                    {breathPhase === 'inhale' && 'Breathe In...'}
                    {breathPhase === 'hold-in' && 'Hold Gently...'}
                    {breathPhase === 'exhale' && 'Breathe Out...'}
                    {breathPhase === 'hold-out' && 'Rest...'}
                  </span>
                  <span className="breathing-seconds-counter">{breathCountdown}s</span>
                </div>
              </div>

              <div className="breathing-meta-info">
                <span>Cycle {breathCycle} of {totalBreathingCycles}</span>
                <span className="meta-dot">•</span>
                <span className="meta-status">Status: {breathingStatus}</span>
              </div>
            </div>

            {/* Interactive Control Buttons */}
            <div className="breathing-controls-row">
              {breathingStatus === 'running' ? (
                <button
                  type="button"
                  data-testid="btn-pause-breathing"
                  className="breathing-ctrl-btn is-pause"
                  onClick={handlePauseBreathing}
                >
                  Pause
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="btn-resume-breathing"
                  className="breathing-ctrl-btn is-resume"
                  onClick={handleResumeBreathing}
                >
                  Resume
                </button>
              )}

              <button
                type="button"
                className="breathing-ctrl-btn is-reset"
                onClick={handleResetBreathing}
              >
                Reset
              </button>

              <button
                type="button"
                data-testid="btn-complete-breathing"
                className="breathing-ctrl-btn is-complete"
                onClick={handleCompleteBreathing}
              >
                Complete &amp; Mark Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Better Sleep Guidance Modal */}
      {activeModal === 'sleep' && (
        <div className="care-modal-overlay" onClick={() => setActiveModal(null)}>
          <div
            className="care-modal-card is-sleep"
            data-testid="sleep-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="care-modal-close"
              onClick={() => setActiveModal(null)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <h3 className="care-modal-title">Evidence-Based Sleep Hygiene Tips</h3>
            <p className="care-modal-desc">
              Sleep fragmentation is expected with a newborn. These strategies focus on restorative
              efficiency without unrealistic expectations:
            </p>

            <div className="sleep-tips-list">
              <div className="sleep-tip-card">
                <strong>1. Synchronized Daytime Rest</strong>
                <p>Prioritize 20–30 minute restorative naps while baby sleeps during daytime intervals.</p>
              </div>

              <div className="sleep-tip-card">
                <strong>2. 4-Hour Protected Night Block</strong>
                <p>Have your partner or support person manage one feeding cycle so you achieve at least one contiguous 4-hour sleep block.</p>
              </div>

              <div className="sleep-tip-card">
                <strong>3. Melatonin &amp; Lighting Protocol</strong>
                <p>Switch to soft, amber lighting 60 minutes before bed; avoid looking directly at smartphone screens during midnight feeds.</p>
              </div>

              <div className="sleep-tip-card">
                <strong>4. Somatic Wind-Down</strong>
                <p>Engage in 3 minutes of slow somatic exhales when lying down to reduce postpartum hypervigilance.</p>
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                data-testid="btn-mark-sleep-done"
                className="care-modal-submit-btn"
                onClick={handleMarkSleepDone}
              >
                Mark Sleep Routine as Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Mood Journaling Modal with Entry Persistence */}
      {activeModal === 'journaling' && (
        <div className="care-modal-overlay" onClick={() => setActiveModal(null)}>
          <div
            className="care-modal-card is-journal"
            data-testid="journaling-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="care-modal-close"
              onClick={() => setActiveModal(null)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <h3 className="care-modal-title">Postpartum Mood Journal</h3>
            <p className="care-modal-desc">
              Write down your uncensored feelings. Acknowledging your emotional reality relieves internal pressure.
            </p>

            {/* Quick Mood Chips */}
            <div className="journal-mood-chips">
              {[
                'Tired but Grateful',
                'Overwhelmed',
                'Peaceful',
                'Anxious',
                'Emotionally Sensitive',
                'Grounded',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className={`mood-chip-btn ${journalMood === chip ? 'is-selected' : ''}`}
                  onClick={() => setJournalMood(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveJournal}>
              <textarea
                data-testid="journal-textarea"
                className="journal-textarea"
                rows={4}
                placeholder="What felt heavy today? What gave you a moment of comfort? Write freely..."
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
              />

              <div className="journal-form-footer">
                <span className="journal-char-count">{journalEntry.length} characters</span>
                <button
                  type="submit"
                  data-testid="btn-save-journal"
                  className="care-modal-submit-btn"
                  disabled={!journalEntry.trim()}
                >
                  Save Reflection &amp; Mark Done
                </button>
              </div>
            </form>

            {/* Previously Saved Reflections List */}
            {savedJournalEntries.length > 0 && (
              <div className="journal-history-section">
                <h4 className="journal-history-title">Recent Reflections</h4>
                <div className="journal-entries-scroll">
                  {savedJournalEntries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="saved-entry-card">
                      <div className="saved-entry-header">
                        <span className="saved-entry-mood">{entry.mood}</span>
                        <span className="saved-entry-date">{entry.date}</span>
                      </div>
                      <p className="saved-entry-text">{entry.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Progressive Muscle Relaxation Modal */}
      {activeModal === 'muscle-relax' && (
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
            <h3 className="care-modal-title">Progressive Muscle Relaxation</h3>
            <p className="care-modal-desc">
              Follow these gentle physical tension release steps from head to toe:
            </p>
            <ol className="muscle-relax-steps">
              <li><strong>Shoulders &amp; Neck:</strong> Gently lift shoulders towards ears for 5 seconds, then drop completely and breathe out.</li>
              <li><strong>Hands &amp; Forearms:</strong> Clench fists softly, hold for 5 seconds, release and feel warmth in your palms.</li>
              <li><strong>Abdomen &amp; Lower Back:</strong> Relax belly breathing, allowing your abdominal wall to soften naturally without holding tension.</li>
              <li><strong>Legs &amp; Feet:</strong> Point toes softly, then relax calves and thighs entirely into the chair or bed.</li>
            </ol>
            <button
              type="button"
              className="care-modal-submit-btn"
              onClick={() => {
                const task = carePlan?.tasks?.find((t) => t.id === 'task-5');
                if (task && !task.completed) toggleCareTask('task-5');
                setActiveModal(null);
              }}
            >
              Complete Session &amp; Mark Done
            </button>
          </div>
        </div>
      )}

      {/* 5. Sensory Grounding Modal */}
      {activeModal === 'grounding' && (
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
            <h3 className="care-modal-title">5-4-3-2-1 Grounding Technique</h3>
            <p className="care-modal-desc">
              When postpartum thoughts race, use your physical surroundings to return to the present:
            </p>
            <ul className="grounding-list">
              <li><strong>5 things you can SEE:</strong> Look for soft colors, shadows, or items in the room.</li>
              <li><strong>4 things you can TOUCH:</strong> The texture of your baby's blanket, the chair fabric, your cool palms.</li>
              <li><strong>3 things you can HEAR:</strong> Gentle breathing, outdoor breeze, household hum.</li>
              <li><strong>2 things you can SMELL:</strong> Baby lotion, warm herbal tea, fresh air.</li>
              <li><strong>1 thing you can TASTE:</strong> A sip of water or tea.</li>
            </ul>
            <button
              type="button"
              className="care-modal-submit-btn"
              onClick={() => {
                const task = carePlan?.tasks?.find((t) => t.id === 'task-7');
                if (task && !task.completed) toggleCareTask('task-7');
                setActiveModal(null);
              }}
            >
              Mark Grounding Done
            </button>
          </div>
        </div>
      )}

      {/* 6. Thought Reframing Modal */}
      {activeModal === 'reframing' && (
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
            <h3 className="care-modal-title">Thought Reframing for New Mothers</h3>
            <p className="care-modal-desc">
              Common self-critical thoughts and balanced, compassionate perspectives:
            </p>
            <div className="reframing-pairs">
              <div className="reframing-pair">
                <span className="thought-harsh">"I should be feeling happier right now."</span>
                <span className="thought-balanced">➔ "Hormones fluctuate dramatically postpartum. It is normal and acceptable to feel mixed, sad, or tired."</span>
              </div>
              <div className="reframing-pair">
                <span className="thought-harsh">"I am failing if the baby won't stop crying."</span>
                <span className="thought-balanced">➔ "Crying is how babies communicate distress, not a judgment of my maternal capability."</span>
              </div>
            </div>
            <button
              type="button"
              className="care-modal-submit-btn"
              onClick={() => {
                const task = carePlan?.tasks?.find((t) => t.id === 'task-2');
                if (task && !task.completed) toggleCareTask('task-2');
                setActiveModal(null);
              }}
            >
              Mark Mood Check-in Done
            </button>
          </div>
        </div>
      )}

      {/* 7. Nutrition Modal */}
      {activeModal === 'nutrition' && (
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
            <h3 className="care-modal-title">Postpartum Recovery Nutrition</h3>
            <p className="care-modal-desc">
              Fueling your healing body with warm, easily digestible, nutrient-dense foods:
            </p>
            <ul className="grounding-list">
              <li><strong>Iron-Rich Soups &amp; Stews:</strong> Bone broths, lentil dahl, and spinach support blood volume recovery.</li>
              <li><strong>Healthy Fats:</strong> Avocados, olive oil, and walnuts support cellular recovery and breastmilk fatty acids.</li>
              <li><strong>Hydration Benchmark:</strong> Keep a 1-liter water bottle at every nursing / feeding station.</li>
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
    </div>
  );
}

export default CareSuggestionsPage;
