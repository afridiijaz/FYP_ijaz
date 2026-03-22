import React, { useState, useEffect } from "react";
import {
  Plus, Trash2, Printer, Send, FileText, ChevronDown,
  Pill, Clock, CalendarDays, Stethoscope, User, AlertCircle,
  CheckCircle, Loader, ClipboardList, NotepadText
} from "lucide-react";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";
import { getCompletedPatients, createPrescription, getDoctorPrescriptions } from "../../services/doctorAction";
import "./PrescriptionGeneration.css";

const PrescriptionGeneration = () => {
  const { user } = useUser();

  // Patient dropdown
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(true);

  // Prescription form
  const [diagnosis, setDiagnosis] = useState("");
  const [medications, setMedications] = useState([
    { id: 1, name: "", dosage: "", frequency: "", duration: "" },
  ]);
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Previous prescriptions
  const [pastPrescriptions, setPastPrescriptions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load completed patients
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await getCompletedPatients();
        if (data.patients) setPatients(data.patients);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load patients");
      } finally {
        setLoadingPatients(false);
      }
    };
    loadPatients();
  }, []);

  // Load prescription history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getDoctorPrescriptions();
        if (data.prescriptions) setPastPrescriptions(data.prescriptions);
      } catch (_) {}
    };
    loadHistory();
  }, []);

  const filteredPatients = patients.filter((p) =>
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addMedication = () => {
    setMedications([
      ...medications,
      { id: Date.now(), name: "", dosage: "", frequency: "", duration: "" },
    ]);
  };

  const removeMedication = (id) => {
    if (medications.length > 1) {
      setMedications(medications.filter((m) => m.id !== id));
    }
  };

  const handleChange = (id, field, value) => {
    setMedications(medications.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const resetForm = () => {
    setMedications([{ id: 1, name: "", dosage: "", frequency: "", duration: "" }]);
    setInstructions("");
    setDiagnosis("");
    setSelectedPatient(null);
    setSearchQuery("");
  };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient");
      return;
    }

    const validMeds = medications.filter((m) => m.name.trim());
    if (validMeds.length === 0) {
      toast.error("Please add at least one medication");
      return;
    }

    // Check all fields filled
    for (const med of validMeds) {
      if (!med.dosage.trim() || !med.frequency.trim() || !med.duration.trim()) {
        toast.error(`Please fill all fields for "${med.name}"`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        patient: selectedPatient._id,
        appointment: selectedPatient.lastAppointmentId,
        medications: validMeds.map(({ name, dosage, frequency, duration }) => ({
          name, dosage, frequency, duration,
        })),
        instructions,
        diagnosis,
      };

      await createPrescription(payload);
      toast.success("Prescription sent to patient successfully!");

      // Refresh history
      const data = await getDoctorPrescriptions();
      if (data.prescriptions) setPastPrescriptions(data.prescriptions);

      resetForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const doctorName = user?.fullName || "Doctor";
  const doctorSpecialty = user?.specialty || "General Physician";

  return (
    <div className="prescription-page-wrapper">
      {/* ── TOP HEADER ── */}
      <div className="prescription-header-bar">
        <div className="prescription-header-left">
          <div className="prescription-header-icon-circle">
            <FileText size={24} color="#fff" />
          </div>
          <div>
            <h1 className="prescription-page-title">Prescription Generator</h1>
            <p className="prescription-page-subtitle">Create and send prescriptions to your patients</p>
          </div>
        </div>
        <button
          className="prescription-history-toggle"
          onClick={() => setShowHistory(!showHistory)}
        >
          <ClipboardList size={18} />
          {showHistory ? "Write Prescription" : `History (${pastPrescriptions.length})`}
        </button>
      </div>

      {/* ── PRESCRIPTION HISTORY VIEW ── */}
      {showHistory ? (
        <div className="prescription-history-section">
          {pastPrescriptions.length === 0 ? (
            <div className="prescription-empty-history">
              <NotepadText size={48} color="#d1d5db" />
              <p>No prescriptions yet</p>
            </div>
          ) : (
            pastPrescriptions.map((rx) => (
              <div key={rx._id} className="prescription-history-card">
                <div className="prescription-history-card-header">
                  <div className="prescription-history-patient-info">
                    <div className="prescription-history-avatar">
                      {rx.patient?.fullName?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div>
                      <span className="prescription-history-patient-name">{rx.patient?.fullName}</span>
                      <span className="prescription-history-date">
                        {new Date(rx.createdAt).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="prescription-history-badge" style={{
                    backgroundColor: rx.status === "sent" ? "#ecfdf5" : rx.status === "viewed" ? "#eff6ff" : "#f9fafb",
                    color: rx.status === "sent" ? "#10b981" : rx.status === "viewed" ? "#3b82f6" : "#6b7280",
                  }}>
                    {rx.status === "sent" ? <Send size={12} /> : <CheckCircle size={12} />}
                    {rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}
                  </span>
                </div>
                {rx.diagnosis && (
                  <p className="prescription-history-diagnosis"><strong>Diagnosis:</strong> {rx.diagnosis}</p>
                )}
                <div className="prescription-history-meds-list">
                  {rx.medications.map((m, i) => (
                    <span key={i} className="prescription-history-med-pill">
                      <Pill size={12} /> {m.name} — {m.dosage}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── PRESCRIPTION FORM ── */
        <div className="prescription-card">
          {/* ─ Letterhead ─ */}
          <div className="prescription-letterhead">
            <div>
              <h2 className="prescription-dr-name">Dr. {doctorName}</h2>
              <p className="prescription-dr-sub">{doctorSpecialty}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="prescription-dr-sub">
                <CalendarDays size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short", year: "numeric", month: "short", day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* ─ Patient selector ─ */}
          <div className="prescription-section">
            <label className="prescription-label">
              <User size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Select Patient
            </label>
            <div className="prescription-dropdown-wrapper">
              <div
                className="prescription-dropdown-trigger"
                style={{
                  borderColor: dropdownOpen ? "#16a34a" : "#d1d5db",
                  boxShadow: dropdownOpen ? "0 0 0 3px rgba(22,163,74,0.1)" : "none",
                }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {selectedPatient ? (
                  <div className="prescription-selected-patient-display">
                    <div className="prescription-patient-avatar-small">
                      {selectedPatient.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: "#1f2937", fontSize: 14 }}>
                        {selectedPatient.fullName}
                      </span>
                      <br />
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>
                        {selectedPatient.gender}{selectedPatient.age ? ` · ${selectedPatient.age} yrs` : ""}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span style={{ color: "#9ca3af" }}>Choose a patient...</span>
                )}
                <ChevronDown size={16} style={{ marginLeft: "auto", color: "#6b7280" }} />
              </div>
              {dropdownOpen && (
                <div className="prescription-dropdown-list">
                  <input
                    type="text"
                    placeholder="Search patient by name..."
                    className="prescription-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {loadingPatients ? (
                      <div className="prescription-empty-dropdown">
                        <Loader size={20} color="#16a34a" style={{ animation: "spin 1s linear infinite" }} />
                        <span>Loading...</span>
                      </div>
                    ) : filteredPatients.length === 0 ? (
                      <div className="prescription-empty-dropdown">
                        <AlertCircle size={18} color="#9ca3af" />
                        <span>No patients found</span>
                      </div>
                    ) : (
                      filteredPatients.map((p) => (
                        <div
                          key={p._id}
                          className="prescription-dropdown-item"
                          style={{
                            backgroundColor: selectedPatient?._id === p._id ? "#f0fdf4" : "transparent",
                          }}
                          onClick={() => {
                            setSelectedPatient(p);
                            setDropdownOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          <div className="prescription-patient-avatar">
                            {p.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: "#1f2937" }}>
                              {p.fullName}
                            </div>
                            <div style={{ fontSize: 12, color: "#9ca3af" }}>
                              {p.gender}{p.age ? ` · ${p.age} yrs` : ""}{p.city ? ` · ${p.city}` : ""}
                              {p.lastAppointmentDate ? ` · Last visit: ${p.lastAppointmentDate}` : ""}
                            </div>
                          </div>
                          {selectedPatient?._id === p._id && (
                            <CheckCircle size={16} color="#16a34a" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─ Diagnosis ─ */}
          <div className="prescription-section">
            <label className="prescription-label">
              <Stethoscope size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Diagnosis
            </label>
            <input
              type="text"
              placeholder="e.g. Upper Respiratory Tract Infection"
              className="prescription-diagnosis-input"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>

          {/* ─ Rx Symbol ─ */}
          <div className="prescription-rx-symbol">℞</div>

          {/* ─ Medication Table ─ */}
          <div className="prescription-table-wrapper">
            <div className="prescription-table-header">
              <span style={{ flex: 3 }}>
                <Pill size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Medicine Name
              </span>
              <span style={{ flex: 1.5 }}>Dosage</span>
              <span style={{ flex: 1.5 }}>Frequency</span>
              <span style={{ flex: 1.5 }}>Duration</span>
              <span style={{ width: "44px" }}></span>
            </div>

            {medications.map((med, idx) => (
              <div key={med.id} className="prescription-med-row">
                <div className="prescription-med-index">{idx + 1}</div>
                <div className="prescription-input-group">
                  <label className="prescription-input-label">Medicine Name</label>
                  <input
                    placeholder="e.g. Paracetamol"
                    className="prescription-input"
                    value={med.name}
                    onChange={(e) => handleChange(med.id, "name", e.target.value)}
                  />
                </div>
                <div className="prescription-input-group">
                  <label className="prescription-input-label">Dosage</label>
                  <input
                    placeholder="500mg"
                    className="prescription-input"
                    value={med.dosage}
                    onChange={(e) => handleChange(med.id, "dosage", e.target.value)}
                  />
                </div>
                <div className="prescription-input-group">
                  <label className="prescription-input-label">Frequency</label>
                  <input
                    placeholder="1-0-1"
                    className="prescription-input"
                    value={med.frequency}
                    onChange={(e) => handleChange(med.id, "frequency", e.target.value)}
                  />
                </div>
                <div className="prescription-input-group">
                  <label className="prescription-input-label">Duration</label>
                  <input
                    placeholder="5 Days"
                    className="prescription-input"
                    value={med.duration}
                    onChange={(e) => handleChange(med.id, "duration", e.target.value)}
                  />
                </div>
                <button
                  onClick={() => removeMedication(med.id)}
                  className="prescription-delete-btn"
                  title="Remove"
                  disabled={medications.length === 1}
                  style={{ opacity: medications.length === 1 ? 0.3 : 1 }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>

          <button onClick={addMedication} className="prescription-add-btn">
            <Plus size={16} /> Add Medicine
          </button>

          {/* ─ Additional Advice ─ */}
          <div className="prescription-section">
            <label className="prescription-label">
              <NotepadText size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Additional Advice / Instructions
            </label>
            <textarea
              className="prescription-text-area"
              placeholder="e.g. Drink plenty of fluids, avoid cold food, review in 7 days..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* ─ Footer Actions ─ */}
          <div className="prescription-footer-actions">
            <button className="prescription-secondary-btn" onClick={resetForm}>
              Clear All
            </button>
            <button
              className="prescription-primary-btn"
              disabled={submitting}
              style={{
                opacity: submitting ? 0.7 : 1,
              }}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <Loader size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} /> Send to Patient
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionGeneration;