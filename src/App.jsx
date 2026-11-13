import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LandingPageRoute } from './LandingPageRoute.jsx';
import { LoginScreen } from './LoginScreen.jsx';
import { CreateAccountScreen } from './CreateAccountScreen.jsx';

// Patient Foundation Architecture
import { PatientProvider } from './patient/context/PatientContext.jsx';
import { PatientLayout } from './patient/layout/PatientLayout.jsx';

// Patient Screen Components
import { MedicalHistoryScreen } from './patient/pages/MedicalHistoryScreen.jsx';
import { PatientScreeningPage } from './patient/pages/PatientScreeningPage.jsx';
import { ScreeningResultsPage } from './patient/pages/ScreeningResultsPage.jsx';
import { AiAssistantScreen } from './patient/pages/AiAssistantScreen.jsx';
import { ConnectDoctorPage } from './patient/pages/ConnectDoctorPage.jsx';
import { PatientReportsPage } from './patient/pages/PatientReportsPage.jsx';
import { CareSuggestionsPage } from './patient/pages/CareSuggestionsPage.jsx';
import { PatientProfilePage } from './patient/pages/PatientProfilePage.jsx';
import { PatientSettingsPage } from './patient/pages/PatientSettingsPage.jsx';

// Clinician Dashboard Architecture & Pages (Preserved)
import { ClinicalProvider } from './dashboard/context/ClinicalContext.jsx';
import { DashboardLayout } from './dashboard/DashboardLayout.jsx';
import { CommandCenterPage } from './dashboard/pages/CommandCenterPage.jsx';
import { MothersCasesPage } from './dashboard/pages/MothersCasesPage.jsx';
import { LiveScreeningPage } from './dashboard/pages/LiveScreeningPage.jsx';
import { UploadAnalyzePage } from './dashboard/pages/UploadAnalyzePage.jsx';
import { ResultsPage } from './dashboard/pages/ResultsPage.jsx';
import { DiscordancePage } from './dashboard/pages/DiscordancePage.jsx';
import { InsightsCarePage } from './dashboard/pages/InsightsCarePage.jsx';
import { ClinicalReviewPage } from './dashboard/pages/ClinicalReviewPage.jsx';

export function App() {
  return (
    <ClinicalProvider>
      <PatientProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPageRoute />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/signin" element={<Navigate to="/login" replace />} />
            <Route path="/create-account" element={<CreateAccountScreen />} />
            <Route path="/register" element={<CreateAccountScreen />} />
            <Route path="/signup" element={<Navigate to="/create-account" replace />} />

            {/* =================================================================
                Patient Portal Routes (Nested in Shared PatientLayout)
                ================================================================= */}
            <Route element={<PatientLayout />}>
              {/* 1. Medical History */}
              <Route path="/patient/medical-history" element={<MedicalHistoryScreen />} />
              <Route path="/medical-history" element={<Navigate to="/patient/medical-history" replace />} />
              <Route path="/patient/history" element={<Navigate to="/patient/medical-history" replace />} />

              {/* 2. AI Screening */}
              <Route path="/patient/screening" element={<PatientScreeningPage />} />
              <Route path="/screening" element={<Navigate to="/patient/screening" replace />} />
              <Route path="/ai-screening" element={<Navigate to="/patient/screening" replace />} />
              <Route path="/patient-screening" element={<Navigate to="/patient/screening" replace />} />
              <Route path="/patient/ai-screening" element={<Navigate to="/patient/screening" replace />} />

              {/* Screening Results Sub-route */}
              <Route path="/patient/screening-results" element={<ScreeningResultsPage />} />
              <Route path="/screening-results" element={<Navigate to="/patient/screening-results" replace />} />
              <Route path="/screening/results" element={<Navigate to="/patient/screening-results" replace />} />
              <Route path="/patient/screening/results" element={<Navigate to="/patient/screening-results" replace />} />
              <Route path="/patient/results" element={<Navigate to="/patient/screening-results" replace />} />

              {/* 3. AI Assistant */}
              <Route path="/patient/ai-assistant" element={<AiAssistantScreen />} />
              <Route path="/patient/assistant" element={<Navigate to="/patient/ai-assistant" replace />} />
              <Route path="/ai-assistant" element={<Navigate to="/patient/ai-assistant" replace />} />
              <Route path="/patient/companion" element={<Navigate to="/patient/ai-assistant" replace />} />
              <Route path="/assistant" element={<Navigate to="/patient/ai-assistant" replace />} />
              <Route path="/voice-assistant" element={<Navigate to="/patient/ai-assistant" replace />} />

              {/* 4. Connect to a Doctor */}
              <Route path="/patient/connect-doctor" element={<ConnectDoctorPage />} />
              <Route path="/patient/connect" element={<Navigate to="/patient/connect-doctor" replace />} />
              <Route path="/connect-doctor" element={<Navigate to="/patient/connect-doctor" replace />} />

              {/* 5. My Reports */}
              <Route path="/patient/reports" element={<PatientReportsPage />} />
              <Route path="/patient/dashboard" element={<Navigate to="/patient/reports" replace />} />
              <Route path="/patient" element={<Navigate to="/patient/reports" replace />} />
              <Route path="/patient/home" element={<Navigate to="/patient/reports" replace />} />
              <Route path="/patient/my-reports" element={<Navigate to="/patient/reports" replace />} />
              <Route path="/reports" element={<Navigate to="/patient/reports" replace />} />
              <Route path="/my-reports" element={<Navigate to="/patient/reports" replace />} />

              {/* 6. Care Suggestions */}
              <Route path="/patient/care-suggestions" element={<CareSuggestionsPage />} />
              <Route path="/care-suggestions" element={<Navigate to="/patient/care-suggestions" replace />} />
              <Route path="/patient/suggestions" element={<Navigate to="/patient/care-suggestions" replace />} />

              {/* Profile & Settings */}
              <Route path="/patient/profile" element={<PatientProfilePage />} />
              <Route path="/patient/settings" element={<PatientSettingsPage />} />
            </Route>

            {/* =================================================================
                Clinician Dashboard Routes (Preserved Exactly)
                ================================================================= */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<CommandCenterPage />} />
              <Route path="/command-center" element={<Navigate to="/dashboard" replace />} />
              <Route path="/mothers" element={<MothersCasesPage />} />
              <Route path="/mothers/:motherId" element={<MothersCasesPage />} />
              <Route path="/live-screening" element={<LiveScreeningPage />} />
              <Route path="/upload-analyze" element={<UploadAnalyzePage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/results/:motherId" element={<ResultsPage />} />
              <Route path="/discordance" element={<DiscordancePage />} />
              <Route path="/discordance/:motherId" element={<DiscordancePage />} />
              <Route path="/clinical-review" element={<ClinicalReviewPage />} />
              <Route path="/clinical-review/:motherId" element={<ClinicalReviewPage />} />
              <Route path="/insights" element={<InsightsCarePage />} />
              <Route path="/insights/:motherId" element={<InsightsCarePage />} />
            </Route>

            {/* Wildcard Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </PatientProvider>
    </ClinicalProvider>
  );
}

export default App;
