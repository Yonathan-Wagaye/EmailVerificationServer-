// src/App.js
import React, { useMemo, useState, useEffect } from "react";
import "./App.css";

// Use environment variable for API URL, fallback to Netlify Functions
const API_BASE = process.env.REACT_APP_API_BASE || "https://verifyemailserver.netlify.app/.netlify/functions";

function maskEmail(e) {
  if (!e || !e.includes("@")) return e || "";
  const [user, dom] = e.split("@");
  const u = user.length <= 2 ? user : `${user.slice(0, 2)}***`;
  return `${u}@${dom}`;
}



export default function App() {
  const [step, setStep] = useState("email"); // 'email' | 'code' | 'success'
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds for resend

  // simple email regex for UX (server still validates)
  const emailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email]
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function sendCode(e) {
    e?.preventDefault?.();
    setError(""); setMessage("");
    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage("✅ Code sent! Check your inbox.");
        setStep("code");
        setCooldown(30); // 30s before user can resend
      } else {
        setError(data.error || "Failed to send code.");
      }
    } catch {
      setError("Network error—could not reach server.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e) {
    e.preventDefault();
    setError(""); setMessage("");
    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.verified) {
        setMessage("🎉 Email verified successfully!");
        setStep("success");
      } else {
        setError(data.message || "Invalid or expired code.");
      }
    } catch {
      setError("Network error—could not reach server.");
    } finally {
      setLoading(false);
    }
  }

  const onCodeChange = (v) => {
    // keep only digits, max length 6
    const digits = v.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
  };

  return (
    <div className="container">
      <h1>Email Verification</h1>

      {step === "email" && (
        <form onSubmit={sendCode}>
          <label htmlFor="email">Your email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            autoComplete="email"
          />
          <button type="submit" disabled={loading || !emailValid}>
            {loading ? "Sending…" : "Send Verification Code"}
          </button>
          {!emailValid && email.length > 0 && (
            <p className="hint">Enter a valid email like name@domain.com</p>
          )}
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyCode}>
          <p>We sent a code to <strong>{maskEmail(email)}</strong></p>

          <label htmlFor="code">Enter 6-digit code</label>
          <input
            id="code"
            inputMode="numeric"
            pattern="\d{6}"
            title="6 digits"
            placeholder="123456"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              onCodeChange(e.clipboardData.getData("text"));
            }}
          />

          <button type="submit" disabled={loading || code.length !== 6}>
            {loading ? "Verifying…" : "Verify Code"}
          </button>

          <div className="row">
            <button
              type="button"
              className="linkbtn"
              onClick={() => setStep("email")}
              disabled={loading}
            >
              Change email
            </button>
            <button
              type="button"
              onClick={sendCode}
              disabled={loading || cooldown > 0}
              title={cooldown > 0 ? `You can resend in ${cooldown}s` : ""}
            >
              {cooldown > 0 ? `Resend (${cooldown}s)` : "Resend code"}
            </button>
          </div>
        </form>
      )}

      {step === "success" && (
        <div className="success">
          <div className="big">✅</div>
          <h2>Verified!</h2>
          <p>{maskEmail(email)} has been verified.</p>
          <p className="dim">You can safely continue to the next step.</p>
        </div>
      )}

      {message && <p className="message">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
