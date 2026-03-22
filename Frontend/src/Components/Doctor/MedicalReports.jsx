import React, { useState } from "react";
import { 
  FileText, Upload, Search, Download, 
  Eye, Filter, MoreVertical, FilePlus 
} from "lucide-react";
import "./MedicalReports.css";

const MedicalReports = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for patient reports
  const reports = [
    { id: 1, patient: "John Doe", type: "Blood Test", date: "2025-12-10", status: "Analyzed", file: "blood_work_dec.pdf" },
    { id: 2, patient: "Jane Smith", type: "X-Ray", date: "2025-11-28", status: "Pending Review", file: "chest_xray_01.png" },
    { id: 3, patient: "John Doe", type: "MRI Scan", date: "2025-11-15", status: "Analyzed", file: "mri_lumbar.pdf" },
    { id: 4, patient: "Robert Brown", type: "ECG", date: "2025-12-05", status: "New", file: "ecg_report.pdf" },
  ];

  return (
    <div className="medical-reports-container">
      <div className="medical-reports-header">
        <div className="medical-reports-title-area">
          <h2 className="medical-reports-title">Medical Reports Repository</h2>
          <p className="medical-reports-subtitle">Manage and review patient diagnostic documents</p>
        </div>
        <button className="medical-reports-upload-btn">
          <Upload size={18} /> Upload New Report
        </button>
      </div>

      <div className="medical-reports-toolbar">
        <div className="medical-reports-search-wrapper">
          <Search size={18} color="#9ca3af" />
          <input 
            type="text" 
            placeholder="Search by patient or report type..." 
            className="medical-reports-search-input"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="medical-reports-filter-btn">
          <Filter size={18} /> Filter
        </button>
      </div>

      <div className="medical-reports-table-card">
        <table className="medical-reports-table">
          <thead>
            <tr className="medical-reports-table-head-row">
              <th className="medical-reports-th">Report Name / Type</th>
              <th className="medical-reports-th">Patient Name</th>
              <th className="medical-reports-th">Upload Date</th>
              <th className="medical-reports-th">Status</th>
              <th className="medical-reports-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports
              .filter(r => r.patient.toLowerCase().includes(searchTerm.toLowerCase()) || r.type.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((report) => (
                <tr key={report.id} className="medical-reports-table-row">
                  <td className="medical-reports-td">
                    <div className="medical-reports-file-name-cell">
                      <FileText size={20} color="#16a34a" />
                      <div>
                        <div className="medical-reports-file-name">{report.type}</div>
                        <div className="medical-reports-file-sub">{report.file}</div>
                      </div>
                    </div>
                  </td>
                  <td className="medical-reports-td">{report.patient}</td>
                  <td className="medical-reports-td">{report.date}</td>
                  <td className="medical-reports-td">
                    <span className={`medical-reports-status-badge ${
                      report.status === "Analyzed" ? "medical-reports-status-analyzed" : 
                      report.status === "Pending Review" ? "medical-reports-status-pending" :
                      "medical-reports-status-new"
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="medical-reports-td">
                    <div className="medical-reports-action-group">
                      <button className="medical-reports-icon-btn" title="View"><Eye size={18} /></button>
                      <button className="medical-reports-icon-btn" title="Download"><Download size={18} /></button>
                      <button className="medical-reports-icon-btn" title="More"><MoreVertical size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="medical-reports-card-grid">
        {reports
          .filter(r => r.patient.toLowerCase().includes(searchTerm.toLowerCase()) || r.type.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((report) => (
            <div key={report.id} className="medical-reports-card">
              <div className="medical-reports-card-header">
                <div className="medical-reports-card-icon">
                  <FileText size={24} color="#fff" />
                </div>
                <div className="medical-reports-card-status">
                  <span className={`medical-reports-status-badge ${
                    report.status === "Analyzed" ? "medical-reports-status-analyzed" : 
                    report.status === "Pending Review" ? "medical-reports-status-pending" :
                    "medical-reports-status-new"
                  }`}>
                    {report.status}
                  </span>
                </div>
              </div>

              <div className="medical-reports-card-content">
                <div className="medical-reports-card-type">{report.type}</div>
                <div className="medical-reports-card-file">{report.file}</div>

                <div className="medical-reports-card-meta">
                  <div className="medical-reports-card-meta-item">
                    <span className="medical-reports-card-meta-label">Patient</span>
                    <span className="medical-reports-card-meta-value">{report.patient}</span>
                  </div>
                  <div className="medical-reports-card-meta-item">
                    <span className="medical-reports-card-meta-label">Date</span>
                    <span className="medical-reports-card-meta-value">{report.date}</span>
                  </div>
                </div>
              </div>

              <div className="medical-reports-card-actions">
                <button className="medical-reports-card-action-btn" title="View">
                  <Eye size={16} /> View
                </button>
                <button className="medical-reports-card-action-btn" title="Download">
                  <Download size={16} /> Download
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default MedicalReports;