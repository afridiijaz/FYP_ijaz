import React, { useState, useEffect } from "react";
import {
  Search, Clock, FileText, Calendar, ChevronRight,
  Download, User, Activity, Pill, Stethoscope, ClipboardList,
  Phone, Mail, MapPin, Heart, AlertCircle, Loader2
} from "lucide-react";
import { getCompletedPatients, getPatientHistory } from "../../services/doctorAction";
import jsPDF from "jspdf";
import "./PatientHistory.css";

const PatientHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");

  // Fetch completed patients on mount
  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoadingPatients(true);
        const data = await getCompletedPatients();
        setPatients(data.patients || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingPatients(false);
      }
    }
    fetchPatients();
  }, []);

  // Fetch patient history when a patient is selected
  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setHistory(null);
    try {
      setLoadingHistory(true);
      const data = await getPatientHistory(patient._id);
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  // Format time to 12-hour AM/PM format
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    try {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const period = hours >= 12 ? "pm" : "am";
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch {
      return timeStr;
    }
  };

  // Format duration helper
  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Status badge colors
  const getStatusColor = (status) => {
    const map = {
      completed: { bg: "#dcfce7", color: "#15803d" },
      approved: { bg: "#dbeafe", color: "#1d4ed8" },
      pending: { bg: "#fef3c7", color: "#b45309" },
      cancelled: { bg: "#fee2e2", color: "#dc2626" },
      active: { bg: "#dbeafe", color: "#1d4ed8" },
      missed: { bg: "#fee2e2", color: "#dc2626" },
      sent: { bg: "#dcfce7", color: "#15803d" },
      viewed: { bg: "#dbeafe", color: "#1d4ed8" },
      draft: { bg: "#f3f4f6", color: "#6b7280" },
    };
    return map[status] || { bg: "#f3f4f6", color: "#6b7280" };
  };

  // Timeline icon + color by type
  const getTimelineIcon = (type) => {
    switch (type) {
      case "appointment": return { icon: <Calendar size={16} />, color: "#2563eb", bg: "#dbeafe", label: "Appointment" };
      case "consultation": return { icon: <Stethoscope size={16} />, color: "#7c3aed", bg: "#ede9fe", label: "Consultation" };
      case "prescription": return { icon: <Pill size={16} />, color: "#059669", bg: "#d1fae5", label: "Prescription" };
      default: return { icon: <Activity size={16} />, color: "#6b7280", bg: "#f3f4f6", label: "Event" };
    }
  };

  // PDF Export
  const handleExportPDF = () => {
    if (!history || !selectedPatient) return;

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;

    // Header strip
    doc.setFillColor(22, 163, 106);
    doc.rect(0, 0, pageW, 38, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Medical History", pageW / 2, 16, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageW / 2, 26, { align: "center" });

    // Patient info box - Enhanced
    y = 48;
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, y, pageW - 28, 52, 3, 3, "FD");
    
    // Patient name
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(history.patient.fullName, 20, y + 10);
    
    // Patient details in table format
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    
    const detailsLeft = [
      `Age: ${history.patient.age || "N/A"}`,
      `Gender: ${history.patient.gender || "N/A"}`,
    ];
    const detailsRight = [
      `Phone: ${history.patient.phone || "N/A"}`,
      `Email: ${history.patient.email || "N/A"}`,
    ];
    
    detailsLeft.forEach((detail, idx) => {
      doc.text(detail, 20, y + 20 + (idx * 5));
    });
    detailsRight.forEach((detail, idx) => {
      doc.text(detail, pageW / 2, y + 20 + (idx * 5));
    });
    
    // City and last visit
    doc.text(`City: ${history.patient.city || "N/A"}`, 20, y + 30);
    doc.text(`Last Visit: ${formatDate(history.patient.lastAppointmentDate) || "N/A"}`, pageW / 2, y + 30);

    // Summary
    const s = history.summary;
    doc.setFontSize(9);
    doc.setTextColor(22, 163, 106);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total Appointments: ${s.totalAppointments}  |  Completed: ${s.completedAppointments}  |  Consultations: ${s.totalConsultations}  |  Prescriptions: ${s.totalPrescriptions}`,
      20, y + 40
    );

    y += 58;

    // Timeline
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Medical Timeline", 14, y);
    y += 8;

    for (const item of history.timeline) {
      if (y > 270) { doc.addPage(); y = 20; }

      const meta = getTimelineIcon(item.type);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 106);
      doc.text(`${formatDate(item.date)}  —  ${meta.label}`, 20, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(9);

      if (item.type === "appointment") {
        const d = item.data;
        
        // Appointment header with background
        doc.setFillColor(225, 243, 254);
        doc.rect(20, y, pageW - 40, 6, "F");
        doc.setTextColor(37, 99, 235);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("APPOINTMENT", 22, y + 4);
        y += 10;
        
        // Details
        doc.setFont("helvetica", "bold");
        doc.setTextColor(37, 99, 235);
        doc.setFontSize(9);
        doc.text(`Type: ${d.appointmentType || "N/A"}`, 24, y); y += 5;
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(55, 65, 81);
        doc.setFontSize(9);
        doc.text(`Time: ${formatTime(d.time) || "N/A"}`, 24, y); y += 4;
        doc.text(`Status: ${d.status}`, 24, y); y += 4;
        
        if (d.fee) { 
          doc.setFont("helvetica", "bold");
          doc.setTextColor(22, 163, 106);
          doc.text(`Fee: Rs. ${d.fee}`, 24, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(55, 65, 81);
          y += 5;
        }
        
        if (d.reason) { 
          doc.setFont("helvetica", "bold");
          doc.text(`Reason:`, 24, y);
          doc.setFont("helvetica", "normal");
          doc.text(d.reason, 45, y);
          y += 5;
        }
        
        if (d.doctorRemarks) { 
          doc.setFont("helvetica", "bold");
          doc.text(`Remarks:`, 24, y);
          doc.setFont("helvetica", "normal");
          doc.text(d.doctorRemarks, 50, y);
          y += 5;
        }
        y += 4;
      } else if (item.type === "consultation") {
        const d = item.data;
        
        // Consultation header with background
        doc.setFillColor(243, 232, 255);
        doc.rect(20, y, pageW - 40, 6, "F");
        doc.setTextColor(124, 58, 237);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("CONSULTATION", 22, y + 4);
        y += 10;
        
        // Details
        doc.setFont("helvetica", "bold");
        doc.setTextColor(124, 58, 237);
        doc.setFontSize(9);
        doc.text(`Type: ${d.appointmentType || "Online"}`, 24, y); y += 5;
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(55, 65, 81);
        doc.setFontSize(9);
        doc.text(`Status: ${d.status}`, 24, y); y += 4;
        doc.text(`Duration: ${formatDuration(d.duration)}`, 24, y); y += 5;
        
        if (d.notes) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(17, 24, 39);
          doc.text("Notes:", 24, y); y += 4;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(55, 65, 81);
          const lines = doc.splitTextToSize(d.notes, pageW - 50);
          doc.text(lines, 28, y); y += lines.length * 3.5;
        }
        y += 4;
      } else if (item.type === "prescription") {
        const d = item.data;
        
        // Prescription header
        doc.setFillColor(22, 163, 106);
        doc.rect(20, y, pageW - 40, 6, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("PRESCRIPTION", 22, y + 4);
        y += 10;
        
        // Diagnosis
        if (d.diagnosis) {
          doc.setTextColor(17, 24, 39);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text("Diagnosis:", 22, y);
          y += 5;
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(55, 65, 81);
          doc.setFontSize(9);
          const diagLines = doc.splitTextToSize(d.diagnosis, pageW - 50);
          doc.text(diagLines, 24, y);
          y += (diagLines.length * 4) + 6;
        }
        
        // Medications table
        if (d.medications?.length) {
          // Table header
          doc.setFillColor(22, 163, 106);
          doc.rect(22, y, pageW - 44, 6, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          
          const colWidths = [60, 45, 35, 30];
          const headers = ["Medicine", "Dosage", "Frequency", "Duration"];
          let xPos = 24;
          headers.forEach((header, idx) => {
            doc.text(header, xPos, y + 4);
            xPos += colWidths[idx];
          });
          
          y += 8;
          
          // Table outer border
          doc.setDrawColor(22, 163, 106);
          let tableStartY = y;
          
          // Table rows
          doc.setTextColor(55, 65, 81);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          
          d.medications.forEach((med, idx) => {
            if (y > 270) { 
              // Draw bottom border before page break
              doc.rect(22, tableStartY, pageW - 44, y - tableStartY);
              doc.addPage(); 
              y = 20;
              tableStartY = y;
            }
            
            // Alternate row colors
            if (idx % 2 === 0) {
              doc.setFillColor(240, 253, 244);
              doc.rect(22, y, pageW - 44, 5, "F");
            }
            
            xPos = 24;
            doc.text(med.name || "—", xPos, y + 3);
            xPos += colWidths[0];
            doc.text(med.dosage || "—", xPos, y + 3);
            xPos += colWidths[1];
            doc.text(med.frequency || "—", xPos, y + 3);
            xPos += colWidths[2];
            doc.text(med.duration || "—", xPos, y + 3);
            
            y += 5;
          });
          
          // Draw final table border
          doc.setDrawColor(22, 163, 106);
          doc.rect(22, tableStartY, pageW - 44, y - tableStartY);
          
          y += 5;
        }
        
        // Instructions
        if (d.instructions) {
          doc.setFillColor(240, 253, 244);
          doc.roundedRect(20, y, pageW - 40, 2, 1, 1, "F");
          
          doc.setTextColor(22, 163, 106);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text("Instructions:", 22, y + 6);
          
          doc.setFont("helvetica", "normal");
          doc.setTextColor(55, 65, 81);
          doc.setFontSize(8);
          const instLines = doc.splitTextToSize(d.instructions, pageW - 50);
          doc.text(instLines, 24, y + 11);
          y += (instLines.length * 3.5) + 10;
        }
        y += 4;
      }

      y += 6;
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("Confidential — Healthcare Management System", pageW / 2, 290, { align: "center" });
      doc.text(`Page ${i} of ${pageCount}`, pageW - 20, 290, { align: "right" });
    }

    doc.save(`${history.patient.fullName.replace(/\s+/g, "_")}_History.pdf`);
  };

  // Filter patients
  const filteredPatients = patients.filter(p =>
    p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="patient-history-container">
      {/* LEFT: Patient List */}
      <div className="patient-history-list-section">
        <div className="patient-history-list-header">
          <ClipboardList size={20} color="#16a34a" />
          <h3 style={{ margin: 0, fontSize: "16px", color: "#111827" }}>My Patients</h3>
          <span className="patient-history-badge">{patients.length}</span>
        </div>

        <div className="patient-history-search-box">
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by name, email, city..."
            className="patient-history-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {error && (
          <div className="patient-history-error-bar">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="patient-history-list">
          {loadingPatients ? (
            <div className="patient-history-center-flex">
              <Loader2 size={28} color="#16a34a" className="patient-history-spin" />
              <span style={{ color: "#6b7280", fontSize: "13px", marginTop: "8px" }}>Loading patients...</span>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="patient-history-center-flex">
              <User size={32} color="#d1d5db" />
              <span style={{ color: "#9ca3af", fontSize: "13px", marginTop: "8px" }}>
                {searchTerm ? "No matching patients" : "No completed patients yet"}
              </span>
            </div>
          ) : (
            filteredPatients.map((p) => (
              <div
                key={p._id}
                className={`patient-history-card ${selectedPatient?._id === p._id ? 'selected' : ''}`}
                onClick={() => handleSelectPatient(p)}
              >
                <div className="patient-history-avatar-small">
                  {p.fullName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="patient-history-name">{p.fullName}</div>
                  <div className="patient-history-sub">
                    {p.gender || "—"}{p.age ? `, ${p.age} yrs` : ""}
                    {p.city ? ` • ${p.city}` : ""}
                  </div>
                  <div className="patient-history-last-visit">
                    Last visit: {formatDate(p.lastAppointmentDate)}
                  </div>
                </div>
                <ChevronRight size={16} color="#9ca3af" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Patient History */}
      <div className="patient-history-section">
        {loadingHistory ? (
          <div className="patient-history-empty-state">
            <Loader2 size={48} color="#16a34a" className="patient-history-spin" />
            <p style={{ color: "#6b7280", marginTop: "12px" }}>Loading medical history...</p>
          </div>
        ) : history && selectedPatient ? (
          <>
            {/* Patient Info Card */}
            <div className="patient-history-info-card">
              {/* Avatar and Name Row */}
              <div className="patient-history-header-row">
                <div className="patient-history-avatar-large">
                  {history.patient.fullName?.charAt(0)?.toUpperCase()}
                </div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#111827" }}>
                  {history.patient.fullName}
                </h3>
              </div>

              {/* Divider line */}
              <div className="patient-history-divider"></div>

              {/* Desktop info row */}
              <div className="patient-history-info-row patient-history-info-row-desktop">
                <span className="patient-history-info-chip"><User size={12} /> {history.patient.gender || "—"}, {history.patient.age || "—"} yrs</span>
                {history.patient.phone && <span className="patient-history-info-chip"><Phone size={12} /> {history.patient.phone}</span>}
                {history.patient.email && <span className="patient-history-info-chip"><Mail size={12} /> {history.patient.email}</span>}
                {history.patient.city && <span className="patient-history-info-chip"><MapPin size={12} /> {history.patient.city}</span>}
              </div>

              {/* Mobile info table */}
              <div className="patient-history-info-table">
                <div className="patient-history-info-table-row">
                  <span className="patient-history-info-table-label">gender</span>
                  <span className="patient-history-info-table-value">{history.patient.gender || "—"}</span>
                </div>
                <div className="patient-history-info-table-row">
                  <span className="patient-history-info-table-label">age</span>
                  <span className="patient-history-info-table-value">{history.patient.age || "—"} years</span>
                </div>
                {history.patient.phone && (
                  <div className="patient-history-info-table-row">
                    <span className="patient-history-info-table-label">Mobile</span>
                    <span className="patient-history-info-table-value">{history.patient.phone}</span>
                  </div>
                )}
                {history.patient.email && (
                  <div className="patient-history-info-table-row">
                    <span className="patient-history-info-table-label">Email</span>
                    <span className="patient-history-info-table-value">{history.patient.email}</span>
                  </div>
                )}
                {history.patient.city && (
                  <div className="patient-history-info-table-row">
                    <span className="patient-history-info-table-label">city</span>
                    <span className="patient-history-info-table-value">{history.patient.city}</span>
                  </div>
                )}
              </div>

              {/* Medical History/Issue - Chief Complaint */}
              {history.patient.medicalHistory && (
                <div className="patient-history-issue-box">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "14px", color: "#1f2937" }}>Chief Complaint</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#4b5563", lineHeight: "1.6" }}>
                    {history.patient.medicalHistory}
                  </p>
                </div>
              )}

              <button className="patient-history-download-btn" onClick={handleExportPDF}>
                <Download size={15} /> Export PDF
              </button>
            </div>

            {/* Summary Cards */}
            <div className="patient-history-summary-row">
              {[
                { label: "Appointments", value: history.summary.totalAppointments, icon: <Calendar size={18} />, color: "#2563eb", bg: "#eff6ff" },
                { label: "Completed", value: history.summary.completedAppointments, icon: <Activity size={18} />, color: "#16a34a", bg: "#f0fdf4" },
                { label: "Consultations", value: history.summary.totalConsultations, icon: <Stethoscope size={18} />, color: "#7c3aed", bg: "#f5f3ff" },
                { label: "Prescriptions", value: history.summary.totalPrescriptions, icon: <Pill size={18} />, color: "#ea580c", bg: "#fff7ed" },
              ].map((s, i) => (
                <div key={i} className="patient-history-summary-card" style={{ backgroundColor: s.bg }}>
                  <div style={{ color: s.color }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: "22px", fontWeight: "700", color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "500" }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="patient-history-timeline-header">
              <Clock size={16} color="#16a34a" />
              <h4 style={{ margin: 0, fontSize: "15px", color: "#111827" }}>Medical Timeline</h4>
            </div>

            {history.timeline.length === 0 ? (
              <div className="patient-history-empty-state" style={{ height: "auto", padding: "40px 0" }}>
                <FileText size={36} color="#d1d5db" />
                <p style={{ color: "#9ca3af" }}>No records found for this patient.</p>
              </div>
            ) : (
              <div className="patient-history-timeline">
                {history.timeline.map((item, index) => {
                  const meta = getTimelineIcon(item.type);
                  return (
                    <div key={index} className="patient-history-timeline-item">
                      {/* Dot */}
                      <div className="patient-history-timeline-dot" style={{ backgroundColor: meta.bg, borderColor: meta.color }}>
                        <span style={{ color: meta.color }}>{meta.icon}</span>
                      </div>

                      {/* Connector line */}
                      {index < history.timeline.length - 1 && <div className="patient-history-timeline-line" />}

                      {/* Content */}
                      <div className="patient-history-timeline-content">
                        <div className="patient-history-timeline-meta">
                          <span className="patient-history-type-chip" style={{ backgroundColor: meta.bg, color: meta.color }}>
                            {meta.label}
                          </span>
                          <span className="patient-history-timeline-date">
                            <Calendar size={12} /> {formatDate(item.date)}
                          </span>
                        </div>

                        {/* Appointment card */}
                        {item.type === "appointment" && (
                          <div className="patient-history-card-body">
                            <div className="patient-history-card-row">
                              <span className="patient-history-card-label">Type</span>
                              <span className="patient-history-card-value">{item.data.appointmentType || "N/A"}</span>
                            </div>
                            <div className="patient-history-card-row">
                              <span className="patient-history-card-label">Status</span>
                              <span className="patient-history-status-badge" style={{
                                backgroundColor: getStatusColor(item.data.status).bg,
                                color: getStatusColor(item.data.status).color,
                              }}>
                                {item.data.status}
                              </span>
                            </div>
                            <div className="patient-history-card-row">
                              <span className="patient-history-card-label">Time</span>
                              <span className="patient-history-card-value">{formatTime(item.data.time) || "N/A"}</span>
                            </div>
                            {item.data.fee && (
                              <div className="patient-history-card-row">
                                <span className="patient-history-card-label">Fees</span>
                                <span className="patient-history-card-value" style={{ color: "#16a34a", fontWeight: "600" }}>Rs. {item.data.fee}</span>
                              </div>
                            )}
                            {item.data.reason && (
                              <div className="patient-history-card-row">
                                <span className="patient-history-card-label">Reason</span>
                                <span className="patient-history-card-value">{item.data.reason}</span>
                              </div>
                            )}
                            {item.data.doctorRemarks && (
                              <div className="patient-history-card-row">
                                <span className="patient-history-card-label">Remarks</span>
                                <span className="patient-history-card-value">{item.data.doctorRemarks}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Consultation card */}
                        {item.type === "consultation" && (
                          <div className="patient-history-card-body">
                            {item.data.appointmentType && (
                              <div className="patient-history-card-row">
                                <span className="patient-history-card-label">Type</span>
                                <span className="patient-history-card-value">{item.data.appointmentType}</span>
                              </div>
                            )}
                            <div className="patient-history-card-row">
                              <span className="patient-history-card-label">Status</span>
                              <span className="patient-history-status-badge" style={{
                                backgroundColor: getStatusColor(item.data.status).bg,
                                color: getStatusColor(item.data.status).color,
                              }}>
                                {item.data.status}
                              </span>
                            </div>
                            <div className="patient-history-card-row">
                              <span className="patient-history-card-label">Duration</span>
                              <span className="patient-history-card-value">{formatDuration(item.data.duration)}</span>
                            </div>
                            {item.data.notes && (
                              <div style={{ marginTop: "8px", padding: "8px 10px", backgroundColor: "#f9fafb", borderRadius: "6px", fontSize: "13px", color: "#4b5563", lineHeight: "1.5", borderLeft: "3px solid #7c3aed" }}>
                                <strong>Notes:</strong> {item.data.notes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Prescription card */}
                        {item.type === "prescription" && (
                          <div className="patient-history-card-body">
                            {item.data.diagnosis && (
                              <div className="patient-history-card-row">
                                <span className="patient-history-card-label">Diagnosis</span>
                                <span className="patient-history-card-value">{item.data.diagnosis}</span>
                              </div>
                            )}
                            {item.data.medications?.length > 0 && (
                              <div style={{ marginTop: "12px", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #f3f4f6" }}>
                                <span className="patient-history-card-label" style={{ marginBottom: "8px", display: "block", color: "#059669" }}>Medications</span>
                                <div className="patient-history-med-table">
                                  <div className="patient-history-med-header">
                                    <span>Medicine</span>
                                    <span>Dosage</span>
                                    <span>Frequency</span>
                                    <span>Duration</span>
                                  </div>
                                  {item.data.medications.map((med, mi) => (
                                    <div key={mi} className="patient-history-med-row">
                                      <span className="patient-history-med-cell" data-label="Medicine">
                                        {med.name}
                                      </span>
                                      <span className="patient-history-med-cell" data-label="Dosage">
                                        {med.dosage}
                                      </span>
                                      <span className="patient-history-med-cell" data-label="Frequency">
                                        {med.frequency}
                                      </span>
                                      <span className="patient-history-med-cell" data-label="Duration">
                                        {med.duration}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {item.data.instructions && (
                              <div style={{ padding: "10px 12px", backgroundColor: "#f0fdf4", borderRadius: "6px", fontSize: "13px", color: "#166534", lineHeight: "1.5", borderLeft: "3px solid #16a34a" }}>
                                <strong>Instructions:</strong> {item.data.instructions}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="patient-history-empty-state">
            <div className="patient-history-empty-circle">
              <Activity size={36} color="#16a34a" />
            </div>
            <h4 className="patient-history-empty-title">Patient Medical History</h4>
            <p className="patient-history-empty-text">
              Select a patient from the list to view their complete medical history, consultations, and prescriptions.
            </p>
          </div>
        )}
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PatientHistory;