import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './medicalHistory.css';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];
const STORAGE_KEY = 'miora_medical_history_v1';

export function MedicalHistoryScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const profileMenuRef = useRef(null);

  // 1. Diagnosis response state ('yes' | 'no' | 'not-sure')
  // Default to 'yes' as seen in the design screenshot
  const [selectedOption, setSelectedOption] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedOption) return parsed.selectedOption;
      }
    } catch {
      // ignore
    }
    return 'yes';
  });

  // 2. Uploaded documents state
  // Default to the reference screenshot's initial document
  const [uploadedFiles, setUploadedFiles] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.uploadedFiles) && parsed.uploadedFiles.length > 0) {
          return parsed.uploadedFiles;
        }
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'default-ppd-report',
        name: 'PPD_Diagnosis_Report.pdf',
        size: '1.2 MB',
        type: 'application/pdf',
      },
    ];
  });

  // 3. UI states
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format bytes to human readable size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Process incoming File objects from input or drop
  const handleFiles = (filesList) => {
    setValidationError('');
    const newFiles = [];
    const files = Array.from(filesList);

    for (const file of files) {
      const isAllowedType =
        ALLOWED_TYPES.includes(file.type.toLowerCase()) ||
        /\.(pdf|jpe?g|png)$/i.test(file.name);

      if (!isAllowedType) {
        setValidationError(`"${file.name}" is not a supported format. Please upload PDF, JPG, or PNG.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setValidationError(`"${file.name}" exceeds the 10 MB limit (${formatFileSize(file.size)}).`);
        return;
      }

      newFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      });
    }

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset input value so same file can be re-uploaded if removed
      e.target.value = '';
    }
  };

  const removeFile = (id) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSaveAndContinue = () => {
    // Persist to project localStorage
    try {
      const dataToSave = {
        selectedOption,
        uploadedFiles,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {
      console.warn('Could not save medical history to localStorage:', err);
    }

    // Continue to next patient screening flow
    navigate('/screening');
  };

  return (
    <div className="medhist-page-shell">
      {/* =========================================================================
          1. Left Sidebar
          ========================================================================= */}
      <aside className="medhist-sidebar" aria-label="Patient Navigation">
        {/* Brand Header */}
        <div className="medhist-brand-section">
          <NavLink to="/patient/dashboard" className="medhist-brand-logo" aria-label="Miora Home">
            <span className="medhist-brand-wordmark">Miora</span>
          </NavLink>
          <div className="medhist-brand-tagline">
            Maternal Emotional<br />Intelligence
          </div>
          <div className="medhist-brand-divider" aria-hidden="true" />
        </div>

        {/* Navigation items */}
        <nav className="medhist-nav-menu" aria-label="Main Menu">
          <ul className="medhist-nav-list">
            <li className="medhist-nav-item">
              <NavLink to="/patient/dashboard" className="medhist-nav-link">
                <span className="medhist-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
                    <path d="M9.5 21v-7h5v7" />
                  </svg>
                </span>
                <span>Home</span>
              </NavLink>
            </li>

            <li className="medhist-nav-item">
              <NavLink
                to="/medical-history"
                className="medhist-nav-link is-active"
                aria-current="page"
              >
                <span className="medhist-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </span>
                <span>Medical History</span>
              </NavLink>
            </li>

            <li className="medhist-nav-item">
              <NavLink to="/screening" className="medhist-nav-link">
                <span className="medhist-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2Z" />
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2Z" />
                  </svg>
                </span>
                <span>AI Screening</span>
              </NavLink>
            </li>

            <li className="medhist-nav-item">
              <NavLink to="/ai-assistant" className="medhist-nav-link">
                <span className="medhist-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    <circle cx="8" cy="12" r="0.8" fill="currentColor" />
                    <circle cx="12" cy="12" r="0.8" fill="currentColor" />
                    <circle cx="16" cy="12" r="0.8" fill="currentColor" />
                  </svg>
                </span>
                <span>Voice Assistant</span>
              </NavLink>
            </li>

            <li className="medhist-nav-item">
              <NavLink to="/patient/reports" className="medhist-nav-link">
                <span className="medhist-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <span>My Reports</span>
              </NavLink>
            </li>

            <li className="medhist-nav-item">
              <NavLink to="/patient/care-suggestions" className="medhist-nav-link">
                <span className="medhist-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </span>
                <span>Care Suggestions</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="medhist-sidebar-footer">
          <NavLink to="/patient/reports" className="medhist-nav-link">
            <span className="medhist-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span>Profile</span>
          </NavLink>

          <NavLink to="/patient/reports" className="medhist-nav-link">
            <span className="medhist-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>

      {/* =========================================================================
          2. Main Content Viewport
          ========================================================================= */}
      <main className="medhist-main-viewport">
        {/* Top Header */}
        <header className="medhist-top-header">
          <div className="medhist-header-left">
            {/* Breadcrumb: Home > Medical History */}
            <div className="medhist-breadcrumb">
              <NavLink to="/" className="medhist-breadcrumb-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
                  <path d="M9.5 21v-7h5v7" />
                </svg>
                <span>Home</span>
              </NavLink>
              <span className="medhist-breadcrumb-sep" aria-hidden="true">›</span>
              <span className="medhist-breadcrumb-current">Medical History</span>
            </div>

            <h1 className="medhist-title">Medical History</h1>
            <p className="medhist-subtitle">
              Help us understand your background for a more accurate and personalised screening.
            </p>
          </div>

          <div className="medhist-header-right">
            {/* Notification Bell */}
            <button
              type="button"
              className="medhist-bell-btn"
              aria-label="Notifications"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            {/* User Profile Pill */}
            <div className="medhist-profile-wrap" ref={profileMenuRef}>
              <button
                type="button"
                className="medhist-profile-btn"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                aria-expanded={profileDropdownOpen}
              >
                <span className="medhist-avatar-circle">S</span>
                <span className="medhist-profile-name">Sadiya</span>
                <svg className="medhist-chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileDropdownOpen && (
                <div className="screening-dropdown-menu" style={{ right: 0, top: 44, width: 200, zIndex: 100 }}>
                  <div className="screening-profile-menu-info" style={{ padding: '8px 12px' }}>
                    <strong style={{ display: 'block', fontSize: '13px' }}>Sadiya Rahman</strong>
                    <small style={{ color: '#777', fontSize: '11px' }}>sadiya@miora.health</small>
                  </div>
                  <hr className="screening-menu-divider" style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #f0e4ea' }} />
                  <NavLink to="/patient/dashboard" className="screening-menu-link" style={{ display: 'block', padding: '6px 12px', fontSize: '12px', color: '#444', textDecoration: 'none' }}>
                    Patient Dashboard
                  </NavLink>
                  <NavLink to="/dashboard" className="screening-menu-link" style={{ display: 'block', padding: '6px 12px', fontSize: '12px', color: '#444', textDecoration: 'none' }}>
                    Doctor Portal
                  </NavLink>
                  <NavLink to="/login" className="screening-menu-link" style={{ display: 'block', padding: '6px 12px', fontSize: '12px', color: '#c73566', textDecoration: 'none', fontWeight: '500' }}>
                    Sign Out
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* =========================================================================
            3. Card 1: Question & Options with Clipboard Illustration
            ========================================================================= */}
        <section className="medhist-card medhist-question-card" aria-labelledby="question-heading">
          <div className="medhist-question-left">
            <h2 id="question-heading" className="medhist-question-text">
              Have you ever been diagnosed with Postpartum Depression (PPD)<br />
              or received related treatment?
            </h2>

            <div className="medhist-options-row" role="radiogroup" aria-labelledby="question-heading">
              {/* Option Yes */}
              <button
                type="button"
                className={`medhist-option-btn ${selectedOption === 'yes' ? 'is-selected' : ''}`}
                onClick={() => setSelectedOption('yes')}
                role="radio"
                aria-checked={selectedOption === 'yes'}
              >
                <span className="medhist-radio-indicator">
                  {selectedOption === 'yes' && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2.5 6.2 4.8 8.6 9.5 3.6" />
                    </svg>
                  )}
                </span>
                <span>Yes</span>
              </button>

              {/* Option No */}
              <button
                type="button"
                className={`medhist-option-btn ${selectedOption === 'no' ? 'is-selected' : ''}`}
                onClick={() => setSelectedOption('no')}
                role="radio"
                aria-checked={selectedOption === 'no'}
              >
                <span className="medhist-radio-indicator">
                  {selectedOption === 'no' && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2.5 6.2 4.8 8.6 9.5 3.6" />
                    </svg>
                  )}
                </span>
                <span>No</span>
              </button>

              {/* Option Not Sure */}
              <button
                type="button"
                className={`medhist-option-btn ${selectedOption === 'not-sure' ? 'is-selected' : ''}`}
                onClick={() => setSelectedOption('not-sure')}
                role="radio"
                aria-checked={selectedOption === 'not-sure'}
              >
                <span className="medhist-radio-indicator">
                  {selectedOption === 'not-sure' && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2.5 6.2 4.8 8.6 9.5 3.6" />
                    </svg>
                  )}
                </span>
                <span>Not Sure</span>
              </button>
            </div>
          </div>

          {/* Right illustration: clipboard with heart and leaves */}
          <div className="medhist-question-illustration-wrap" aria-hidden="true">
            <img
              src="/assets/medical-history-clipboard.png"
              alt=""
              className="medhist-question-illustration"
            />
          </div>
        </section>

        {/* =========================================================================
            4. Card 2: Upload Relevant Records (Optional)
            ========================================================================= */}
        <section className="medhist-card medhist-upload-card" aria-labelledby="upload-card-heading">
          <h2 id="upload-card-heading" className="medhist-upload-title">
            Upload Relevant Records (Optional)
          </h2>
          <p className="medhist-upload-subtitle">
            You can upload previous diagnosis, prescriptions, or hospital records.
          </p>

          {/* Dashed Drag & Drop Area */}
          <div
            className={`medhist-dropzone ${isDragOver ? 'is-dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                fileInputRef.current?.click();
              }
            }}
            aria-label="Upload files by dragging or clicking"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              style={{ display: 'none' }}
              tabIndex={-1}
            />

            <div className="medhist-cloud-icon-wrap" aria-hidden="true">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 20V11" />
                <path d="m8 15 4-4 4 4" />
              </svg>
            </div>

            <p className="medhist-dropzone-prompt">
              Drag and drop files here, or{' '}
              <button
                type="button"
                className="medhist-click-upload-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                click to upload
              </button>
            </p>

            <span className="medhist-dropzone-hint">
              Supports PDF, JPG, PNG (up to 10 MB each)
            </span>
          </div>

          {/* Validation Notice if any */}
          {validationError && (
            <div className="medhist-validation-error" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{validationError}</span>
            </div>
          )}

          {/* Bottom row: Uploaded Files (Left) and Save & Continue (Right) */}
          <div className="medhist-card2-bottom-row">
            {/* Uploaded Files Box */}
            <div className="medhist-uploaded-section">
              <div className="medhist-uploaded-header">
                Uploaded Files ({uploadedFiles.length})
              </div>

              <div className="medhist-uploaded-list">
                {uploadedFiles.map((file) => {
                  const isPdf =
                    file.type === 'application/pdf' ||
                    file.name.toLowerCase().endsWith('.pdf');

                  return (
                    <div key={file.id} className="medhist-file-item">
                      <div className="medhist-file-info">
                        {isPdf ? (
                          <div className="medhist-pdf-badge" aria-label="PDF file">
                            PDF
                          </div>
                        ) : (
                          <div className="medhist-img-badge" aria-label="Image file">
                            IMG
                          </div>
                        )}
                        <div className="medhist-file-meta">
                          <span className="medhist-file-name">{file.name}</span>
                          <span className="medhist-file-size">{file.size}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="medhist-file-remove-btn"
                        onClick={() => removeFile(file.id)}
                        aria-label={`Remove file ${file.name}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save & Continue Button */}
            <button
              type="button"
              className="medhist-save-btn"
              onClick={handleSaveAndContinue}
            >
              <span>Save &amp; Continue</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
