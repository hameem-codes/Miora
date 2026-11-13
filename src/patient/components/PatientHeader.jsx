import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext.jsx';
import { PatientIcon } from './PatientIcons.jsx';
import { signOutUser } from '../../auth/authService.js';

const ROUTE_LABELS = {
  '/patient/medical-history': 'Medical History',
  '/medical-history': 'Medical History',
  '/patient/screening': 'AI Screening',
  '/screening': 'AI Screening',
  '/ai-screening': 'AI Screening',
  '/patient/screening-results': 'Screening Results',
  '/screening-results': 'Screening Results',
  '/patient/ai-assistant': 'AI Assistant',
  '/ai-assistant': 'AI Assistant',
  '/patient/connect-doctor': 'Connect to a Doctor',
  '/patient/reports': 'My Reports',
  '/patient/dashboard': 'My Reports',
  '/reports': 'My Reports',
  '/my-reports': 'My Reports',
  '/patient/care-suggestions': 'Care Suggestions',
  '/care-suggestions': 'Care Suggestions',
  '/patient/profile': 'Patient Profile',
  '/patient/settings': 'Settings',
};

export function PatientHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    patient,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = usePatient();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

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

  const unreadNotifs = (notifications || []).filter((n) => !n.read);

  // Derive current screen title from pathname
  const currentTitle = ROUTE_LABELS[location.pathname] || 'Patient Portal';

  const handleSignOut = () => {
    signOutUser();
    navigate('/login');
  };

  return (
    <header className="miora-patient-header" aria-label="Patient Portal Top Bar">
      {/* Left: Active context */}
      <div className="patient-header-left">
        <span className="patient-header-current-badge">
          <span>{currentTitle}</span>
        </span>
        <span className="patient-header-tagline">
          Confidential Maternal Emotional Care
        </span>
      </div>

      {/* Right: Notifications & Profile Menu */}
      <div className="patient-header-right">
        {/* Notifications */}
        <div className="patient-header-notif-wrap" ref={notifRef}>
          <button
            type="button"
            className="patient-header-icon-btn"
            onClick={() => {
              setNotifDropdownOpen((prev) => !prev);
              setProfileDropdownOpen(false);
            }}
            aria-label={`Notifications (${unreadNotifs.length} unread)`}
            aria-expanded={notifDropdownOpen}
          >
            <PatientIcon name="bell" size={15} color="#3b252e" />
            {unreadNotifs.length > 0 && <span className="patient-notif-unread-dot" />}
          </button>

          {notifDropdownOpen && (
            <div className="patient-header-dropdown" role="dialog" aria-label="Notifications list">
              <div className="patient-dropdown-head">
                <span>Notifications ({unreadNotifs.length})</span>
                {unreadNotifs.length > 0 && (
                  <button
                    type="button"
                    className="patient-dropdown-link-btn"
                    onClick={markAllNotificationsRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="patient-notif-list">
                {(notifications || []).length === 0 ? (
                  <div className="patient-notif-empty">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`patient-notif-item ${n.read ? 'is-read' : 'is-unread'}`}
                      onClick={() => markNotificationRead(n.id)}
                    >
                      <strong className="patient-notif-item-title">{n.title}</strong>
                      <span className="patient-notif-item-msg">{n.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill */}
        <div className="patient-header-profile-wrap" ref={profileRef}>
          <button
            type="button"
            className="patient-header-profile-btn"
            onClick={() => {
              setProfileDropdownOpen((prev) => !prev);
              setNotifDropdownOpen(false);
            }}
            aria-expanded={profileDropdownOpen}
            aria-label="Patient profile menu"
          >
            <span className="patient-header-avatar">
              {patient?.avatarInitials || patient?.name?.[0] || 'P'}
            </span>
            <span className="patient-header-name">{patient?.name || 'Patient'}</span>
            <PatientIcon name="chevron-down" size={11} color="#72515d" />
          </button>

          {profileDropdownOpen && (
            <div className="patient-header-dropdown" role="menu" aria-label="User menu">
              <div className="patient-profile-menu-meta">
                <span className="patient-profile-meta-name">
                  {patient?.fullName || 'Patient User'}
                </span>
                <span className="patient-profile-meta-email">
                  {patient?.email || ''}
                </span>
              </div>
              <NavLink
                to="/patient/profile"
                className="patient-profile-menu-link"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <PatientIcon name="profile" size={14} color="#72515d" />
                <span>Patient Profile</span>
              </NavLink>
              <NavLink
                to="/patient/settings"
                className="patient-profile-menu-link"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <PatientIcon name="settings" size={14} color="#72515d" />
                <span>Account Settings</span>
              </NavLink>
              <NavLink
                to="/dashboard"
                className="patient-profile-menu-link"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <PatientIcon name="stethoscope" size={14} color="#72515d" />
                <span>Doctor Portal</span>
              </NavLink>
              <button
                type="button"
                className="patient-profile-menu-link is-danger"
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                onClick={handleSignOut}
              >
                <PatientIcon name="arrow-right" size={14} color="#c83264" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
export default PatientHeader;
