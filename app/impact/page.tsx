"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Navbar } from "@/components/raksha/navbar"

import { rawCSV } from "@/lib/dataset";

/* ─────────────────────────────────────────
   FONTS & CORE STYLES — Injected via Style block
   ───────────────────────────────────────── */
const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  
  /* Tooltip hover trigger */
  .timeline-bar-group:hover .bar-tooltip {
    opacity: 1 !important;
    transform: translateX(-50%) translateY(-5px) !important;
  }
  .timeline-bar-group:hover .timeline-bar {
    background-color: #FAF9F7 !important;
  }
  
  /* Scrollbar styles for transfusion panel */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #0A1628;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #9B2335;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #C0152A;
  }
`;

/* ─────────────────────────────────────────
   DESIGN TOKENS
   ───────────────────────────────────────── */
const T = {
  bgDark: "#0D0D0D",
  bgNavy: "#0A1628",
  card: "#111827",
  cardBorder: "1px solid #1e293b",
  cardRadius: "12px",
  crimson: "#C0152A", // Urgent, CTAs
  maroon: "#9B2335", // Labels, Section titles
  teal: "#2CA8A0",   // Success, Confirmed, Positive metrics
  gold: "#D4A847",   // Warnings, Milestones
  green: "#1A7A4A",  // Eligible, Active
  muted: "#6B7280",  // Secondary text
  white: "#FAF9F7",  // Primary text
};

const bgColors: Record<string, string> = {
  "O+": "#C0152A",
  "O-": "#9B2335",
  "A+": "#2CA8A0",
  "A-": "#1A7A4A",
  "B+": "#D4A847",
  "B-": "#E8897A",
  "AB+": "#6B7280",
  "AB-": "#374151"
};

/* ─────────────────────────────────────────
   FALLBACK DATASETS (used if rawCSV is empty)
   ───────────────────────────────────────── */
const fallbackStats = {
  totalUniqueDonors: 7342,
  activeDonors: 5821,
  inactiveDonors: 1521,
  eligibleDonors: 3214,
  totalDonations: 18452,
  activeBridges: 147,
  totalCalls: 38240,
  avgRatio: 2.1,
  bloodGroupBreakdown: {
    "O+": 2154, "O-": 643, "A+": 1842, "A-": 420,
    "B+": 1520, "B-": 312, "AB+": 352, "AB-": 99
  },
  donorTypeBreakdown: {
    "Regular Donor": 4832,
    "One-Time Donor": 1980,
    "Other": 530
  },
  genderBreakdown: {
    "Male": 4890,
    "Female": 2400,
    "Other": 52
  },
  roleBreakdown: {
    "Emergency Donor": 3200,
    "Bridge Donor": 2842,
    "Volunteer": 800,
    "Guest": 350,
    "Other": 150
  },
  cycleBreakdown: {
    "90 days": 4200,
    "120 days": 2100,
    "Other": 1042
  },
  topInactiveReasons: [
    ["Not donated in last 1 year", 620],
    ["Very limited activity despite multiple calls", 410],
    ["Moved out of city / state", 250],
    ["Medical deferral (temporary/permanent)", 180],
    ["User requested opt-out", 61]
  ] as [string, number][],
  registrationsByYear: {
    "2020": 450,
    "2021": 980,
    "2022": 1520,
    "2023": 1890,
    "2024": 2100,
    "2025": 402
  },
  upcomingTransfusionsCount: 14,
  upcomingTransfusionsList: [
    { date: "2026-06-08", bloodGroup: "O+", label: "Bridge Match" },
    { date: "2026-06-08", bloodGroup: "A+", label: "Direct Request" },
    { date: "2026-06-09", bloodGroup: "B+", label: "Bridge Match" },
    { date: "2026-06-10", bloodGroup: "O-", label: "Bridge Match" },
    { date: "2026-06-11", bloodGroup: "AB+", label: "Direct Request" },
    { date: "2026-06-12", bloodGroup: "A-", label: "Direct Request" },
    { date: "2026-06-13", bloodGroup: "O+", label: "Bridge Match" }
  ],
  bridgeGenderCombo: {
    "Male-Male": 62,
    "Male-Female": 45,
    "Female-Male": 28,
    "Female-Female": 12
  },
  sortedBridgeBloodGroups: [
    ["O-", 48],
    ["O+", 35],
    ["A+", 28],
    ["B+", 22],
    ["AB-", 8],
    ["A-", 6]
  ] as [string, number][]
};

/* ─────────────────────────────────────────
   CSV PARSER UTILITY
   ───────────────────────────────────────── */
function parseCSV(csvText: string) {
  if (!csvText || !csvText.trim()) return [];
  
  const lines = csvText.split('\n');
  if (lines.length <= 1) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const resultData: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim().replace(/^["']|["']$/g, ''));
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim().replace(/^["']|["']$/g, ''));
    
    const rowObj: any = {};
    headers.forEach((header, idx) => {
      rowObj[header] = fields[idx] || '';
    });
    resultData.push(rowObj);
  }
  
  return resultData;
}

/* ─────────────────────────────────────────
   STATS COMPUTER
   ───────────────────────────────────────── */
function computeStats(data: any[]) {
  if (data.length === 0) return fallbackStats;
  
  // STAT 1 - Total unique donors
  const donorRoles = ['Emergency Donor', 'Bridge Donor', 'Volunteer'];
  const uniqueDonorsSet = new Set(
    data
      .filter(r => donorRoles.includes(r.role))
      .map(r => r.user_id)
      .filter(id => id)
  );
  const totalUniqueDonors = uniqueDonorsSet.size || data.filter(r => donorRoles.includes(r.role)).length;

  // STAT 2 - Active donors
  const activeDonors = data.filter(r => r.user_donation_active_status === 'Active').length;

  // STAT 3 - Inactive donors
  const inactiveDonors = data.filter(r => r.user_donation_active_status === 'Inactive').length;

  // STAT 4 - Eligible donors right now
  const eligibleDonors = data.filter(r => r.eligibility_status === 'eligible').length;

  // STAT 5 - Total donations ever made
  const totalDonations = data.reduce((sum, r) => sum + (parseInt(r.donations_till_date) || 0), 0);

  // STAT 6 - Active bridges
  const activeBridges = data.filter(r => 
    (r.bridge_status === 'true' || r.bridge_status === 'True' || r.bridge_status === '1') && 
    (r.status_of_bridge === 'true' || r.status_of_bridge === 'True' || r.status_of_bridge === '1')
  ).length;

  // STAT 7 - Total calls made
  const totalCalls = data.reduce((sum, r) => sum + (parseInt(r.total_calls) || 0), 0);

  // STAT 8 - Average calls to donations ratio
  const ratioRows = data.map(r => parseFloat(r.calls_to_donations_ratio)).filter(val => !isNaN(val) && val > 0);
  const avgRatio = ratioRows.length > 0 ? Number((ratioRows.reduce((sum, val) => sum + val, 0) / ratioRows.length).toFixed(2)) : 0;

  // STAT 9 - Blood group breakdown
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const bloodGroupBreakdown = bloodGroups.reduce((acc, bg) => {
    acc[bg] = data.filter(r => r.blood_group === bg).length;
    return acc;
  }, {} as Record<string, number>);

  // STAT 10 - Donor type breakdown
  const donorTypeBreakdown = {
    "Regular Donor": data.filter(r => r.donor_type === 'Regular Donor').length,
    "One-Time Donor": data.filter(r => r.donor_type === 'One-Time Donor').length,
    "Other": data.filter(r => r.donor_type && r.donor_type !== 'Regular Donor' && r.donor_type !== 'One-Time Donor').length,
  };

  // STAT 11 - Gender breakdown
  const genderBreakdown = {
    "Male": data.filter(r => r.gender === 'Male' || r.gender === 'M').length,
    "Female": data.filter(r => r.gender === 'Female' || r.gender === 'F').length,
    "Other": data.filter(r => r.gender && r.gender !== 'Male' && r.gender !== 'M' && r.gender !== 'Female' && r.gender !== 'F').length,
  };

  // STAT 12 - Role breakdown
  const roles = ['Emergency Donor', 'Bridge Donor', 'Volunteer', 'Guest'];
  const roleBreakdown = roles.reduce((acc, role) => {
    acc[role] = data.filter(r => r.role === role).length;
    return acc;
  }, {} as Record<string, number>);
  roleBreakdown['Other'] = data.filter(r => r.role && !roles.includes(r.role)).length;

  // STAT 13 - Donation cycle distribution
  const cycleBreakdown = {
    "90 days": data.filter(r => r.cycle_of_donations?.includes('90') || r.cycle_of_donations === '90').length,
    "120 days": data.filter(r => r.cycle_of_donations?.includes('120') || r.cycle_of_donations === '120').length,
    "Other": data.filter(r => r.cycle_of_donations && !r.cycle_of_donations.includes('90') && !r.cycle_of_donations.includes('120')).length,
  };

  // STAT 14 - Inactive reason breakdown
  const inactiveReasons: Record<string, number> = {};
  data.forEach(r => {
    if (r.user_donation_active_status === 'Inactive' && r.inactive_trigger_comment) {
      const comment = r.inactive_trigger_comment.trim();
      if (comment) {
        inactiveReasons[comment] = (inactiveReasons[comment] || 0) + 1;
      }
    }
  });
  const topInactiveReasons = Object.entries(inactiveReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // STAT 15 - Registrations over time
  const registrationsByYear = {
    "2020": 0, "2021": 0, "2022": 0, "2023": 0, "2024": 0, "2025": 0
  };
  data.forEach(r => {
    if (r.registration_date) {
      const match = r.registration_date.match(/\b(202\d)\b/);
      if (match) {
        const year = match[1] as keyof typeof registrationsByYear;
        if (registrationsByYear[year] !== undefined) {
          registrationsByYear[year]++;
        }
      }
    }
  });

  // STAT 16 - Next transfusions due (within 7 days of 2026-06-07)
  const parseDate = (dStr: string) => {
    if (!dStr) return null;
    let d = new Date(dStr);
    if (!isNaN(d.getTime())) return d;
    const parts = dStr.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        if (!isNaN(d.getTime())) return d;
      }
      if (parts[0].length === 4) {
        d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (!isNaN(d.getTime())) return d;
      }
    }
    return null;
  };

  const today = new Date("2026-06-07T00:00:00");
  const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const upcomingTransfusions = data
    .filter(r => {
      const d = parseDate(r.expected_next_transfusion_date);
      return d && d >= today && d <= sevenDaysLater;
    })
    .sort((a, b) => {
      const da = parseDate(a.expected_next_transfusion_date)!.getTime();
      const db = parseDate(b.expected_next_transfusion_date)!.getTime();
      return da - db;
    });

  const upcomingTransfusionsCount = upcomingTransfusions.length;
  const upcomingTransfusionsList = upcomingTransfusions.slice(0, 15).map(r => ({
    date: r.expected_next_transfusion_date,
    bloodGroup: r.bridge_blood_group || r.blood_group || 'Unknown',
    label: r.role === 'Bridge Donor' ? 'Bridge Match' : 'Direct Request'
  }));

  // STAT 17 - Bridge gender compatibility
  const bridgeGenderCombo = {
    "Male-Male": 0,
    "Male-Female": 0,
    "Female-Male": 0,
    "Female-Female": 0,
  };
  data.forEach(r => {
    if (r.bridge_id && r.gender && r.bridge_gender) {
      const g = r.gender.trim().toLowerCase();
      const bg = r.bridge_gender.trim().toLowerCase();
      const gName = (g === 'male' || g === 'm') ? 'Male' : (g === 'female' || g === 'f') ? 'Female' : '';
      const bgName = (bg === 'male' || bg === 'm') ? 'Male' : (bg === 'female' || bg === 'f') ? 'Female' : '';
      if (gName && bgName) {
        const combo = `${gName}-${bgName}` as keyof typeof bridgeGenderCombo;
        if (bridgeGenderCombo[combo] !== undefined) {
          bridgeGenderCombo[combo]++;
        }
      }
    }
  });

  // STAT 18 - Top donated blood groups in bridges
  const bridgeBloodGroupCounts: Record<string, number> = {};
  data.forEach(r => {
    if (r.bridge_id && r.bridge_blood_group) {
      const bg = r.bridge_blood_group.trim().toUpperCase();
      if (bg) {
        bridgeBloodGroupCounts[bg] = (bridgeBloodGroupCounts[bg] || 0) + 1;
      }
    }
  });
  const sortedBridgeBloodGroups = Object.entries(bridgeBloodGroupCounts)
    .sort((a, b) => b[1] - a[1]);

  return {
    totalUniqueDonors,
    activeDonors,
    inactiveDonors,
    eligibleDonors,
    totalDonations,
    activeBridges,
    totalCalls,
    avgRatio,
    bloodGroupBreakdown,
    donorTypeBreakdown,
    genderBreakdown,
    roleBreakdown,
    cycleBreakdown,
    topInactiveReasons,
    registrationsByYear,
    upcomingTransfusionsCount,
    upcomingTransfusionsList,
    bridgeGenderCombo,
    sortedBridgeBloodGroups
  };
}

/* ─────────────────────────────────────────
   ANIMATED METRIC NUMBER COMPONENT
   ───────────────────────────────────────── */
function AnimatedNumber({ value }: { value: number }) {
  const [displayVal, setDisplayVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    if (value === 0) {
      setDisplayVal(0);
      return;
    }
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplayVal(Math.floor(start));
      if (start >= value) {
        clearInterval(timer);
        setDisplayVal(value);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return <>{displayVal.toLocaleString()}</>;
}

/* ─────────────────────────────────────────
   SCROLL INTERSECTION WRAPPER
   ───────────────────────────────────────── */
function ScrollAnimate({ children }: { children: (inView: boolean) => React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true);
        obs.unobserve(el);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} style={{ width: "100%", height: "100%" }}>{children(inView)}</div>;
}



/* ─────────────────────────────────────────
   FOOTER COMPONENT
   ───────────────────────────────────────── */
function Footer() {
  const cols = [
    { title: "Platform", links: ["How It Works", "For Donors", "For Patients", "Impact", "Library"] },
    { title: "Organization", links: ["About", "Blood Warriors", "Partners", "Volunteer"] },
    { title: "Resources", links: ["Thalassemia Library", "Donor FAQs", "Contact Us"] },
  ]
  return (
    <footer style={{
      background: "#060810",
      borderTop: "1px solid rgba(155,35,53,0.25)",
      padding: "64px 48px 32px",
    }}>
      <div style={{
        maxWidth: "1200px", margin: "0 auto",
        display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: "48px", marginBottom: "40px",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <LogoMark size={26} />
            <span style={{ fontFamily: "'DM Sans'", fontSize: "16px", fontWeight: 600 }}>
              <span style={{ color: T.white }}>Raksha</span>
              <span style={{ color: T.teal }}>AI</span>
            </span>
          </div>
          <p style={{ fontFamily: "'DM Sans'", fontSize: "13px", color: T.muted, lineHeight: 1.7 }}>
            Protecting lives, one match at a time.
          </p>
          <div style={{ marginTop: "16px" }}>
            <span style={{
              fontFamily: "'DM Sans'", fontSize: "12px",
              color: T.crimson, fontWeight: 600,
            }}>
              🆘 Emergency: 1800-XXX-XXXX
            </span>
          </div>
        </div>
        {cols.map(col => (
          <div key={col.title}>
            <div style={{
              fontFamily: "'DM Sans'", fontSize: "11px",
              letterSpacing: "2px", color: T.crimson,
              textTransform: "uppercase", marginBottom: "16px",
            }}>
              {col.title}
            </div>
            {col.links.map(l => (
              <div key={l} style={{
                fontFamily: "'DM Sans'", fontSize: "13px",
                color: T.muted, marginBottom: "10px",
              }}>{l}</div>
            ))}
          </div>
        ))}
      </div>
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: "24px",
        display: "flex", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: "'DM Sans'", fontSize: "12px", color: T.muted }}>
          © 2025 Raksha AI × Blood Warriors Foundation
        </span>
        <span style={{ fontFamily: "'DM Sans'", fontSize: "12px", color: T.muted }}>
          Privacy Policy · Terms of Use
        </span>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────
   MAIN EXPORT COMPONENT
   ───────────────────────────────────────── */
export default function ImpactDashboard() {
  const parsedRows = useMemo(() => parseCSV(rawCSV), []);
  const stats = useMemo(() => computeStats(parsedRows), [parsedRows]);

  const {
    totalUniqueDonors,
    activeDonors,
    inactiveDonors,
    eligibleDonors,
    totalDonations,
    activeBridges,
    totalCalls,
    avgRatio,
    bloodGroupBreakdown,
    donorTypeBreakdown,
    genderBreakdown,
    roleBreakdown,
    cycleBreakdown,
    topInactiveReasons,
    registrationsByYear,
    upcomingTransfusionsCount,
    upcomingTransfusionsList,
    bridgeGenderCombo,
    sortedBridgeBloodGroups
  } = stats;

  // Compute values for Donut chart
  const totalDT = donorTypeBreakdown["Regular Donor"] + donorTypeBreakdown["One-Time Donor"] + donorTypeBreakdown["Other"];
  const regPct = totalDT > 0 ? (donorTypeBreakdown["Regular Donor"] / totalDT) * 360 : 0;
  const onePct = totalDT > 0 ? (donorTypeBreakdown["One-Time Donor"] / totalDT) * 360 : 0;

  // Compute values for Gender Split
  const totalGender = genderBreakdown.Male + genderBreakdown.Female;
  const malePct = totalGender > 0 ? (genderBreakdown.Male / totalGender) * 100 : 0;
  const femalePct = totalGender > 0 ? (genderBreakdown.Female / totalGender) * 100 : 0;

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div style={{ background: T.bgDark, color: T.white, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLE }} />
      <Navbar />

      {/* ─────────────────────────────────────────
         SECTION 1 — HERO HEADER
         ───────────────────────────────────────── */}
      <header style={{
        background: T.bgNavy,
        padding: "160px 48px 80px",
        textAlign: "center",
        borderBottom: "1px solid rgba(155,35,53,0.15)",
        position: "relative"
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <span style={{
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: T.maroon,
            fontWeight: 600,
            display: "block",
            marginBottom: "16px"
          }}>
            LIVE IMPACT DASHBOARD
          </span>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(36px, 5.5vw, 56px)",
            fontWeight: 700,
            color: T.white,
            lineHeight: 1.15,
            margin: "0 0 24px"
          }}>
            Every number here is a real donor. A real life.
          </h1>
          <p style={{
            fontSize: "clamp(14px, 1.8vw, 16px)",
            color: T.muted,
            fontWeight: 300,
            lineHeight: 1.6,
            maxWidth: "600px",
            margin: "0 auto 32px"
          }}>
            Computed live from Blood Warriors Foundation donor database — Hyderabad, India.
          </p>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            color: T.teal,
            background: "rgba(44,168,160,0.08)",
            padding: "8px 16px",
            border: "1px solid rgba(44,168,160,0.2)",
            display: "inline-block",
            marginBottom: "20px"
          }}>
            LATEST COMPILATION: {todayStr}
          </div>
          <p style={{ fontSize: "11px", color: T.muted, margin: 0 }}>
            * Demo Data — Blood Warriors Foundation Dataset
          </p>
        </div>
      </header>

      {/* ─────────────────────────────────────────
         SECTION 2 — TOP METRICS GRID (6 cards)
         ───────────────────────────────────────── */}
      <section style={{ padding: "80px 48px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px"
        }}>
          {/* Card 1: Total Donors */}
          <div style={{
            background: T.card,
            border: T.cardBorder,
            borderRadius: T.cardRadius,
            padding: "32px 28px",
            borderTop: `3px solid ${T.crimson}`
          }}>
            <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.15em", color: T.muted, display: "block", marginBottom: "12px" }}>
              Total Unique Donors
            </span>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "3rem", fontWeight: 700, color: T.crimson, lineHeight: 1 }}>
              <AnimatedNumber value={totalUniqueDonors} />
            </div>
            <p style={{ fontSize: "13px", color: T.muted, marginTop: "12px", margin: 0 }}>
              Registered emergency volunteers, bridge matching pools & coordinators.
            </p>
          </div>

          {/* Card 2: Active Donors */}
          <div style={{
            background: T.card,
            border: T.cardBorder,
            borderRadius: T.cardRadius,
            padding: "32px 28px",
            borderTop: `3px solid ${T.teal}`
          }}>
            <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.15em", color: T.muted, display: "block", marginBottom: "12px" }}>
              Active Donors
            </span>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "3rem", fontWeight: 700, color: T.teal, lineHeight: 1 }}>
              <AnimatedNumber value={activeDonors} />
            </div>
            <p style={{ fontSize: "13px", color: T.muted, marginTop: "12px", margin: 0 }}>
              Users with status flag set to Active, ready to take calls and matches.
            </p>
          </div>

          {/* Card 3: Eligible Now */}
          <div style={{
            background: T.card,
            border: T.cardBorder,
            borderRadius: T.cardRadius,
            padding: "32px 28px",
            borderTop: `3px solid ${T.green}`
          }}>
            <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.15em", color: T.muted, display: "block", marginBottom: "12px" }}>
              Eligible Right Now
            </span>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "3rem", fontWeight: 700, color: T.green, lineHeight: 1 }}>
              <AnimatedNumber value={eligibleDonors} />
            </div>
            <p style={{ fontSize: "13px", color: T.muted, marginTop: "12px", margin: 0 }}>
              Cleared standard donation gap protocol (90 days since last donation).
            </p>
          </div>

          {/* Card 4: Total Donations */}
          <div style={{
            background: T.card,
            border: T.cardBorder,
            borderRadius: T.cardRadius,
            padding: "32px 28px",
            borderTop: `3px solid ${T.crimson}`
          }}>
            <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.15em", color: T.muted, display: "block", marginBottom: "12px" }}>
              Total Donations Made
            </span>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "3rem", fontWeight: 700, color: T.white, lineHeight: 1 }}>
              <AnimatedNumber value={totalDonations} />
            </div>
            <p style={{ fontSize: "13px", color: T.muted, marginTop: "12px", margin: 0 }}>
              Cumulative donation events supported through Blood Warriors network.
            </p>
          </div>

          {/* Card 5: Active Bridges */}
          <div style={{
            background: T.card,
            border: T.cardBorder,
            borderRadius: T.cardRadius,
            padding: "32px 28px",
            borderTop: `3px solid ${T.teal}`
          }}>
            <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.15em", color: T.muted, display: "block", marginBottom: "12px" }}>
              Active Bridges
            </span>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "3rem", fontWeight: 700, color: T.teal, lineHeight: 1 }}>
              <AnimatedNumber value={activeBridges} />
            </div>
            <p style={{ fontSize: "13px", color: T.muted, marginTop: "12px", margin: 0 }}>
              Active dedicated recurring matches between donors and pediatric recipients.
            </p>
          </div>

          {/* Card 6: Total Calls Made */}
          <div style={{
            background: T.card,
            border: T.cardBorder,
            borderRadius: T.cardRadius,
            padding: "32px 28px",
            borderTop: `3px solid ${T.gold}`
          }}>
            <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.15em", color: T.muted, display: "block", marginBottom: "12px" }}>
              Total Triage Calls
            </span>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "3rem", fontWeight: 700, color: T.gold, lineHeight: 1 }}>
              <AnimatedNumber value={totalCalls} />
            </div>
            <p style={{ fontSize: "13px", color: T.muted, marginTop: "12px", margin: 0 }}>
              Verification, reminder & coordination outreach logs. Ratio: <strong>{avgRatio}</strong> calls/donation.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
         SECTION 3 — BLOOD GROUP BREAKDOWN
         ───────────────────────────────────────── */}
      <section style={{ background: T.bgDark, padding: "100px 48px", borderTop: "1px solid rgba(155,35,53,0.15)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <span style={{
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: T.maroon,
            fontWeight: 600,
            display: "block",
            marginBottom: "16px"
          }}>
            BLOOD GROUP DISTRIBUTION
          </span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: 700, color: T.white, marginBottom: "40px" }}>
            Database Antigen Mapping (ABO / Rh Phenotype)
          </h2>

          <ScrollAnimate>
            {(inView) => (
              <div style={{ background: T.card, border: T.cardBorder, borderRadius: T.cardRadius, padding: "40px" }}>
                {Object.entries(bloodGroupBreakdown).map(([bg, count]) => {
                  const pct = totalUniqueDonors > 0 ? (count / totalUniqueDonors) * 100 : 0;
                  const color = bgColors[bg] || T.muted;
                  return (
                    <div key={bg} style={{ marginBottom: "24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                        <span style={{ fontWeight: 600, color: T.white, fontFamily: "'JetBrains Mono', monospace" }}>{bg}</span>
                        <span style={{ color: T.muted, fontFamily: "'JetBrains Mono', monospace" }}>
                          {count.toLocaleString()} donors ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div style={{ height: "10px", background: "#1f2937", borderRadius: "0px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: inView ? `${pct}%` : "0%",
                          background: color,
                          transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollAnimate>
        </div>
      </section>

      {/* ─────────────────────────────────────────
         SECTION 4 — DONOR STATUS BREAKDOWN
         ───────────────────────────────────────── */}
      <section style={{ background: T.bgNavy, padding: "100px 48px", borderTop: "1px solid rgba(155,35,53,0.15)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <span style={{
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: T.maroon,
            fontWeight: 600,
            display: "block",
            marginBottom: "16px"
          }}>
            DONOR STATUS & ENGAGEMENT
          </span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: 700, color: T.white, marginBottom: "48px" }}>
            Operational Triage Breakdown
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "32px"
          }}>
            {/* Column 1 — DONOR TYPE */}
            <div style={{ background: T.card, border: T.cardBorder, borderRadius: T.cardRadius, padding: "32px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: T.maroon, marginBottom: "32px" }}>
                Donor Type Ratio
              </h3>
              
              <div style={{
                position: "relative",
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                background: `conic-gradient(${T.teal} 0deg ${regPct}deg, ${T.crimson} ${regPct}deg ${regPct + onePct}deg, ${T.muted} ${regPct + onePct}deg 360deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 32px"
              }}>
                <div style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  background: T.card,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <span style={{ fontSize: "10px", color: T.muted, letterSpacing: "1px" }}>POOL SIZE</span>
                  <span style={{ fontSize: "20px", color: T.white, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                    {totalDT.toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "10px", height: "10px", background: T.teal }} />
                    <span>Regular Donor</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                    {donorTypeBreakdown["Regular Donor"].toLocaleString()}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "10px", height: "10px", background: T.crimson }} />
                    <span>One-Time Donor</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                    {donorTypeBreakdown["One-Time Donor"].toLocaleString()}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "10px", height: "10px", background: T.muted }} />
                    <span>Other</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                    {donorTypeBreakdown["Other"].toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2 — ACTIVE vs INACTIVE */}
            <div style={{ background: T.card, border: T.cardBorder, borderRadius: T.cardRadius, padding: "32px", display: "flex", flexDirection: "column" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: T.maroon, marginBottom: "24px" }}>
                Active vs Inactive Status
              </h3>
              
              <div style={{ display: "flex", gap: "24px", marginBottom: "32px", textAlign: "center" }}>
                <div style={{ flex: 1, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", display: "block" }}>Active</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2.2rem", fontWeight: 700, color: T.teal }}>
                    {activeDonors.toLocaleString()}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", display: "block" }}>Inactive</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2.2rem", fontWeight: 700, color: T.crimson }}>
                    {inactiveDonors.toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: T.muted, display: "block", marginBottom: "12px" }}>
                  Inactive Trigger Reasons
                </span>
                {topInactiveReasons.map(([reason, count], idx) => (
                  <div key={idx} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    padding: "8px 0",
                    borderBottom: idx < topInactiveReasons.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none"
                  }}>
                    <span style={{ color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "240px" }} title={reason}>
                      {reason}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: T.crimson }}>
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3 — GENDER SPLIT */}
            <div style={{ background: T.card, border: T.cardBorder, borderRadius: T.cardRadius, padding: "32px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: T.maroon, marginBottom: "32px" }}>
                  Gender Distribution
                </h3>

                <div style={{ height: "24px", display: "flex", overflow: "hidden", margin: "32px 0 20px" }}>
                  <div style={{ width: `${malePct}%`, background: T.teal, display: "flex", alignItems: "center", paddingLeft: "12px", fontSize: "11px", color: T.white, fontWeight: 600 }}>
                    {malePct.toFixed(0)}%
                  </div>
                  <div style={{ width: `${femalePct}%`, background: T.crimson, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "12px", fontSize: "11px", color: T.white, fontWeight: 600 }}>
                    {femalePct.toFixed(0)}%
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginTop: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "10px", height: "10px", background: T.teal }} />
                    <span>Male ({genderBreakdown.Male.toLocaleString()})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "10px", height: "10px", background: T.crimson }} />
                    <span>Female ({genderBreakdown.Female.toLocaleString()})</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "24px", marginTop: "24px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: T.muted, display: "block", marginBottom: "12px" }}>
                  Donation Cycle Distribution
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>90-Day Pool</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: T.teal }}>{cycleBreakdown["90 days"].toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>120-Day Pool</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: T.gold }}>{cycleBreakdown["120 days"].toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Other Frequency</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: T.muted }}>{cycleBreakdown["Other"].toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
         SECTION 5 — REGISTRATION TIMELINE
         ───────────────────────────────────────── */}
      <section style={{ background: T.bgDark, padding: "100px 48px", borderTop: "1px solid rgba(155,35,53,0.15)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <span style={{
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: T.maroon,
            fontWeight: 600,
            display: "block",
            marginBottom: "16px"
          }}>
            REGISTRATION TIMELINE
          </span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: 700, color: T.white, marginBottom: "48px" }}>
            Donor Registrations By Year
          </h2>

          <ScrollAnimate>
            {(inView) => {
              const maxVal = Math.max(...Object.values(registrationsByYear));
              return (
                <div style={{
                  background: T.card,
                  border: T.cardBorder,
                  borderRadius: T.cardRadius,
                  padding: "60px 40px 40px",
                  height: "360px",
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "24px"
                }}>
                  {Object.entries(registrationsByYear).map(([year, count]) => {
                    const heightPct = maxVal > 0 ? (count / maxVal) * 80 : 0;
                    return (
                      <div key={year} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative", height: "100%", justifyContent: "flex-end" }} className="timeline-bar-group">
                        <div className="bar-tooltip" style={{
                          position: "absolute",
                          bottom: `calc(${heightPct}% + 15px)`,
                          left: "50%",
                          transform: "translateX(-50%) translateY(5px)",
                          background: "#0A1628",
                          border: "1px solid #1e293b",
                          color: T.white,
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontFamily: "'JetBrains Mono', monospace",
                          zIndex: 10,
                          opacity: 0,
                          pointerEvents: "none",
                          transition: "opacity 0.2s, transform 0.2s",
                          whiteSpace: "nowrap"
                        }}>
                          {count.toLocaleString()} registered
                        </div>
                        <div className="timeline-bar" style={{
                          width: "100%",
                          maxWidth: "48px",
                          height: inView ? `${heightPct}%` : "0%",
                          background: T.crimson,
                          transition: "height 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          cursor: "pointer",
                        }} />
                        <span style={{ marginTop: "16px", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", color: T.muted, display: "block" }}>
                          {year}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          </ScrollAnimate>
        </div>
      </section>

      {/* ─────────────────────────────────────────
         SECTION 6 — BRIDGE NETWORK + TRANSFUSIONS
         ───────────────────────────────────────── */}
      <section style={{ background: T.bgNavy, padding: "100px 48px", borderTop: "1px solid rgba(155,35,53,0.15)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
            gap: "40px"
          }}>
            {/* Left panel — BRIDGE NETWORK STATS */}
            <div style={{ background: T.card, border: T.cardBorder, borderRadius: T.cardRadius, padding: "40px" }}>
              <span style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: T.maroon,
                fontWeight: 600,
                display: "block",
                marginBottom: "8px"
              }}>
                BRIDGE NETWORK STATS
              </span>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 700, color: T.white, marginBottom: "32px" }}>
                Match Compatibility Analysis
              </h3>

              <div style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: "32px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", display: "block" }}>Active Bridges</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "3rem", fontWeight: 700, color: T.teal, lineHeight: 1 }}>
                    {activeBridges.toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: T.muted, lineHeight: 1.5, borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: "24px" }}>
                  Recurring pediatric transfusion pairings established across clinics in Hyderabad.
                </div>
              </div>

              <div style={{ marginBottom: "32px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: T.muted, display: "block", marginBottom: "12px" }}>
                  Bridge Gender Match Distribution
                </span>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "left" }}>
                      <th style={{ padding: "8px 0", color: T.muted, fontWeight: 500 }}>Donation Pairing</th>
                      <th style={{ padding: "8px 0", color: T.muted, fontWeight: 500, textAlign: "right" }}>Active Matches</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(bridgeGenderCombo).map(([combo, count]) => (
                      <tr key={combo} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "10px 0", color: T.white }}>{combo} Match</td>
                        <td style={{ padding: "10px 0", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: T.teal, fontWeight: 600 }}>
                          {count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: T.muted, display: "block", marginBottom: "12px" }}>
                  Top Blood Groups in Bridges
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {sortedBridgeBloodGroups.slice(0, 6).map(([bg, count]) => (
                    <div key={bg} style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      padding: "8px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: T.crimson }}>{bg}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: T.muted }}>
                        {count.toLocaleString()} pairs
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right panel — UPCOMING TRANSFUSIONS */}
            <div style={{ background: T.card, border: T.cardBorder, borderRadius: T.cardRadius, padding: "40px", display: "flex", flexDirection: "column" }}>
              <span style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: T.maroon,
                fontWeight: 600,
                display: "block",
                marginBottom: "8px"
              }}>
                PEDIATRIC TRANSFUSION PIPELINE
              </span>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 700, color: T.white, marginBottom: "32px" }}>
                Transfusions Due In Next 7 Days
              </h3>

              <div style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: "32px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", display: "block" }}>Urgent Needs</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "3rem", fontWeight: 700, color: T.crimson, lineHeight: 1 }}>
                    <AnimatedNumber value={upcomingTransfusionsCount} />
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: T.muted, lineHeight: 1.5, borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: "24px" }}>
                  Expected next transfusion milestones tracking in standard 21-day pediatric thalassemia intervals.
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: T.muted, display: "block", marginBottom: "12px" }}>
                  Upcoming Schedule List
                </span>
                
                <div className="custom-scrollbar" style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  border: "1px solid rgba(255,255,255,0.04)",
                  background: "rgba(0,0,0,0.2)"
                }}>
                  {upcomingTransfusionsList.length > 0 ? (
                    upcomingTransfusionsList.map((tr, idx) => (
                      <div key={idx} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        borderBottom: idx < upcomingTransfusionsList.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "12px",
                            color: T.white,
                            background: "rgba(255,255,255,0.05)",
                            padding: "4px 8px",
                            border: "1px solid rgba(255,255,255,0.1)"
                          }}>
                            {tr.date}
                          </span>
                          <span style={{ fontSize: "12px", color: T.muted }}>
                            {tr.label}
                          </span>
                        </div>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          color: T.white,
                          background: bgColors[tr.bloodGroup] || T.maroon,
                          padding: "2px 8px",
                          fontSize: "11px"
                        }}>
                          {tr.bloodGroup}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "40px", textAlign: "center", color: T.teal, fontSize: "14px" }}>
                      ✓ No transfusions due in next 7 days
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export { ImpactDashboard };
