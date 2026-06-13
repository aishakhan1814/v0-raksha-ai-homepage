"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setError("Phone number and password are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Store user in localstorage for legacy dashboard wiring
        localStorage.setItem("raksha_user", JSON.stringify({
          phone: data.donor?.phone,
          email: data.donor?.email || "",
          role: "donor",
          name: `${data.donor?.firstName || ""} ${data.donor?.lastName || ""}`.trim()
        }));
        localStorage.setItem("donorPhone", data.donor?.phone);
        localStorage.setItem("donorName", `${data.donor?.firstName || ""} ${data.donor?.lastName || ""}`.trim());

        router.push("/dashboard/donor");
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .inp-login {
          width: 100%;
          background: rgba(17,30,55,0.8);
          border: 1px solid rgba(107,114,128,0.25);
          color: #FAF9F7;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          padding: 14px 16px;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s;
          border-radius: 0px;
        }
        .inp-login:focus {
          border-color: #C0152A;
          box-shadow: 0 0 0 3px rgba(192,21,42,0.12);
        }
        .btn-login {
          width: 100%;
          background: #C0152A;
          color: #FAF9F7;
          border: none;
          padding: 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
          border-radius: 0px;
        }
        .btn-login:hover {
          background: #a8111f;
        }
        .btn-login:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0A1628", color: "#FAF9F7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: "400px", background: "#111827", border: "1px solid #1e293b", padding: "40px 32px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: "32px" }}>
            <svg viewBox="0 0 48 56" fill="none" width="30" height="35">
              <path d="M24 2L44 11V30C44 43 24 54 24 54S4 43 4 30V11Z" fill="#8B1A2A" />
              <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem", fontWeight: 700, color: "#FAF9F7" }}>
                Raksha<span style={{ color: "#2CA8A0" }}>AI</span>
              </span>
              <span style={{ fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#6B7280", marginTop: 2 }}>
                Donor Authentication
              </span>
            </div>
          </div>

          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 600, color: "#FAF9F7", marginBottom: "8px", textAlign: "center" }}>
            Donor Login
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#9CA3AF", textAlign: "center", marginBottom: "32px", fontWeight: 300 }}>
            Enter your phone number to access your donor dashboard.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: "6px" }}>
                Phone Number
              </label>
              <input
                type="tel"
                className="inp-login"
                placeholder="e.g. +919999999999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>

            <div>
              <label style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: "6px" }}>
                Password
              </label>
              <input
                type="password"
                className="inp-login"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{ background: "rgba(192,21,42,0.1)", border: "1px solid rgba(192,21,42,0.3)", padding: "12px 14px", color: "#E8897A", fontSize: "0.85rem", fontWeight: 300, display: "flex", gap: "8px" }}>
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.8rem" }}>
            <span style={{ color: "#9CA3AF" }}>Don't have an account? </span>
            <a href="/register/donor" style={{ color: "#2CA8A0", textDecoration: "none", fontWeight: 600 }}>
              Register Here
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
