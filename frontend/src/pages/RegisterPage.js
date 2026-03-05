
import React, { useEffect, useRef, useState } from "react";
import api from "../apiClient";
import { useNavigate, Link } from "react-router-dom";
import "./RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [emailExists, setEmailExists] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const emailCheckTimeout = useRef(null);

  // Validation functions
  const validateName = (value) => {
    if (!value) return "Name is required";
    return "";
  };
  const validateEmail = (value) => {
    if (!value) return "Email is required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return "Invalid email address";
    if (emailExists) return "Email already exists";
    return "";
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setTouched(t => ({ ...t, email: true }));
    setEmailExists(false);
    if (emailCheckTimeout.current) {
      clearTimeout(emailCheckTimeout.current);
    }
    // Debounce live uniqueness check while typing
    emailCheckTimeout.current = setTimeout(async () => {
      if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        try {
          setEmailChecking(true);
          const res = await api.post("/auth/check-email", { email: value });
          setEmailExists(!!res.data?.exists);
        } catch (err) {
          setEmailExists(false);
        } finally {
          setEmailChecking(false);
        }
      } else {
        setEmailChecking(false);
      }
    }, 350);
  };

  const handleEmailBlur = async () => {
    setTouched(t => ({ ...t, email: true }));
    // No-op; live validation handles this already
  };
  const validatePassword = (value) => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter";
    if (!/[0-9]/.test(value)) return "Password must contain at least one number";
    return "";
  };
  const validateConfirmPassword = (value) => {
    if (!value) return "Please confirm your password";
    if (value !== password) return "Passwords do not match";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    setError("");
    const cleanedName = name.trim();
    const cleanedEmail = email.trim();
    const nameError = validateName(cleanedName);
    const emailError = validateEmail(cleanedEmail);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    if (nameError || emailError || passwordError || confirmPasswordError) {
      setError(nameError || emailError || passwordError || confirmPasswordError);
      return;
    }
    if (emailExists) {
      setError("This email is already registered");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", { name: cleanedName, email: cleanedEmail, password });
      // Auto-login
      const loginRes = await api.post("/auth/login", { email: cleanedEmail, password });
      const token = loginRes.data.token;
      localStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (err) {
      const networkMsg = !err.response ? `Network error: cannot reach API at ${api.defaults.baseURL}` : null;
      setError(networkMsg || err.response?.data?.message || err.response?.data?.error || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="chem-header">
          <img src="https://cdn-icons-png.flaticon.com/512/2553/2553635.png" alt="colorful-chemistry-logo" className="chem-logo" />
          <h2>ChemConcept Bridge</h2>
          <p className="chem-subtext">Join our community of chemistry learners</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              className={touched.name && validateName(name) ? 'input-error' : ''}
            />
            {touched.name && validateName(name) && <p className="error-message">{validateName(name)}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              className={touched.email && validateEmail(email) ? 'input-error' : ''}
              autoComplete="off"
            />
            {touched.email && validateEmail(email) && <p className="error-message">{validateEmail(email)}</p>}
            {touched.email && !validateEmail(email) && emailChecking && (
              <p className="info-message">Checking email availability…</p>
            )}
            {touched.email && !emailChecking && email && !validateEmail(email) && emailExists && (
              <p className="error-message">This email is already registered</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a secure password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, password: true }))}
              className={touched.password && validatePassword(password) ? 'input-error' : ''}
              autoComplete="new-password"
            />
            {touched.password && validatePassword(password) && <p className="error-message">{validatePassword(password)}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, confirmPassword: true }))}
              className={touched.confirmPassword && validateConfirmPassword(confirmPassword) ? 'input-error' : ''}
              autoComplete="new-password"
            />
            {touched.confirmPassword && validateConfirmPassword(confirmPassword) && <p className="error-message">{validateConfirmPassword(confirmPassword)}</p>}
          </div>

          {error && <p className="error-message" style={{ marginTop: 10 }}>{error}</p>}

          <button
            type="submit"
            className="register-btn"
            disabled={loading || emailChecking || emailExists || !!validateEmail(email)}
          >
            {loading ? 'Registering...' : (emailExists ? 'Email Already Registered' : 'Create Account')}
          </button>
          <div className="divider"><span>OR</span></div>
          <div className="login-links">
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
            <Link to="/generate-password">Need help creating a secure password?</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
