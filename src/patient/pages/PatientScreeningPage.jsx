import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { PatientSidebar } from '../components/PatientSidebar.jsx';
import { usePatient } from '../context/PatientContext.jsx';
import './screening.css';

// Structured sequence of clinical screening companion questions
const SCREENING_QUESTIONS = [
  {
    id: 'intro',
    botMessage: (name) =>
      `Hi ${name}! I'm Miora, your AI screening companion. I'll ask you a few questions to understand how you've been feeling lately.\nIs it okay if we begin?`,
    initialUserResponse: 'Yes, we can start.',
  },
  {
    id: 'q1-mood',
    botMessage: () => 'In the past two weeks, how often have you felt low, sad, or hopeless?',
    suggestedResponse: "I've been feeling a bit low almost every day.",
    progressPct: 40,
  },
  {
    id: 'q2-anxiety',
    botMessage: () =>
      'Thank you for sharing that. Have you been feeling anxious, overwhelmed, or unable to relax since welcoming your baby?',
    suggestedResponse: 'Yes, especially in the evenings when trying to settle down.',
    progressPct: 65,
  },
  {
    id: 'q3-support',
    botMessage: () =>
      'Do you have supportive family or friends around you who can help when things feel difficult?',
    suggestedResponse: 'My partner helps when he can, but I often feel alone with the baby during the day.',
    progressPct: 85,
  },
  {
    id: 'q4-closing',
    botMessage: (name) =>
      `Thank you for completing this screening session, ${name}. Your responses, vocal tone, and video recordings have been securely captured. Whenever you are ready, please click "End Screening" below to proceed to your analysis.`,
    suggestedResponse: '',
    progressPct: 100,
  },
];

// Default waveform bar heights (20 lines matching reference visual)
const DEFAULT_WAVE_HEIGHTS = [4, 7, 13, 5, 11, 16, 9, 15, 12, 7, 15, 11, 16, 9, 13, 5, 11, 15, 7, 4];

export function PatientScreeningPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    patient,
    medicalHistory,
    currentSession,
    startScreeningSession,
    updateScreeningSession,
    completeScreeningSession,
  } = usePatient();

  const patientName = patient?.name || 'Sadiya';
  const patientInitial = patient?.avatarInitials || patientName.charAt(0).toUpperCase() || 'S';

  // Session lifecycle state: 'consent' | 'requesting' | 'active' | 'error' | 'completed'
  // If auto-start param (?start=true / ?autostart=1) or existing in-progress session, start active
  const initialAutostart = searchParams.get('start') === 'true' || searchParams.get('autostart') === '1';
  const [hasConsented, setHasConsented] = useState(initialAutostart);
  const [sessionState, setSessionState] = useState(initialAutostart ? 'requesting' : 'consent');
  const [mediaError, setMediaError] = useState(null); // 'denied' | 'unavailable' | 'unsupported' | 'general'

  // Media controls
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Question & Conversation flow state
  // Index 1 corresponds to Question 2 in SCREENING_QUESTIONS, matching the 40% screenshot
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(1);
  const [progress, setProgress] = useState(40);
  const [currentAnswer, setCurrentAnswer] = useState("I've been feeling a bit low almost every day.");
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  // Initial transcript turns matching the visual reference
  const [transcriptTurns, setTranscriptTurns] = useState([
    {
      id: 'turn-1',
      sender: 'bot',
      text: `Hi ${patientName}! I'm Miora, your AI screening companion. I'll ask you a few questions to understand how you've been feeling lately.\nIs it okay if we begin?`,
      time: '10:24 AM',
    },
    {
      id: 'turn-2',
      sender: 'user',
      text: 'Yes, we can start.',
      time: '10:24 AM',
      confirmed: true,
    },
    {
      id: 'turn-3',
      sender: 'bot',
      text: 'In the past two weeks, how often have you felt low, sad, or hopeless?',
      time: '10:25 AM',
    },
  ]);

  // Audio wave visualization heights (20 bars)
  const [waveHeights, setWaveHeights] = useState(DEFAULT_WAVE_HEIGHTS);

  // UI dropdown states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Element and stream references
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const transcriptTurnsRef = useRef(transcriptTurns);

  // Keep transcript ref in sync
  useEffect(() => {
    transcriptTurnsRef.current = transcriptTurns;
  }, [transcriptTurns]);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Helper to format current time string (e.g. 10:25 AM)
  const getCurrentTimeString = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // ---------------------------------------------------------------------------
  // 1. Audio Analyser & Real-time Waveform Visualization
  // ---------------------------------------------------------------------------
  const setupAudioAnalyser = useCallback((stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;

      const frequencyData = new Uint8Array(analyser.frequencyBinCount);

      const renderWaveform = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(frequencyData);

        // Map frequency bins to 20 waveform bars between 3px and 16px
        const nextHeights = DEFAULT_WAVE_HEIGHTS.map((baseHeight, idx) => {
          const binIndex = Math.min(Math.floor((idx / 20) * frequencyData.length), frequencyData.length - 1);
          const rawValue = frequencyData[binIndex] || 0;
          // Scale raw 0-255 to 3px-16px range
          const dynamicHeight = Math.max(3, Math.min(16, Math.round(3 + (rawValue / 255) * 13)));
          return dynamicHeight;
        });

        setWaveHeights(nextHeights);
        animFrameRef.current = requestAnimationFrame(renderWaveform);
      };

      animFrameRef.current = requestAnimationFrame(renderWaveform);
    } catch (err) {
      console.warn('AudioAnalyser setup notice:', err);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Speech Recognition (Web Speech API)
  // ---------------------------------------------------------------------------
  const setupSpeechRecognition = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setIsSpeechSupported(false);
      return;
    }

    setIsSpeechSupported(true);
    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setCurrentAnswer(transcript.trim());
        }
      };

      recognition.onerror = (event) => {
        // Non-fatal error; raw audio recording continues via MediaRecorder
        console.warn('SpeechRecognition notice:', event.error);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // 3. Start Media Capture (getUserMedia + MediaRecorder + Analyser)
  // ---------------------------------------------------------------------------
  const startMediaStream = useCallback(async () => {
    setMediaError(null);
    setSessionState('requesting');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError('unsupported');
      setSessionState('error');
      return;
    }

    try {
      // Explicitly request both camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Attach stream to real HTML5 video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('Video autoplay notice:', err);
        });
      }

      // Initialize MediaRecorder for genuine local browser recording
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!window.MediaRecorder || !MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }

      recordedChunksRef.current = [];
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      recorder.start(1000); // Record in 1s timeslices
      mediaRecorderRef.current = recorder;

      // Setup real-time audio analysis for live waveform
      setupAudioAnalyser(stream);

      // Setup live speech-to-text if supported
      setupSpeechRecognition();

      // Initialize session in patient context
      startScreeningSession();

      setSessionState('active');
      setIsRecording(true);
      setCameraOn(true);
      setMicOn(true);
    } catch (err) {
      console.error('Media stream acquisition error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMediaError('denied');
      } else if (
        err.name === 'NotFoundError' ||
        err.name === 'DevicesNotFoundError' ||
        err.name === 'NotReadableError'
      ) {
        setMediaError('unavailable');
      } else {
        setMediaError('general');
      }
      setSessionState('error');
    }
  }, [setupAudioAnalyser, setupSpeechRecognition, startScreeningSession]);

  // Auto-start if requested via URL
  useEffect(() => {
    if (initialAutostart) {
      startMediaStream();
    }
  }, [initialAutostart, startMediaStream]);

  // Elapsed recording timer
  useEffect(() => {
    if (isRecording && sessionState === 'active') {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording, sessionState]);

  // Cleanup all media resources on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Sync video element when stream attaches or cameraOn toggles
  useEffect(() => {
    if (videoRef.current && streamRef.current && cameraOn) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOn, sessionState]);

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

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // ---------------------------------------------------------------------------
  // 4. Media Controls (Camera Toggle, Mic Toggle, Fullscreen)
  // ---------------------------------------------------------------------------
  const toggleCamera = () => {
    const nextCameraState = !cameraOn;
    setCameraOn(nextCameraState);
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextCameraState;
      });
    }
  };

  const toggleMic = () => {
    const nextMicState = !micOn;
    setMicOn(nextMicState);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextMicState;
      });
    }
    if (!nextMicState) {
      // If muted, collapse waveform bars to flat baseline
      setWaveHeights(DEFAULT_WAVE_HEIGHTS.map(() => 3));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Question Progression & Answer Confirmation
  // ---------------------------------------------------------------------------
  const handleConfirmAnswer = () => {
    if (!currentAnswer.trim()) return;

    const currentTime = getCurrentTimeString();

    // 1. Append confirmed patient response
    const confirmedTurn = {
      id: `turn-patient-${Date.now()}`,
      sender: 'user',
      text: currentAnswer.trim(),
      time: currentTime,
      confirmed: true,
    };

    const nextTurns = [...transcriptTurns, confirmedTurn];

    // 2. Advance question index
    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < SCREENING_QUESTIONS.length) {
      const nextQ = SCREENING_QUESTIONS[nextIdx];
      const botTurn = {
        id: `turn-bot-${Date.now()}`,
        sender: 'bot',
        text: typeof nextQ.botMessage === 'function' ? nextQ.botMessage(patientName) : nextQ.botMessage,
        time: currentTime,
      };

      nextTurns.push(botTurn);
      setCurrentQuestionIdx(nextIdx);
      setProgress(nextQ.progressPct || 100);
      setCurrentAnswer(nextQ.suggestedResponse || '');
    } else {
      setProgress(100);
      setCurrentAnswer('');
    }

    setTranscriptTurns(nextTurns);

    // Update active session transcript in context
    updateScreeningSession({
      transcript: nextTurns,
      sessionProgress: SCREENING_QUESTIONS[nextIdx]?.progressPct || 100,
    });
  };

  // ---------------------------------------------------------------------------
  // 6. End Screening Session & Navigation to Analysis
  // ---------------------------------------------------------------------------
  const handleEndScreening = async () => {
    setIsRecording(false);

    // 1. Stop recorder and capture final chunks
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping mediaRecorder:', err);
      }
    }

    // 2. Stop all camera & microphone tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // 3. Stop audio analyser & speech recognition
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
    }

    // 4. Assemble video/audio blobs
    const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
    const recordedBlob =
      recordedChunksRef.current.length > 0
        ? new Blob(recordedChunksRef.current, { type: mimeType })
        : new Blob([], { type: mimeType });

    const blobUrl = recordedBlob.size > 0 ? URL.createObjectURL(recordedBlob) : null;

    // 5. Update active session with real media references & transcript
    updateScreeningSession({
      recordings: {
        audioBlob: recordedBlob,
        audioBlobUrl: blobUrl,
        audioDurationSeconds: timerSeconds,
        videoBlob: recordedBlob,
        videoBlobUrl: blobUrl,
        videoDurationSeconds: timerSeconds,
        format: 'webm',
        storageType: 'temporary-browser-memory',
        isLocalMemoryOnly: true,
        isPersistedRemotely: false,
        remoteUrl: null,
      },
      transcript: transcriptTurnsRef.current,
      sessionProgress: 100,
      completedAt: new Date().toISOString(),
    });

    // 6. Finalize session without fabricating synthetic clinical PPD scores
    completeScreeningSession(null);

    // 7. Navigate directly to the Screening Results / Analysis view
    navigate('/patient/screening-results');
  };

  return (
    <div className="miora-screening-shell">
      {/* =========================================================================
          1. Left Sidebar
          ========================================================================= */}
      <PatientSidebar activeTab="screening" />

      {/* =========================================================================
          2. Main Content Viewport
          ========================================================================= */}
      <div className="miora-screening-viewport">
        {/* Top Header */}
        <header className="screening-top-header">
          <div className="screening-header-left">
            {/* Breadcrumb: [Home Icon] AI Screening */}
            <div className="screening-breadcrumb">
              <NavLink to="/patient/dashboard" className="screening-breadcrumb-link" aria-label="Home Dashboard">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
                  <path d="M9.5 21v-7h5v7" />
                </svg>
              </NavLink>
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
              <NavLink
                to="/patient/medical-history"
                className="tracker-stage is-completed"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="tracker-circle">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
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
              <NavLink
                to="/patient/screening-results"
                className="tracker-stage is-upcoming"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="tracker-circle" />
                <span className="tracker-label">Analysis</span>
              </NavLink>

              {/* Connecting line 3 -> 4 */}
              <div className="tracker-connector" aria-hidden="true" />

              {/* Stage 4: Results (upcoming) */}
              <NavLink
                to="/patient/screening-results"
                className="tracker-stage is-upcoming"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
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
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
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
                        <strong>Screening Session Active</strong>
                        <p>Real-time conversational screening in progress.</p>
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
                  <span className="screening-avatar-badge">{patientInitial}</span>
                  <span className="screening-profile-name">{patientName}</span>
                  <svg
                    width="12"
                    height="12"
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
                  <div className="screening-dropdown-menu screening-profile-menu" role="menu">
                    <div className="screening-profile-menu-info">
                      <strong>{patient?.fullName || patientName}</strong>
                      <small>{patient?.email || 'patient@miora.health'}</small>
                    </div>
                    <hr className="screening-menu-divider" />
                    <NavLink to="/patient/dashboard" className="screening-menu-link">
                      Patient Dashboard
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
              {/* State A: Pre-Session Consent Card */}
              {sessionState === 'consent' && (
                <div className="screening-consent-panel" role="region" aria-label="Screening Consent">
                  <div className="screening-consent-icon-badge" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <h3 className="screening-consent-title">Private AI Screening</h3>
                  <p className="screening-consent-desc">
                    Miora records live camera video and microphone audio to analyze emotional well-being cues. All data
                    remains in temporary browser memory on your device.
                  </p>
                  <label className="screening-consent-checkbox-label">
                    <div className="screening-consent-checkbox-wrap">
                      <input
                        type="checkbox"
                        checked={hasConsented}
                        onChange={(e) => setHasConsented(e.target.checked)}
                        className="screening-consent-checkbox"
                      />
                      <span>I consent to live video and audio recording for this screening session.</span>
                    </div>
                  </label>
                  <button
                    type="button"
                    className="screening-start-btn"
                    disabled={!hasConsented}
                    onClick={startMediaStream}
                  >
                    Start Screening Session
                  </button>
                </div>
              )}

              {/* State B: Loading Media Access */}
              {sessionState === 'requesting' && (
                <div className="screening-video-state-overlay" role="status">
                  <div className="screening-video-spinner" aria-hidden="true" />
                  <p className="screening-state-title">Accessing Camera &amp; Microphone...</p>
                  <p className="screening-state-desc">Please grant browser permissions when prompted.</p>
                </div>
              )}

              {/* State C: Permission Denied or Unavailable Error */}
              {sessionState === 'error' && (
                <div className="screening-video-state-overlay" role="alert">
                  <div className="screening-error-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <p className="screening-state-title">
                    {mediaError === 'denied'
                      ? 'Camera / Mic Permission Blocked'
                      : mediaError === 'unavailable'
                      ? 'Camera / Mic Unavailable'
                      : mediaError === 'unsupported'
                      ? 'Browser Media Not Supported'
                      : 'Media Connection Error'}
                  </p>
                  <p className="screening-state-desc">
                    {mediaError === 'denied'
                      ? 'Please allow camera and microphone access in your browser settings to proceed.'
                      : mediaError === 'unavailable'
                      ? 'No operational camera or microphone was detected on this device.'
                      : 'An error occurred while establishing audio/video capture.'}
                  </p>
                  <button type="button" className="screening-retry-btn" onClick={startMediaStream}>
                    Retry Permissions
                  </button>
                </div>
              )}

              {/* State D: Active Live Camera Preview */}
              {sessionState === 'active' && (
                <>
                  {cameraOn ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="screening-video-element"
                      aria-label="Patient live camera preview"
                    />
                  ) : (
                    <div className="screening-video-off-placeholder">
                      <div className="camera-off-avatar">{patientInitial}</div>
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
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
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
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M23 7l-7 5 7 5V7z" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                      <span>You (Live)</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Right: Miora AI Conversational Screening Panel */}
          <section className="screening-chat-panel" aria-label="Miora AI Chat">
            {/* Chat Panel Header */}
            <div className="screening-chat-header">
              <div className="screening-bot-avatar-wrap">
                <img
                  src="/assets/screening-robot-avatar.png"
                  alt="Miora AI Companion"
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

            {/* Chat Messages Body */}
            <div className="screening-chat-body">
              {transcriptTurns.map((turn) => {
                if (turn.sender === 'bot') {
                  return (
                    <div key={turn.id} className="screening-chat-message is-bot">
                      <div className="screening-chat-bot-icon">
                        <img src="/assets/screening-robot-avatar.png" alt="" aria-hidden="true" />
                      </div>
                      <div className="screening-bubble-group">
                        <div className="screening-bubble is-bot-bubble" style={{ whiteSpace: 'pre-line' }}>
                          {turn.text}
                        </div>
                        <time className="screening-bubble-time">{turn.time}</time>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={turn.id} className="screening-chat-message is-user">
                    <div className="screening-bubble-group">
                      <div className="screening-bubble is-user-bubble">{turn.text}</div>
                      <div className="screening-bubble-meta">
                        <time className="screening-bubble-time">{turn.time}</time>
                        <svg
                          className="screening-check-icon"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Active Listening Card with Live Waveform & Captured Answer */}
              {sessionState === 'active' && currentQuestionIdx < SCREENING_QUESTIONS.length - 1 && (
                <div className="screening-listening-card" aria-live="polite">
                  <div className="screening-listening-top">
                    <div className="screening-listening-pill">
                      <span className="listening-eq-icon" aria-hidden="true">
                        <span className={`eq-bar bar-1 ${!micOn ? 'is-paused' : ''}`} />
                        <span className={`eq-bar bar-2 ${!micOn ? 'is-paused' : ''}`} />
                        <span className={`eq-bar bar-3 ${!micOn ? 'is-paused' : ''}`} />
                      </span>
                      <span className="listening-label">{micOn ? 'Listening...' : 'Mic Muted'}</span>
                    </div>

                    {/* Speech Waveform Visualization (Driven by live audio input) */}
                    <div className="screening-audio-waveform" aria-hidden="true">
                      {waveHeights.map((h, idx) => (
                        <span
                          key={idx}
                          className={`wave-line w-${idx + 1}`}
                          style={{ height: micOn && isRecording ? `${h}px` : '3px' }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="screening-listening-bottom">
                    <div className="screening-transcribed-wrap">
                      <p className="screening-transcribed-text">
                        {currentAnswer || (micOn ? 'Listening to your response...' : 'Microphone is currently muted.')}
                      </p>
                      {!isSpeechSupported && (
                        <span className="screening-transcribed-notice">
                          Transcription unavailable in this browser · Recording raw audio
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="screening-audio-check-btn"
                      onClick={handleConfirmAnswer}
                      title="Confirm answer and proceed to next question"
                      aria-label="Confirm answer"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="2.5 6 4.8 8.5 9.5 3.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* =========================================================================
            4. Bottom Control Bar: Camera On, Mic On, Recording Status, Progress, End Screening
            ========================================================================= */}
        <footer className="screening-bottom-bar-container">
          <div className="screening-bottom-card">
            <div className="screening-control-buttons">
              {/* Camera On / Off Button */}
              <button
                type="button"
                className={`screening-media-btn ${cameraOn ? 'is-active' : 'is-muted'}`}
                onClick={toggleCamera}
                aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
              >
                <span className="screening-media-icon">
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
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </span>
                <span className="screening-media-text">{cameraOn ? 'Camera On' : 'Camera Off'}</span>
              </button>

              {/* Mic On / Off Button */}
              <button
                type="button"
                className={`screening-media-btn ${micOn ? 'is-active' : 'is-muted'}`}
                onClick={toggleMic}
                aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                <span className="screening-media-icon">
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
              <span
                className={`recording-status-dot ${!isRecording || sessionState !== 'active' ? 'is-paused' : ''}`}
                aria-hidden="true"
              />
              <span className="recording-status-text">
                {sessionState === 'active' && isRecording ? 'Recording in progress' : 'Session ready'}
              </span>
            </div>

            {/* Center Progress Bar: Session Progress (e.g. 40%) */}
            <div className="screening-progress-widget">
              <div className="screening-progress-header">
                <span className="progress-title">Session Progress</span>
                <span className="progress-percentage">{progress}%</span>
              </div>
              <div
                className="screening-progress-track"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div className="screening-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Right CTA Button: End Screening */}
            <div className="screening-action-right">
              <button
                type="button"
                className="screening-end-btn"
                onClick={handleEndScreening}
                aria-label="End Screening Session"
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
