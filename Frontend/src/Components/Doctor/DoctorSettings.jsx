import React, { useState } from "react";
import { User, BellRing, Save, DollarSign } from "lucide-react";
import "./DoctorSettings.css";

const DoctorSettings = () => {
  const [settings, setSettings] = useState({
    name: "Dr. Raz",
    email: "dr.raz@telemed.com",
    fee: "150",
    emailNotifications: true,
  });

  return (
    <div className="doctor-settings-container">
      <h2 className="doctor-settings-title">Account Settings</h2>
      
      <div className="doctor-settings-section">
        <div className="doctor-settings-section-header">
          <User size={20} color="#16a34a" />
          <h3 className="doctor-settings-section-title">Profile Information</h3>
        </div>
        <div className="doctor-settings-grid">
          <div className="doctor-settings-input-group">
            <label className="doctor-settings-label">Display Name</label>
            <input 
              className="doctor-settings-input"
              value={settings.name} 
              onChange={(e) => setSettings({...settings, name: e.target.value})}
            />
          </div>
          <div className="doctor-settings-input-group">
            <label className="doctor-settings-label">Consultation Fee ($)</label>
            <input 
              className="doctor-settings-input"
              type="number"
              value={settings.fee} 
              onChange={(e) => setSettings({...settings, fee: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="doctor-settings-section">
        <div className="doctor-settings-section-header">
          <BellRing size={20} color="#16a34a" />
          <h3 className="doctor-settings-section-title">Notifications</h3>
        </div>
        <div className="doctor-settings-toggle-row">
          <span>Receive email alerts for new bookings</span>
          <input 
            type="checkbox" 
            className="doctor-settings-checkbox"
            checked={settings.emailNotifications} 
            onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
          />
        </div>
      </div>

      <button className="doctor-settings-save-btn"><Save size={18} /> Save Changes</button>
    </div>
  );
};

export default DoctorSettings;