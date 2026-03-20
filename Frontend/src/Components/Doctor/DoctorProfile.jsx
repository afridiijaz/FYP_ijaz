import React, { useState, useEffect } from 'react';
import { getDoctorProfile, updateDoctorProfile } from '../../services/doctorAction';
import { useUser } from '../../context/UserContext';
import { toast } from 'react-toastify';
import './DoctorProfile.css';

const DoctorProfile = () => {
  const { updateUserContext } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState(null);

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    username: '',
    gender: '',
    phone: '',
    specialty: '',
    qualifications: '',
    yearsOfExperience: '',
    availability: '',
    chargesPerSession: '',
    city: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDoctorProfile();
        const u = data.user;
        const fields = {
          fullName: u.fullName || '',
          email: u.email || '',
          username: u.username || '',
          gender: u.gender || '',
          phone: u.phone || '',
          specialty: u.specialty || '',
          qualifications: u.qualifications || '',
          yearsOfExperience: u.yearsOfExperience ?? '',
          availability: u.availability || '',
          chargesPerSession: u.chargesPerSession ?? '',
          city: u.city || '',
        };
        setProfile(fields);
        setOriginal(fields);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Check if any field changed from original
  const hasChanges = original && Object.keys(profile).some(
    (key) => String(profile[key]) !== String(original[key])
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        fullName: profile.fullName,
        gender: profile.gender,
        phone: profile.phone,
        specialty: profile.specialty,
        qualifications: profile.qualifications,
        yearsOfExperience: profile.yearsOfExperience,
        availability: profile.availability,
        chargesPerSession: profile.chargesPerSession,
        city: profile.city,
      };
      const data = await updateDoctorProfile(payload);
      const u = data.user;
      const fields = {
        fullName: u.fullName || '',
        email: u.email || '',
        username: u.username || '',
        gender: u.gender || '',
        phone: u.phone || '',
        specialty: u.specialty || '',
        qualifications: u.qualifications || '',
        yearsOfExperience: u.yearsOfExperience ?? '',
        availability: u.availability || '',
        chargesPerSession: u.chargesPerSession ?? '',
        city: u.city || '',
      };
      setProfile(fields);
      setOriginal(fields);
      updateUserContext(u);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="doctor-profile-loading">Loading profile...</div>;
  }

  return (
    <div className="doctor-profile-card">
      <div className="doctor-profile-header">
        <h2 className="doctor-profile-title">Professional Profile</h2>
        <p className="doctor-profile-subtitle">This information will be visible to patients looking for consultations.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="doctor-profile-grid">
          {/* Full Name */}
          <div className="doctor-profile-field">
            <label className="doctor-profile-label">Full Name</label>
            <input 
              type="text" 
              name="fullName" 
              value={profile.fullName} 
              onChange={handleChange} 
              className="doctor-profile-input" 
              required 
              placeholder="Dr. John Smith" 
            />
          </div>

          {/* Email (read-only) */}
          <div className="doctor-profile-field">
            <label className="doctor-profile-label">Email</label>
            <input 
              type="email" 
              value={profile.email} 
              disabled 
              className="doctor-profile-input" 
            />
          </div>

          {/* Username (read-only) */}
          <div className="doctor-profile-field">
            <label className="doctor-profile-label">Username</label>
            <input 
              type="text" 
              value={profile.username} 
              disabled 
              className="doctor-profile-input" 
            />
          </div>

          {/* Gender */}
          <div className="doctor-profile-field">
            <label className="doctor-profile-label">Gender</label>
            <select 
              name="gender" 
              value={profile.gender} 
              onChange={handleChange} 
              className="doctor-profile-select"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Phone */}
          <div className="doctor-profile-field">
            <label className="doctor-profile-label">Phone</label>
            <input 
              type="tel" 
              name="phone" 
              value={profile.phone} 
              onChange={handleChange} 
              className="doctor-profile-input" 
              placeholder="e.g. +1234567890" 
            />
          </div>

          {/* Specialty */}
          <div className="doctor-profile-field">
            <label className="doctor-profile-label">Specialty</label>
            <input 
              type="text" 
              name="specialty" 
              value={profile.specialty} 
              onChange={handleChange} 
              className="doctor-profile-input" 
              placeholder="e.g. Cardiology" 
            />
          </div>

          {/* Qualifications */}
          <div className="doctor-profile-field">
            <label className="doctor-profile-label">Qualifications</label>
            <input 
              type="text" 
              name="qualifications" 
              value={profile.qualifications} 
              onChange={handleChange} 
              className="doctor-profile-input" 
              placeholder="e.g. MBBS, MD" 
            />
          </div>

          {/* Years of Experience */}
          <div className="doctor-profile-field">
            <label className="doctor-profile-label">Years of Experience</label>
            <input 
              type="number" 
              name="yearsOfExperience" 
              value={profile.yearsOfExperience} 
              onChange={handleChange} 
              className="doctor-profile-input" 
              placeholder="e.g. 10" 
            />
          </div>

          {/* Availability */}
          <div className="doctor-profile-field">
            <label className="doctor-profile-label">Availability</label>
            <input 
              type="text" 
              name="availability" 
              value={profile.availability} 
              onChange={handleChange} 
              className="doctor-profile-input" 
              placeholder="e.g. Mon-Fri 9:00-14:00" 
            />
          </div>

          {/* Charges Per Session */}
          <div className="doctor-profile-field">
            <label className="doctor-profile-label">Charges Per Session ($)</label>
            <input 
              type="number" 
              name="chargesPerSession" 
              value={profile.chargesPerSession} 
              onChange={handleChange} 
              className="doctor-profile-input" 
              placeholder="e.g. 2000" 
            />
          </div>

          {/* City */}
          <div className="doctor-profile-field">
            <label className="doctor-profile-label">City</label>
            <input 
              type="text" 
              name="city" 
              value={profile.city} 
              onChange={handleChange} 
              className="doctor-profile-input" 
              placeholder="e.g. Lahore" 
            />
          </div>
        </div>

        <div className="doctor-profile-button-container">
          <button
            type="submit"
            className="doctor-profile-submit-btn"
            disabled={!hasChanges || saving}
          >
            {saving ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorProfile;