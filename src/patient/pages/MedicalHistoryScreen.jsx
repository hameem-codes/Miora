import React, { useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import './medicalHistory.css';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];
const STORAGE_KEY = 'miora_medical_history_v1';

export function MedicalHistoryScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { medicalHistory, updateMedicalHistory } = usePatient();

  // Retrieve saved state from localStorage or persistent patient context if previously saved
  const initialData = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.selectedOption || (Array.isArray(parsed.uploadedFiles) && parsed.uploadedFiles.length > 0))) {
          return parsed;
        }
      }
    } catch {
      // ignore JSON errors
    }
    // If context was previously explicitly saved
    if (medicalHistory && medicalHistory.isSaved) {
      return medicalHistory;
    }
    return null;
  })();

  // 1. Diagnosis option state: 'yes' | 'no' | 'not-sure' | ''
  const [selectedOption, setSelectedOption] = useState(() => initialData?.selectedOption || '');

  // 2. Uploaded documents list
  const [uploadedFiles, setUploadedFiles] = useState(() => {
    if (initialData?.uploadedFiles && Array.isArray(initialData.uploadedFiles)) {
      return initialData.uploadedFiles;
    }
    return [];
  });

  // 3. UI interaction & validation states
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [optionError, setOptionError] = useState('');

  // Format bytes to human readable format (e.g. 1.2 MB)
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Validate and ingest files from input picker or drag-drop
  const handleFiles = (filesList) => {
    setUploadError('');
    if (!filesList || filesList.length === 0) return;

    const files = Array.from(filesList);
    const validBatch = [];

    for (const file of files) {
      const lowerName = file.name.toLowerCase();
      const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
      const hasAllowedType = file.type ? ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) : hasAllowedExt;

      if (!hasAllowedExt && !hasAllowedType) {
        setUploadError(`"${file.name}" is not a supported file format. Please upload PDF, JPG, or PNG.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setUploadError(`"${file.name}" exceeds the 10 MB limit (${formatFileSize(file.size)}).`);
        return;
      }

      validBatch.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || (lowerName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        uploadedAt: new Date().toISOString(),
        isLocalMemoryOnly: true,
      });
    }

    if (validBatch.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validBatch]);
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
      // Reset input value so the same file name can be selected again if removed
      e.target.value = '';
    }
  };

  const removeFile = (id) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    setUploadError('');
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setOptionError('');
  };

  const handleSaveAndContinue = () => {
    // 1. Validate that an option has been selected
    if (!selectedOption) {
      setOptionError('Please select an option before continuing.');
      return;
    }

    // 2. Prepare payload conforming to patient contracts
    const payload = {
      selectedOption,
      uploadedFiles: uploadedFiles.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        uploadedAt: f.uploadedAt || new Date().toISOString(),
        isLocalMemoryOnly: true,
      })),
      isSaved: true,
      savedAt: new Date().toISOString(),
    };

    // 3. Persist to existing patient context
    if (typeof updateMedicalHistory === 'function') {
      updateMedicalHistory(payload);
    }

    // 4. Also write to localStorage for resilient cross-session persistence
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('Could not save medical history to localStorage:', err);
    }

    // 5. Navigate to canonical AI Screening route
    navigate('/patient/screening');
  };

  return (
    <div className="medhist-page-shell">
      <div className="medhist-main-viewport">
        {/* =====================================================================
            Page Heading & Breadcrumb
            ===================================================================== */}
        <div className="medhist-top-header">
          {/* Breadcrumb / Home indicator */}
          <div className="medhist-breadcrumb">
            <span className="medhist-breadcrumb-link" aria-hidden="true">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
                <path d="M9.5 21v-7h5v7" />
              </svg>
            </span>
            <span className="medhist-breadcrumb-label">Medical History</span>
          </div>

          <h1 className="medhist-title">Medical History</h1>
          <p className="medhist-subtitle">
            Help us understand your background for a more accurate and personalised screening.
          </p>
        </div>

        {/* =====================================================================
            Card 1: Previous Diagnosis Card (with Medical Illustration)
            ===================================================================== */}
        <section className="medhist-card medhist-question-card" aria-labelledby="diagnosis-question-title">
          <div className="medhist-question-content">
            <h2 id="diagnosis-question-title" className="medhist-question-heading">
              Have you ever been diagnosed with Postpartum Depression (PPD)<br />
              or received related treatment?
            </h2>

            <div
              className="medhist-options-group"
              role="radiogroup"
              aria-labelledby="diagnosis-question-title"
            >
              {/* Option Yes */}
              <button
                type="button"
                className={`medhist-option-pill ${selectedOption === 'yes' ? 'is-selected' : ''}`}
                onClick={() => handleOptionSelect('yes')}
                role="radio"
                aria-checked={selectedOption === 'yes'}
                data-testid="option-yes"
              >
                <span className="medhist-radio-dot" aria-hidden="true">
                  {selectedOption === 'yes' && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="2.5 6.2 4.8 8.6 9.5 3.6" />
                    </svg>
                  )}
                </span>
                <span className="medhist-option-text">Yes</span>
              </button>

              {/* Option No */}
              <button
                type="button"
                className={`medhist-option-pill ${selectedOption === 'no' ? 'is-selected' : ''}`}
                onClick={() => handleOptionSelect('no')}
                role="radio"
                aria-checked={selectedOption === 'no'}
                data-testid="option-no"
              >
                <span className="medhist-radio-dot" aria-hidden="true">
                  {selectedOption === 'no' && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="2.5 6.2 4.8 8.6 9.5 3.6" />
                    </svg>
                  )}
                </span>
                <span className="medhist-option-text">No</span>
              </button>

              {/* Option Not Sure */}
              <button
                type="button"
                className={`medhist-option-pill ${selectedOption === 'not-sure' ? 'is-selected' : ''}`}
                onClick={() => handleOptionSelect('not-sure')}
                role="radio"
                aria-checked={selectedOption === 'not-sure'}
                data-testid="option-not-sure"
              >
                <span className="medhist-radio-dot" aria-hidden="true">
                  {selectedOption === 'not-sure' && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="2.5 6.2 4.8 8.6 9.5 3.6" />
                    </svg>
                  )}
                </span>
                <span className="medhist-option-text">Not Sure</span>
              </button>
            </div>

            {/* Validation error for selection */}
            {optionError && (
              <div className="medhist-error-feedback" role="alert" data-testid="option-error">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{optionError}</span>
              </div>
            )}
          </div>

          {/* Medical Illustration on the right */}
          <div className="medhist-illustration-container" aria-hidden="true">
            <img
              src="/assets/medical-history-clipboard.png"
              alt=""
              className="medhist-illustration-asset"
            />
          </div>
        </section>

        {/* =====================================================================
            Card 2: Medical Records Upload Card
            ===================================================================== */}
        <section className="medhist-card medhist-upload-card" aria-labelledby="upload-section-title">
          <h2 id="upload-section-title" className="medhist-upload-heading">
            Upload Relevant Records (Optional)
          </h2>
          <p className="medhist-upload-subtext">
            You can upload previous diagnosis, prescriptions, or hospital records.
          </p>

          {/* Dashed Upload Dropzone */}
          <div
            className={`medhist-dropzone-box ${isDragOver ? 'is-drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="Upload files by dragging and dropping here or clicking to browse"
            data-testid="dropzone-area"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              style={{ display: 'none' }}
              tabIndex={-1}
              data-testid="native-file-input"
            />

            <div className="medhist-cloud-icon" aria-hidden="true">
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 20V11" />
                <path d="m8 15 4-4 4 4" />
              </svg>
            </div>

            <p className="medhist-dropzone-main-text">
              Drag and drop files here, or{' '}
              <span className="medhist-upload-highlight">click to upload</span>
            </p>

            <span className="medhist-dropzone-sub-hint">
              Supports PDF, JPG, PNG (up to 10 MB each)
            </span>
          </div>

          {/* Upload error banner (format / size violation) */}
          {uploadError && (
            <div className="medhist-error-feedback" role="alert" data-testid="upload-error">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{uploadError}</span>
            </div>
          )}

          {/* Bottom Area: Uploaded Files (Left) & Save & Continue Button (Right) */}
          <div className="medhist-card-actions-row">
            {/* Populated State: Uploaded files list */}
            {uploadedFiles.length > 0 ? (
              <div className="medhist-files-panel" data-testid="uploaded-files-panel">
                <div className="medhist-files-panel-title">
                  Uploaded Files ({uploadedFiles.length})
                </div>

                <div className="medhist-files-list">
                  {uploadedFiles.map((file) => {
                    const isPdf =
                      file.type === 'application/pdf' ||
                      (file.name && file.name.toLowerCase().endsWith('.pdf'));

                    return (
                      <div key={file.id} className="medhist-file-card" data-testid={`file-item-${file.id}`}>
                        <div className="medhist-file-card-lead">
                          <div
                            className={`medhist-doc-badge ${isPdf ? 'is-pdf' : 'is-img'}`}
                            aria-label={isPdf ? 'PDF document' : 'Image document'}
                          >
                            {isPdf ? 'PDF' : 'IMG'}
                          </div>
                          <div className="medhist-doc-details">
                            <span className="medhist-doc-name" title={file.name}>
                              {file.name}
                            </span>
                            <span className="medhist-doc-size">{file.size}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="medhist-trash-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.id);
                          }}
                          aria-label={`Remove file ${file.name}`}
                          data-testid={`remove-file-${file.id}`}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
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
            ) : (
              // Empty state spacer so Save & Continue stays on the right
              <div className="medhist-files-panel-empty" aria-hidden="true" />
            )}

            {/* Save & Continue Button */}
            <button
              type="button"
              className="medhist-submit-btn"
              onClick={handleSaveAndContinue}
              data-testid="save-and-continue-btn"
            >
              <span>Save &amp; Continue</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default MedicalHistoryScreen;