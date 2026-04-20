import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "../Login/Login.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/reset-password/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        toast.error("Server error. Please try again later.");
        setLoading(false);
        return;
      }
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
      } else {
        setSuccess(true);
        toast.success("Password reset successfully!");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <h1 className="login-title">NEW PASSWORD</h1>

        {success ? (
          <>
            <p className="login-subtitle">
              Your password has been reset successfully. You can now login with
              your new password.
            </p>
            <button
              className="login-btn-submit"
              type="button"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </>
        ) : (
          <>
            <p className="login-subtitle">
              Enter your new password below.
            </p>
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="login-field">
                <label className="login-label" htmlFor="new-password">
                  New Password
                </label>
                <div className="login-input-wrapper">
                  <input
                    id="new-password"
                    className={`login-input${errors.password ? " login-input-error" : ""}`}
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password)
                        setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && (
                  <span className="login-error-msg">{errors.password}</span>
                )}
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <div className="login-input-wrapper">
                  <input
                    id="confirm-password"
                    className={`login-input${errors.confirmPassword ? " login-input-error" : ""}`}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }}
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="login-error-msg">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>

              <button
                className="login-btn-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
