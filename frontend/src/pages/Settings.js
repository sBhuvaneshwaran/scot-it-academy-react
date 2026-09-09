import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Panel } from "../components/Ui";

export default function Settings() {
  const [email, setEmail] = useState("scotitacademy@gmail.com");
  const [follow, setFollow] = useState(true);

  return (
    <div className="settings-grid">

      {/* ==============================
          INSTITUTE SETTINGS
      ============================== */}
      <Panel
        title="Institute Settings"
        subtitle="Update academy information"
      >
        <div className="form-group">
          <label>Institute Name</label>
          <input defaultValue="SCOT IT Academy" />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Branch</label>
          <input defaultValue="Keelkattalai" />
        </div>

        <button className="primary">
          Save Settings
        </button>
      </Panel>

      {/* ==============================
          SYSTEM SETTINGS
      ============================== */}
      <Panel
        title="System Settings"
        subtitle="Configure notifications"
      >

        {/* Follow-up Reminder */}
        <div className="setting-row">
          <div>
            <strong>Follow-up Reminder</strong>
            <small>
              Notify admins about due follow-ups
            </small>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={follow}
              onChange={(e) => setFollow(e.target.checked)}
            />
            <span></span>
          </label>
        </div>

        {/* Duplicate Mobile Check */}
        <div className="setting-row">
          <div>
            <strong>Duplicate Mobile Check</strong>
            <small>
              Prevent duplicate enquiry mobile numbers
            </small>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              defaultChecked
            />
            <span></span>
          </label>
        </div>

        {/* Update Account */}
        <div
          className="setting-row"
          style={{
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <div>
            <strong>Account Settings</strong>
            <small>
              Update your username and password
            </small>
          </div>

          <Link
            to="/signup"
            className="link-btn"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 16px",
              borderRadius: "8px",
            }}
          >
            Update Account
          </Link>
        </div>

      </Panel>

    </div>
  );
}

