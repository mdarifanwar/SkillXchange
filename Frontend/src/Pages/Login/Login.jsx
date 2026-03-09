import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { FaGoogle } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { getApiBaseUrl } from "../../util/baseUrl";
import { useUser } from "../../util/UserContext";
import { toast } from "react-toastify";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = `${getApiBaseUrl()}/auth/google`;
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (isSignup && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const apiBaseUrl = getApiBaseUrl();
    const endpoint = isSignup ? "/auth/signup" : "/auth/login";

    try {
      const res = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        toast.error("Server error. Please try again later.");
        setLoading(false);
        return;
      }
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      // Fetch full user details after login/signup
      const userRes = await fetch(`${apiBaseUrl}/user/registered/getDetails`, {
        credentials: "include",
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.data && userData.data.username) {
          setUser(userData.data);
          localStorage.setItem("userInfo", JSON.stringify(userData.data));
          toast.success(isSignup ? "Account created!" : "Login successful!");
          navigate(`/profile/${userData.data.username}`);
        } else {
          navigate("/discover");
        }
      } else {
        navigate("/discover");
      }
    } catch (err) {
      console.error("Auth error:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!forgotEmail.trim()) {
      setErrors({ forgotEmail: "Email is required" });
      return;
    }
    if (!emailRegex.test(forgotEmail)) {
      setErrors({ forgotEmail: "Please enter a valid email address" });
      return;
    }
    setErrors({});
    setForgotLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        toast.error("Server error. Please try again later.");
        setForgotLoading(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
      } else {
        setForgotSent(true);
        toast.success("Reset link sent! Check your email.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // ========== FORGOT PASSWORD VIEW ==========
  if (isForgotPassword) {
    return (
      <div className="login-page-container">
        <div className="login-card">
          <h1 className="login-title">RESET PASSWORD</h1>
          {forgotSent ? (
            <>
              <p className="login-subtitle">
                A password reset link has been sent to <strong>{forgotEmail}</strong>. Please check your inbox (and spam folder).
              </p>
              <button
                className="login-btn-submit"
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotSent(false);
                  setForgotEmail("");
                }}
              >
                Back to Login
              </button>
            </>
          ) : (
            <>
              <p className="login-subtitle">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form className="login-form" onSubmit={handleForgotPassword} noValidate>
                <div className="login-field">
                  <label className="login-label" htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email"
                    className={`login-input${errors.forgotEmail ? " login-input-error" : ""}`}
                    type="email"
                    placeholder="user@example.com"
                    autoComplete="email"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (errors.forgotEmail) setErrors({});
                    }}
                  />
                  {errors.forgotEmail && (
                    <span className="login-error-msg">{errors.forgotEmail}</span>
                  )}
                </div>
                <button className="login-btn-submit" type="submit" disabled={forgotLoading}>
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
              <p className="login-toggle-text">
                Remember your password?{" "}
                <button
                  className="login-toggle-btn"
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrors({});
                    setForgotEmail("");
                  }}
                >
                  Login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-container">
      <div className="login-card">
        <h1 className="login-title">{isSignup ? "SIGN UP" : "LOGIN"}</h1>
        <p className="login-subtitle">
          {isSignup
            ? "Create your account to get started."
            : "Welcome back! Please login to continue."}
        </p>

        <button className="login-btn-google" onClick={handleGoogleLogin}>
          <FaGoogle className="google-icon" style={{ fontSize: "1.2rem" }} />
          <span>{isSignup ? "Sign up with Google" : "Login with Google"}</span>
        </button>

        <div className="login-divider">
          <span className="login-divider-line"></span>
          <span className="login-divider-text">OR</span>
          <span className="login-divider-line"></span>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label className="login-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className={`login-input${errors.email ? " login-input-error" : ""}`}
              type="email"
              placeholder="user@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
              }}
            />
            {errors.email && (
              <span className="login-error-msg">{errors.email}</span>
            )}
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-password">
              Password
            </label>
            <div className="login-input-wrapper">
              <input
                id="login-password"
                className={`login-input${errors.password ? " login-input-error" : ""}`}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete={isSignup ? "new-password" : "current-password"}
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

          {!isSignup && (
            <div className="login-forgot-wrapper">
              <button
                className="login-forgot-btn"
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setErrors({});
                  setForgotEmail(email);
                }}
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            className="login-btn-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isSignup
              ? "Create Account"
              : "Login"}
          </button>
        </form>

        <p className="login-toggle-text">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button
            className="login-toggle-btn"
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setErrors({});
              setEmail("");
              setPassword("");
            }}
          >
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
