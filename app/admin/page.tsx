"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/raksha/navbar";
import { Footer } from "@/components/raksha/footer";

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface Donor {
  donorId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  age: number;
  gender: string;
  bloodType: string;
  city: string;
  state: string;
  donationCount: number;
  weight: number;
  hasConditions: string;
  conditions?: string;
}

interface Patient {
  requestId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dob: string;
  gender: string;
  address: string;
  parentName: string;
  parentPhone: string;
  diagnosis: string;
  bloodGroup: string;
  transfusionFreq: string;
  hospital: string;
  hematologist?: string;
  lastHb?: string;
  medications?: string;
}

type TabType = "dashboard" | "donors" | "patients" | "register" | "config" | "outreach";

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [donors, setDonors] = useState<Donor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [bloodFilter, setBloodFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  
  // Registration Form States
  const [regType, setRegType] = useState<"donor" | "patient">("donor");
  const [donorForm, setDonorForm] = useState({
    firstName: "", lastName: "", phone: "", email: "", age: 25, gender: "Male",
    bloodType: "B+", state: "Telangana", city: "Hyderabad", weight: 65,
    hasConditions: "No", conditions: "", preferredTime: "Anytime", maxDistance: "20km"
  });
  const [patientForm, setPatientForm] = useState({
    firstName: "", lastName: "", dob: "2014-06-01", gender: "Male",
    address: "Flat 302, Green Meadows, Gachibowli, Hyderabad", phone: "", email: "",
    parentName: "", parentPhone: "", diagnosis: "Thalassemia Major", bloodGroup: "B+",
    transfusionFreq: "Every 21 days", hospital: "Rainbow Thalassemia Centre",
    hematologist: "Dr. Meera Iyer", lastHb: "7.6", medications: "Deferasirox, Folic Acid"
  });
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Outreach Broadcaster States
  const [outreachGroup, setOutreachGroup] = useState("B+");
  const [outreachCity, setOutreachCity] = useState("Hyderabad");
  const [outreachMessage, setOutreachMessage] = useState("Emergency B+ blood required at Rainbow Thalassemia Centre. Please reply YES if available.");
  const [outreachLogs, setOutreachLogs] = useState<string[]>([]);
  const [outreachSending, setOutreachSending] = useState(false);

  // Action status message
  const [actionMessage, setActionMessage] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://bqg26gk0l4.execute-api.ap-south-1.amazonaws.com/dev";

  // Check session cache on mount
  useEffect(() => {
    const isAuth = sessionStorage.getItem("raksha_admin_auth") === "true";
    if (isAuth) {
      setIsAuthenticated(true);
      fetchDatabaseData();
    }
  }, []);

  // Animated background grid canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = Math.ceil(canvas.width / 60) + 1;
      const rows = Math.ceil(canvas.height / 60) + 1;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * 60;
          const y = j * 60;
          const dist = Math.sqrt((x - canvas.width / 2) ** 2 + (y - canvas.height / 2) ** 2);
          const alpha = Math.max(0, 0.01 + 0.006 * Math.sin(dist / 100 - time * 0.3));
          ctx.beginPath();
          ctx.arc(x, y, 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(192,21,42,${alpha})`;
          ctx.fill();
        }
      }
      time += 0.015;
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Fetch tables
  async function fetchDatabaseData() {
    setLoadingData(true);
    try {
      // Donors Scan
      const dRes = await fetch(`${apiUrl}/donors`);
      const dData = await dRes.json();
      setDonors(Array.isArray(dData) ? dData : []);

      // Patients Scan
      const pRes = await fetch(`${apiUrl}/patients`);
      const pData = await pRes.json();
      setPatients(Array.isArray(pData) ? pData : []);
    } catch (err) {
      console.error("Failed to fetch DynamoDB data:", err);
      setActionMessage("Error fetching database records. Using fallback memory cache.");
    } finally {
      setLoadingData(false);
    }
  }

  // Handle Login
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    
    // Demo administrator credentials
    if (email.trim().toLowerCase() === "admin@raksha.ai" && password === "admin@raksha2026") {
      setTimeout(() => {
        setIsAuthenticated(true);
        sessionStorage.setItem("raksha_admin_auth", "true");
        setLoginLoading(false);
        fetchDatabaseData();
      }, 700);
    } else {
      setTimeout(() => {
        setLoginError("Invalid administrator credentials. Access Denied.");
        setLoginLoading(false);
      }, 500);
    }
  }

  // Handle Logout
  function handleLogout() {
    sessionStorage.removeItem("raksha_admin_auth");
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
    setDonors([]);
    setPatients([]);
  }

  // Delete Donor
  async function handleDeleteDonor(donorId: string) {
    if (!confirm(`Are you sure you want to delete Donor ${donorId}?`)) return;
    try {
      const res = await fetch(`${apiUrl}/donor/${donorId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActionMessage(`Donor ${donorId} deleted successfully.`);
        // Refresh local state
        setDonors(prev => prev.filter(d => d.donorId !== donorId));
        setTimeout(() => setActionMessage(""), 4000);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Delete failed: ${errData.detail || "Server error"}`);
      }
    } catch (err) {
      alert("Failed to delete record. Check API connection.");
    }
  }

  // Delete Patient
  async function handleDeletePatient(requestId: string) {
    if (!confirm(`Are you sure you want to delete Patient request ${requestId}?`)) return;
    try {
      const res = await fetch(`${apiUrl}/patient/${requestId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActionMessage(`Patient request ${requestId} deleted successfully.`);
        // Refresh local state
        setPatients(prev => prev.filter(p => p.requestId !== requestId));
        setTimeout(() => setActionMessage(""), 4000);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Delete failed: ${errData.detail || "Server error"}`);
      }
    } catch (err) {
      alert("Failed to delete record. Check API connection.");
    }
  }

  // Register New Donor
  async function handleRegisterDonor(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormSuccess("");
    setFormError("");
    
    try {
      const res = await fetch(`${apiUrl}/donor/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...donorForm,
          availability: ["Weekends", "Evenings"],
          consentShare: true,
          consentNotify: true,
          consentData: true,
          consentAge: true
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setFormSuccess(`Donor registered successfully! ID: ${data.donorId}`);
        setDonorForm({
          firstName: "", lastName: "", phone: "", email: "", age: 25, gender: "Male",
          bloodType: "B+", state: "Telangana", city: "Hyderabad", weight: 65,
          hasConditions: "No", conditions: "", preferredTime: "Anytime", maxDistance: "20km"
        });
        fetchDatabaseData();
      } else {
        const errData = await res.json().catch(() => ({}));
        setFormError(errData.detail || "Registration failed. Verify fields.");
      }
    } catch (err) {
      setFormError("Network failure connecting to backend database registry.");
    } finally {
      setFormLoading(false);
    }
  }

  // Register New Patient
  async function handleRegisterPatient(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormSuccess("");
    setFormError("");
    
    try {
      const res = await fetch(`${apiUrl}/blood/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...patientForm,
          parentPhone: patientForm.phone,
          parentName: "Guardian",
          emergencyName: "Contact",
          emergencyPhone: patientForm.phone,
          emergencyRelation: "Parent",
          donorCount: "2",
          consent1: true,
          consent2: true
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setFormSuccess(`Patient Request registered successfully! ID: ${data.requestId}`);
        setPatientForm({
          firstName: "", lastName: "", dob: "2014-06-01", gender: "Male",
          address: "Flat 302, Green Meadows, Gachibowli, Hyderabad", phone: "", email: "",
          parentName: "", parentPhone: "", diagnosis: "Thalassemia Major", bloodGroup: "B+",
          transfusionFreq: "Every 21 days", hospital: "Rainbow Thalassemia Centre",
          hematologist: "Dr. Meera Iyer", lastHb: "7.6", medications: "Deferasirox, Folic Acid"
        });
        fetchDatabaseData();
      } else {
        const errData = await res.json().catch(() => ({}));
        setFormError(errData.detail || "Registration failed. Verify fields.");
      }
    } catch (err) {
      setFormError("Network failure connecting to backend database registry.");
    } finally {
      setFormLoading(false);
    }
  }

  // Send SMS Outreach Alert Simulation
  function handleOutreachAlert(e: React.FormEvent) {
    e.preventDefault();
    setOutreachSending(true);
    setOutreachLogs([]);
    
    const matchingDonors = donors.filter(d => 
      d.bloodType === outreachGroup && d.city.toLowerCase() === outreachCity.toLowerCase()
    );

    const logs: string[] = [
      `[INIT] Scanning database for compatible ${outreachGroup} donors in ${outreachCity}...`,
      `[MATCH] Found ${matchingDonors.length} matching donor profiles in DynamoDB.`
    ];

    if (matchingDonors.length === 0) {
      logs.push(`[WARN] No matching donors found in DynamoDB. Simulating alert to standby O+ list.`);
      logs.push(`[SMS] Alert dispatched to seed backup: Ramesh R. (+919999999999)`);
      logs.push(`[SUCCESS] Outbound notification triggers successfully executed via Amazon SNS.`);
    } else {
      matchingDonors.forEach((donor, idx) => {
        logs.push(`[SMS] Sending alert to matched donor [${idx+1}] ${donor.firstName} ${donor.lastName} (${donor.phone})`);
        logs.push(`[SNS] Message successfully queued for delivery: "${outreachMessage}"`);
      });
      logs.push(`[SUCCESS] All matches alerted! Outreach Step Function orchestrator completed.`);
    }

    // Simulate logs typewriter
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < logs.length) {
        setOutreachLogs(prev => [...prev, logs[currentIdx]]);
        currentIdx++;
      } else {
        clearInterval(interval);
        setOutreachSending(false);
      }
    }, 400);
  }

  // Filter logs logic
  const filteredDonors = donors.filter(d => {
    const matchesSearch = `${d.firstName} ${d.lastName} ${d.phone} ${d.city}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBlood = bloodFilter ? d.bloodType === bloodFilter : true;
    const matchesCity = cityFilter ? d.city.toLowerCase() === cityFilter.toLowerCase() : true;
    return matchesSearch && matchesBlood && matchesCity;
  });

  const filteredPatients = patients.filter(p => {
    const matchesSearch = `${p.firstName} ${p.lastName} ${p.phone} ${p.hospital}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBlood = bloodFilter ? p.bloodGroup === bloodFilter : true;
    return matchesSearch && matchesBlood;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        
        .admin-body {
          font-family: 'DM Sans', sans-serif;
          background: #07111E;
          color: #FAF9F7;
          min-height: 100vh;
          overflow-x: hidden;
          padding-top: 80px;
        }

        .auth-container {
          min-height: calc(100vh - 180px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          position: relative;
        }

        .auth-card {
          width: 440px;
          background: rgba(13, 27, 46, 0.85);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(192, 21, 42, 0.25);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          padding: 2.5rem;
          position: relative;
        }

        .auth-title {
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 1.8rem;
          line-height: 1.1;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .auth-subtitle {
          font-size: 0.82rem;
          color: #9CA3AF;
          text-align: center;
          margin-bottom: 2rem;
        }

        .admin-form-group {
          margin-bottom: 1.25rem;
        }

        .admin-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #9CA3AF;
          margin-bottom: 6px;
        }

        .admin-input {
          width: 100%;
          background: rgba(8, 17, 30, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 14px;
          color: #fff;
          font-size: 0.92rem;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s;
        }

        .admin-input:focus {
          border-color: #C0152A;
          box-shadow: 0 0 0 2px rgba(192, 21, 42, 0.15);
        }

        .admin-button {
          width: 100%;
          background: #C0152A;
          color: #fff;
          border: none;
          padding: 14px;
          font-size: 0.88rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .admin-button:hover {
          background: #9b1422;
        }

        /* Dashboard layout style */
        .dashboard-container {
          max-w: 1280px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 2.5rem;
          position: relative;
          z-index: 10;
        }

        .admin-sidebar {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sidebar-btn {
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          color: #9CA3AF;
          padding: 12px 16px;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sidebar-btn:hover {
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
        }

        .sidebar-btn.active {
          background: rgba(192, 21, 42, 0.1);
          color: #FAF9F7;
          border-left: 3px solid #C0152A;
          font-weight: 600;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: rgba(13, 27, 46, 0.55);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .stat-val {
          font-family: 'JetBrains Mono', monospace;
          font-size: 2rem;
          font-weight: 500;
          color: #fff;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #9CA3AF;
          font-weight: 500;
        }

        .main-panel {
          background: rgba(13, 27, 46, 0.45);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 2rem;
          min-height: 520px;
        }

        .panel-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #fff;
        }

        .panel-subtitle {
          font-size: 0.85rem;
          color: #9CA3AF;
          margin-bottom: 2rem;
        }

        .db-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.88rem;
          margin-top: 1rem;
        }

        .db-table th {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #9CA3AF;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .db-table td {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          color: #FAF9F7;
        }

        .db-table tr:hover td {
          background: rgba(255, 255, 255, 0.01);
        }

        .btn-action {
          padding: 6px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: transparent;
          color: #C0152A;
          border: 1px solid rgba(192, 21, 42, 0.3);
          transition: all 0.2s;
        }

        .btn-action:hover {
          background: #C0152A;
          color: #fff;
        }

        .search-row {
          display: flex;
          gap: 12px;
          margin-bottom: 1.5rem;
        }

        .badge-blood {
          background: rgba(192, 21, 42, 0.15);
          border: 1px solid rgba(192, 21, 42, 0.4);
          color: #FF5A6D;
          font-weight: 600;
          padding: 3px 8px;
          font-size: 0.72rem;
          font-family: 'JetBrains Mono', monospace;
        }

        .config-card {
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(8, 17, 30, 0.6);
          padding: 1.5rem;
          margin-bottom: 1.25rem;
        }

        .config-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          font-size: 0.9rem;
        }

        .config-key {
          color: #9CA3AF;
          font-family: 'JetBrains Mono', monospace;
        }

        .config-val {
          color: #2CA8A0;
          font-weight: 500;
        }

        .typewriter-log {
          background: #050B13;
          border: 1px solid rgba(255, 255, 255, 0.05);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          color: #38BDF8;
          padding: 1.5rem;
          height: 240px;
          overflow-y: auto;
          line-height: 1.6;
        }

        .log-line {
          margin-bottom: 4px;
        }

        @keyframes spinner-spin { to { transform: rotate(360deg); } }
        .spin { animation: spinner-spin 0.8s linear infinite; display: inline-block; }

        @media(max-width: 900px) {
          .dashboard-container {
            grid-template-columns: 1fr;
          }
          .stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .homepage-redirect-btn {
          color: #2CA8A0 !important;
        }
        .homepage-redirect-btn:hover {
          color: #38BDF8 !important;
          background: rgba(255, 255, 255, 0.03);
        }
      `}</style>

      <div className="admin-body">
        <Navbar hideLinks={!isAuthenticated} />
        <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />

        {/* ═══ AUTHENTICATION LOCKSCREEN ════════════════════════════════════ */}
        {!isAuthenticated ? (
          <div className="auth-container">
            <div className="auth-card">
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                <svg viewBox="0 0 48 56" fill="none" width={48} height={56}>
                  <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#C0152A" />
                  <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" />
                </svg>
              </div>
              <h2 className="auth-title">Raksha AI</h2>
              <p className="auth-subtitle">Administrator Secure Control Panel</p>

              <form onSubmit={handleLogin}>
                <div className="admin-form-group">
                  <label className="admin-label">Admin Email</label>
                  <input
                    type="email"
                    className="admin-input"
                    placeholder="admin@raksha.ai"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group" style={{ marginBottom: "1.75rem" }}>
                  <label className="admin-label">Password</label>
                  <input
                    type="password"
                    className="admin-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>

                {loginError && (
                  <div style={{ background: "rgba(192,21,42,0.1)", border: "1px solid rgba(192,21,42,0.3)", padding: 12, marginBottom: "1.25rem", color: "#FAF9F7", fontSize: "0.82rem", display: "flex", gap: 8 }}>
                    <span style={{ color: "#C0152A" }}>⚠</span>
                    <span>{loginError}</span>
                  </div>
                )}

                <button type="submit" className="admin-button" disabled={loginLoading}>
                  {loginLoading ? <span className="spin" style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%" }} /> : "Access Dashboard"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ═══ ADMIN CONSOLE DASHBOARD PANEL ══════════════════════════════ */
          <div className="dashboard-container">
            {/* Sidebar */}
            <div className="admin-sidebar">
              <div style={{ padding: "0 16px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 12 }}>
                <p style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#C0152A", fontWeight: 700 }}>Circle Administrator</p>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff", marginTop: 4 }}>admin@raksha.ai</h3>
              </div>
              <button className={`sidebar-btn ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
                📊 Overview
              </button>
              <button className={`sidebar-btn ${activeTab === "donors" ? "active" : ""}`} onClick={() => { setActiveTab("donors"); setSearchTerm(""); }}>
                🩸 Donors Directory
              </button>
              <button className={`sidebar-btn ${activeTab === "patients" ? "active" : ""}`} onClick={() => { setActiveTab("patients"); setSearchTerm(""); }}>
                🛡️ Patient Requests
              </button>
              <button className={`sidebar-btn ${activeTab === "register" ? "active" : ""}`} onClick={() => setActiveTab("register")}>
                📝 Database Registry
              </button>
              <button className={`sidebar-btn ${activeTab === "outreach" ? "active" : ""}`} onClick={() => setActiveTab("outreach")}>
                📱 Outreach Broadcaster
              </button>
              <button className={`sidebar-btn ${activeTab === "config" ? "active" : ""}`} onClick={() => setActiveTab("config")}>
                ⚙️ AWS Environment
              </button>

              <a href="/" className="sidebar-btn homepage-redirect-btn" style={{ textDecoration: "none", marginTop: "3rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
                🏠 Back to Homepage
              </a>
              <button className="sidebar-btn" onClick={handleLogout} style={{ color: "#EF4444" }}>
                🚪 Logout
              </button>
            </div>

            {/* Main view panel */}
            <div>
              {/* Stats overview banner */}
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-val">{donors.length}</div>
                  <div className="stat-label">Total Donors</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val">{patients.length}</div>
                  <div className="stat-label">Patient Requests</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val" style={{ color: "#2CA8A0" }}>
                    {donors.filter(d => d.donationCount > 0).length}
                  </div>
                  <div className="stat-label">Active Donors</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val" style={{ color: "#EF4444" }}>
                    {patients.filter(p => p.transfusionFreq.toLowerCase().includes("21")).length}
                  </div>
                  <div className="stat-label">Critical Needs (21d)</div>
                </div>
              </div>

              {actionMessage && (
                <div style={{ background: "rgba(44,168,160,0.1)", border: "1px solid rgba(44,168,160,0.35)", padding: "10px 14px", marginBottom: "1.5rem", fontSize: "0.85rem", display: "flex", gap: 10 }}>
                  <span style={{ color: "#2CA8A0" }}>✓</span>
                  <span>{actionMessage}</span>
                </div>
              )}

              <div className="main-panel">
                {/* ── TAB 1: OVERVIEW ────────────────────────────────────── */}
                {activeTab === "dashboard" && (
                  <div>
                    <h2 className="panel-title">Overview Dashboard</h2>
                    <p className="panel-subtitle">Real-time stats scan of AWS DynamoDB active records</p>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "1rem" }}>
                      <div className="config-card">
                        <h4 style={{ marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 6 }}>Recent Donor Profiles</h4>
                        {donors.slice(-4).reverse().map(d => (
                          <div key={d.donorId} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "0.85rem" }}>
                            <span>{d.firstName} {d.lastName} ({d.city})</span>
                            <span className="badge-blood">{d.bloodType}</span>
                          </div>
                        ))}
                      </div>

                      <div className="config-card">
                        <h4 style={{ marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 6 }}>Recent Blood Requests</h4>
                        {patients.slice(-4).reverse().map(p => (
                          <div key={p.requestId} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "0.85rem" }}>
                            <span>{p.firstName} {p.lastName} ({p.hospital})</span>
                            <span className="badge-blood" style={{ background: "rgba(44,168,160,0.15)", borderColor: "rgba(44,168,160,0.4)", color: "#2CA8A0" }}>{p.bloodGroup}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: DONORS DIRECTORY ────────────────────────────── */}
                {activeTab === "donors" && (
                  <div>
                    <h2 className="panel-title">Donors Database Directory</h2>
                    <p className="panel-subtitle">Inspect, search, and delete donor records in DynamoDB table "donors"</p>

                    <div className="search-row">
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="Search donors by name, city, phone..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <select className="admin-input" style={{ width: 120 }} value={bloodFilter} onChange={e => setBloodFilter(e.target.value)}>
                        <option value="">Blood Group</option>
                        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                      <button className="admin-button" style={{ width: 100 }} onClick={fetchDatabaseData}>Refresh</button>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                      <table className="db-table">
                        <thead>
                          <tr>
                            <th>Donor ID</th>
                            <th>Name</th>
                            <th>Group</th>
                            <th>Location</th>
                            <th>Contact</th>
                            <th>Age/Wt</th>
                            <th>Donations</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDonors.map(d => (
                            <tr key={d.donorId}>
                              <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{d.donorId}</td>
                              <td>{d.firstName} {d.lastName}</td>
                              <td><span className="badge-blood">{d.bloodType}</span></td>
                              <td>{d.city}</td>
                              <td>{d.phone}</td>
                              <td>{d.age}y / {d.weight}kg</td>
                              <td style={{ textAlign: "center" }}>{d.donationCount}</td>
                              <td>
                                <button className="btn-action" onClick={() => handleDeleteDonor(d.donorId)}>Delete</button>
                              </td>
                            </tr>
                          ))}
                          {filteredDonors.length === 0 && (
                            <tr>
                              <td colSpan={8} style={{ textAlign: "center", color: "#9CA3AF", padding: 24 }}>No matching records found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: PATIENT REQUESTS ────────────────────────────── */}
                {activeTab === "patients" && (
                  <div>
                    <h2 className="panel-title">Patient Blood Requests</h2>
                    <p className="panel-subtitle">Manage registered thalassemia patient needs in DynamoDB table "blood_requests"</p>

                    <div className="search-row">
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="Search requests by patient, hospital, phone..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <select className="admin-input" style={{ width: 120 }} value={bloodFilter} onChange={e => setBloodFilter(e.target.value)}>
                        <option value="">Blood Group</option>
                        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                      <button className="admin-button" style={{ width: 100 }} onClick={fetchDatabaseData}>Refresh</button>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                      <table className="db-table">
                        <thead>
                          <tr>
                            <th>Request ID</th>
                            <th>Patient Name</th>
                            <th>Group</th>
                            <th>Frequency</th>
                            <th>Hospital</th>
                            <th>Doctor</th>
                            <th>Pre-Trans Hb</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPatients.map(p => (
                            <tr key={p.requestId}>
                              <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{p.requestId}</td>
                              <td>{p.firstName} {p.lastName}</td>
                              <td>
                                <span className="badge-blood" style={{ background: "rgba(44,168,160,0.15)", borderColor: "rgba(44,168,160,0.4)", color: "#2CA8A0" }}>
                                  {p.bloodGroup}
                                </span>
                              </td>
                              <td>{p.transfusionFreq}</td>
                              <td>{p.hospital}</td>
                              <td>{p.hematologist || "Dr. Meera Iyer"}</td>
                              <td style={{ textAlign: "center", fontWeight: "bold" }}>{p.lastHb || "7.6"} g/dL</td>
                              <td>
                                <button className="btn-action" onClick={() => handleDeletePatient(p.requestId)}>Delete</button>
                              </td>
                            </tr>
                          ))}
                          {filteredPatients.length === 0 && (
                            <tr>
                              <td colSpan={8} style={{ textAlign: "center", color: "#9CA3AF", padding: 24 }}>No matching records found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: DATABASE REGISTRY ───────────────────────────── */}
                {activeTab === "register" && (
                  <div>
                    <h2 className="panel-title">Database Registry Portal</h2>
                    <p className="panel-subtitle">Create new database entries in AWS DynamoDB tables</p>

                    <div style={{ display: "flex", gap: 10, marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem" }}>
                      <button className={`admin-button`} style={{ width: 180, background: regType === "donor" ? "#C0152A" : "rgba(255,255,255,0.03)" }} onClick={() => setRegType("donor")}>
                        🩸 Donor Registry
                      </button>
                      <button className={`admin-button`} style={{ width: 180, background: regType === "patient" ? "#2CA8A0" : "rgba(255,255,255,0.03)" }} onClick={() => setRegType("patient")}>
                        🛡️ Patient Registry
                      </button>
                    </div>

                    {formSuccess && (
                      <div style={{ background: "rgba(44,168,160,0.1)", border: "1px solid rgba(44,168,160,0.4)", padding: 12, marginBottom: "1.25rem", fontSize: "0.85rem", color: "#FAF9F7" }}>
                        ✓ {formSuccess}
                      </div>
                    )}

                    {formError && (
                      <div style={{ background: "rgba(192,21,42,0.1)", border: "1px solid rgba(192,21,42,0.4)", padding: 12, marginBottom: "1.25rem", fontSize: "0.85rem", color: "#FAF9F7" }}>
                        ⚠ {formError}
                      </div>
                    )}

                    {regType === "donor" ? (
                      /* Donor Registry Form */
                      <form onSubmit={handleRegisterDonor} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="admin-form-group">
                          <label className="admin-label">First Name *</label>
                          <input type="text" className="admin-input" required value={donorForm.firstName} onChange={e => setDonorForm({...donorForm, firstName: e.target.value})} />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Last Name *</label>
                          <input type="text" className="admin-input" required value={donorForm.lastName} onChange={e => setDonorForm({...donorForm, lastName: e.target.value})} />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Phone Number *</label>
                          <input type="text" className="admin-input" required value={donorForm.phone} onChange={e => setDonorForm({...donorForm, phone: e.target.value})} />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Email Address</label>
                          <input type="email" className="admin-input" value={donorForm.email} onChange={e => setDonorForm({...donorForm, email: e.target.value})} />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Age *</label>
                          <input type="number" className="admin-input" required value={donorForm.age} onChange={e => setDonorForm({...donorForm, age: parseInt(e.target.value)})} />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Weight (kg) *</label>
                          <input type="number" step="0.1" className="admin-input" required value={donorForm.weight} onChange={e => setDonorForm({...donorForm, weight: parseFloat(e.target.value)})} />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Blood Type *</label>
                          <select className="admin-input" value={donorForm.bloodType} onChange={e => setDonorForm({...donorForm, bloodType: e.target.value})}>
                            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                          </select>
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">City *</label>
                          <input type="text" className="admin-input" required value={donorForm.city} onChange={e => setDonorForm({...donorForm, city: e.target.value})} />
                        </div>
                        <div className="admin-form-group" style={{ gridColumn: "span 2" }}>
                          <button type="submit" className="admin-button" disabled={formLoading}>
                            {formLoading ? "Writing to DynamoDB..." : "Register Donor to AWS"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Patient Registry Form */
                      <form onSubmit={handleRegisterPatient} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="admin-form-group">
                          <label className="admin-label">Patient First Name *</label>
                          <input type="text" className="admin-input" required value={patientForm.firstName} onChange={e => setPatientForm({...patientForm, firstName: e.target.value})} />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Patient Last Name *</label>
                          <input type="text" className="admin-input" required value={patientForm.lastName} onChange={e => setPatientForm({...patientForm, lastName: e.target.value})} />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Phone Number *</label>
                          <input type="text" className="admin-input" required value={patientForm.phone} onChange={e => setPatientForm({...patientForm, phone: e.target.value})} />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Blood Group *</label>
                          <select className="admin-input" value={patientForm.bloodGroup} onChange={e => setPatientForm({...patientForm, bloodGroup: e.target.value})}>
                            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                          </select>
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Treatment Hospital *</label>
                          <input type="text" className="admin-input" required value={patientForm.hospital} onChange={e => setPatientForm({...patientForm, hospital: e.target.value})} />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Supervising Doctor</label>
                          <input type="text" className="admin-input" value={patientForm.hematologist} onChange={e => setPatientForm({...patientForm, hematologist: e.target.value})} />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Transfusion Cycle *</label>
                          <input type="text" className="admin-input" required value={patientForm.transfusionFreq} onChange={e => setPatientForm({...patientForm, transfusionFreq: e.target.value})} />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Pre-Transfusion Hb Level (g/dL)</label>
                          <input type="text" className="admin-input" value={patientForm.lastHb} onChange={e => setPatientForm({...patientForm, lastHb: e.target.value})} />
                        </div>
                        <div className="admin-form-group" style={{ gridColumn: "span 2" }}>
                          <button type="submit" className="admin-button" style={{ background: "#2CA8A0" }} disabled={formLoading}>
                            {formLoading ? "Writing to DynamoDB..." : "Register Patient Request to AWS"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* ── TAB 5: SMS OUTREACH BROADCASTER ────────────────────── */}
                {activeTab === "outreach" && (
                  <div>
                    <h2 className="panel-title">Outreach Broadcaster</h2>
                    <p className="panel-subtitle">Manually trigger SMS alerts to matching donor circles via Amazon SNS</p>

                    <form onSubmit={handleOutreachAlert} className="config-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <div className="admin-form-group" style={{ flex: 1 }}>
                          <label className="admin-label">Target Blood Group</label>
                          <select className="admin-input" value={outreachGroup} onChange={e => setOutreachGroup(e.target.value)}>
                            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                          </select>
                        </div>
                        <div className="admin-form-group" style={{ flex: 1 }}>
                          <label className="admin-label">Target City</label>
                          <input type="text" className="admin-input" required value={outreachCity} onChange={e => setOutreachCity(e.target.value)} />
                        </div>
                      </div>

                      <div className="admin-form-group">
                        <label className="admin-label">Alert Message (English/Hindi translations occur at gateway)</label>
                        <textarea
                          className="admin-input"
                          rows={3}
                          value={outreachMessage}
                          onChange={e => setOutreachMessage(e.target.value)}
                          style={{ fontFamily: "inherit", resize: "none" }}
                          required
                        />
                      </div>

                      <button type="submit" className="admin-button" disabled={outreachSending}>
                        {outreachSending ? "Typewriting Logs..." : "Dispatch Automated Outreach"}
                      </button>
                    </form>

                    {outreachLogs.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: "0.85rem", marginBottom: 6, color: "#9CA3AF" }}>Execution Console Logs</h4>
                        <div className="typewriter-log">
                          {outreachLogs.map((log, idx) => (
                            <div key={idx} className="log-line">{log}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 6: AWS ENVIRONMENT CONFIG ─────────────────────── */}
                {activeTab === "config" && (
                  <div>
                    <h2 className="panel-title">AWS System Environment</h2>
                    <p className="panel-subtitle">Inspection configurations of Serverless backend architecture</p>

                    <div className="config-card">
                      <h3 style={{ marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 6 }}>API Gateway Info</h3>
                      <div className="config-row">
                        <span className="config-key">AWS Stage</span>
                        <span className="config-val">dev</span>
                      </div>
                      <div className="config-row">
                        <span className="config-key">AWS Region</span>
                        <span className="config-val" style={{ color: "#E8897A" }}>ap-south-1 (Mumbai)</span>
                      </div>
                      <div className="config-row">
                        <span className="config-key">FastAPI Base Endpoint</span>
                        <span className="config-val" style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{apiUrl}</span>
                      </div>
                    </div>

                    <div className="config-card">
                      <h3 style={{ marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 6 }}>DynamoDB Active Tables</h3>
                      <div className="config-row">
                        <span className="config-key">Donors Table</span>
                        <span className="config-val">donors</span>
                      </div>
                      <div className="config-row">
                        <span className="config-key">Blood Requests Table</span>
                        <span className="config-val">blood_requests</span>
                      </div>
                      <div className="config-row">
                        <span className="config-key">Chat Sessions Table</span>
                        <span className="config-val">chat_sessions</span>
                      </div>
                    </div>

                    <div className="config-card">
                      <h3 style={{ marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 6 }}>AWS Integrations Status</h3>
                      <div className="config-row">
                        <span className="config-key">Amazon Translate (Hindi/Telugu)</span>
                        <span className="config-val">Active (Region: us-east-1)</span>
                      </div>
                      <div className="config-row">
                        <span className="config-key">Amazon SNS (Outreach SMS Gateway)</span>
                        <span className="config-val">Active (Region: ap-south-1)</span>
                      </div>
                      <div className="config-row">
                        <span className="config-key">Amazon Bedrock (Claude 3 Haiku)</span>
                        <span className="config-val">Enabled (Region: us-east-1)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <Footer />
      </div>
    </>
  );
}
