import React from 'react';
import { Outlet } from 'react-router-dom';
import { PatientSidebar } from '../components/PatientSidebar.jsx';
import { PatientHeader } from '../components/PatientHeader.jsx';
import '../styles/patientLayout.css';

export function PatientLayout() {
  return (
    <div className="miora-patient-layout">
      {/* 1. Unified 172px Left Sidebar (Single source of truth) */}
      <PatientSidebar />

      {/* 2. Main Right Column: Header + Child Screen Content */}
      <div className="miora-patient-main">
        <PatientHeader />
        <main className="miora-patient-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PatientLayout;
