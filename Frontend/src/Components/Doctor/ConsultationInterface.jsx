import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Phone,
  FileText, User, Clock, AlertCircle, CheckCircle, Loader
} from "lucide-react";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";
import { getDoctorAppointments } from "../../services/doctorAction";
import { startConsultation, getActiveConsultations, endConsultation, saveConsultationNotes } from "../../services/consultationService";
import { connectSocket } from "../../services/socket";
import "./ConsultationInterface.css";

const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const ConsultationInterface = () => {
  const { user } = useUser();

  const [approvedAppointments, setApprovedAppointments] = useState([]);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [loading, setLoading] = useState(true);

  const [callStatus, setCallStatus] = useState("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const [notes, setNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);
  const socketRef = useRef(null);
  const currentPatientIdRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [apptData, consultData] = await Promise.all([
        getDoctorAppointments(),
        getActiveConsultations(),
      ]);
      const approved = (apptData.appointments || []).filter(a => a.status === "approved");
      setApprovedAppointments(approved);
      if (consultData.consultations && consultData.consultations.length > 0) {
        setActiveConsultation(consultData.consultations[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Socket connection
  useEffect(() => {
    if (!user?._id) return;
    socketRef.current = connectSocket(user._id);

    // Patient accepted → set remote description
    socketRef.current.on("call-accepted", async ({ signal }) => {
      try {
        if (pcRef.current && pcRef.current.signalingState !== "stable") {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        }
      } catch (e) { console.error("setRemoteDescription error:", e); }
    });

    // ICE candidates from patient
    socketRef.current.on("ice-candidate", ({ candidate }) => {
      try {
        if (pcRef.current && candidate) pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) { console.error("addIceCandidate error:", e); }
    });

    socketRef.current.on("call-ended", () => { cleanUpCall(false); toast.info("Patient ended the call"); });
    socketRef.current.on("user-offline", () => { toast.error("Patient is not online. They need to open their dashboard first."); cleanUpCall(false); });

    return () => {
      socketRef.current?.off("call-accepted");
      socketRef.current?.off("ice-candidate");
      socketRef.current?.off("call-ended");
      socketRef.current?.off("user-offline");
    };
  }, [user]);

  useEffect(() => {
    if (callStatus === "connected") {
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callStatus]);

  // Re-attach local video stream after render (fixes dark preview)
  useEffect(() => {
    if (callStatus !== "idle" && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callStatus]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const cleanUpCall = async (notify = true) => {
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    clearInterval(timerRef.current);

    if (notify && currentPatientIdRef.current) {
      socketRef.current?.emit("end-call", { to: currentPatientIdRef.current });
      if (activeConsultation) { try { await endConsultation(activeConsultation._id); } catch (error) { console.error("Error ending consultation:", error); } }
    }

    currentPatientIdRef.current = null;
    setCallStatus("idle");
    setCallDuration(0);
    setActiveConsultation(null);
    setNotes("");
    setPrescription("");
    loadData();
  };

  const handleStartCall = async (appointment) => {
    try {
      const { consultation } = await startConsultation(appointment._id);
      setActiveConsultation(consultation);
      toast.success("Consultation started! Calling patient...");

      const patientId = typeof appointment.patient === "object" ? appointment.patient._id : appointment.patient;
      currentPatientIdRef.current = patientId;

      // Audio constraints to prevent echo/noise
      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };

      // Try video+audio, fall back to audio-only if camera is busy
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: audioConstraints });
      } catch (mediaErr) {
        console.warn("Video failed, trying audio-only:", mediaErr.message);
        toast.warn("Camera unavailable — starting with audio only");
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: audioConstraints });
        setIsVideoOff(true);
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Handle remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setCallStatus("connected");
          setCallDuration(0);
        }
      };

      // Send ICE candidates to patient
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("ice-candidate", { to: patientId, candidate: event.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          cleanUpCall(false);
        }
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current.emit("call-user", {
        to: patientId, from: user._id,
        signal: pc.localDescription,
        callerName: user.fullName || "Doctor",
        consultationId: consultation._id,
      });

      setCallStatus("calling");
      setApprovedAppointments(prev => prev.filter(a => a._id !== appointment._id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
    }
  };

  const toggleVideo = async () => {
    if (!localStreamRef.current) return;

    const existingTrack = localStreamRef.current.getVideoTracks()[0];
    if (existingTrack) {
      existingTrack.enabled = !existingTrack.enabled;
      setIsVideoOff(!existingTrack.enabled);
    } else {
      // No video track (started audio-only) — try to acquire camera now
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const videoTrack = videoStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(videoTrack);
        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          } else {
            pcRef.current.addTrack(videoTrack, localStreamRef.current);
          }
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        setIsVideoOff(false);
        toast.success("Camera enabled!");
      } catch (err) {
        toast.error("Camera still unavailable. Make sure no other app is using it.");
        console.error("toggleVideo acquire error:", err);
      }
    }
  };

  const handleSaveNotes = async () => {
    if (!activeConsultation) return;
    setSavingNotes(true);
    try {
      await saveConsultationNotes(activeConsultation._id, notes, prescription);
      toast.success("Notes saved successfully");
    } catch (err) { toast.error(err.message); }
    finally { setSavingNotes(false); }
  };

  // ─── RENDER ──────────────────────────────────

  if (loading) {
    return (
      <div className="consultation-loading-container">
        <Loader size={40} style={{ animation: "spin 1s linear infinite" }} color="#16a34a" />
        <p>Loading consultations...</p>
      </div>
    );
  }

  // ── ACTIVE CALL VIEW ──
  if (callStatus !== "idle") {
    const patientName = activeConsultation?.patient?.fullName || "Patient";
    const reason = activeConsultation?.appointment?.reason || "Consultation";

    return (
      <div className="consultation-container">
        <div className="consultation-video-section">
          <div className="consultation-main-video">
            <video ref={remoteVideoRef} autoPlay playsInline className="consultation-remote-video" />

            {callStatus === "calling" && (
              <div className="consultation-calling-overlay">
                <div className="consultation-pulse-circle"><Phone size={40} color="#fff" /></div>
                <p>Calling {patientName}...</p>
                <p>Waiting for patient to accept</p>
              </div>
            )}

            <div className="consultation-local-video-wrapper">
              <video ref={localVideoRef} autoPlay playsInline muted className="consultation-local-video" />
              {isVideoOff && <div className="consultation-video-off-overlay"><VideoOff size={24} color="#fff" /></div>}
              <span className="consultation-preview-label">You</span>
            </div>

            {callStatus === "connected" && (
              <div className="consultation-call-info-bar">
                <div className="consultation-call-info-dot" />
                <span>LIVE</span>
                <span style={{ marginLeft: 10 }}>
                  <Clock size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />{formatDuration(callDuration)}
                </span>
              </div>
            )}

            <div className="consultation-controls-bar">
              <button onClick={toggleMute} className={isMuted ? "consultation-control-btn-active" : "consultation-control-btn"}>
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button onClick={toggleVideo} className={isVideoOff ? "consultation-control-btn-active" : "consultation-control-btn"}>
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
              <button onClick={() => cleanUpCall(true)} className="consultation-end-call-btn"><PhoneOff size={20} /></button>
            </div>
          </div>
        </div>

        <div className="consultation-side-panel">
          <div className="consultation-panel-header">
            <FileText size={18} color="#16a34a" />
            <h4>Consultation Notes</h4>
          </div>
          <div className="consultation-patient-brief">
            <p><strong>Patient:</strong> {patientName}</p>
            <p><strong>Reason:</strong> {reason}</p>
            {activeConsultation?.appointment?.date && (
              <p><strong>Date:</strong> {activeConsultation.appointment.date} at {activeConsultation.appointment.time}</p>
            )}
          </div>
          <label className="consultation-note-label">Clinical Notes</label>
          <textarea className="consultation-notes-area" placeholder="Type clinical notes here..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          <label className="consultation-note-label">Prescription</label>
          <textarea className="consultation-notes-area" placeholder="Prescription details..." style={{ marginTop: 8 }} value={prescription} onChange={(e) => setPrescription(e.target.value)} />
          <button onClick={handleSaveNotes} disabled={savingNotes} className="consultation-save-btn">
            {savingNotes ? "Saving..." : "Save Notes"}
          </button>
        </div>
      </div>
    );
  }

  // ── LOBBY VIEW — list approved appointments ──
  return (
    <div className="consultation-lobby-container">
      <div className="consultation-lobby-header">
        <Video size={28} color="#16a34a" />
        <div>
          <h2>Video Consultations</h2>
          <p>Start a video call with your patients</p>
        </div>
      </div>

      {approvedAppointments.length === 0 ? (
        <div className="consultation-empty-state">
          <AlertCircle size={50} color="#d1d5db" />
          <h3>No Approved Appointments</h3>
          <p>
            Approve pending appointments from the Schedule tab to start video consultations.
          </p>
        </div>
      ) : (
        <div className="consultation-appointment-grid">
          {approvedAppointments.map((appt) => {
            const patient = appt.patient || {};
            return (
              <div key={appt._id} className="consultation-appointment-card">
                <div className="consultation-card-top">
                  <div className="consultation-patient-avatar">{(patient.fullName || "P").charAt(0).toUpperCase()}</div>
                  <div>
                    <h4>{patient.fullName || "Patient"}</h4>
                    <p>{patient.email || ""}</p>
                  </div>
                </div>
                <div className="consultation-card-details">
                  <div className="consultation-detail-row"><Clock size={14} color="#6b7280" /><span>{appt.date} at {appt.time}</span></div>
                  {appt.reason && <div className="consultation-detail-row"><FileText size={14} color="#6b7280" /><span>{appt.reason}</span></div>}
                  <div className="consultation-detail-row approved"><CheckCircle size={14} color="#16a34a" /><span>Approved</span></div>
                </div>
                <button className="consultation-start-call-btn" onClick={() => handleStartCall(appt)}>
                  <Phone size={18} /><span>Start Video Call</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConsultationInterface;