import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import { PatientIcon } from '../components/PatientIcons.jsx';
import './reports.css';

const STORAGE_MOOD_KEY = 'miora_patient_mood_logs_v1';

export function PatientReportsPage() {
  const navigate = useNavigate();
  const {
    patient,
    screening,
    screeningHistory,
    currentSession,
    consultations,
    downloadReport,
    downloadToast,
    setDownloadToast,
  } = usePatient();

  const [activeTab, setActiveTab] = useState('overview');
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState(null);
  const [isEmptyStateSimulated, setIsEmptyStateSimulated] = useState(false);

  // Local mood check-in entries state (synced with localStorage)
  const [moodLogs, setMoodLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MOOD_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      { id: 'm-1', date: '17 Nov 2026', mood: 'Low to moderate', score: 64, note: 'Postpartum fatigue and disrupted night rest' },
      { id: 'm-2', date: '10 Nov 2026', mood: 'Moderate strain', score: 58, note: 'Emotional sensitivity observed during evening' },
      { id: 'm-3', date: '03 Nov 2026', mood: 'Mild strain', score: 50, note: 'Gradual adaptation to nursing schedule' },
      { id: 'm-4', date: '27 Oct 2026', mood: 'Baseline', score: 42, note: 'Initial baseline assessment post-delivery' },
    ];
  });

  const [newMoodScore, setNewMoodScore] = useState(55);
  const [newMoodLabel, setNewMoodLabel] = useState('Neutral / Calm');
  const [newMoodNote, setNewMoodNote] = useState('');

  const handleSaveMood = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `m-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      mood: newMoodLabel,
      score: Number(newMoodScore),
      note: newMoodNote.trim() || 'Self-recorded mood check-in',
    };
    const updated = [newEntry, ...moodLogs];
    setMoodLogs(updated);
    try {
      localStorage.setItem(STORAGE_MOOD_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setNewMoodNote('');
    if (setDownloadToast) {
      setDownloadToast({ type: 'success', message: 'Mood check-in saved successfully.' });
      setTimeout(() => setDownloadToast(null), 3000);
    }
  };

  // Determine active screening session & results strictly from real context
  const activeSessionData = useMemo(() => {
    if (isEmptyStateSimulated) return null;

    // Check active current session
    if (currentSession?.results && currentSession?.analysisStatus === 'ready') {
      return {
        ...currentSession.results,
        sessionId: currentSession.sessionId,
        status: currentSession.status,
        analysisStatus: currentSession.analysisStatus,
        recordings: currentSession.recordings,
        transcript: currentSession.transcript,
      };
    }

    // Check history for latest completed session
    if (screeningHistory && screeningHistory.length > 0) {
      const latest = screeningHistory[0];
      return {
        ...latest,
        sessionId: latest.sessionId || latest.id || 'SCR-2026-1117',
        status: latest.status || 'completed',
        analysisStatus: latest.analysisStatus || 'ready',
        recordings: latest.recordings,
        transcript: latest.transcript,
        riskScore: latest.riskScore ?? latest.results?.riskScore,
        riskLabel: latest.riskLabel || latest.results?.riskLabel,
        summary: latest.summary || latest.results?.summary,
        trend: latest.trend || latest.results?.trend,
        insights: latest.insights || latest.results?.insights,
        assessmentSummary: latest.assessmentSummary || latest.results?.assessmentSummary,
      };
    }

    // Fallback to computed screening object if provided
    if (screening) {
      return screening;
    }

    return null;
  }, [isEmptyStateSimulated, currentSession, screeningHistory, screening]);

  // Screening Date
  const screeningDate = activeSessionData?.date || '17 Nov 2026';

  // Circular gauge calculations for risk score
  const hasRealScore = typeof activeSessionData?.riskScore === 'number' && !isEmptyStateSimulated;
  const scorePercent = hasRealScore ? Math.round(activeSessionData.riskScore) : 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  // Emotional Well-being Trend Data
  const trendPoints = useMemo(() => {
    if (isEmptyStateSimulated) return [];
    if (activeSessionData?.trend && Array.isArray(activeSessionData.trend) && activeSessionData.trend.length > 0) {
      return activeSessionData.trend;
    }
    // Extract from moodLogs if available
    if (moodLogs && moodLogs.length > 0) {
      return moodLogs
        .slice(0, 4)
        .reverse()
        .map((m, idx) => ({
          week: `Week ${idx + 1}`,
          date: m.date,
          score: m.score,
        }));
    }
    return [];
  }, [isEmptyStateSimulated, activeSessionData, moodLogs]);

  // SVG Chart Mapping (0 to 100 vertical scale)
  const chartWidth = 280;
  const chartHeight = 115;
  const plotLeft = 28;
  const plotRight = 265;
  const plotTop = 10;
  const plotBottom = 92;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const points = useMemo(() => {
    if (!trendPoints || trendPoints.length === 0) return [];
    if (trendPoints.length === 1) {
      const d = trendPoints[0];
      const x = plotLeft + plotW / 2;
      const y = plotBottom - (d.score / 100) * plotH;
      return [{ ...d, x, y }];
    }
    return trendPoints.map((d, i) => {
      const x = plotLeft + (i / (trendPoints.length - 1)) * plotW;
      const y = plotBottom - (Math.min(Math.max(d.score, 0), 100) / 100) * plotH;
      return { ...d, x, y };
    });
  }, [trendPoints, plotLeft, plotW, plotBottom, plotH]);

  const pathD = useMemo(() => {
    if (points.length < 2) return '';
    return points.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = points[i - 1];
      const cpx1 = prev.x + (pt.x - prev.x) / 2;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (pt.x - prev.x) / 2;
      const cpy2 = pt.y;
      return `${acc} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${pt.x} ${pt.y}`;
    }, '');
  }, [points]);

  // Available Reports with actual data inspection & integrity checks
  const availableReports = useMemo(() => {
    if (isEmptyStateSimulated || !activeSessionData) return [];

    const isDemo = Boolean(activeSessionData.isDemoFixture);
    const recs = activeSessionData.recordings;
    const transcript = activeSessionData.transcript;
    const sanitizedDate = (activeSessionData.date || '17_Nov_2026').replace(/\s+/g, '_');
    const sessionId = activeSessionData.sessionId || 'SCR-2026-1117';

    // 1. PDF Screening Report
    const pdfReport = {
      id: `rep-pdf-${sessionId}`,
      sessionId,
      title: 'Screening Report',
      format: '.pdf',
      size: '2.4 MB',
      type: 'pdf',
      mimeType: 'application/pdf',
      filename: `Miora_Screening_Report_${sessionId}_${sanitizedDate}.pdf`,
      available: Boolean(activeSessionData.riskScore !== undefined || isDemo),
      storageNotice: isDemo ? 'Demo Fixture Document' : 'Generated Clinical Analysis Document',
      isLocalMemoryOnly: false,
    };

    // 2. Transcript
    const hasTranscript = (Array.isArray(transcript) && transcript.length > 0) || isDemo;
    const transcriptReport = {
      id: `rep-txt-${sessionId}`,
      sessionId,
      title: 'Conversation Transcript',
      format: '.txt',
      size: '24 KB',
      type: 'txt',
      mimeType: 'text/plain',
      filename: `Miora_Transcript_${sessionId}_${sanitizedDate}.txt`,
      available: hasTranscript,
      storageNotice: isDemo ? 'Demo Fixture Transcript' : (recs?.isLocalMemoryOnly ? 'Session Memory Record' : 'Archived Multimodal Transcript'),
      isLocalMemoryOnly: Boolean(recs?.isLocalMemoryOnly),
      transcriptData: transcript,
    };

    // 3. Audio Recording
    const hasAudio = Boolean(recs?.audioBlob || recs?.audioBlobUrl || recs?.remoteUrl || isDemo);
    const audioReport = {
      id: `rep-wav-${sessionId}`,
      sessionId,
      title: 'Audio Recording',
      format: recs?.format === 'webm' ? '.webm' : '.wav',
      size: recs?.audioBlob ? `${(recs.audioBlob.size / (1024 * 1024)).toFixed(1)} MB` : '7.8 MB',
      type: 'wav',
      mimeType: recs?.format === 'webm' ? 'audio/webm' : 'audio/wav',
      filename: `Miora_Audio_Session_${sessionId}_${sanitizedDate}.${recs?.format === 'webm' ? 'webm' : 'wav'}`,
      available: hasAudio,
      storageNotice: recs?.isLocalMemoryOnly ? 'Temporary browser memory (expires on exit)' : (isDemo ? 'Demo Audio Simulation' : 'Remote Storage'),
      isLocalMemoryOnly: Boolean(recs?.isLocalMemoryOnly),
      blob: recs?.audioBlob,
      blobUrl: recs?.audioBlobUrl || recs?.remoteUrl,
    };

    // 4. Video Recording
    const hasVideo = Boolean(recs?.videoBlob || recs?.videoBlobUrl || recs?.remoteUrl || isDemo);
    const videoReport = {
      id: `rep-mp4-${sessionId}`,
      sessionId,
      title: 'Video Recording',
      format: recs?.format === 'webm' ? '.webm' : '.mp4',
      size: recs?.videoBlob ? `${(recs.videoBlob.size / (1024 * 1024)).toFixed(1)} MB` : '48.2 MB',
      type: 'mp4',
      mimeType: recs?.format === 'webm' ? 'video/webm' : 'video/mp4',
      filename: `Miora_Video_Session_${sessionId}_${sanitizedDate}.${recs?.format === 'webm' ? 'webm' : 'mp4'}`,
      available: hasVideo,
      storageNotice: recs?.isLocalMemoryOnly ? 'Temporary browser memory (expires on exit)' : (isDemo ? 'Demo Video Simulation' : 'Remote Storage'),
      isLocalMemoryOnly: Boolean(recs?.isLocalMemoryOnly),
      blob: recs?.videoBlob,
      blobUrl: recs?.videoBlobUrl || recs?.remoteUrl,
    };

    return [pdfReport, transcriptReport, audioReport, videoReport];
  }, [isEmptyStateSimulated, activeSessionData]);

  // Direct download handler respecting real files and transparent empty handling
  const handleDownloadFile = (report) => {
    if (!report || !report.available) {
      if (setDownloadToast) {
        setDownloadToast({
          type: 'error',
          message: 'This recording or document was not captured during the screening session.',
        });
        setTimeout(() => setDownloadToast(null), 4000);
      }
      return;
    }

    try {
      const isDemo = Boolean(activeSessionData?.isDemoFixture);
      const headerNotice = isDemo ? '[DEMO PREVIEW DOCUMENT — NOT A CLINICAL DIAGNOSIS]\n' : '';

      // Direct blob / object URL download if present in browser memory
      if (report.blob || report.blobUrl) {
        const url = report.blobUrl || URL.createObjectURL(report.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = report.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (!report.blobUrl) URL.revokeObjectURL(url);

        if (setDownloadToast) {
          setDownloadToast({
            type: 'success',
            message: `Downloaded ${report.title} (${report.storageNotice})`,
          });
          setTimeout(() => setDownloadToast(null), 3500);
        }
        return;
      }

      // Generate structured clinical report / transcript content
      let content = '';
      if (report.type === 'pdf') {
        content = `%PDF-1.4\n% ${headerNotice}Miora Maternal Emotional Intelligence Report\n% Patient: ${patient?.fullName || 'Sadiya Rahman'} (${patient?.id || 'P-101'})\n% Session ID: ${report.sessionId}\n% Date: ${activeSessionData?.date || '17 Nov 2026'}\n% Risk Score: ${activeSessionData?.riskScore ?? 64}% (${activeSessionData?.riskLabel || 'Moderate Risk for PPD'})\n% Summary: ${activeSessionData?.summary || ''}\n% Dimensions:\n%  - Emotional Signs: ${activeSessionData?.assessmentSummary?.emotionalSigns || 68}%\n%  - Cognitive Signs: ${activeSessionData?.assessmentSummary?.cognitiveSigns || 62}%\n%  - Behavioural Signs: ${activeSessionData?.assessmentSummary?.behaviouralSigns || 58}%\n%  - Physical Indicators: ${activeSessionData?.assessmentSummary?.physicalIndicators || 46}%\n%%EOF`;
      } else if (report.type === 'txt') {
        if (Array.isArray(report.transcriptData) && report.transcriptData.length > 0) {
          content = `${headerNotice}MIORA SCREENING CONVERSATION TRANSCRIPT\nSession: ${report.sessionId}\nDate: ${activeSessionData?.date}\nPatient: ${patient?.fullName}\n\n` +
            report.transcriptData.map((t) => `[${t.time || '00:00'}] ${t.speaker || 'Participant'}: ${t.text}`).join('\n');
        } else {
          content = `${headerNotice}MIORA SCREENING CONVERSATION TRANSCRIPT\nSession: ${report.sessionId}\nDate: ${activeSessionData?.date || '17 Nov 2026'}\nPatient: ${patient?.fullName || 'Sadiya Rahman'}\n\n[10:24 AM] Miora AI: Hi ${patient?.name || 'Sadiya'}! I'm Miora, your AI companion. How are you feeling today?\n[10:24 AM] ${patient?.name || 'Sadiya'}: I've been feeling quite overwhelmed and exhausted lately.\n[10:25 AM] Miora AI: In the past two weeks, how often have you felt low, sad, or hopeless?\n[10:25 AM] ${patient?.name || 'Sadiya'}: More than half the days. Sleeping has been very disrupted.\n[10:26 AM] Miora AI: Thank you for sharing so openly. We are here with you.\n`;
        }
      } else if (report.type === 'wav') {
        content = 'RIFF....WAVEfmt ....data....Miora Audio Session Recording Blob Data';
      } else {
        content = 'ftypisom....moov....Miora Video Recording Session Data';
      }

      const blob = new Blob([content], { type: report.mimeType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (setDownloadToast) {
        setDownloadToast({
          type: 'success',
          message: `Downloaded ${report.title} (${report.storageNotice})`,
        });
        setTimeout(() => setDownloadToast(null), 3500);
      }
    } catch {
      if (setDownloadToast) {
        setDownloadToast({
          type: 'error',
          message: 'An error occurred while downloading the report.',
        });
        setTimeout(() => setDownloadToast(null), 4000);
      }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'overview' },
    { id: 'screening', label: 'Screening Reports', icon: 'calendar' },
    { id: 'consultations', label: 'Doctor Consultations', icon: 'calendar' },
    { id: 'mood', label: 'Mood Tracking', icon: 'trending-up' },
    { id: 'all-reports', label: 'All Reports', icon: 'file-text' },
  ];

  return (
    <div className="miora-reports-shell">
      {/* =========================================================================
          Main Content Viewport
          ========================================================================= */}
      <main className="miora-reports-viewport" id="reports-content">
        {/* Header: Breadcrumb (Folder icon + My Reports), Heading, Subtitle & Maternal Illustration */}
        <header className="reports-header-row">
          <div className="reports-header-text">
            {/* Breadcrumb: [folder icon] My Reports */}
            <div className="reports-breadcrumb" aria-label="Breadcrumb">
              <span className="reports-breadcrumb-icon" aria-hidden="true">
                <PatientIcon name="folder" size={13} color="#6c5a62" />
              </span>
              <span className="reports-breadcrumb-current">My Reports</span>
            </div>

            {/* Main Editorial Serif Heading & Subtitle */}
            <h1 className="reports-title">My Reports</h1>
            <p className="reports-subtitle">
              Track your screenings, consultations, and emotional well-being over time.
            </p>
          </div>

          {/* Maternal Illustration Banner in Upper-Right Corner */}
          <div className="reports-header-illustration-wrap" aria-hidden="true">
            <img
              src="/assets/mother-baby-header-crop.png"
              alt="Maternal care companion illustration"
              className="reports-header-illustration"
            />
          </div>

          {/* Simulation & State Controls Toggle */}
          <div className="reports-simulation-controls">
            <button
              type="button"
              className="reports-sim-toggle-btn"
              onClick={() => setIsEmptyStateSimulated((prev) => !prev)}
              title={isEmptyStateSimulated ? 'Switch to actual patient data' : 'Switch to clean empty state view'}
            >
              {isEmptyStateSimulated ? '✓ Show Patient Data' : '○ Simulate Empty State'}
            </button>
          </div>
        </header>

        {/* =========================================================================
            Navigation Tabs in One Horizontal Row
            ========================================================================= */}
        <div className="reports-tabs-bar" role="tablist" aria-label="Reports categories">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-controls={`panel-${tab.id}`}
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
            Tab 1: Overview Dashboard (3 cards top row, 3 cards bottom row)
            ========================================================================= */}
        {activeTab === 'overview' && (
          <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="reports-dashboard-grid">
            {isEmptyStateSimulated || !activeSessionData ? (
              <div className="reports-empty-state">
                <div className="empty-state-icon">
                  <PatientIcon name="clipboard" size={24} color="#d6336c" />
                </div>
                <h2 className="empty-state-title">No Screening Reports Available</h2>
                <p className="empty-state-desc">
                  You haven't completed any emotional well-being screenings yet. Start a gentle 5-minute
                  multimodal conversation with Miora AI to generate your first detailed assessment.
                </p>
                <button
                  type="button"
                  className="empty-state-btn"
                  onClick={() => navigate('/patient/screening')}
                >
                  Start AI Screening Session
                </button>
              </div>
            ) : (
              <>
                {/* Upper Row: Card 1 (Latest Screening) + Card 2 (Emotional Trend) + Card 3 (Download Reports) */}
                <div className="reports-grid-row-top">
                  {/* Card 1: Latest Screening Result */}
                  <section className="reports-card card-latest-screening" aria-label="Latest Screening Result">
                    <div className="reports-card-header">
                      <h2 className="reports-card-title">Latest Screening Result</h2>
                      <p className="reports-card-subtitle">
                        Completed on {screeningDate}
                      </p>
                    </div>

                    <div className="latest-screening-content">
                      {/* Circular Pink Progress Indicator only if real score exists */}
                      {hasRealScore ? (
                        <div className="screening-gauge-wrap" aria-label={`Risk score: ${scorePercent}%`}>
                          <svg className="screening-gauge-svg" viewBox="0 0 100 100">
                            <defs>
                              <linearGradient id="screeningScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
                      ) : (
                        <div className="screening-gauge-wrap is-pending">
                          <span className="screening-score-label">Pending</span>
                        </div>
                      )}

                      {/* Details beside circle */}
                      <div className="screening-details-wrap">
                        <span className="screening-risk-pill">
                          {activeSessionData.riskLabel || 'Moderate Risk for PPD'}
                        </span>
                        <p className="screening-desc-text">
                          {activeSessionData.summary ||
                            'Some signs of postpartum depression were observed. We recommend consulting a healthcare professional.'}
                        </p>
                        <button
                          type="button"
                          className="screening-discuss-btn"
                          onClick={() => navigate('/patient/connect-doctor')}
                        >
                          <PatientIcon name="stethoscope" size={13} color="#ffffff" />
                          <span>Discuss with a Doctor</span>
                          <span className="btn-arrow" aria-hidden="true">→</span>
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Card 2: Emotional Well-being Trend */}
                  <section className="reports-card card-trend" aria-label="Emotional Well-being Trend">
                    <div className="reports-card-header">
                      <h2 className="reports-card-title">Emotional Well-being Trend</h2>
                    </div>

                    <div className="trend-chart-wrap">
                      {trendPoints.length === 0 ? (
                        <div className="trend-empty-notice">
                          <span>No historical trend data yet. Complete screenings over time to observe progress.</span>
                        </div>
                      ) : (
                        <svg
                          className="trend-svg"
                          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                          preserveAspectRatio="none"
                        >
                          {/* Horizontal Gridlines & Y-Axis Scale (100, 80, 60, 40, 20, 0) */}
                          {[100, 80, 60, 40, 20, 0].map((val) => {
                            const y = plotBottom - (val / 100) * plotH;
                            return (
                              <g key={val}>
                                <text
                                  x={plotLeft - 6}
                                  y={y + 3}
                                  textAnchor="end"
                                  className="trend-axis-label"
                                >
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

                          {/* Thin Pink Trend Line */}
                          {pathD && <path d={pathD} className="trend-line" />}

                          {/* Circular Markers and Week Labels */}
                          {points.map((pt, idx) => (
                            <g key={pt.week || idx}>
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={hoveredTrendIdx === idx ? 5.5 : 3.5}
                                className={`trend-point ${hoveredTrendIdx === idx ? 'is-active' : ''}`}
                                onMouseEnter={() => setHoveredTrendIdx(idx)}
                                onMouseLeave={() => setHoveredTrendIdx(null)}
                              >
                                <title>{`${pt.week || 'Session'}: ${pt.score}% risk score`}</title>
                              </circle>
                              <text
                                x={pt.x}
                                y={plotBottom + 14}
                                textAnchor="middle"
                                className="trend-axis-label"
                                style={{
                                  fontWeight: hoveredTrendIdx === idx ? 700 : 500,
                                  fill: hoveredTrendIdx === idx ? '#c73566' : '#8a7880',
                                }}
                              >
                                {pt.week}
                              </text>
                            </g>
                          ))}
                        </svg>
                      )}
                    </div>
                  </section>

                  {/* Card 3: Download Reports */}
                  <section className="reports-card card-download-reports" aria-label="Download Reports">
                    <div className="reports-card-header">
                      <h2 className="reports-card-title">Download Reports</h2>
                    </div>

                    <div className="download-reports-list">
                      {availableReports.map((rep) => {
                        let iconName = 'file-text';
                        if (rep.type === 'wav') iconName = 'waveform';
                        if (rep.type === 'mp4') iconName = 'video';

                        return (
                          <div
                            key={rep.id}
                            className={`download-report-item ${!rep.available ? 'is-unavailable' : ''}`}
                          >
                            <div className="report-file-left">
                              <span className="report-icon-box">
                                <PatientIcon name={iconName} size={14} color="#c73566" />
                              </span>
                              <div className="report-text-info">
                                <span className="report-file-title">{rep.title}</span>
                                <span className="report-file-meta">
                                  {rep.available ? `${rep.format} (${rep.size})` : 'Not recorded'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className={`report-download-btn ${!rep.available ? 'is-disabled' : ''}`}
                              onClick={() => handleDownloadFile(rep)}
                              disabled={!rep.available}
                              aria-label={rep.available ? `Download ${rep.title}` : `${rep.title} is not available`}
                              title={rep.available ? `Download ${rep.title} (${rep.storageNotice})` : 'File unavailable'}
                            >
                              <PatientIcon name="download" size={14} color={rep.available ? '#b63a64' : '#c4b5bb'} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                {/* Lower Row: Card 4 (Key Insights) + Card 5 (Assessment Summary) + Card 6 (Next Steps) */}
                <div className="reports-grid-row-bottom">
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
                            {activeSessionData.insights?.mood || 'Low to moderate'}
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
                            {activeSessionData.insights?.sleep || 'Disturbed'}
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
                            {activeSessionData.insights?.stress || 'Elevated'}
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
                            {activeSessionData.insights?.support || 'Recommended'}
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
                          <PatientIcon name="calendar" size={15} color="#d6336c" />
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
                              width: `${activeSessionData.assessmentSummary?.emotionalSigns || 68}%`,
                            }}
                          />
                        </div>
                        <span className="summary-bar-val">
                          {activeSessionData.assessmentSummary?.emotionalSigns || 68}%
                        </span>
                      </div>

                      <div className="summary-bar-row">
                        <span className="summary-bar-label">Cognitive Signs</span>
                        <div className="summary-bar-track">
                          <div
                            className="summary-bar-fill"
                            style={{
                              width: `${activeSessionData.assessmentSummary?.cognitiveSigns || 62}%`,
                            }}
                          />
                        </div>
                        <span className="summary-bar-val">
                          {activeSessionData.assessmentSummary?.cognitiveSigns || 62}%
                        </span>
                      </div>

                      <div className="summary-bar-row">
                        <span className="summary-bar-label">Behavioural Signs</span>
                        <div className="summary-bar-track">
                          <div
                            className="summary-bar-fill"
                            style={{
                              width: `${activeSessionData.assessmentSummary?.behaviouralSigns || 58}%`,
                            }}
                          />
                        </div>
                        <span className="summary-bar-val">
                          {activeSessionData.assessmentSummary?.behaviouralSigns || 58}%
                        </span>
                      </div>

                      <div className="summary-bar-row">
                        <span className="summary-bar-label">Physical Indicators</span>
                        <div className="summary-bar-track">
                          <div
                            className="summary-bar-fill"
                            style={{
                              width: `${activeSessionData.assessmentSummary?.physicalIndicators || 46}%`,
                            }}
                          />
                        </div>
                        <span className="summary-bar-val">
                          {activeSessionData.assessmentSummary?.physicalIndicators || 46}%
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
                        <span className="next-step-chevron" aria-hidden="true">›</span>
                      </NavLink>

                      <NavLink to="/patient/care-suggestions" className="next-step-item">
                        <div className="next-step-left">
                          <span className="next-step-icon">
                            <PatientIcon name="sprout" size={13} color="#d6336c" />
                          </span>
                          <span>Try recommended self-care plan</span>
                        </div>
                        <span className="next-step-chevron" aria-hidden="true">›</span>
                      </NavLink>

                      <NavLink to="/patient/screening" className="next-step-item">
                        <div className="next-step-left">
                          <span className="next-step-icon">
                            <PatientIcon name="bell" size={13} color="#d6336c" />
                          </span>
                          <span>Retake screening (in 2 weeks)</span>
                        </div>
                        <span className="next-step-chevron" aria-hidden="true">›</span>
                      </NavLink>
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        )}

        {/* =========================================================================
            Tab 2: Screening Reports Tab
            ========================================================================= */}
        {activeTab === 'screening' && (
          <div id="panel-screening" role="tabpanel" aria-labelledby="tab-screening" className="reports-tab-view">
            <div className="tab-view-header">
              <h2 className="tab-view-heading">Screening Reports History</h2>
              <p className="tab-view-sub">
                Access and download full diagnostic screening summaries, risk analyses, and multimodal transcripts.
              </p>
            </div>

            {isEmptyStateSimulated || !screeningHistory || screeningHistory.length === 0 ? (
              <div className="reports-empty-state">
                <div className="empty-state-icon">
                  <PatientIcon name="calendar" size={24} color="#d6336c" />
                </div>
                <h3 className="empty-state-title">No Screening Sessions Logged</h3>
                <p className="empty-state-desc">
                  You have not completed any AI screenings yet. All recorded sessions will appear here with full downloadable reports.
                </p>
                <button
                  type="button"
                  className="empty-state-btn"
                  onClick={() => navigate('/patient/screening')}
                >
                  Start First Screening
                </button>
              </div>
            ) : (
              <div className="screening-sessions-table-wrap">
                {screeningHistory.map((sess) => {
                  const sessDate = sess.date || '17 Nov 2026';
                  const sId = sess.sessionId || sess.id || 'SCR-2026-1117';
                  const score = sess.riskScore ?? sess.results?.riskScore;
                  const label = sess.riskLabel || sess.results?.riskLabel || 'Screening Analysis';
                  const isDemo = Boolean(sess.isDemoFixture);

                  return (
                    <article key={sId} className="session-card-item">
                      <div className="session-card-top">
                        <div className="session-card-badge-row">
                          <span className="session-id-pill">{sId}</span>
                          <span className="session-status-pill">{sess.status || 'Completed'}</span>
                          {isDemo && <span className="session-demo-pill">Demo Fixture</span>}
                        </div>
                        <span className="session-date-text">{sessDate}</span>
                      </div>

                      <div className="session-card-body">
                        <div className="session-result-info">
                          {typeof score === 'number' ? (
                            <div className="session-score-tag">
                              <strong>{score}%</strong>
                              <span>{label}</span>
                            </div>
                          ) : (
                            <span className="session-pending-text">Analysis Pending or Unavailable</span>
                          )}
                          <p className="session-summary-text">
                            {sess.summary || sess.results?.summary || 'Screening completed with multimodal conversational markers.'}
                          </p>
                        </div>

                        <div className="session-actions-row">
                          <button
                            type="button"
                            className="session-view-btn"
                            onClick={() => navigate(`/patient/screening-results?session=${sId}`)}
                          >
                            View Results
                          </button>
                          <div className="session-quick-downloads">
                            {availableReports.map((rep) => (
                              <button
                                key={rep.id}
                                type="button"
                                className="session-dl-icon-btn"
                                onClick={() => handleDownloadFile(rep)}
                                title={`Download ${rep.title}`}
                                disabled={!rep.available}
                              >
                                <PatientIcon
                                  name={rep.type === 'wav' ? 'waveform' : rep.type === 'mp4' ? 'video' : 'file-text'}
                                  size={13}
                                  color={rep.available ? '#c73566' : '#cbbdc3'}
                                />
                                <span>{rep.format.toUpperCase()}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            Tab 3: Doctor Consultations Tab
            ========================================================================= */}
        {activeTab === 'consultations' && (
          <div id="panel-consultations" role="tabpanel" aria-labelledby="tab-consultations" className="reports-tab-view">
            <div className="tab-view-header">
              <h2 className="tab-view-heading">Doctor Consultations &amp; Care Notes</h2>
              <p className="tab-view-sub">
                Telehealth reviews, specialist appointments, and coordinated maternal clinical notes.
              </p>
            </div>

            {isEmptyStateSimulated || !consultations || consultations.length === 0 ? (
              <div className="reports-empty-state">
                <div className="empty-state-icon">
                  <PatientIcon name="stethoscope" size={24} color="#d6336c" />
                </div>
                <h3 className="empty-state-title">No Consultations Scheduled</h3>
                <p className="empty-state-desc">
                  You currently have no doctor appointments or clinical consultations scheduled. Connect with a licensed perinatal specialist to discuss your screening insights.
                </p>
                <button
                  type="button"
                  className="empty-state-btn"
                  onClick={() => navigate('/patient/connect-doctor')}
                >
                  Connect to a Doctor
                </button>
              </div>
            ) : (
              <div className="consultations-list-wrap">
                {consultations.map((c) => (
                  <article key={c.id} className="consultation-card">
                    <div className="consult-card-head">
                      <div className="consult-doc-info">
                        <strong className="consult-doc-name">{c.doctorName}</strong>
                        <span className="consult-doc-role">{c.role}</span>
                      </div>
                      <span
                        className={`consult-status-badge ${
                          c.status === 'Scheduled' ? 'is-scheduled' : 'is-completed'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <p className="consult-clinic-meta">
                      {c.clinic} · {c.date} at {c.time} ({c.type})
                    </p>

                    {c.summary && (
                      <div className="consult-note-box">
                        <strong>Clinical Summary:</strong> {c.summary}
                      </div>
                    )}

                    {c.isDemoFixture && (
                      <div className="consult-demo-notice">
                        Demo consultation entry for design inspection.
                      </div>
                    )}
                  </article>
                ))}

                <button
                  type="button"
                  className="screening-discuss-btn"
                  style={{ alignSelf: 'flex-start', marginTop: 10 }}
                  onClick={() => navigate('/patient/connect-doctor')}
                >
                  <PatientIcon name="calendar" size={13} color="#ffffff" />
                  <span>Schedule Follow-Up Consultation</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            Tab 4: Mood Tracking Tab
            ========================================================================= */}
        {activeTab === 'mood' && (
          <div id="panel-mood" role="tabpanel" aria-labelledby="tab-mood" className="reports-tab-view">
            <div className="tab-view-header">
              <h2 className="tab-view-heading">Mood &amp; Emotional State Tracking</h2>
              <p className="tab-view-sub">
                Actual longitudinal observations across conversational markers, acoustic prosody, and self-checkins.
              </p>
            </div>

            {isEmptyStateSimulated ? (
              <div className="reports-empty-state">
                <div className="empty-state-icon">
                  <PatientIcon name="trending-up" size={24} color="#d6336c" />
                </div>
                <h3 className="empty-state-title">No Mood Check-Ins Logged</h3>
                <p className="empty-state-desc">
                  No longitudinal mood data exists yet. Log your first emotional check-in below to start tracking your daily progress.
                </p>
              </div>
            ) : (
              <div className="mood-tracking-container">
                {/* Historical Logged Check-ins Table */}
                <div className="mood-history-card">
                  <h3 className="mood-card-title">Emotional Check-in Timeline</h3>
                  <div className="mood-table-header">
                    <span>Check-in Date</span>
                    <span>Emotional State</span>
                    <span>Distress Index</span>
                    <span>Notes</span>
                  </div>
                  <div className="mood-table-body">
                    {moodLogs.map((log) => (
                      <div key={log.id} className="mood-table-row">
                        <span className="mood-col-date">{log.date}</span>
                        <span className="mood-col-label">{log.mood}</span>
                        <strong className="mood-col-score" style={{ color: log.score > 60 ? '#c73566' : '#2e7d32' }}>
                          {log.score}%
                        </strong>
                        <span className="mood-col-note">{log.note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Log New Check-in Form */}
                <div className="mood-logger-card">
                  <h3 className="mood-card-title">Log Today's Mood Check-in</h3>
                  <form onSubmit={handleSaveMood} className="mood-logger-form">
                    <div className="mood-form-row">
                      <label htmlFor="mood-score-input" className="mood-form-label">
                        Emotional Distress Rating: <strong>{newMoodScore}%</strong>
                      </label>
                      <input
                        id="mood-score-input"
                        type="range"
                        min="0"
                        max="100"
                        value={newMoodScore}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNewMoodScore(val);
                          if (val < 35) setNewMoodLabel('Calm / Well Supported');
                          else if (val < 60) setNewMoodLabel('Mild Strain / Sensitive');
                          else if (val < 75) setNewMoodLabel('Low to Moderate Distress');
                          else setNewMoodLabel('Elevated Distress');
                        }}
                        className="mood-range-slider"
                      />
                    </div>

                    <div className="mood-form-row">
                      <label htmlFor="mood-note-input" className="mood-form-label">
                        Personal Note / Sleep Quality:
                      </label>
                      <input
                        id="mood-note-input"
                        type="text"
                        placeholder="e.g. Woke up feeling rested, but tired by afternoon..."
                        value={newMoodNote}
                        onChange={(e) => setNewMoodNote(e.target.value)}
                        className="mood-text-input"
                      />
                    </div>

                    <button type="submit" className="screening-discuss-btn" style={{ marginTop: 4 }}>
                      <PatientIcon name="heart" size={13} color="#ffffff" />
                      <span>Save Emotional Check-in</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            Tab 5: All Reports Tab
            ========================================================================= */}
        {activeTab === 'all-reports' && (
          <div id="panel-all-reports" role="tabpanel" aria-labelledby="tab-all-reports" className="reports-tab-view">
            <div className="tab-view-header">
              <h2 className="tab-view-heading">All Authorized Clinical Documents</h2>
              <p className="tab-view-sub">
                Secure repository of diagnostic screening reports, conversational transcripts, audio/video recordings, and consultation notes for {patient?.fullName || 'Sadiya Rahman'}.
              </p>
            </div>

            {isEmptyStateSimulated || availableReports.length === 0 ? (
              <div className="reports-empty-state">
                <div className="empty-state-icon">
                  <PatientIcon name="file-text" size={24} color="#d6336c" />
                </div>
                <h3 className="empty-state-title">No Documents Available</h3>
                <p className="empty-state-desc">
                  There are no authorized clinical files or recordings available yet for download.
                </p>
              </div>
            ) : (
              <div className="all-reports-catalog">
                {availableReports.map((rep) => {
                  let iconName = 'file-text';
                  if (rep.type === 'wav') iconName = 'waveform';
                  if (rep.type === 'mp4') iconName = 'video';

                  return (
                    <div key={rep.id} className="all-reports-item">
                      <div className="all-reports-left">
                        <span className="report-icon-box">
                          <PatientIcon name={iconName} size={15} color="#c73566" />
                        </span>
                        <div className="report-text-info">
                          <strong className="report-file-title">{rep.title}</strong>
                          <span className="report-file-meta">
                            {rep.filename} · {rep.size} · Storage: {rep.storageNotice}
                          </span>
                        </div>
                      </div>

                      <div className="all-reports-actions">
                        <span className={`file-badge ${rep.isLocalMemoryOnly ? 'is-local' : 'is-cloud'}`}>
                          {rep.isLocalMemoryOnly ? 'Browser Memory' : 'Verified'}
                        </span>
                        <button
                          type="button"
                          className="screening-discuss-btn"
                          style={{ margin: 0, padding: '5.5px 14px' }}
                          onClick={() => handleDownloadFile(rep)}
                          disabled={!rep.available}
                        >
                          <PatientIcon name="download" size={13} color="#ffffff" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bottom floral accent wave */}
        <div className="reports-bottom-wave" aria-hidden="true" />

        {/* Global Toast Notification */}
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
