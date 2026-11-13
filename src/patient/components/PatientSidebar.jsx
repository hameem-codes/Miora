import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PatientIcon } from './PatientIcons.jsx';
import '../styles/patientSidebar.css';

export const PATIENT_MAIN_NAV = [
  {
    id: 'medical-history',
    to: '/patient/medical-history',
    label: 'Medical History',
    icon: 'medical-history',
    matchPaths: ['/patient/medical-history', '/medical-history', '/patient/history'],
  },
  {
    id: 'screening',
    to: '/patient/screening',
    label: 'AI Screening',
    icon: 'live-ai-screening',
    matchPaths: [
      '/patient/screening',
      '/screening',
      '/ai-screening',
      '/patient/ai-screening',
      '/patient-screening',
      '/patient/screening-results',
      '/screening-results',
      '/patient/results',
    ],
  },
  {
    id: 'ai-assistant',
    to: '/patient/ai-assistant',
    label: 'AI Assistant',
    icon: 'ai-companion',
    matchPaths: ['/patient/ai-assistant', '/patient/assistant', '/ai-assistant', '/patient/companion', '/assistant', '/voice-assistant'],
  },
  {
    id: 'connect-doctor',
    to: '/patient/connect-doctor',
    label: 'Connect to a Doctor',
    icon: 'connect-doctor',
    matchPaths: ['/patient/connect-doctor', '/connect-doctor', '/patient/connect'],
  },
  {
    id: 'reports',
    to: '/patient/reports',
    label: 'My Reports',
    icon: 'my-reports-consultations',
    matchPaths: ['/patient/reports', '/reports', '/my-reports', '/patient/my-reports', '/patient/dashboard'],
  },
  {
    id: 'care-suggestions',
    to: '/patient/care-suggestions',
    label: 'Care Suggestions',
    icon: 'care-suggestions-recovery',
    matchPaths: ['/patient/care-suggestions', '/care-suggestions', '/patient/suggestions'],
  },
];

export const PATIENT_FOOTER_NAV = [
  {
    id: 'profile',
    to: '/patient/profile',
    label: 'Profile',
    icon: 'profile',
    matchPaths: ['/patient/profile'],
  },
  {
    id: 'settings',
    to: '/patient/settings',
    label: 'Settings',
    icon: 'settings',
    matchPaths: ['/patient/settings'],
  },
];

export function PatientSidebar({ activeTab = null, className = '' }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isItemActive = (item) => {
    if (activeTab) {
      return activeTab === item.id;
    }
    return item.matchPaths.some((p) => currentPath === p || (p !== '/' && currentPath.startsWith(p)));
  };

  return (
    <aside
      className={`miora-unified-sidebar ${className}`}
      aria-label="Miora Patient Navigation"
    >
      {/* Brand Header */}
      <div className="unified-sidebar-brand">
        <NavLink to="/patient/medical-history" className="unified-brand-link" aria-label="Miora Home">
          <span className="unified-brand-script">Miora</span>
        </NavLink>
        <span className="unified-brand-tagline">
          Maternal Emotional<br />Intelligence
        </span>
        <div className="unified-brand-divider" aria-hidden="true" />
      </div>

      {/* Main 6 Navigation Items (No Home item) */}
      <nav className="unified-sidebar-nav" aria-label="Patient Tabs">
        <ul className="unified-nav-list">
          {PATIENT_MAIN_NAV.map((item) => {
            const active = isItemActive(item);
            return (
              <li key={item.id} className="unified-nav-item">
                <NavLink
                  to={item.to}
                  className={`unified-nav-link ${active ? 'is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="unified-nav-icon">
                    <PatientIcon
                      name={item.icon}
                      size={17}
                      color={active ? '#c83264' : '#72515d'}
                    />
                  </span>
                  <span className="unified-nav-label">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Navigation (Profile and Settings separate at bottom) */}
      <div className="unified-sidebar-footer">
        <div className="unified-footer-divider" aria-hidden="true" />
        <ul className="unified-footer-list">
          {PATIENT_FOOTER_NAV.map((item) => {
            const active = isItemActive(item);
            return (
              <li key={item.id} className="unified-nav-item">
                <NavLink
                  to={item.to}
                  className={`unified-nav-link ${active ? 'is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="unified-nav-icon">
                    <PatientIcon
                      name={item.icon}
                      size={16}
                      color={active ? '#c83264' : '#72515d'}
                    />
                  </span>
                  <span className="unified-nav-label">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
export default PatientSidebar;
