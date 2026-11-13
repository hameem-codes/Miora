import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './screening.css';

export function PatientScreeningPage() {
  const navigate = useNavigate();

  // Media & Controls state
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isRecording, setIsRecording] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(134); // starts at 02:14 to match screenshot
  const [progress, setProgress] = useState(40);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dropdown states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const videoContainerRef = useRef(null);

  // Timer interval for recording
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Format mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleEndScreening = () => {
    setIsRecording(false);
    navigate('/screening-results');
  };

  return (
    <div className="miora-screening-shell">
      {/* =========================================================================
          1. Left Sidebar
          ========================================================================= */}
      <aside className="miora-patient-sidebar" aria-label="Main Navigation">
        {/* Brand / Logo section */}
        <div className="screening-sidebar-brand">
          <NavLink to="/patient/dashboard" className="screening-brand-link">
            <span className="screening-brand-script">Miora</span>
          </NavLink>
          <div className="screening-brand-tagline">
            <span>Maternal Emotional</span>
            <span>Intelligence</span>
          </div>
          <div className="screening-brand-accent-line" aria-hidden="true" />
        </div>

        {/* Primary Navigation List */}
        <nav className="screening-sidebar-nav">
          <ul className="screening-nav-list">
            {/* Home */}
            <li className="screening-nav-item">
              <NavLink to="/patient/dashboard" className="screening-nav-link">
                <span className="screening-nav-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
                    <path d="M9.5 21v-7h5v7" />
                  </svg>
                </span>
                <span className="screening-nav-label">Home</span>
              </NavLink>
            </li>

            {/* Medical History */}
            <li className="screening-nav-item">
              <NavLink to="/medical-history" className="screening-nav-link">
                <span className="screening-nav-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                </span>
                <span className="screening-nav-label">Medical History</span>
              </NavLink>
            </li>

            {/* AI Screening (ACTIVE) */}
            <li className="screening-nav-item">
              <NavLink to="/screening" className="screening-nav-link is-active">
                <span className="screening-nav-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.5 2A4.5 4.5 0 0 0 5 6.5C5 8 5.7 9.3 6.8 10.1A4.5 4.5 0 0 0 6 12a4.5 4.5 0 0 0 1 2.8A4.5 4.5 0 0 0 9.5 22h1V2h-1z" />
                    <path d="M14.5 2A4.5 4.5 0 0 1 19 6.5c0 1.5-.7 2.8-1.8 3.6A4.5 4.5 0 0 1 18 12a4.5 4.5 0 0 1-1 2.8A4.5 4.5 0 0 1 14.5 22h-1V2h1z" />
                    <circle cx="9.5" cy="8" r="0.8" fill="currentColor" />
                    <circle cx="14.5" cy="8" r="0.8" fill="currentColor" />
                    <circle cx="9.5" cy="15" r="0.8" fill="currentColor" />
                    <circle cx="14.5" cy="15" r="0.8" fill="currentColor" />
                  </svg>
                </span>
                <span className="screening-nav-label">AI Screening</span>
              </NavLink>
            </li>

            {/* Voice Assistant */}
            <li className="screening-nav-item">
              <NavLink to="/ai-assistant" className="screening-nav-link">
                <span className="screening-nav-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    <circle cx="8" cy="12" r="1" fill="currentColor" />
                    <circle cx="12" cy="12" r="1" fill="currentColor" />
                    <circle cx="16" cy="12" r="1" fill="currentColor" />
                  </svg>
                </span>
                <span className="screening-nav-label">Voice Assistant</span>
              </NavLink>
            </li>

            {/* My Reports */}
            <li className="screening-nav-item">
              <NavLink to="/patient/reports" className="screening-nav-link">
                <span className="screening-nav-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <span className="screening-nav-label">My Reports</span>
              </NavLink>
            </li>

            {/* Care Suggestions */}
            <li className="screening-nav-item">
              <NavLink to="/patient/care-suggestions" className="screening-nav-link">
                <span className="screening-nav-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </span>
                <span className="screening-nav-label">Care Suggestions</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer: Profile & Settings */}
        <div className="screening-sidebar-footer">
          <ul className="screening-nav-list">
            <li className="screening-nav-item">
              <NavLink to="/screening" className="screening-nav-link">
                <span className="screening-nav-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span className="screening-nav-label">Profile</span>
              </NavLink>
            </li>
            <li className="screening-nav-item">
              <NavLink to="/screening" className="screening-nav-link">
                <span className="screening-nav-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </span>
                <span className="screening-nav-label">Settings</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </aside>

      {/* =========================================================================
          2. Main Content Viewport
          ========================================================================= */}
      <div className="miora-screening-viewport">
        {/* Top Header */}
        <header className="screening-top-header">
          <div className="screening-header-left">
            {/* Breadcrumb: Home > AI Screening */}
            <div className="screening-breadcrumb">
              <NavLink to="/patient/dashboard" className="screening-breadcrumb-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
                  <path d="M9.5 21v-7h5v7" />
                </svg>
                <span>Home</span>
              </NavLink>
              <span className="screening-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
              <span className="screening-breadcrumb-current">AI Screening</span>
            </div>

            {/* Heading */}
            <h1 className="screening-main-heading">AI Screening Session</h1>
            <p className="screening-main-subtitle">
              A private, conversational screening to understand your emotional well-being after childbirth.
            </p>
          </div>

          <div className="screening-header-right">
            {/* 4-Stage Progress Tracker */}
            <div className="screening-progress-tracker" aria-label="Screening stages">
              {/* Stage 1: Medical History (completed) */}
              <NavLink to="/medical-history" className="tracker-stage is-completed" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="tracker-circle">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="2.5 6 4.8 8.5 9.5 3.5" />
                  </svg>
                </div>
                <span className="tracker-label">Medical History</span>
              </NavLink>

              {/* Connecting line 1 -> 2 */}
              <div className="tracker-connector is-active-connector" aria-hidden="true" />

              {/* Stage 2: Screening (active) */}
              <div className="tracker-stage is-active">
                <div className="tracker-circle">
                  <span className="tracker-inner-dot" />
                </div>
                <span className="tracker-label">Screening</span>
              </div>

              {/* Connecting line 2 -> 3 */}
              <div className="tracker-connector" aria-hidden="true" />

              {/* Stage 3: Analysis (upcoming) */}
              <NavLink to="/screening-results" className="tracker-stage is-upcoming" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="tracker-circle" />
                <span className="tracker-label">Analysis</span>
              </NavLink>

              {/* Connecting line 3 -> 4 */}
              <div className="tracker-connector" aria-hidden="true" />

              {/* Stage 4: Results (upcoming) */}
              <NavLink to="/screening-results" className="tracker-stage is-upcoming" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="tracker-circle" />
                <span className="tracker-label">Results</span>
              </NavLink>
            </div>

            {/* Notification Bell & Patient Profile */}
            <div className="screening-user-controls">
              {/* Notification Bell */}
              <div className="screening-notif-wrap" ref={notifRef}>
                <button
                  type="button"
                  className="screening-icon-btn"
                  onClick={() => {
                    setNotifDropdownOpen((prev) => !prev);
                    setProfileDropdownOpen(false);
                  }}
                  aria-label="Notifications"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </button>

                {notifDropdownOpen && (
                  <div className="screening-dropdown-menu screening-notif-menu" role="dialog">
                    <div className="screening-dropdown-header">
                      <span>Notifications</span>
                    </div>
                    <div className="screening-notif-list">
                      <div className="screening-notif-item is-unread">
                        <strong>Screening in progress</strong>
                        <p>Your session is active and recording.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Patient Profile Badge */}
              <div className="screening-profile-wrap" ref={profileRef}>
                <button
                  type="button"
                  className="screening-profile-btn"
                  onClick={() => {
                    setProfileDropdownOpen((prev) => !prev);
                    setNotifDropdownOpen(false);
                  }}
                  aria-label="User profile menu"
                >
                  <span className="screening-avatar-badge">S</span>
                  <span className="screening-profile-name">Sadiya</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {profileDropdownOpen && (
                  <div className="screening-dropdown-menu screening-profile-menu" role="menu">
                    <div className="screening-profile-menu-info">
                      <strong>Sadiya Khan</strong>
                      <small>sadiya.khan@miora.health</small>
                    </div>
                    <hr className="screening-menu-divider" />
                    <NavLink to="/patient/dashboard" className="screening-menu-link">Patient Dashboard</NavLink>
                    <NavLink to="/dashboard" className="screening-menu-link">Doctor Portal</NavLink>
                    <NavLink to="/login" className="screening-menu-link">Sign Out</NavLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* =========================================================================
            3. Main Two-Column Content: Left Video + Right Chat
            ========================================================================= */}
        <main className="screening-main-layout">
          {/* Left: Video Panel */}
          <section className="screening-video-panel" ref={videoContainerRef} aria-label="Patient Live Video">
            <div className="screening-video-frame">
              {/* Patient Live Video / Feed image */}
              {cameraOn ? (
                <img
                  src="/assets/screening-patient-feed.jpg"
                  alt="You (Live)"
                  className="screening-video-img"
                />
              ) : (
                <div className="screening-video-off-placeholder">
                  <div className="camera-off-avatar">S</div>
                  <span>Camera is turned off</span>
                </div>
              )}

              {/* Top Overlay: Recording indicator + elapsed timer & Fullscreen toggle */}
              <div className="screening-video-top-bar">
                <div className="screening-recording-badge">
                  <span className={`recording-red-dot ${!isRecording ? 'is-paused' : ''}`} aria-hidden="true" />
                  <span className="recording-text">Recording</span>
                  <time className="recording-timer">{formatTime(timerSeconds)}</time>
                </div>

                <button
                  type="button"
                  className="screening-fullscreen-btn"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <polyline points="21 15 21 21 15 21" />
                    <polyline points="3 9 3 3 9 3" />
                  </svg>
                </button>
              </div>

              {/* Bottom Overlay: You (Live) Label */}
              <div className="screening-video-bottom-bar">
                <div className="screening-live-tag">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  <span>You (Live)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Miora AI Chat Panel */}
          <section className="screening-chat-panel" aria-label="Miora AI Chat">
            {/* Chat Panel Header */}
            <div className="screening-chat-header">
              <div className="screening-bot-avatar-wrap">
                <img
                  src="/assets/screening-robot-avatar.png"
                  alt="Miora AI"
                  className="screening-bot-avatar"
                />
              </div>
              <div className="screening-bot-meta">
                <h2 className="screening-bot-name">Miora AI</h2>
                <span className="screening-bot-role">Your screening companion</span>
              </div>

              <div className="screening-chat-options">
                <button type="button" className="screening-dots-btn" aria-label="Chat options">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="12" r="1.8" />
                    <circle cx="12" cy="12" r="1.8" />
                    <circle cx="19" cy="12" r="1.8" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="screening-chat-body">
              {/* Message 1: AI Prompt */}
              <div className="screening-chat-message is-bot">
                <div className="screening-chat-bot-icon">
                  <img src="/assets/screening-robot-avatar.png" alt="" aria-hidden="true" />
                </div>
                <div className="screening-bubble-group">
                  <div className="screening-bubble is-bot-bubble">
                    Hi Sadiya! I'm Miora, your AI screening companion. I'll ask you a few questions to understand how you've been feeling lately.
                    <br />
                    Is it okay if we begin?
                  </div>
                  <time className="screening-bubble-time">10:24 AM</time>
                </div>
              </div>

              {/* Message 2: Patient Response */}
              <div className="screening-chat-message is-user">
                <div className="screening-bubble-group">
                  <div className="screening-bubble is-user-bubble">
                    Yes, we can start.
                  </div>
                  <div className="screening-bubble-meta">
                    <time className="screening-bubble-time">10:24 AM</time>
                    <svg className="screening-check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Message 3: AI Question 2 */}
              <div className="screening-chat-message is-bot">
                <div className="screening-chat-bot-icon">
                  <img src="/assets/screening-robot-avatar.png" alt="" aria-hidden="true" />
                </div>
                <div className="screening-bubble-group">
                  <div className="screening-bubble is-bot-bubble">
                    In the past two weeks, how often have you felt low, sad, or hopeless?
                  </div>
                  <time className="screening-bubble-time">10:25 AM</time>
                </div>
              </div>

              {/* Active Listening Card with Waveform */}
              <div className="screening-listening-card">
                <div className="screening-listening-top">
                  <div className="screening-listening-pill">
                    <span className="listening-eq-icon" aria-hidden="true">
                      <span className={`eq-bar bar-1 ${!micOn ? 'is-paused' : ''}`} />
                      <span className={`eq-bar bar-2 ${!micOn ? 'is-paused' : ''}`} />
                      <span className={`eq-bar bar-3 ${!micOn ? 'is-paused' : ''}`} />
                    </span>
                    <span className="listening-label">Listening...</span>
                  </div>

                  {/* Vocal Sound Waveform */}
                  <div className="screening-audio-waveform" aria-hidden="true">
                    <span className="wave-line w-1" />
                    <span className="wave-line w-2" />
                    <span className="wave-line w-3" />
                    <span className="wave-line w-4" />
                    <span className="wave-line w-5" />
                    <span className="wave-line w-6" />
                    <span className="wave-line w-7" />
                    <span className="wave-line w-8" />
                    <span className="wave-line w-9" />
                    <span className="wave-line w-10" />
                    <span className="wave-line w-11" />
                    <span className="wave-line w-12" />
                    <span className="wave-line w-13" />
                    <span className="wave-line w-14" />
                    <span className="wave-line w-15" />
                    <span className="wave-line w-16" />
                    <span className="wave-line w-17" />
                    <span className="wave-line w-18" />
                    <span className="wave-line w-19" />
                    <span className="wave-line w-20" />
                  </div>
                </div>

                <div className="screening-listening-bottom">
                  <p className="screening-transcribed-text">
                    I've been feeling a bit low almost every day.
                  </p>
                  <span className="screening-audio-check" aria-hidden="true">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2.5 6 4.8 8.5 9.5 3.5" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* =========================================================================
            4. Bottom Control Bar: Camera On, Mic On, Recording in progress, Progress 40%, End Screening
            ========================================================================= */}
        <footer className="screening-bottom-bar-container">
          <div className="screening-bottom-card">
            <div className="screening-control-buttons">
              {/* Camera On Button */}
              <button
                type="button"
                className={`screening-media-btn ${cameraOn ? 'is-active' : 'is-muted'}`}
                onClick={() => setCameraOn((prev) => !prev)}
                aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
              >
                <span className="screening-media-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </span>
                <span className="screening-media-text">{cameraOn ? 'Camera On' : 'Camera Off'}</span>
              </button>

              {/* Mic On Button */}
              <button
                type="button"
                className={`screening-media-btn ${micOn ? 'is-active' : 'is-muted'}`}
                onClick={() => setMicOn((prev) => !prev)}
                aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                <span className="screening-media-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </span>
                <span className="screening-media-text">{micOn ? 'Mic On' : 'Mic Off'}</span>
              </button>
            </div>

            {/* Center-left status: Recording in progress */}
            <div className="screening-recording-status">
              <span className={`recording-status-dot ${!isRecording ? 'is-paused' : ''}`} aria-hidden="true" />
              <span className="recording-status-text">Recording in progress</span>
            </div>

            {/* Center Progress Bar: Session Progress (40%) */}
            <div className="screening-progress-widget">
              <div className="screening-progress-header">
                <span className="progress-title">Session Progress</span>
                <span className="progress-percentage">{progress}%</span>
              </div>
              <div className="screening-progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
                <div className="screening-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Right CTA Button: End Screening */}
            <div className="screening-action-right">
              <button
                type="button"
                className="screening-end-btn"
                onClick={handleEndScreening}
              >
                <span className="end-btn-square" aria-hidden="true" />
                <span>End Screening</span>
              </button>
            </div>
          </div>
        </footer>

        {/* Soft pink watercolor corner floral decoration matching screenshot */}
        <div className="screening-floral-decor" aria-hidden="true">
          <img
            src="/assets/screening-flower-corner.png"
            alt=""
            className="screening-corner-flower-img"
          />
        </div>
      </div>
    </div>
  );
}
