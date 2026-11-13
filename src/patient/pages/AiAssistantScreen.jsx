import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import '../styles/ai-assistant.css';

// SVG Icons matching Miora's clean refined stroke style
const Icons = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
      <path d="M9.5 21v-7h5v7" />
    </svg>
  ),
  medicalHistory: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  aiScreening: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04" />
    </svg>
  ),
  aiAssistant: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <circle cx="8" cy="11.5" r="1" fill="currentColor" />
      <circle cx="12" cy="11.5" r="1" fill="currentColor" />
      <circle cx="16" cy="11.5" r="1" fill="currentColor" />
    </svg>
  ),
  doctor: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="12" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
    </svg>
  ),
  reports: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  careSuggestions: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  profile: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  bell: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none" />
    </svg>
  ),
  sparkles: (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#d93c75', fontSize: '13px', lineHeight: 1 }}>
      ✦✦
    </span>
  ),
  leaf: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  lotus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3c-1.5 3-4 6-8 7 3 2 5.5 5 8 9 2.5-4 5-7 8-9-4-1-6.5-4-8-7z" />
      <path d="M12 12c-2.5 2-4 4.5-5 7 2.5 1 5 1.5 5 1.5s2.5-.5 5-1.5c-1-2.5-2.5-5-5-7z" />
    </svg>
  ),
  calendarCheck: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  ),
  barChart: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  book: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  playCircle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill="none" stroke="currentColor" />
    </svg>
  ),
  stethoscope: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3" />
      <path d="M9 12.5v4a3.5 3.5 0 0 0 7 0v-2.5" />
      <circle cx="16" cy="14" r="2.5" />
      <path d="M3 3h3M12 3h3" />
    </svg>
  ),
  chatDots: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <circle cx="8" cy="11.5" r="1" fill="currentColor" />
      <circle cx="12" cy="11.5" r="1" fill="currentColor" />
      <circle cx="16" cy="11.5" r="1" fill="currentColor" />
    </svg>
  ),
  documentHeart: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </svg>
  ),
};

// 5 Mood face SVGs precisely matching the reference
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
        <circle cx="9" cy="9.5" r="1" fill="currentColor" />
        <circle cx="15" cy="9.5" r="1" fill="currentColor" />
        <path d="M8 13.5c1 2.2 2.5 3 4 3s3-.8 4-3" />
      </svg>
    ),
  },
];

// Initial conversation messages exactly matching the reference screenshot
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

export function AiAssistantScreen() {
  const { patient, selectedMood, setPatientMood } = usePatient();
  const navigate = useNavigate();

  // Chat conversation state
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeMood, setActiveMood] = useState('okay');

  // Resource Modal state
  const [activeModal, setActiveModal] = useState(null); // 'audio' | 'meditation' | 'tips' | null

  // File picker simulation
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join('');
          setInputText(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Sync initial mood with context/localStorage
  useEffect(() => {
    if (selectedMood) {
      const found = MoodFaces.find(m => m.id === selectedMood.toLowerCase() || m.label.toLowerCase() === selectedMood.toLowerCase());
      if (found) {
        setActiveMood(found.id);
      }
    }
  }, [selectedMood]);

  // Scroll messages to bottom only when user interacts or new messages added beyond initial
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > INITIAL_MESSAGES.length || isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  // Toggle voice dictation
  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Voice dictation is available in Chrome, Edge, and Safari browsers. Please type your message or check microphone permissions.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      }
    }
  };

  // Handle Mood selection
  const handleSelectMood = (mood) => {
    setActiveMood(mood.id);
    setPatientMood(mood.label);
  };

  // Send a user message and trigger compassionate AI reply
  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

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
    setIsTyping(true);

    // Compassionate automated response based on context
    setTimeout(() => {
      let replyText = `Thank you for sharing this with me, ${patient?.name || 'Sadiya'}. Taking a moment to express what you're experiencing is an important act of self-care.`;

      const lower = text.toLowerCase();
      if (lower.includes('coping')) {
        replyText = `Here are three gentle coping strategies for postpartum overwhelm:\n\n1. **The 5-4-3-2-1 Grounding:** Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 slow breath.\n2. **Micro-Breaks:** When your baby rests or is safe in the crib, sit quietly with your eyes closed for even 3 minutes with both feet on the floor.\n3. **Lowering the Bar:** Today's only priority is nourishment and rest. Everything else can wait. 🌸`;
      } else if (lower.includes('breath') || lower.includes('exercise')) {
        replyText = `Let's take a calming breath together right now:\n\n✨ **Inhale gently** through your nose for 4 counts...\n✨ **Hold softly** for 4 counts...\n✨ **Exhale slowly** through your mouth for 6 counts...\n\nFeel your shoulders drop and your jaw unclench. You are safe and doing your best.`;
      } else if (lower.includes('doctor') || lower.includes('see a doctor')) {
        replyText = `Speaking with your healthcare provider or perinatal specialist is always a proactive, loving choice for yourself and your baby.\n\nWe recommend reaching out if feelings of sadness, anxiety, or disconnection last more than 2 weeks, if you feel unable to care for daily needs, or if worry feels constant. Would you like me to connect you with our clinical team?`;
      }

      const botReply = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
      setIsTyping(false);
    }, 1100);
  };

  const handlePromptClick = (promptQuery) => {
    handleSendMessage(promptQuery);
  };

  return (
    <div className="miora-companion-shell">
      {/* =========================================================================
          Left Sidebar (Preserved Miora Patient Navigation)
          ========================================================================= */}
      <aside className="companion-sidebar" aria-label="Miora Patient Navigation">
        <div className="companion-brand-block">
          <NavLink to="/" className="companion-brand-link" aria-label="Miora Home">
            <span className="companion-brand-wordmark">
              <svg className="companion-brand-m" viewBox="0 0 50 30" fill="none" aria-hidden="true">
                <path d="M30.8 1.5H36.6L28.8 21.8H26.8L32.8 3.4C32.9 2.5 32.2 2.0 30.8 2.0Z" fill="currentColor" />
                <path d="M33.2 2.0L19.4 21.8C16.2 25.8 12.1 27.2 7.8 26.6C4.2 26.1 2.0 23.8 2.2 21.2C2.3 19.9 3.4 19.4 4.2 19.9C4.9 20.4 4.8 21.5 4.0 21.9" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="3.3" cy="21.0" r="1.45" fill="currentColor" />
                <path d="M44.8 1.5H49.4L42.2 20.9C42.0 21.4 42.5 21.7 43.7 21.7H44.1V22.4H36.8V21.7H37.6C38.8 21.7 39.3 21.4 39.6 20.8L45.6 4.0L28.4 21.9H27.1L46.0 2.2C45.5 1.8 45.1 1.6 44.8 1.5Z" fill="currentColor" />
              </svg>
              <span className="companion-brand-script">iora</span>
            </span>
          </NavLink>
          <div className="companion-brand-tagline">
            Maternal Emotional<br />Intelligence
          </div>
          <div className="companion-brand-divider" aria-hidden="true" />
        </div>

        {/* Main Navigation links */}
        <nav className="companion-sidebar-nav">
          <ul className="companion-nav-list">
            <li className="companion-nav-item">
              <NavLink to="/patient/dashboard" className="companion-nav-link">
                <span className="companion-nav-icon">{Icons.home}</span>
                <span className="companion-nav-label">Home</span>
              </NavLink>
            </li>
            <li className="companion-nav-item">
              <NavLink to="/medical-history" className="companion-nav-link">
                <span className="companion-nav-icon">{Icons.medicalHistory}</span>
                <span className="companion-nav-label">Medical History</span>
              </NavLink>
            </li>
            <li className="companion-nav-item">
              <NavLink to="/screening" className="companion-nav-link">
                <span className="companion-nav-icon">{Icons.aiScreening}</span>
                <span className="companion-nav-label">AI Screening</span>
              </NavLink>
            </li>
            <li className="companion-nav-item">
              <NavLink to="/ai-assistant" className="companion-nav-link is-active" aria-current="page">
                <span className="companion-nav-icon">{Icons.aiAssistant}</span>
                <span className="companion-nav-label">AI Assistant</span>
              </NavLink>
            </li>
            <li className="companion-nav-item">
              <NavLink to="/patient/reports?tab=consultations" className="companion-nav-link">
                <span className="companion-nav-icon">{Icons.doctor}</span>
                <span className="companion-nav-label">Connect to a Doctor</span>
              </NavLink>
            </li>
            <li className="companion-nav-item">
              <NavLink to="/patient/reports" className="companion-nav-link">
                <span className="companion-nav-icon">{Icons.reports}</span>
                <span className="companion-nav-label">My Reports</span>
              </NavLink>
            </li>
            <li className="companion-nav-item">
              <NavLink to="/patient/care-suggestions" className="companion-nav-link">
                <span className="companion-nav-icon">{Icons.careSuggestions}</span>
                <span className="companion-nav-label">Care Suggestions</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer Navigation */}
        <div className="companion-sidebar-footer">
          <ul className="companion-footer-nav">
            <li className="companion-nav-item">
              <NavLink to="/patient/profile" className="companion-nav-link">
                <span className="companion-nav-icon">{Icons.profile}</span>
                <span className="companion-nav-label">Profile</span>
              </NavLink>
            </li>
            <li className="companion-nav-item">
              <NavLink to="/patient/settings" className="companion-nav-link">
                <span className="companion-nav-icon">{Icons.settings}</span>
                <span className="companion-nav-label">Settings</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </aside>

      {/* =========================================================================
          Main Content Viewport
          ========================================================================= */}
      <main className="companion-viewport">
        {/* Top Header Row: Breadcrumb & User Menu */}
        <header className="companion-top-row">
          <div className="companion-breadcrumb">
            <NavLink to="/patient/dashboard" className="companion-breadcrumb-link">
              {Icons.home}
              <span>Home</span>
            </NavLink>
            <span className="companion-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
            <span className="companion-breadcrumb-current">AI Assistant</span>
          </div>

          <div className="companion-top-right">
            <button type="button" className="companion-icon-btn" aria-label="Notifications">
              {Icons.bell}
            </button>
            <button type="button" className="companion-profile-pill" aria-label="User Profile">
              <span className="companion-avatar-circle">
                {patient?.avatarInitials || patient?.name?.[0] || 'S'}
              </span>
              <span>{patient?.name || 'Sadiya'}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </header>

        {/* Heading Section with Mother & Baby Illustration */}
        <div className="companion-header-banner">
          <div className="companion-header-text">
            <h1 className="companion-main-title">Your AI Companion</h1>
            <p className="companion-main-subtitle">
              A safe, supportive space to talk, reflect, and get guidance through your postpartum journey.
            </p>
          </div>

          {/* Mother and Baby Illustration matching reference */}
          <div className="companion-header-illu-wrap" aria-hidden="true">
            <img
              src="/assets/companion-mother-baby-smooth.png"
              alt="Maternal companion illustration"
              className="companion-header-illustration"
            />
          </div>
        </div>

        {/* =========================================================================
            Main Two-Column Layout (Chat Interface on Left, Panels on Right)
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

              <div className="companion-chat-header-actions">
                <button type="button" className="companion-mini-action-btn" aria-label="Session information">
                  {Icons.info}
                </button>
                <button type="button" className="companion-mini-action-btn" aria-label="Chat options">
                  {Icons.dots}
                </button>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="companion-chat-messages" role="log" aria-live="polite">
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';
                return (
                  <div key={msg.id} className={`companion-msg-row ${isBot ? 'is-bot' : 'is-user'}`}>
                    {isBot && (
                      <div className="companion-msg-avatar" aria-hidden="true">
                        <img src="/assets/miora-robot-avatar-sm.png" alt="" />
                      </div>
                    )}

                    <div className="companion-msg-col">
                      <div className="companion-msg-bubble">
                        {msg.text.split('\n\n').map((para, i) => (
                          <p key={i} style={{ margin: i === 0 ? 0 : '8px 0 0 0' }}>{para}</p>
                        ))}
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

              {isTyping && (
                <div className="companion-msg-row is-bot">
                  <div className="companion-msg-avatar" aria-hidden="true">
                    <img src="/assets/miora-robot-avatar-sm.png" alt="" />
                  </div>
                  <div className="companion-typing-row" aria-label="Miora is typing">
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
                onClick={() => handlePromptClick('Can you guide me through a calming breathing exercise?')}
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

              <button
                type="button"
                className="companion-prompt-chip companion-chip-more"
                onClick={() => handlePromptClick('What are other ways you can help me today?')}
                aria-label="More prompt suggestions"
              >
                &bull;&bull;&bull;
              </button>
            </div>

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
                    handleSendMessage(`[Attached: ${e.target.files[0].name}]`);
                  }
                }}
              />
              <button
                type="button"
                className="companion-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach document or note"
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
                className={`companion-mic-btn ${isListening ? 'is-listening' : ''}`}
                onClick={handleToggleVoice}
                aria-label={isListening ? 'Stop listening' : 'Start voice dictation'}
                title={isListening ? 'Listening... click to stop' : 'Voice input'}
              >
                {Icons.mic}
              </button>

              <button
                type="submit"
                className="companion-send-btn"
                aria-label="Send message"
              >
                {Icons.send}
              </button>
            </form>
          </section>

          {/* Right Column – Information Panels */}
          <aside className="companion-info-panels" aria-label="Companion Guidance & Resources">
            {/* Panel 1: How I Can Help */}
            <section className="companion-info-card" aria-labelledby="help-card-title">
              <div className="companion-card-header">
                <span className="companion-sparkle-icon" aria-hidden="true">{Icons.sparkles}</span>
                <h3 id="help-card-title" className="companion-card-title">How I Can Help</h3>
              </div>
              <ul className="companion-help-list">
                <li
                  className="companion-help-item"
                  onClick={() => handlePromptClick("I'd like to talk about how I've been feeling.")}
                >
                  <span className="companion-help-icon">{Icons.chatDots}</span>
                  <span>Talk about your feelings</span>
                </li>
                <li
                  className="companion-help-item"
                  onClick={() => handlePromptClick("Can you suggest some gentle self-care activities for today?")}
                >
                  <span className="companion-help-icon">{Icons.lotus}</span>
                  <span>Suggest self-care activities</span>
                </li>
                <li
                  className="companion-help-item"
                  onClick={() => handlePromptClick("I have questions about postpartum recovery and maternal feelings.")}
                >
                  <span className="companion-help-icon">{Icons.book}</span>
                  <span>Answer maternal &amp; postpartum questions</span>
                </li>
                <li
                  className="companion-help-item"
                  onClick={() => handlePromptClick("Help me reflect on and track my mood over the past few days.")}
                >
                  <span className="companion-help-icon">{Icons.calendarCheck}</span>
                  <span>Help you track your mood</span>
                </li>
                <li
                  className="companion-help-item"
                  onClick={() => handlePromptClick("When is the right time to speak with a doctor or mental health professional?")}
                >
                  <span className="companion-help-icon">{Icons.stethoscope}</span>
                  <span>Guide you on when to seek professional help</span>
                </li>
              </ul>
            </section>

            {/* Panel 2: Your Mood Today */}
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
            </section>

            {/* Panel 3: Quick Resources */}
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
                  onClick={() => setActiveModal('meditation')}
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
          </aside>
        </div>
      </main>

      {/* Decorative ambient bottom wave */}
      <div className="companion-bg-wave-bottom" aria-hidden="true" />

      {/* =========================================================================
          Interactive Resource Modals (Audio / Meditation / Tips)
          ========================================================================= */}
      {activeModal && (
        <div className="companion-modal-backdrop" onClick={() => setActiveModal(null)} role="dialog">
          <div className="companion-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="companion-modal-head">
              <h4 className="companion-modal-title">
                {activeModal === 'audio' && 'Relaxation Audio'}
                {activeModal === 'meditation' && 'Guided Meditation'}
                {activeModal === 'tips' && 'Postpartum Recovery Tips'}
              </h4>
              <button
                type="button"
                className="companion-modal-close-btn"
                onClick={() => setActiveModal(null)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="companion-modal-body">
              {activeModal === 'audio' && (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <p style={{ fontSize: '13px', color: '#5b4750', marginBottom: '16px' }}>
                    Soothing ocean swell and gentle ambient soundscape designed to calm postpartum nervous system arousal.
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#fdf2f6', borderRadius: '30px', color: '#d93c75', fontWeight: 600, fontSize: '13px' }}>
                    <span>▶ Playing: Gentle Waves (04:12)</span>
                  </div>
                </div>
              )}

              {activeModal === 'meditation' && (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <p style={{ fontSize: '13px', color: '#5b4750', marginBottom: '16px' }}>
                    A 3-minute mindful pause for mothers: softening body tension and embracing self-compassion.
                  </p>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fee7ef', border: '3px solid #ea3b75', margin: '0 auto 12px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d93c75', fontSize: '14px', fontWeight: 700 }}>
                    Inhale
                  </div>
                  <small style={{ color: '#8c747f' }}>Breathe softly with the pulsing circle</small>
                </div>
              )}

              {activeModal === 'tips' && (
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#4a353f', lineHeight: 1.6 }}>
                  <li><strong>Rest when possible:</strong> Even 15 minutes of quiet resting restores neurological energy.</li>
                  <li><strong>Hydration &amp; Warm Nourishment:</strong> Soups, warm teas, and iron-rich foods aid healing.</li>
                  <li><strong>Ask for specific help:</strong> Let family or friends hold household tasks so you can bond and recover.</li>
                  <li><strong>Be gentle with yourself:</strong> Baby blues and mood fluctuations are natural hormonal transitions.</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
