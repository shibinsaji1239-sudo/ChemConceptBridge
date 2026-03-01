import React, { useState } from "react";
import "./LoginPage.css";
import { Link, useNavigate } from "react-router-dom";
import api from "../apiClient";
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // 🌐 Use Render backend when deployed, localhost otherwise
  // API base handled by shared api client (local dev defaults to http://localhost:10000/api)
  // Handle redirect-based Google auth results (fallback for popup issues/COP)
  React.useEffect(() => {
    const consumeRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result) return;
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const tokenId = credential?.idToken;
        if (!tokenId) return;
        const { data } = await api.post(`/auth/google-login`, { tokenId });
        localStorage.setItem("token", data.token);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userRole", data.user.role);
        const next = data.user.role === "admin" ? "/admin-dashboard" : data.user.role === "teacher" ? "/teacher-dashboard" : "/student-dashboard";
        navigate(next);
      } catch (e) {
        // Silent: user may have cancelled
      }
    };
    consumeRedirectResult();
  }, [navigate]);

  // Email validation
  const validateEmail = (value) => {
    if (!value) return "Email is required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return "Invalid email address";
    return "";
  };

  // Password validation
  const validatePassword = (value) => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter";
    if (!/[0-9]/.test(value)) return "Password must contain at least one number";
    return "";
  };

  // ======================
  // 📧 Email/Password Login
  // ======================
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError) {
      setError(emailError || passwordError);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/auth/login`, {
        email,
        password,
        rememberMe,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userRole", data.user.role);

      const next =
        data.user.role === "admin"
          ? "/admin-dashboard"
          : data.user.role === "teacher"
            ? "/teacher-dashboard"
            : "/student-dashboard";

      navigate(next);
    } catch (err) {
      console.error("Login error:", err);
      let errorMessage = "Login failed. Please try again.";

      if (err.message === "Network Error" || err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED") {
        errorMessage = "Cannot connect to server. Please ensure the backend server is running on http://localhost:10000";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 404) {
        errorMessage = "Server endpoint not found. Please check backend configuration.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // 🔐 Google Login
  // ======================
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Get Google ID token from Firebase
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const tokenId = credential?.idToken;

      if (!tokenId) throw new Error("Failed to retrieve Google token");

      // Send token to backend for verification
      const { data } = await api.post(`/auth/google-login`, {
        tokenId,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userRole", data.user.role);

      const next =
        data.user.role === "admin"
          ? "/admin-dashboard"
          : data.user.role === "teacher"
            ? "/teacher-dashboard"
            : "/student-dashboard";

      navigate(next);
    } catch (err) {
      console.error("Google login error:", err);
      // Fallback to redirect flow for environments with COOP/popup restrictions
      try {
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
        return;
      } catch (redirectErr) {
        if (err.code === "auth/popup-closed-by-user") {
          setError("Google login was cancelled.");
        } else if (err.code === "auth/popup-blocked") {
          setError("Popup blocked. Allow popups for this site.");
        } else if (err.code === "auth/unauthorized-domain") {
          setError("Unauthorized domain. Add this site in Firebase console.");
        } else {
          setError("Google login failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="chem-header">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2553/2553635.png"
            alt="logo"
            className="chem-logo"
          />
          <h2>ChemConcept Bridge</h2>
          <p>Empowering Students to Master Chemistry Concepts with AI</p>
        </div>

        <form onSubmit={handleLogin}>
          <label>Email Address</label>
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
          />

          <div className="password-label-row">
            <label>Password</label>
            <Link to="/forgot-password" className="forgot-password-link">Forgot Password?</Link>
          </div>
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember Me
          </label>

          {error && <p className="error-message">{error}</p>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Authenticating..." : "Sign In"}
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? "Connecting..." : "Sign in with Google"}
          </button>

          <div className="register-links">
            <p>
              Don’t have an account? <Link to="/register">Register Now</Link>
            </p>
            <Link to="/generate-password">Generate Secure Password</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
