import React, { useState } from 'react';
import { usePatient } from '../context/PatientContext.jsx';
import { PatientIcon } from '../components/PatientIcons.jsx';

export function ConnectDoctorPage() {
  const { consultations, bookConsultation } = usePatient();
  const [isBooking, setIsBooking] = useState(false);
  const [selectedType, setSelectedType] = useState('Telehealth Video');
  const [selectedDate, setSelectedDate] = useState('25 Nov 2026');
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [bookedNotice, setBookedNotice] = useState(false);

  const handleBook = (e) => {
    e.preventDefault();
    bookConsultation({
      date: selectedDate,
      time: selectedTime,
      type: selectedType,
      doctorName: 'Dr. Elena Rostova',
      role: 'Perinatal Psychiatry Lead',
      clinic: 'Miora Maternal Care Unit',
    });
    setIsBooking(false);
    setBookedNotice(true);
    setTimeout(() => setBookedNotice(false), 3500);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 880 }}>
      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, margin: '0 0 6px 0', color: 'var(--patient-text-primary)' }}>
          Connect to a Doctor
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--patient-text-muted)' }}>
          Direct consultations with perinatal mental health specialists.
        </p>
      </div>

      {/* Clinical Disclaimer Banner */}
      <div style={{ background: '#fff9e6', border: '1px solid #f2dfa2', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#7a5a10', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 14 }}>ℹ</span>
        <div>
          <strong>Telehealth Simulation Notice:</strong> Doctor profiles and scheduled appointments on this screen are demonstration fixtures. If you are experiencing acute distress or a medical emergency, please contact your local maternal crisis hotline or emergency services immediately.
        </div>
      </div>

      {bookedNotice && (
        <div style={{ background: 'var(--patient-success-bg)', color: 'var(--patient-success)', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          ✓ New consultation scheduled. A confirmation notice was added to your alerts.
        </div>
      )}

      {/* Doctor Info Card */}
      <div style={{ background: '#ffffff', border: '1px solid var(--patient-border)', borderRadius: 12, padding: 22, marginBottom: 24, boxShadow: 'var(--patient-shadow-card)', display: 'flex', gap: 18, alignItems: 'center' }}>
        <div style={{ width: 62, height: 62, borderRadius: 12, background: 'var(--patient-primary-subtle)', border: '1px solid var(--patient-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PatientIcon name="stethoscope" size={28} color="var(--patient-primary)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h2 style={{ fontSize: 17, margin: 0, color: 'var(--patient-text-primary)' }}>Dr. Elena Rostova</h2>
            <span style={{ background: 'var(--patient-primary-subtle)', color: 'var(--patient-primary)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>Demo Care Lead</span>
          </div>
          <p style={{ margin: '0 0 4px 0', fontSize: 12.5, color: 'var(--patient-text-muted)' }}>
            Perinatal Psychiatry Lead · Miora Maternal Care Unit
          </p>
          <span style={{ fontSize: 11.5, color: 'var(--patient-text-subtle)' }}>
            Available for confidential 30-min reviews of AI screening assessments and personalized care plans.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsBooking((prev) => !prev)}
          style={{
            background: 'var(--patient-primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            padding: '9px 16px',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <PatientIcon name="calendar" size={14} color="#ffffff" />
          <span>{isBooking ? 'Cancel' : 'Schedule Consult'}</span>
        </button>
      </div>

      {/* Booking Form (Conditional) */}
      {isBooking && (
        <form onSubmit={handleBook} style={{ background: '#ffffff', border: '1px solid var(--patient-primary)', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: 'var(--patient-shadow-dropdown)' }}>
          <h3 style={{ fontSize: 15, margin: '0 0 14px 0', color: 'var(--patient-text-primary)' }}>Select Appointment Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 4, color: 'var(--patient-text-muted)' }}>Consultation Mode</label>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--patient-border)', borderRadius: 6, fontSize: 12.5 }}>
                <option value="Telehealth Video">Telehealth Video</option>
                <option value="Audio Consult">Audio Consult</option>
                <option value="In-Person Clinic">In-Person Clinic</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 4, color: 'var(--patient-text-muted)' }}>Preferred Date</label>
              <input type="text" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--patient-border)', borderRadius: 6, fontSize: 12.5 }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 4, color: 'var(--patient-text-muted)' }}>Preferred Time</label>
              <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--patient-border)', borderRadius: 6, fontSize: 12.5 }}>
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:30 PM">03:30 PM</option>
              </select>
            </div>
          </div>
          <button type="submit" style={{ background: 'var(--patient-primary)', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            Confirm Booking
          </button>
        </form>
      )}

      {/* Consultations List */}
      <h3 style={{ fontSize: 16, margin: '0 0 12px 0', color: 'var(--patient-text-primary)' }}>
        Your Consultations &amp; Clinical Care Notes
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(consultations || []).map((c) => (
          <div key={c.id} style={{ background: '#ffffff', border: '1px solid var(--patient-border)', borderRadius: 10, padding: 16, boxShadow: 'var(--patient-shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <strong style={{ fontSize: 14, color: 'var(--patient-text-primary)' }}>{c.doctorName}</strong>
                <span style={{ fontSize: 12, color: 'var(--patient-text-muted)', marginLeft: 8 }}>· {c.type}</span>
                {c.isDemoFixture && (
                  <span style={{ fontSize: 10, color: '#888', background: '#f5f5f5', padding: '1px 6px', borderRadius: 6, marginLeft: 8 }}>Demo Record</span>
                )}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 12, background: c.status === 'Scheduled' ? 'var(--patient-success-bg)' : 'var(--patient-primary-subtle)', color: c.status === 'Scheduled' ? 'var(--patient-success)' : 'var(--patient-primary)' }}>
                {c.status}
              </span>
            </div>
            <p style={{ margin: '0 0 6px 0', fontSize: 12, color: 'var(--patient-text-muted)' }}>
              {c.clinic} · {c.date} at {c.time}
            </p>
            {c.summary && (
              <div style={{ background: 'var(--patient-primary-subtle)', padding: '8px 12px', borderRadius: 6, fontSize: 12, color: 'var(--patient-text-body)' }}>
                <strong>Care Summary:</strong> {c.summary}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
export default ConnectDoctorPage;
