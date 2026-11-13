import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import { signOutUser } from '../../auth/authService.js';
import '../styles/ai-assistant.css';

// SVG Icons matching Miora's clean refined stroke style
const Icons = {
  chatDots: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <circle cx="8" cy="11.5" r="1" fill="currentColor" />
      <circle cx="12" cy="11.5" r="1" fill="currentColor" />
      <circle cx="16" cy="11.5" r="1" fill="currentColor" />
    </svg>
  ),
  bell: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  chevronDown: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  info: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  dots: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  ),
  paperclip: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l7.88-7.88" />
    </svg>
  ),
  mic: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  ),
  send: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none" />
    </svg>
  ),
  leaf: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  lotus: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3c-1.5 3-4 6-8 7 3 2 5.5 5 8 9 2.5-4 5-7 8-9-4-1-6.5-4-8-7z" />
      <path d="M12 12c-2.5 2-4 4.5-5 7 2.5 1 5 1.5 5 1.5s2.5-.5 5-1.5c-1-2.5-2.5-5-5-7z" />
    </svg>
  ),
  calendarCheck: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  ),
  barChart: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  book: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  playCircle: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill="none" stroke="currentColor" />
    </svg>
  ),
  stethoscope: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3" />
      <path d="M9 12.5v4a3.5 3.5 0 0 0 7 0v-2.5" />
      <circle cx="16" cy="14" r="2.5" />
      <path d="M3 3h3M12 3h3" />
    </svg>
  ),
  documentHeart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </svg>
  ),
};

// 5 Mood face SVGs precisely matching the reference screenshot
const MoodFaces = [
  {
    id: 'distressed',
    label: 'Distressed',
    render: (size = 22) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="8" y1="9" x2="10" y2="9.5" />
        <line x1="16" y1="9" x2="14" y2="9.5" />
        <path d="M8 16c1-1.5 2-2 4-2s3 .5 4 2" />
      </svg>
    ),
  },
  {
    id: 'down',
    label: 'Down',
    render: (size = 22) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="9" cy="9.5" r="1" fill="currentColor" />
        <circle cx="15" cy="9.5" r="1" fill="currentColor" />
        <path d="M9 16c1-1.2 2-1.8 3-1.8s2 .6 3 1.8" />
      </svg>
    ),
  },
  {
    id: 'neutral',
    label: 'Neutral',
    render: (size = 22) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="9" cy="9.5" r="1" fill="currentColor" />
        <circle cx="15" cy="9.5" r="1" fill="currentColor" />
        <line x1="9" y1="15.5" x2="15" y2="15.5" />
      </svg>
    ),
  },
  {
    id: 'okay',
    label: 'Okay',
    render: (size = 22) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="9" cy="9.5" r="1" fill="currentColor" />
        <circle cx="15" cy="9.5" r="1" fill="currentColor" />
        <path d="M9 14.5c.8 1 1.8 1.5 3 1.5s2.2-.5 3-1.5" />
      </svg>
    ),
  },
  {
    id: 'happy',
    label: 'Happy',
    render: (size = 22) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 9.5c.5-.8 1.5-.8 2 0" />
        <path d="M14 9.5c.5-.8 1.5-.8 2 0" />
        <path d="M8 13.5c1 2.2 2.5 3 4 3s3-.8 4-3" />
      </svg>
    ),
  },
];

// Initial conversation messages precisely matching reference screenshot
const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    sender: 'bot',
    text: `Hi Sadiya! 💕\nI'm Miora, your AI companion. I'm here to listen, answer your questions, and support you through your postpartum journey.\n\nHow are you feeling today?`,
    timestamp: '10:24 AM',
  },
  {
    id: 'msg-2',
    sender: 'user',
    text: `I've been feeling a bit anxious and overwhelmed lately.`,
    timestamp: '10:26 AM',
    status: 'delivered',
  },
  {
    id: 'msg-3',
    sender: 'bot',
    text: `I'm really sorry you're feeling this way. It's completely understandable, especially after childbirth. 💖\n\nWould you like me to share some simple coping strategies, a calming exercise, or help you decide if it's a good time to talk to a professional?`,
    timestamp: '10:26 AM',
  },
];

const STORAGE_CHAT_KEY = 'miora_ai_companion_chat_history_v2';
const STORAGE_MOOD_KEY = 'miora_patient_selected_mood_v2';

export function AiAssistantScreen() {
  const { patient, notifications, markNotificationRead, markAllNotificationsRead, toggleCareTask } = usePatient();
  const navigate = useNavigate();

  // Chat conversation state preserved in localStorage
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback to initial
    }
    return INITIAL_MESSAGES;
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeMood, setActiveMood] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_MOOD_KEY) || 'okay';
    } catch {
      return 'okay';
    }
  });
  const [moodToast, setMoodToast] = useState(null);

  // Voice dictation state
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'requesting' | 'listening' | 'transcribing' | 'error'
  const [voiceError, setVoiceError] = useState(null);

  // Modals & Popovers
  const [activeModal, setActiveModal] = useState(null); // 'audio' | 'meditation' | 'tips' | 'info' | 'crisis' | null
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [morePromptsOpen, setMorePromptsOpen] = useState(false);

  // Web Audio state for Relaxation Audio
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioContextRef = useRef(null);
  const audioNodesRef = useRef([]);

  // Meditation state
  const [meditationPhase, setMeditationPhase] = useState('Inhale'); // Inhale (4s) -> Hold (4s) -> Exhale (6s)
  const [meditationSeconds, setMeditationSeconds] = useState(0);
  const [meditationRunning, setMeditationRunning] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const optionsRef = useRef(null);

  // Persist conversation history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setOptionsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onstart = () => {
            setVoiceState('listening');
            setVoiceError(null);
          };

          recognition.onresult = (event) => {
            setVoiceState('transcribing');
            const transcript = Array.from(event.results)
              .map((r) => r[0].transcript)
              .join('');
            if (transcript) {
              setInputText(transcript);
            }
          };

          recognition.onend = () => {
            setVoiceState('idle');
          };

          recognition.onerror = (event) => {
            setVoiceState('error');
            if (event.error === 'not-allowed') {
              setVoiceError('Microphone permission denied. Please allow microphone access in your browser settings.');
            } else if (event.error === 'no-speech') {
              setVoiceError('No speech detected. Please speak clearly into your microphone.');
            } else {
              setVoiceError(`Voice input error: ${event.error}`);
            }
          };

          recognitionRef.current = recognition;
        } catch (err) {
          console.warn('SpeechRecognition initialization error:', err);
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Meditation breathing timer
  useEffect(() => {
    let timer = null;
    if (meditationRunning && activeModal === 'meditation') {
      timer = setInterval(() => {
        setMeditationSeconds((sec) => {
          const nextSec = sec + 1;
          const cycle = nextSec % 14; // 4s inhale, 4s hold, 6s exhale
          if (cycle < 4) {
            setMeditationPhase('Inhale');
          } else if (cycle < 8) {
            setMeditationPhase('Hold');
          } else {
            setMeditationPhase('Exhale');
          }
          return nextSec;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [meditationRunning, activeModal]);

  // Clean up Web Audio on unmount or modal close
  const stopAudio = useCallback(() => {
    try {
      if (audioNodesRef.current) {
        audioNodesRef.current.forEach((n) => {
          try {
            n.stop?.();
            n.disconnect?.();
          } catch {
            // ignore
          }
        });
        audioNodesRef.current = [];
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch {
      // ignore
    }
    setIsPlayingAudio(false);
  }, []);

  useEffect(() => {
    if (activeModal !== 'audio' && isPlayingAudio) {
      stopAudio();
    }
  }, [activeModal, isPlayingAudio, stopAudio]);

  const toggleRelaxationAudio = () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        alert('Web Audio is not supported in this browser.');
        return;
      }

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Master gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Gentle ambient chords (432Hz harmonic soothing frequency)
      const freqs = [216, 324, 432, 540];
      const nodes = [];

      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        oscGain.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start();
        nodes.push(osc);
      });

      // Soothing ocean wave white/pink noise simulation
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.11;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter for ocean swell
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, ctx.currentTime);

      // LFO for rhythmic swells
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.1, ctx.currentTime); // 10 second gentle swell cycle
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(140, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);

      whiteNoise.start();
      lfo.start();

      nodes.push(whiteNoise, lfo);
      audioNodesRef.current = nodes;
      setIsPlayingAudio(true);
    } catch (err) {
      console.warn('Audio playback error:', err);
      setIsPlayingAudio(false);
    }
  };

  // Scroll messages to bottom on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Voice Toggle Handler
  const handleToggleVoice = async () => {
    setVoiceError(null);

    // If currently listening, stop it
    if (voiceState === 'listening' || voiceState === 'requesting' || voiceState === 'transcribing') {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setVoiceState('idle');
      return;
    }

    // If browser supports SpeechRecognition, start it
    if (recognitionRef.current) {
      try {
        setVoiceState('requesting');
        recognitionRef.current.start();
      } catch (err) {
        console.warn('SpeechRecognition start error:', err);
        setVoiceState('error');
        setVoiceError('Unable to start speech recognition. Please verify microphone permissions.');
      }
      return;
    }

    // If SpeechRecognition not available, check browser microphone permission honestly
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        setVoiceState('requesting');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Real microphone permission granted!
        stream.getTracks().forEach((track) => track.stop());
        setVoiceState('error');
        setVoiceError(
          'Microphone permission granted, but speech-to-text recognition is not supported in this browser engine. Please type your message.'
        );
      } catch (err) {
        setVoiceState('error');
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setVoiceError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else {
          setVoiceError(`Microphone error: ${err.message || 'Device unavailable'}`);
        }
      }
    } else {
      setVoiceState('error');
      setVoiceError('Microphone media devices are not supported in this browser.');
    }
  };

  // Mood selection handler
  const handleSelectMood = (mood) => {
    setActiveMood(mood.id);
    try {
      localStorage.setItem(STORAGE_MOOD_KEY, mood.id);
    } catch {
      // ignore
    }
    // Complete mood task in care plan if present
    try {
      toggleCareTask('task-2');
    } catch {
      // ignore
    }
    setMoodToast(`Your mood (${mood.label}) has been logged for today.`);
    setTimeout(() => setMoodToast(null), 3000);
  };

  // Check for crisis / self-harm keywords
  const isSafetyConcern = (text) => {
    const lower = text.toLowerCase();
    const safetyKeywords = [
      'hurt myself',
      'harm myself',
      'kill myself',
      'suicide',
      'suicidal',
      'end it all',
      'end my life',
      'want to die',
      'no reason to live',
      'better off dead',
      'give up',
    ];
    return safetyKeywords.some((kw) => lower.includes(kw));
  };

  // Send message handler
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: timeString,
      status: 'delivered',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setVoiceError(null);

    // 1. Safety escalation check
    if (isSafetyConcern(text)) {
      setIsTyping(true);
      setTimeout(() => {
        const crisisMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'bot',
          isSafetyAlert: true,
          text: `I hear how much pain you're experiencing, and your life and safety matter deeply. 💕\n\nBecause I am an AI companion and cannot replace urgent clinical care, please connect immediately with trained postpartum and crisis specialists who can support you right now:`,
          helplines: [
            { region: 'United States & Canada', action: 'Call or Text 988', tel: '988' },
            { region: 'United Kingdom', action: 'Call 111 (NHS) or 999', tel: '111' },
            { region: 'India', action: 'Call 14416 (Tele-MANAS)', tel: '14416' },
            { region: 'Crisis Text Line', action: 'Text HOME to 741741', sms: '741741' },
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, crisisMsg]);
        setIsTyping(false);
      }, 700);
      return;
    }

    // 2. AI Service Request
    setIsTyping(true);

    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MIORA_AI_API_URL) || '';

    if (apiBase) {
      try {
        const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/assistant/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: patient?.id,
            message: text,
            history: messages.slice(-6),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const botReply = {
            id: `msg-${Date.now() + 1}`,
            sender: 'bot',
            text: data.reply || data.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, botReply]);
          setIsTyping(false);
          return;
        }
      } catch (err) {
        console.warn('AI endpoint connection error:', err);
      }
    }

    // 3. Honest Service Unavailable Error State
    // No backend URL is configured or fetch failed. Adhere to project guidelines:
    // "Display errors when the AI service is unavailable. Do not generate hardcoded replies pretending to come from a live AI model."
    setTimeout(() => {
      const errorMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        isServiceUnavailable: true,
        text: `The live AI companion model endpoint is currently offline in this environment. In accordance with Miora clinical safety standards, synthetic replies are not fabricated.\n\nYou can explore verified care resources on the right, try our guided meditation exercise, or connect with a healthcare provider.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsTyping(false);
    }, 900);
  };

  const handlePromptClick = (promptQuery) => {
    handleSendMessage(promptQuery);
  };

  // Reset conversation to initial state
  const handleResetConversation = () => {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(INITIAL_MESSAGES));
    } catch {
      // ignore
    }
    setOptionsMenuOpen(false);
  };

  // Clear all messages
  const handleClearChat = () => {
    setMessages([]);
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify([]));
    } catch {
      // ignore
    }
    setOptionsMenuOpen(false);
  };

  const unreadNotifs = (notifications || []).filter((n) => !n.read);

  return (
    <div className="companion-screen">
      {/* Subtle ambient bottom decorative wave matching reference */}
      <div className="companion-bg-wave-bottom" aria-hidden="true" />

      {/* Main Viewport */}
      <div className="companion-viewport">
        {/* Top Header Row: Breadcrumb & User Menu */}
        <header className="companion-top-row">
          <div className="companion-breadcrumb" aria-label="Breadcrumb">
            <span className="companion-breadcrumb-icon">{Icons.chatDots}</span>
            <span className="companion-breadcrumb-label">AI Assistant</span>
            <span className="companion-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
          </div>

          <div className="companion-top-right">
            {/* Notification Bell */}
            <div className="companion-notif-wrap" ref={notifRef}>
              <button
                type="button"
                className="companion-icon-btn"
                onClick={() => {
                  setNotifDropdownOpen((prev) => !prev);
                  setProfileDropdownOpen(false);
                }}
                aria-label={`Notifications (${unreadNotifs.length} unread)`}
                aria-expanded={notifDropdownOpen}
              >
                {Icons.bell}
                {unreadNotifs.length > 0 && <span className="companion-notif-badge" />}
              </button>

              {notifDropdownOpen && (
                <div className="companion-dropdown-panel" role="dialog" aria-label="Notifications list">
                  <div className="companion-dropdown-head">
                    <span className="companion-dropdown-title">Notifications</span>
                    {unreadNotifs.length > 0 && (
                      <button
                        type="button"
                        className="companion-text-btn"
                        onClick={markAllNotificationsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="companion-notif-scroll">
                    {(notifications || []).map((n) => (
                      <div
                        key={n.id}
                        className={`companion-notif-item ${n.read ? 'is-read' : 'is-unread'}`}
                        onClick={() => markNotificationRead(n.id)}
                      >
                        <strong>{n.title}</strong>
                        <p>{n.message}</p>
                        <time>{n.date || 'Today'}</time>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="companion-profile-wrap" ref={profileRef}>
              <button
                type="button"
                className="companion-profile-pill"
                onClick={() => {
                  setProfileDropdownOpen((prev) => !prev);
                  setNotifDropdownOpen(false);
                }}
                aria-label="User profile menu"
                aria-expanded={profileDropdownOpen}
              >
                <span className="companion-avatar-circle">
                  {patient?.avatarInitials || patient?.name?.[0] || 'S'}
                </span>
                <span className="companion-profile-name">{patient?.name || 'Sadiya'}</span>
                {Icons.chevronDown}
              </button>

              {profileDropdownOpen && (
                <div className="companion-dropdown-panel companion-profile-dropdown" role="menu">
                  <div className="companion-profile-info">
                    <strong>{patient?.fullName || 'Sadiya Rahman'}</strong>
                    <small>{patient?.email || 'sadiya@miora.health'}</small>
                  </div>
                  <div className="companion-dropdown-divider" />
                  <NavLink to="/patient/profile" className="companion-menu-link" role="menuitem">
                    Profile Settings
                  </NavLink>
                  <NavLink to="/patient/settings" className="companion-menu-link" role="menuitem">
                    Preferences
                  </NavLink>
                  <button
                    type="button"
                    className="companion-menu-link companion-signout-btn"
                    onClick={() => {
                      signOutUser();
                      navigate('/login');
                    }}
                    role="menuitem"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Heading Section with Mother & Baby Illustration */}
        <section className="companion-header-banner" aria-label="Page Header">
          <div className="companion-header-text">
            <h1 className="companion-main-title">Your AI Companion</h1>
            <p className="companion-main-subtitle">
              A safe, supportive space to talk, reflect, and get guidance through your postpartum journey.
            </p>
          </div>

          {/* Maternal illustration on the right */}
          <div className="companion-header-illu-wrap" aria-hidden="true">
            <img
              src="/assets/companion-mother-baby-smooth.png"
              alt="Maternal companion illustration"
              className="companion-header-illustration"
            />
          </div>
        </section>

        {/* =========================================================================
            Main Two-Column Layout (Chat Interface on Left, 3 Support Cards on Right)
            ========================================================================= */}
        <div className="companion-columns-layout">
          {/* Left Column – Chat Interface Card */}
          <section className="companion-chat-card" aria-label="Miora AI Chat Interface">
            {/* Chat Card Header */}
            <div className="companion-chat-header">
              <div className="companion-chat-header-left">
                <div className="companion-bot-avatar-badge" aria-hidden="true">
                  <img
                    src="/assets/miora-robot-avatar.png"
                    alt="Miora AI avatar"
                    className="companion-bot-avatar-img"
                  />
                </div>
                <h2 className="companion-chat-title">Miora AI</h2>
                <span className="companion-assistant-tag">Your Maternal AI Assistant</span>
              </div>

              <div className="companion-chat-header-actions" ref={optionsRef}>
                <button
                  type="button"
                  className="companion-mini-action-btn"
                  onClick={() => setActiveModal('info')}
                  aria-label="Companion information and safety disclaimer"
                  title="About Miora AI"
                >
                  {Icons.info}
                </button>
                <button
                  type="button"
                  className="companion-mini-action-btn"
                  onClick={() => setOptionsMenuOpen((prev) => !prev)}
                  aria-label="Conversation options"
                  aria-expanded={optionsMenuOpen}
                >
                  {Icons.dots}
                </button>

                {optionsMenuOpen && (
                  <div className="companion-options-menu" role="menu">
                    <button
                      type="button"
                      className="companion-option-item"
                      onClick={handleResetConversation}
                      role="menuitem"
                    >
                      Reset to Sample Conversation
                    </button>
                    <button
                      type="button"
                      className="companion-option-item"
                      onClick={handleClearChat}
                      role="menuitem"
                    >
                      Clear Chat History
                    </button>
                    <button
                      type="button"
                      className="companion-option-item"
                      onClick={() => {
                        const transcript = messages
                          .map((m) => `[${m.timestamp}] ${m.sender === 'bot' ? 'Miora AI' : 'Patient'}: ${m.text}`)
                          .join('\n\n');
                        const blob = new Blob([transcript], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `miora-chat-transcript-${Date.now()}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setOptionsMenuOpen(false);
                      }}
                      role="menuitem"
                    >
                      Export Transcript (.txt)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="companion-chat-messages" role="log" aria-live="polite">
              {messages.length === 0 && (
                <div className="companion-empty-chat">
                  <p>Start a conversation with Miora AI or choose a prompt below.</p>
                </div>
              )}

              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';
                return (
                  <div
                    key={msg.id}
                    className={`companion-msg-row ${isBot ? 'is-bot' : 'is-user'} ${msg.isSafetyAlert ? 'is-safety-alert' : ''} ${msg.isServiceUnavailable ? 'is-error-msg' : ''}`}
                  >
                    {isBot && (
                      <div className="companion-msg-avatar" aria-hidden="true">
                        <img src="/assets/miora-robot-avatar-sm.png" alt="" />
                      </div>
                    )}

                    <div className="companion-msg-col">
                      <div className="companion-msg-bubble">
                        {msg.isServiceUnavailable && (
                          <div className="companion-error-badge">
                            <span className="companion-error-dot" />
                            <strong>AI Service Unavailable</strong>
                          </div>
                        )}

                        {msg.isSafetyAlert && (
                          <div className="companion-safety-badge">
                            <strong>Immediate Support &amp; Helplines</strong>
                          </div>
                        )}

                        {msg.text.split('\n\n').map((para, i) => (
                          <p key={i} style={{ margin: i === 0 ? 0 : '8px 0 0 0' }}>{para}</p>
                        ))}

                        {msg.helplines && (
                          <div className="companion-crisis-list">
                            {msg.helplines.map((h, idx) => (
                              <div key={idx} className="companion-crisis-pill">
                                <span>{h.region}:</span>
                                {h.tel ? (
                                  <a href={`tel:${h.tel}`} className="companion-crisis-link">
                                    {h.action}
                                  </a>
                                ) : (
                                  <a href={`sms:${h.sms}`} className="companion-crisis-link">
                                    {h.action}
                                  </a>
                                )}
                              </div>
                            ))}
                            <div style={{ marginTop: '8px' }}>
                              <button
                                type="button"
                                className="companion-escalate-btn"
                                onClick={() => navigate('/patient/connect-doctor')}
                              >
                                Connect with Miora Doctor
                              </button>
                            </div>
                          </div>
                        )}

                        {msg.isServiceUnavailable && (
                          <div className="companion-error-actions">
                            <button
                              type="button"
                              className="companion-retry-btn"
                              onClick={() => handleSendMessage('Can you help me with gentle postpartum guidance?')}
                            >
                              Retry Connection
                            </button>
                            <button
                              type="button"
                              className="companion-resource-link-btn"
                              onClick={() => setActiveModal('meditation')}
                            >
                              Try Guided Meditation
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="companion-msg-meta">
                        <time>{msg.timestamp}</time>
                        {!isBot && msg.status && (
                          <span className="companion-check-icon" aria-label="Delivered">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loading Typing Indicator */}
              {isTyping && (
                <div className="companion-msg-row is-bot">
                  <div className="companion-msg-avatar" aria-hidden="true">
                    <img src="/assets/miora-robot-avatar-sm.png" alt="" />
                  </div>
                  <div className="companion-typing-row" aria-label="Miora is thinking and preparing response">
                    <span className="companion-typing-dot" />
                    <span className="companion-typing-dot" />
                    <span className="companion-typing-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompt Chips */}
            <div className="companion-chips-row" aria-label="Suggested Prompts">
              <button
                type="button"
                className="companion-prompt-chip"
                onClick={() => handlePromptClick('Could you share some simple coping strategies?')}
              >
                <span className="companion-chip-icon">{Icons.leaf}</span>
                <span>Coping Strategies</span>
              </button>

              <button
                type="button"
                className="companion-prompt-chip"
                onClick={() => {
                  setActiveModal('meditation');
                  setMeditationRunning(true);
                }}
              >
                <span className="companion-chip-icon">{Icons.lotus}</span>
                <span>Breathing Exercise</span>
              </button>

              <button
                type="button"
                className="companion-prompt-chip"
                onClick={() => handlePromptClick('Should I see a doctor about how I am feeling?')}
              >
                <span className="companion-chip-icon">{Icons.calendarCheck}</span>
                <span>Should I See a Doctor?</span>
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="companion-prompt-chip companion-chip-more"
                  onClick={() => setMorePromptsOpen((prev) => !prev)}
                  aria-label="More prompt suggestions"
                >
                  &bull;&bull;&bull;
                </button>

                {morePromptsOpen && (
                  <div className="companion-more-prompts-menu">
                    <button
                      type="button"
                      onClick={() => {
                        handlePromptClick('What are tips for dealing with postpartum sleep deprivation?');
                        setMorePromptsOpen(false);
                      }}
                    >
                      Sleep &amp; Fatigue
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handlePromptClick('How can my partner or family better support me right now?');
                        setMorePromptsOpen(false);
                      }}
                    >
                      Partner &amp; Family Support
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handlePromptClick('What physical recovery milestones should I expect this month?');
                        setMorePromptsOpen(false);
                      }}
                    >
                      Physical Recovery
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Voice Feedback Banner */}
            {voiceState !== 'idle' && (
              <div className={`companion-voice-banner is-${voiceState}`} role="status">
                {voiceState === 'requesting' && <span>Requesting microphone access...</span>}
                {voiceState === 'listening' && (
                  <span className="companion-voice-listening-text">
                    <span className="companion-voice-pulse-dot" /> Listening... Speak naturally
                  </span>
                )}
                {voiceState === 'transcribing' && <span>Transcribing speech...</span>}
                {voiceState === 'error' && (
                  <span className="companion-voice-error-text">
                    {voiceError || 'Microphone error'}
                  </span>
                )}
                <button
                  type="button"
                  className="companion-voice-close-btn"
                  onClick={() => {
                    setVoiceState('idle');
                    setVoiceError(null);
                  }}
                  aria-label="Dismiss voice status"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Message Input with Attachment, Mic, and Send Button */}
            <form
              className="companion-input-capsule"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const fileName = e.target.files[0].name;
                    handleSendMessage(`[Attached note or record: ${fileName}]`);
                  }
                }}
              />
              <button
                type="button"
                className="companion-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach document or note"
                title="Attach document or medical record"
              >
                {Icons.paperclip}
              </button>

              <input
                type="text"
                className="companion-text-input"
                placeholder="Ask me anything about your mental well-being..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                aria-label="Message Miora AI"
              />

              <button
                type="button"
                className={`companion-mic-btn ${voiceState === 'listening' ? 'is-listening' : ''}`}
                onClick={handleToggleVoice}
                aria-label={voiceState === 'listening' ? 'Stop listening' : 'Start voice dictation'}
                title={voiceState === 'listening' ? 'Listening... click to stop' : 'Voice input'}
              >
                {Icons.mic}
              </button>

              <button
                type="submit"
                className="companion-send-btn"
                aria-label="Send message"
                title="Send message"
                disabled={!inputText.trim() || isTyping}
              >
                {Icons.send}
              </button>
            </form>
          </section>

          {/* Right Column – 3 Support Cards */}
          <div className="companion-info-panels" aria-label="Support and Resources">
            {/* Card 1: How I Can Help */}
            <section className="companion-info-card" aria-labelledby="help-card-title">
              <div className="companion-card-header">
                <span className="companion-sparkle-icon" aria-hidden="true">✦✦</span>
                <h3 id="help-card-title" className="companion-card-title">How I Can Help</h3>
              </div>
              <ul className="companion-help-list">
                <li
                  className="companion-help-item"
                  onClick={() => handlePromptClick("I'd like to talk about how I've been feeling.")}
                  role="button"
                  tabIndex={0}
                >
                  <span className="companion-help-icon">{Icons.chatDots}</span>
                  <span>Talk about your feelings</span>
                </li>
                <li
                  className="companion-help-item"
                  onClick={() => handlePromptClick("Can you suggest some gentle self-care activities for today?")}
                  role="button"
                  tabIndex={0}
                >
                  <span className="companion-help-icon">{Icons.lotus}</span>
                  <span>Suggest self-care activities</span>
                </li>
                <li
                  className="companion-help-item"
                  onClick={() => handlePromptClick("I have questions about postpartum recovery and maternal feelings.")}
                  role="button"
                  tabIndex={0}
                >
                  <span className="companion-help-icon">{Icons.book}</span>
                  <span>Answer maternal &amp; postpartum questions</span>
                </li>
                <li
                  className="companion-help-item"
                  onClick={() => handlePromptClick("Help me reflect on and track my mood over the past few days.")}
                  role="button"
                  tabIndex={0}
                >
                  <span className="companion-help-icon">{Icons.calendarCheck}</span>
                  <span>Help you track your mood</span>
                </li>
                <li
                  className="companion-help-item"
                  onClick={() => handlePromptClick("When is the right time to seek professional clinical help?")}
                  role="button"
                  tabIndex={0}
                >
                  <span className="companion-help-icon">{Icons.stethoscope}</span>
                  <span>Guide you on when to seek professional help</span>
                </li>
              </ul>
            </section>

            {/* Card 2: Your Mood Today */}
            <section className="companion-info-card" aria-labelledby="mood-card-title">
              <div className="companion-card-header">
                <span className="companion-help-icon" style={{ color: '#d93c75' }} aria-hidden="true">
                  {Icons.barChart}
                </span>
                <h3 id="mood-card-title" className="companion-card-title">Your Mood Today</h3>
              </div>

              <div className="companion-mood-row" role="radiogroup" aria-label="Select your mood today">
                {MoodFaces.map((face) => {
                  const isActive = activeMood === face.id;
                  return (
                    <button
                      key={face.id}
                      type="button"
                      className={`companion-mood-btn ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleSelectMood(face)}
                      role="radio"
                      aria-checked={isActive}
                      aria-label={face.label}
                      title={`Select mood: ${face.label}`}
                    >
                      {face.render(22)}
                    </button>
                  );
                })}
              </div>

              <div className="companion-mood-label-row">
                <span className="companion-mood-pill">
                  {MoodFaces.find((m) => m.id === activeMood)?.label || 'Okay'}
                </span>
              </div>

              {moodToast && (
                <div className="companion-mood-feedback" role="status">
                  ✓ {moodToast}
                </div>
              )}
            </section>

            {/* Card 3: Quick Resources */}
            <section className="companion-info-card" aria-labelledby="resources-card-title">
              <div className="companion-card-header">
                <span className="companion-help-icon" style={{ color: '#d93c75' }} aria-hidden="true">
                  {Icons.book}
                </span>
                <h3 id="resources-card-title" className="companion-card-title">Quick Resources</h3>
              </div>

              <div className="companion-resources-grid">
                <div
                  className="companion-resource-card"
                  onClick={() => setActiveModal('audio')}
                  role="button"
                  tabIndex={0}
                  aria-label="Open Relaxation Audio"
                >
                  <span className="companion-resource-icon">{Icons.playCircle}</span>
                  <span className="companion-resource-title">
                    Relaxation<br />Audio
                  </span>
                </div>

                <div
                  className="companion-resource-card"
                  onClick={() => {
                    setActiveModal('meditation');
                    setMeditationRunning(true);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Open Guided Meditation"
                >
                  <span className="companion-resource-icon">{Icons.lotus}</span>
                  <span className="companion-resource-title">
                    Guided<br />Meditation
                  </span>
                </div>

                <div
                  className="companion-resource-card"
                  onClick={() => setActiveModal('tips')}
                  role="button"
                  tabIndex={0}
                  aria-label="Open Postpartum Tips"
                >
                  <span className="companion-resource-icon">{Icons.documentHeart}</span>
                  <span className="companion-resource-title">
                    Postpartum<br />Tips
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Interactive Resource Modals (Audio / Meditation / Tips / Info)
          ========================================================================= */}
      {activeModal && (
        <div className="companion-modal-backdrop" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true">
          <div className="companion-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="companion-modal-head">
              <h4 className="companion-modal-title">
                {activeModal === 'audio' && 'Relaxation Audio'}
                {activeModal === 'meditation' && 'Guided Meditation'}
                {activeModal === 'tips' && 'Postpartum Recovery Tips'}
                {activeModal === 'info' && 'About Miora AI Companion'}
              </h4>
              <button
                type="button"
                className="companion-modal-close-btn"
                onClick={() => {
                  if (activeModal === 'audio' && isPlayingAudio) {
                    stopAudio();
                  }
                  setActiveModal(null);
                }}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="companion-modal-body">
              {/* Relaxation Audio Modal */}
              {activeModal === 'audio' && (
                <div className="companion-audio-player-modal">
                  <p className="companion-modal-desc">
                    Soothing ocean swell and gentle 432Hz ambient soundscape designed to calm postpartum nervous system arousal.
                  </p>

                  <div className="companion-audio-controls-card">
                    <button
                      type="button"
                      className={`companion-play-toggle-btn ${isPlayingAudio ? 'is-playing' : ''}`}
                      onClick={toggleRelaxationAudio}
                    >
                      {isPlayingAudio ? '⏸ Pause Audio' : '▶ Play Ocean Waves'}
                    </button>
                    <span className="companion-audio-timer">
                      {isPlayingAudio ? 'Playing Live Soundscape · 432Hz Ambient' : '04:12 · Gentle Surf & Ambient Chords'}
                    </span>
                  </div>

                  <p className="companion-audio-tip">
                    Tip: Listen with headphones in a comfortable, quiet space while your baby rests.
                  </p>
                </div>
              )}

              {/* Guided Meditation Modal */}
              {activeModal === 'meditation' && (
                <div className="companion-meditation-modal">
                  <p className="companion-modal-desc">
                    A gentle 4-4-6 paced breathing exercise to lower cortisol, release muscle tension, and restore grounding.
                  </p>

                  <div className={`companion-breathing-circle is-${meditationPhase.toLowerCase()}`}>
                    <span className="companion-breathing-phase">{meditationPhase}</span>
                    <span className="companion-breathing-sub">
                      {meditationPhase === 'Inhale' && '4 counts'}
                      {meditationPhase === 'Hold' && '4 counts'}
                      {meditationPhase === 'Exhale' && '6 counts'}
                    </span>
                  </div>

                  <div className="companion-meditation-actions">
                    <button
                      type="button"
                      className="companion-meditation-toggle-btn"
                      onClick={() => setMeditationRunning((prev) => !prev)}
                    >
                      {meditationRunning ? 'Pause Breathing' : 'Resume Breathing'}
                    </button>
                    <button
                      type="button"
                      className="companion-meditation-reset-btn"
                      onClick={() => {
                        setMeditationSeconds(0);
                        setMeditationPhase('Inhale');
                      }}
                    >
                      Reset
                    </button>
                  </div>
                  <small className="companion-meditation-note">
                    Follow the pulsing circle with slow, smooth breaths.
                  </small>
                </div>
              )}

              {/* Postpartum Tips Modal */}
              {activeModal === 'tips' && (
                <div className="companion-tips-modal">
                  <div className="companion-tips-list">
                    <div className="companion-tip-block">
                      <strong>1. Prioritize Micro-Rest</strong>
                      <p>Even 15 minutes of eyes-closed resting restores neurological bandwidth and lowers fatigue hormones.</p>
                    </div>
                    <div className="companion-tip-block">
                      <strong>2. Warm Nutrition &amp; Hydration</strong>
                      <p>Warm broths, complex grains, and gentle hydration support physiological recovery and lactation.</p>
                    </div>
                    <div className="companion-tip-block">
                      <strong>3. Normalizing the "Baby Blues"</strong>
                      <p>Rapid hormone shifts cause mood fluctuations in 80% of mothers during the first 2-3 weeks postpartum.</p>
                    </div>
                    <div className="companion-tip-block">
                      <strong>4. When to Seek Professional Guidance</strong>
                      <p>If intense anxiety, sadness, intrusive thoughts, or disconnection persist past 2 weeks, speak with your doctor.</p>
                    </div>
                  </div>

                  <div className="companion-tips-footer-actions">
                    <button
                      type="button"
                      className="companion-primary-action-btn"
                      onClick={() => {
                        setActiveModal(null);
                        navigate('/patient/connect-doctor');
                      }}
                    >
                      Speak with Miora Clinical Lead
                    </button>
                    <button
                      type="button"
                      className="companion-secondary-action-btn"
                      onClick={() => {
                        setActiveModal(null);
                        navigate('/patient/care-suggestions');
                      }}
                    >
                      View Full Care Suggestions
                    </button>
                  </div>
                </div>
              )}

              {/* About Miora AI Information Modal */}
              {activeModal === 'info' && (
                <div className="companion-info-dialog">
                  <p>
                    <strong>Miora AI</strong> is a compassionate maternal emotional companion engineered to provide
                    non-judgmental support, guided mindfulness, and evidence-based psychoeducation.
                  </p>
                  <div className="companion-disclaimer-box">
                    <strong>Clinical Notice:</strong> Miora AI is an emotional support companion and does not diagnose postpartum depression, prescribe medication, or replace a licensed obstetrician or psychiatrist.
                  </div>
                  <div style={{ marginTop: '14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      className="companion-primary-action-btn"
                      onClick={() => setActiveModal(null)}
                    >
                      Got it
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiAssistantScreen;
