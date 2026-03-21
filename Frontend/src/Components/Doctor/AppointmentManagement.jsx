import React, { useState, useEffect, useCallback } from "react";
import { Check, X, Clock, Calendar, User, AlertCircle, MapPin, Phone, DollarSign, FileText, CheckCircle, XCircle } from "lucide-react";
import { getDoctorAppointments, approveAppointment, cancelAppointmentByDoctor } from "../../services/doctorAction";
import { toast } from "react-toastify";
import "./AppointmentManagement.css";

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // track which appointment action is in progress

  const loadAppointments = useCallback(async () => {
    try {
      const data = await getDoctorAppointments();
      setAppointments(data.appointments);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const data = await approveAppointment(id);
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? data.appointment : a))
      );
      toast.success("Appointment approved");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id) => {
    setActionLoading(id);
    try {
      const data = await cancelAppointmentByDoctor(id);
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? data.appointment : a))
      );
      toast.success("Appointment cancelled");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  if (loading) {
    return <p className="appointment-loading">Loading appointments...</p>;
  }

  return (
    <div className="appointment-container">
      <div className="appointment-header">
        <h4 className="appointment-title">Appointment Requests</h4>
        {pendingCount > 0 && (
          <span className="appointment-count-badge">{pendingCount} New</span>
        )}
      </div>

      {appointments.length === 0 && (
        <p className="appointment-empty">No appointment requests yet.</p>
      )}

      <div className="appointment-list">
        {appointments.map((app) => (
          <div key={app._id} className="appointment-card">
            <div className="appointment-card-info">
              {/* Patient name + status */}
              <div className="appointment-patient-row">
                <div className="appointment-avatar">
                  {app.patient?.fullName ? app.patient.fullName.charAt(0).toUpperCase() : <User size={18} />}
                </div>
                <span className="appointment-patient-name">{app.patient?.fullName || "Unknown"}</span>
                <span className={`appointment-status-badge ${getStatusClass(app.status)}`}>
                  {app.status}
                </span>
              </div>

              {/* Date, Time, Type */}
              <div className="appointment-date-time-row">
                <div className="appointment-info-item">
                  <Calendar size={14} className="appointment-info-icon" />
                  <span>{app.date}</span>
                </div>
                <div className="appointment-info-item">
                  <Clock size={14} className="appointment-info-icon" />
                  <span>{app.time}</span>
                </div>
                <div className="appointment-info-item">
                  <AlertCircle size={14} className="appointment-info-icon" />
                  <span style={{ textTransform: "capitalize" }}>{app.type}</span>
                </div>
                {app.fee > 0 && (
                  <div className="appointment-info-item">
                    <DollarSign size={14} className="appointment-info-icon" />
                    <span>${app.fee}</span>
                  </div>
                )}
              </div>

              {/* Extra details row */}
              <div className="appointment-date-time-row">
                {app.patient?.phone && (
                  <div className="appointment-info-item">
                    <Phone size={14} className="appointment-info-icon" />
                    <span>{app.patient.phone}</span>
                  </div>
                )}
                {app.patient?.city && (
                  <div className="appointment-info-item">
                    <MapPin size={14} className="appointment-info-icon" />
                    <span>{app.patient.city}</span>
                  </div>
                )}
                {app.reason && (
                  <div className="appointment-info-item">
                    <FileText size={14} className="appointment-info-icon" />
                    <span>{app.reason}</span>
                  </div>
                )}
              </div>

              {app.notes && (
                <p className="appointment-notes"><strong>Notes:</strong> {app.notes}</p>
              )}
            </div>

            <div className="appointment-action-buttons">
              {app.status === "pending" && (
                <>
                  <button
                    onClick={() => handleApprove(app._id)}
                    className="appointment-approve-btn"
                    disabled={actionLoading === app._id}
                    title="Approve appointment"
                  >
                    <CheckCircle size={18} /> {actionLoading === app._id ? "..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleCancel(app._id)}
                    className="appointment-cancel-btn"
                    disabled={actionLoading === app._id}
                    title="Reject appointment"
                  >
                    <XCircle size={20} />
                  </button>
                </>
              )}
              {app.status === "approved" && (
                <span className="appointment-status-text appointment-status-approved">✓ Approved</span>
              )}
              {app.status === "cancelled" && (
                <span className="appointment-status-text appointment-status-rejected">Rejected</span>
              )}
              {app.status === "completed" && (
                <span className="appointment-status-text appointment-status-completed">Completed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper for status CSS classes
const getStatusClass = (status) => {
  switch (status) {
    case "pending": return "appointment-status-pending";
    case "approved": return "appointment-status-approved-badge";
    case "cancelled": return "appointment-status-cancelled";
    case "completed": return "appointment-status-completed-badge";
    default: return "";
  }
};

export default AppointmentManagement;