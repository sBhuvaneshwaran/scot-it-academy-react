import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, getAccessToken } from "../services/api";

export default function ForgotPassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /*
   * ======================================================
   * CHECK LOGIN TOKEN
   * ======================================================
   */

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setError(
        "Your login session has expired. Please login again."
      );
    }
  }, []);

  /*
   * ======================================================
   * SUBMIT
   * ======================================================
   */

  async function submit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    /*
     * Check authentication token
     */

    const token = getAccessToken();

    if (!token) {
      setError(
        "Authentication token is missing. Please login again."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);

      return;
    }

    /*
     * Current password validation
     */

    if (!currentPassword.trim()) {
      setError(
        "Please enter your current password."
      );
      return;
    }

    /*
     * New password validation
     */

    if (!newPassword.trim()) {
      setError(
        "Please enter your new password."
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "New password must contain at least 6 characters."
      );
      return;
    }

    /*
     * Confirm password validation
     */

    if (!confirmPassword.trim()) {
      setError(
        "Please confirm your new password."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }

    /*
     * Prevent same password
     */

    if (currentPassword === newPassword) {
      setError(
        "New password must be different from your current password."
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await authApi.updatePassword({
          current_password:
            currentPassword,

          new_password:
            newPassword,
        });

      /*
       * Success
       */

      setSuccess(
        response?.data?.message ||
          "Password updated successfully."
      );

      /*
       * Clear fields
       */

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      /*
       * Go back to login
       */

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      console.error(
        "Password update failed:",
        error
      );

      /*
       * Backend error message
       */

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        "";

      /*
       * Handle authentication error
       */

      if (
        error?.response?.status === 401
      ) {
        setError(
          "Your login session has expired. Please login again."
        );

        setTimeout(() => {
          navigate("/login");
        }, 1500);

        return;
      }

      /*
       * Handle known error message
       */

      if (backendMessage) {
        setError(
          backendMessage
        );
        return;
      }

      /*
       * Handle normal password error
       */

      setError(
        "Current password is incorrect. Password was not changed."
      );

    } finally {
      setLoading(false);
    }
  }

  /*
   * ======================================================
   * UI
   * ======================================================
   */

  return (
    <div className="login-screen">
      <div className="login-card">

        {/* ==================================================
            LOGO
        ================================================== */}

        <div className="login-logo">
          <h2>SCOT</h2>
          <p>IT ACADEMY</p>
        </div>

        {/* ==================================================
            TITLE
        ================================================== */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "7px 16px",
              borderRadius: "20px",
              background: "#eaf4ff",
              color: "#145a96",
              fontSize: "13px",
              fontWeight: "700",
              letterSpacing: "1px",
              marginBottom: "14px",
            }}
          >
            PASSWORD RESET
          </div>

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "28px",
              color: "#15324d",
            }}
          >
            Update Password
          </h1>

          <p
            style={{
              margin: 0,
              color: "#607d9d",
              fontSize: "15px",
            }}
          >
            Enter your current password and
            create a new password.
          </p>
        </div>

        {/* ==================================================
            FORM
        ================================================== */}

        <form onSubmit={submit}>

          {/* CURRENT PASSWORD */}

          <div className="login-field">
            <label htmlFor="current-password">
              Current Password
            </label>

            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) =>
                setCurrentPassword(
                  e.target.value
                )
              }
              placeholder="Enter current password"
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </div>

          {/* NEW PASSWORD */}

          <div className="login-field">
            <label htmlFor="new-password">
              New Password
            </label>

            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
              placeholder="Enter new password"
              autoComplete="new-password"
              disabled={loading}
              required
            />
          </div>

          {/* CONFIRM PASSWORD */}

          <div className="login-field">
            <label htmlFor="confirm-password">
              Confirm New Password
            </label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder="Confirm new password"
              autoComplete="new-password"
              disabled={loading}
              required
            />
          </div>

          {/* PASSWORD REQUIREMENT */}

          <div
            style={{
              fontSize: "13px",
              color: "#607d9d",
              marginBottom: "15px",
            }}
          >
            Password must contain at least
            6 characters.
          </div>

          {/* ERROR */}

          {error && (
            <div
              className="login-error"
              style={{
                marginBottom: "15px",
              }}
            >
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div
              style={{
                marginBottom: "15px",
                padding: "12px",
                borderRadius: "8px",
                background: "#e9f8ee",
                color: "#20733b",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {success}
            </div>
          )}

          {/* UPDATE PASSWORD */}

          <button
            type="submit"
            className="primary login-btn"
            disabled={loading}
          >
            {loading
              ? "Updating..."
              : "Update Password"}
          </button>

          {/* BACK TO LOGIN */}

          <div className="login-links">
            <Link to="/login">
              Back to login
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}

// ### But there is one important point

// This code fixes the **React page**, but your original error can still occur if you open `/forgot-password` directly without logging in.

// Your current backend API is:

// ```text
// PUT /api/auth/update-password
// ```

// and your `api.js` requires:

// ```text
// Authorization: Bearer <JWT>
// ```

// So this is actually a **Change Password** page, not a true **Forgot Password** page.

// If you want the actual flow:

// ```text
// Login
//    ↓
// Dashboard
//    ↓
// Update Password
//    ↓
// Current Password
// New Password
// Confirm Password
//    ↓
// Password Updated
// ```

// then the code above is correct.

// If you want:

// ```text
// Login
//    ↓
// Forgot Password
//    ↓
// Username / Email
//    ↓
// Reset Password
//    ↓
// Login
// ```

// then we need to add a **public forgot-password/reset-password backend API**, because a real forgot-password flow cannot depend on an existing JWT token.
