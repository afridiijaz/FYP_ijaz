import React, { useState, useRef, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import "./ProfileDropdown.css";

const ProfileDropdown = ({ userName, userRole, onLogout, onProfile, avatarIcon }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setDropdownOpen(false);
    onProfile();
  };

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    onLogout();
  };

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <button
        className="profile-dropdown-avatar-btn"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        title={userName}
      >
        <div className="profile-dropdown-avatar">
          {avatarIcon}
        </div>
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="profile-dropdown-menu">
          {/* User Info */}
          <div className="profile-dropdown-user-info">
            <div className="profile-dropdown-dropdown-avatar">
              {avatarIcon}
            </div>
            <div className="profile-dropdown-user-details">
              <div className="profile-dropdown-full-name">{userName}</div>
              <div className="profile-dropdown-role">{userRole}</div>
            </div>
          </div>

          <div className="profile-dropdown-divider" />

          {/* Profile Button */}
          <button className="profile-dropdown-item" onClick={handleProfileClick}>
            <User size={16} />
            <span>View Profile</span>
          </button>

          {/* Logout Button */}
          <button className="profile-dropdown-item" onClick={handleLogoutClick}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
