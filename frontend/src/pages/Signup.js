import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  authApi,
  getCurrentUser,
  getAccessToken,
  setAuthSession,
} from "../services/api";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanUsername =
      String(username || "").trim();

    const cleanCurrentPassword =
      String(currentPassword || "");

    /*
     * ==================================================
     * VALIDATION
     * ==================================================
     */

    if (!cleanUsername) {
      setError(
        "Please enter owner username."
      );
      return;
    }

    if (!cleanCurrentPassword) {
      setError(
        "Please enter your current password."
      );
      return;
    }

    /*
     * ==================================================
     * CHECK LOGIN SESSION
     * ==================================================
     */

    const currentUser =
      getCurrentUser();

    const token =
      getAccessToken();

    /*
     * The Update Account page requires
     * the owner to already be logged in.
     */

    if (!currentUser) {
      setError(
        "You are not logged in. Please login first."
      );
      return;
    }

    if (!token) {
      setError(
        "Your login session has expired. Please login again."
      );
      return;
    }

    /*
     * ==================================================
     * CHECK OWNER ROLE
     * ==================================================
     */

    const role =
      String(
        currentUser?.role || ""
      ).trim().toLowerCase();

    if (
      role !== "owner" &&
      role !== "administrator"
    ) {
      setError(
        "Only the owner can update the owner username."
      );
      return;
    }

    /*
     * ==================================================
     * START LOADING
     * ==================================================
     */

    setLoading(true);

    try {
      /*
       * ==================================================
       * UPDATE OWNER USERNAME
       * ==================================================
       *
       * The existing JWT will automatically be sent
       * by api.js interceptor.
       */

      const res =
        await authApi.updateOwner({
          username: cleanUsername,
          current_password:
            cleanCurrentPassword,
        });

      /*
       * ==================================================
       * GET RESPONSE USER
       * ==================================================
       */

      const updatedUser =
        res?.data?.user ||
        null;

      /*
       * ==================================================
       * GET NEW JWT
       * ==================================================
       */

      const newToken =
        res?.data?.access ||
        res?.data?.token ||
        res?.data?.access_token ||
        null;

      /*
       * ==================================================
       * SAVE AUTH SESSION
       * ==================================================
       */

      if (updatedUser) {
        setAuthSession(
          newToken || token,
          updatedUser
        );
      } else {
        /*
         * If backend doesn't return user,
         * update the existing local user.
         */

        const updatedLocalUser = {
          ...currentUser,
          username:
            cleanUsername,
        };

        setAuthSession(
          newToken || token,
          updatedLocalUser
        );
      }

      /*
       * ==================================================
       * SUCCESS
       * ==================================================
       */

      setSuccess(
        "Owner username updated successfully."
      );

      setCurrentPassword("");

      /*
       * ==================================================
       * REDIRECT
       * ==================================================
       */

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } catch (error) {
      console.error(
        "Owner username update failed:",
        error
      );

      const status =
        error?.response?.status;

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        "";

      /*
       * ==================================================
       * 401
       * ==================================================
       */

      if (status === 401) {
        setError(
          backendMessage ||
          "Current password is incorrect or your login session has expired. Please login again."
        );
      }

      /*
       * ==================================================
       * 400
       * ==================================================
       */

      else if (status === 400) {
        setError(
          backendMessage ||
          "Unable to update owner username. Please check the entered details."
        );
      }

      /*
       * ==================================================
       * 403
       * ==================================================
       */

      else if (status === 403) {
        setError(
          backendMessage ||
          "You do not have permission to update the owner account."
        );
      }

      /*
       * ==================================================
       * OTHER ERROR
       * ==================================================
       */

      else {
        setError(
          backendMessage ||
          error?.message ||
          "Owner username update failed."
        );
      }

    } finally {
      setLoading(false);
    }
  }

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
            UPDATE ACCOUNT
          </div>

        </div>


        {/* ==================================================
            FORM
        ================================================== */}

        <form onSubmit={submit}>

          {/* ==================================================
              OWNER USERNAME
          ================================================== */}

          <div className="login-field">

            <label htmlFor="owner-username">
              Owner Username
            </label>

            <input
              id="owner-username"
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
              placeholder="Enter new owner username"
              autoComplete="username"
              disabled={loading}
              required
            />

          </div>


          {/* ==================================================
              CURRENT PASSWORD
          ================================================== */}

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


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          {/* ==================================================
              SUCCESS
          ================================================== */}

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


          {/* ==================================================
              UPDATE BUTTON
          ================================================== */}

          <button
            type="submit"
            className="primary login-btn"
            disabled={loading}
          >
            {loading
              ? "Updating..."
              : "Update Owner Account"}
          </button>


          {/* ==================================================
              FORGOT PASSWORD
          ================================================== */}

          <div
            style={{
              textAlign: "center",
              marginTop: "16px",
            }}
          >

            <Link
              to="/forgot-password"
              style={{
                color: "#145a96",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Forgot Password?
            </Link>

          </div>


          {/* ==================================================
              BACK TO LOGIN
          ================================================== */}

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