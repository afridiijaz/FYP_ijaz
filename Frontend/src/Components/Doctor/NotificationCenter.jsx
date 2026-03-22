import React, { useState, useEffect } from "react";
import {
  Bell, CalendarCheck, CalendarX, CheckCircle2, Clock,
  Inbox, CheckCheck, Loader2,
} from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/doctorAction";
import { toast } from "react-toastify";
import "./NotificationCenter.css";

/* ── helpers ─────────────────────────────────────── */
const timeAgo = (dateStr) => {
  const now = new Date();
  const past = new Date(dateStr);
  const mins = Math.floor((now - past) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return past.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const typeConfig = {
  booking: {
    icon: CalendarCheck,
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    label: "New Booking",
  },
  approved: {
    icon: CheckCircle2,
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    label: "Approved",
  },
  cancelled: {
    icon: CalendarX,
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    label: "Cancelled",
  },
  completed: {
    icon: CheckCircle2,
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    label: "Completed",
  },
  general: {
    icon: Bell,
    color: "#6b7280",
    bg: "#f9fafb",
    border: "#e5e7eb",
    label: "General",
  },
};

/* ── component ───────────────────────────────────── */
const NotificationCenter = ({ onCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | unread | read
  const [markingAll, setMarkingAll] = useState(false);

  const fetchData = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const handleMarkRead = async (id) => {
    const notif = notifications.find((n) => n._id === id);
    if (!notif || notif.status === "read") return;

    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, status: "read" } : n))
      );
      if (onCountChange) onCountChange();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
      if (onCountChange) onCountChange();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return n.status === "unread";
    if (filter === "read") return n.status === "read";
    return true;
  });

  /* ── render ──────────────────────────────────── */
  if (loading) {
    return (
      <div className="notification-loading-wrap">
        <Loader2 size={32} color="#16a34a" style={{ animation: "spin 1s linear infinite" }} />
        <p className="notification-loading-text">Loading notifications…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="notification-container">
      {/* ── HEADER ── */}
      <div className="notification-header-bar">
        <div className="notification-header-left">
          <div className="notification-header-icon-wrap">
            <Bell size={22} color="#fff" />
          </div>
          <div>
            <h2 className="notification-header-title">Notifications</h2>
            <p className="notification-header-sub">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "You're all caught up! ✨"}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            className="notification-mark-all-btn"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCheck size={14} />}
            <span>{markingAll ? "Marking…" : "Mark all read"}</span>
          </button>
        )}
      </div>

      {/* ── FILTER TABS ── */}
      <div className="notification-filter-row">
        {[
          { key: "all", label: "All", count: notifications.length },
          { key: "unread", label: "Unread", count: unreadCount },
          { key: "read", label: "Read", count: notifications.length - unreadCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`notification-filter-btn ${filter === tab.key ? "active" : ""}`}
          >
            {tab.label}
            <span className="notification-filter-count">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── NOTIFICATION LIST ── */}
      {filtered.length === 0 ? (
        <div className="notification-empty-wrap">
          <div className="notification-empty-icon">
            <Inbox size={44} color="#d1d5db" />
          </div>
          <p className="notification-empty-title">No notifications here</p>
          <p className="notification-empty-subtitle">
            {filter === "unread"
              ? "Great job! You've read all your notifications."
              : filter === "read"
              ? "No read notifications yet."
              : "Notifications will appear when patients book appointments."}
          </p>
        </div>
      ) : (
        <div className="notification-feed">
          {filtered.map((notif, i) => {
            const cfg = typeConfig[notif.type] || typeConfig.general;
            const Icon = cfg.icon;
            const isUnread = notif.status === "unread";

            return (
              <div
                key={notif._id}
                onClick={() => handleMarkRead(notif._id)}
                className={`notification-card ${isUnread ? "unread" : "read"}`}
                style={{
                  animation: `fadeSlide 0.3s ease ${i * 0.04}s both`,
                }}
              >
                {/* Header Row: Icon, Badge, Time */}
                <div className="notification-card-header-row">
                  {/* Icon circle */}
                  <div className={`notification-icon-circle ${isUnread ? "unread" : "read"}`}>
                    <Icon size={18} />
                  </div>

                  {/* Badge and Time */}
                  <div className="notification-header-content">
                    <span
                      className="notification-type-badge"
                      style={{
                        backgroundColor: isUnread ? `${cfg.color}18` : "#f3f4f6",
                        color: isUnread ? cfg.color : "#9ca3af",
                        borderColor: isUnread ? cfg.border : "#e5e7eb",
                      }}
                    >
                      {cfg.label}
                    </span>
                    <span className="notification-time-text">
                      <Clock size={11} /> {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="notification-card-body">
                  <p className="notification-card-title">
                    {notif.title}
                  </p>
                  <p className="notification-card-msg">
                    {notif.message}
                  </p>

                  {notif.relatedAppointment && (
                    <div className="notification-meta-row">
                      <CalendarCheck size={12} />
                      <span>
                        {notif.relatedAppointment.date} at {notif.relatedAppointment.time}
                      </span>
                    </div>
                  )}
                </div>

                {/* Unread dot */}
                {isUnread && (
                  <div className="notification-unread-pulse-wrap">
                    <div className="notification-unread-dot" />
                    <div className="notification-unread-pulse" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default NotificationCenter;