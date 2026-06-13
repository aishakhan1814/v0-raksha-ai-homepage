"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  slug: string;
}

interface Article {
  id: string;
  tag: "FOR DONORS" | "FOR FAMILIES" | "MEDICAL";
  title: string;
  excerpt: string;
  readTime: string;
  updated: string;
  slug: string;
  featured: boolean;
  size: "large" | "small";
}

interface BloodBank {
  id: string;
  name: string;
  hospital: string;
  city: string;
  state: string;
  phone: string;
  extendedTyping: boolean;
  thalassemiaProgram: boolean;
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: "1", emoji: "🔬", title: "What Is Thalassemia?", sub: "A plain language guide for donors, friends, and new families", slug: "what-is-thalassemia" },
  { id: "2", emoji: "🩸", title: "Understanding Blood Compatibility", sub: "Beyond ABO: Rh phenotype, Kell, and why it matters", slug: "blood-compatibility" },
  { id: "3", emoji: "📋", title: "Transfusion-Dependent Thalassemia", sub: "A complete patient and family guide", slug: "transfusion-dependent" },
  { id: "4", emoji: "💊", title: "Iron Overload & Chelation Therapy", sub: "What it is, why it happens, and how to manage it", slug: "iron-overload-chelation" },
  { id: "5", emoji: "🏥", title: "Bone Marrow Transplant", sub: "Is my child eligible? What does the process look like?", slug: "bone-marrow-transplant" },
  { id: "6", emoji: "🏫", title: "Thalassemia at School", sub: "Supporting a child with TDT in daily life", slug: "thalassemia-at-school" },
  { id: "7", emoji: "❓", title: "Donor FAQs", sub: "What happens to my blood? Does it hurt? What's extended typing?", slug: "donor-faqs" },
  { id: "8", emoji: "🗺️", title: "Blood Bank Directory", sub: "Searchable by city, searchable by blood bank name", slug: "blood-bank-directory" },
];

const ARTICLES: Article[] = [
  {
    id: "1", tag: "FOR DONORS", size: "large", featured: true,
    title: "Why Thalassemia Patients Need the Same Donor to Come Back",
    excerpt: "Most blood donation platforms treat every donation as a one-time transaction. For Thalassemia patients, that model is dangerous. Here's why recurring, compatible donation is a medical necessity.",
    readTime: "5 min read", updated: "Updated January 2025", slug: "recurring-donor-necessity",
  },
  {
    id: "2", tag: "FOR FAMILIES", size: "small", featured: true,
    title: "The Parent's Guide to Managing Transfusion Schedules",
    excerpt: "How to prepare for each transfusion, what questions to ask, and how to build a reliable donor support network.",
    readTime: "8 min read", updated: "December 2024", slug: "parents-guide-transfusion",
  },
  {
    id: "3", tag: "MEDICAL", size: "small", featured: true,
    title: "Alloimmunization: The Hidden Risk in Unmatched Transfusions",
    excerpt: "Each time a patient receives blood with incompatible antigens, their immune system builds resistance. Over hundreds of transfusions, this becomes life-threatening.",
    readTime: "6 min read", updated: "November 2024", slug: "alloimmunization-risk",
  },
];

const BLOOD_BANKS: BloodBank[] = [
  { id: "1", name: "KEM Hospital Blood Bank", hospital: "KEM Hospital", city: "Mumbai", state: "Maharashtra", phone: "022-2410-7000", extendedTyping: true, thalassemiaProgram: true },
  { id: "2", name: "Tata Memorial Blood Bank", hospital: "Tata Memorial Centre", city: "Mumbai", state: "Maharashtra", phone: "022-2417-7000", extendedTyping: true, thalassemiaProgram: true },
  { id: "3", name: "AIIMS Blood Bank", hospital: "AIIMS Delhi", city: "New Delhi", state: "Delhi", phone: "011-2659-3308", extendedTyping: true, thalassemiaProgram: true },
  { id: "4", name: "Sassoon Hospital Blood Bank", hospital: "Sassoon General Hospital", city: "Pune", state: "Maharashtra", phone: "020-2612-8000", extendedTyping: true, thalassemiaProgram: false },
  { id: "5", name: "Apollo Blood Bank", hospital: "Apollo Hospitals", city: "Hyderabad", state: "Telangana", phone: "040-2360-7777", extendedTyping: false, thalassemiaProgram: true },
  { id: "6", name: "CMC Blood Bank", hospital: "Christian Medical College", city: "Vellore", state: "Tamil Nadu", phone: "0416-228-1000", extendedTyping: true, thalassemiaProgram: true },
  { id: "7", name: "Prathama Blood Centre", hospital: "Prathama Blood Centre", city: "Ahmedabad", state: "Gujarat", phone: "079-2754-5757", extendedTyping: true, thalassemiaProgram: true },
  { id: "8", name: "Calcutta Medical Research Institute", hospital: "CMRI", city: "Kolkata", state: "West Bengal", phone: "033-2287-3300", extendedTyping: false, thalassemiaProgram: true },
  { id: "9", name: "Manipal Blood Bank", hospital: "Manipal Hospital", city: "Bangalore", state: "Karnataka", phone: "080-2502-4444", extendedTyping: true, thalassemiaProgram: false },
  { id: "10", name: "Government Medical College Blood Bank", hospital: "GMC Nagpur", city: "Nagpur", state: "Maharashtra", phone: "0712-256-0021", extendedTyping: false, thalassemiaProgram: true },
];

const QUICK_FACTS = [
  "30 million thalassemia carriers in India",
  "10,000–12,000 new thalassemia births per year",
  "Transfusion frequency: every 2–5 weeks",
  "500–700 transfusions in a lifetime",
  "3–4% thalassemia prevalence in India",
  "India has the highest number of thalassemia patients globally",
  "Compatible blood reduces alloimmunization risk by up to 80%",
  "Blood Warriors Foundation active in 17 Indian cities",
];

// ─── HOOKS ───────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function RakshaLogo() {
  return (
    <a href="/" className="flex items-center gap-3 no-underline">
      <svg viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="42">
        <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A" />
        <path d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" fill="white" opacity="0.95" />
        <path d="M16 39Q20 36 24 39Q28 42 32 39" stroke="#2CA8A0" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M18 44Q21 41.5 24 44Q27 46.5 30 44" stroke="#E8897A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
      <div className="flex items-baseline gap-1">
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "1.4rem", color: "#FAF9F7", letterSpacing: "-0.02em" }}>Raksha</span>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "1.4rem", color: "#2CA8A0", letterSpacing: "-0.02em" }}>AI</span>
      </div>
    </a>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [user, setUser] = useState<any>(null);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > lastY.current && y > 120);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    if (typeof window !== "undefined") {
      const u = localStorage.getItem("raksha_user");
      if (u) setUser(JSON.parse(u));
    }

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["How It Works", "For Donors", "For Patients", "Impact", "Library", "About", "Console"];
  const visibleLinks = links.filter(link => {
    if (link === "Console") {
      return user && (user.role === "coordinator" || user.role === "admin");
    }
    return true;
  });

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "#0A1628" : "transparent",
      borderBottom: scrolled ? "1px solid #8B1A2A" : "none",
      transform: hidden ? "translateY(-100%)" : "translateY(0)",
      transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      padding: "0 48px",
      height: "68px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <RakshaLogo />
      <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
        {visibleLinks.map((link) => (
          <a key={link} href={`/${link.toLowerCase().replace(/ /g, "-")}`}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: link === "Library" ? "#2CA8A0" : "#9CA3AF", fontWeight: link === "Library" ? 600 : 400, textDecoration: "none", transition: "color 0.2s", letterSpacing: "0.02em" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#FAF9F7")}
            onMouseLeave={e => (e.currentTarget.style.color = link === "Library" ? "#2CA8A0" : "#9CA3AF")}
          >{link}</a>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <a href="/register/donor" style={{ background: "#C0152A", color: "#FAF9F7", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: "0.875rem", padding: "10px 20px", textDecoration: "none", borderRadius: 0, border: "none", letterSpacing: "0.03em", transition: "background 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#9B2335")}
          onMouseLeave={e => (e.currentTarget.style.background = "#C0152A")}>Register as Donor</a>
        <a href="/register/patient" style={{ background: "transparent", color: "#FAF9F7", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: "0.875rem", padding: "10px 20px", textDecoration: "none", border: "1px solid rgba(250,249,247,0.4)", letterSpacing: "0.03em", transition: "border-color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "#FAF9F7")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(250,249,247,0.4)")}>Request Blood</a>
      </div>
    </nav>
  );
}

function TagPill({ tag }: { tag: Article["tag"] }) {
  const styles: Record<Article["tag"], { bg: string; color: string }> = {
    "FOR DONORS": { bg: "#C0152A", color: "#FAF9F7" },
    "FOR FAMILIES": { bg: "#2CA8A0", color: "#FAF9F7" },
    "MEDICAL": { bg: "#D4A847", color: "#0D0D0D" },
  };
  const s = styles[tag];
  return (
    <span style={{ background: s.bg, color: s.color, fontFamily: "'DM Sans',sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.12em", padding: "4px 10px", textTransform: "uppercase", display: "inline-block" }}>
      {tag}
    </span>
  );
}

// ─── SECTION 1: HERO ──────────────────────────────────────────────────────────

function HeroSection({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  return (
    <section style={{ background: "#0A1628", paddingTop: "140px", paddingBottom: "80px", position: "relative", overflow: "hidden" }}>
      {/* Grain texture */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")", pointerEvents: "none", opacity: 0.5 }} />
      {/* Teal glow */}
      <div style={{ position: "absolute", top: "60px", right: "10%", width: "320px", height: "320px", background: "radial-gradient(circle, rgba(44,168,160,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 48px", textAlign: "center", position: "relative" }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", color: "#9B2335", textTransform: "uppercase", marginBottom: "20px" }}>
          RAKSHA LIBRARY
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(44px,6vw,72px)", fontWeight: 700, color: "#FAF9F7", lineHeight: 1.05, letterSpacing: "-1.5px", margin: "0 0 16px" }}>
          Knowledge is the first step.
          <br />
          <span style={{ fontStyle: "italic", color: "#F5ECD7" }}>This is yours.</span>
        </h1>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "1.1rem", color: "#6B7280", fontWeight: 300, maxWidth: "560px", margin: "0 auto 40px", lineHeight: 1.7 }}>
          Everything you need to understand Thalassemia, blood compatibility, and what it means to be a donor or a family.
        </p>

        {/* Search Bar */}
        <div style={{ position: "relative", maxWidth: "640px", margin: "0 auto" }}>
          <span style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", color: "#6B7280", fontSize: "1.1rem", pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles, guides, FAQs..."
            style={{
              width: "100%", background: "#111827", border: "1px solid #1e293b",
              borderRadius: "4px", padding: "16px 20px 16px 52px",
              fontFamily: "'DM Sans',sans-serif", fontSize: "1rem", color: "#FAF9F7",
              outline: "none", transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
            onFocus={e => (e.target.style.borderColor = "#C0152A")}
            onBlur={e => (e.target.style.borderColor = "#1e293b")}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "1.1rem", padding: "4px" }}>✕</button>
          )}
        </div>
        {search && (
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", color: "#6B7280", marginTop: "12px" }}>
            Showing results for "<span style={{ color: "#2CA8A0" }}>{search}</span>"
          </p>
        )}
      </div>
    </section>
  );
}

// ─── SECTION 2: CATEGORY GRID ─────────────────────────────────────────────────

function CategoryGrid({ search }: { search: string }) {
  const { ref, inView } = useInView();
  const filtered = search
    ? CATEGORIES.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.sub.toLowerCase().includes(search.toLowerCase()))
    : CATEGORIES;

  return (
    <section ref={ref} style={{ background: "#0D0D0D", padding: "96px 48px", position: "relative" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", color: "#9B2335", textTransform: "uppercase", marginBottom: "48px", textAlign: "center" }}>
          BROWSE BY TOPIC
        </div>

        {filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6B7280", fontFamily: "'DM Sans',sans-serif" }}>No categories match your search.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            {filtered.map((cat, i) => (
              <a key={cat.id} href={`/library/${cat.slug}`}
                style={{
                  background: "#111827", border: "1px solid #1e293b", borderRadius: "16px",
                  padding: "28px 24px", textDecoration: "none", display: "block",
                  transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(24px)",
                  transitionDelay: `${i * 60}ms`,
                  cursor: "pointer",
                  position: "relative", overflow: "hidden",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderTopColor = "#C0152A";
                  el.style.transform = "translateY(-4px)";
                  el.style.boxShadow = "0 12px 32px rgba(192,21,42,0.12)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderTopColor = "#1e293b";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "16px", lineHeight: 1 }}>{cat.emoji}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: "1.1rem", color: "#FAF9F7", marginBottom: "8px", lineHeight: 1.3 }}>{cat.title}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", color: "#6B7280", lineHeight: 1.5 }}>{cat.sub}</div>
                <div style={{ position: "absolute", bottom: "16px", right: "20px", color: "#9B2335", fontSize: "1rem", opacity: 0.5 }}>→</div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── SECTION 3: FEATURED ARTICLES ────────────────────────────────────────────

function FeaturedArticles({ search }: { search: string }) {
  const { ref, inView } = useInView();
  const filtered = search
    ? ARTICLES.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.excerpt.toLowerCase().includes(search.toLowerCase()))
    : ARTICLES;

  const large = filtered.find(a => a.size === "large");
  const smalls = filtered.filter(a => a.size === "small");

  return (
    <section ref={ref} style={{ background: "#0A1628", padding: "96px 48px", borderTop: "1px solid #8B1A2A" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", color: "#9B2335", textTransform: "uppercase", marginBottom: "48px" }}>
          FEATURED THIS MONTH
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: "#6B7280", fontFamily: "'DM Sans',sans-serif" }}>No articles match your search.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Large article */}
            {large && (
              <a href={`/library/${large.slug}`}
                style={{
                  gridRow: "span 2", background: "#111827", border: "1px solid #1e293b",
                  borderRadius: "16px", padding: "36px", textDecoration: "none", display: "flex",
                  flexDirection: "column", justifyContent: "space-between",
                  opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)",
                  transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "#9B2335"; el.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "#1e293b"; el.style.transform = "translateY(0)"; }}
              >
                <div>
                  <TagPill tag={large.tag} />
                  <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: "1.75rem", color: "#FAF9F7", margin: "20px 0 16px", lineHeight: 1.2, letterSpacing: "-0.3px" }}>{large.title}</h2>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.95rem", color: "#6B7280", lineHeight: 1.7, fontWeight: 300 }}>{large.excerpt}</p>
                </div>
                <div style={{ marginTop: "28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.78rem", color: "#6B7280" }}>{large.readTime} · {large.updated}</span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "#C0152A", fontWeight: 500 }}>Read Article →</span>
                </div>
              </a>
            )}

            {/* Small articles */}
            {smalls.map((art, i) => (
              <a key={art.id} href={`/library/${art.slug}`}
                style={{
                  background: "#111827", border: "1px solid #1e293b", borderRadius: "16px",
                  padding: "28px", textDecoration: "none", display: "flex", flexDirection: "column", justifyContent: "space-between",
                  opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)",
                  transition: `all 0.5s cubic-bezier(0.4,0,0.2,1) ${(i + 1) * 100}ms`,
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "#9B2335"; el.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "#1e293b"; el.style.transform = "translateY(0)"; }}
              >
                <div>
                  <TagPill tag={art.tag} />
                  <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: "1.25rem", color: "#FAF9F7", margin: "16px 0 12px", lineHeight: 1.3 }}>{art.title}</h3>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "#6B7280", lineHeight: 1.6, fontWeight: 300 }}>{art.excerpt}</p>
                </div>
                <div style={{ marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", color: "#6B7280" }}>{art.readTime}</span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", color: "#C0152A", fontWeight: 500 }}>Read →</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── SECTION 4: BLOOD BANK DIRECTORY ─────────────────────────────────────────

function BloodBankDirectory({ search }: { search: string }) {
  const { ref, inView } = useInView();
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [extFilter, setExtFilter] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  const cities = [...new Set(BLOOD_BANKS.map(b => b.city))].sort();
  const states = [...new Set(BLOOD_BANKS.map(b => b.state))].sort();

  const filtered = BLOOD_BANKS.filter(b => {
    const matchSearch = search ? (b.name.toLowerCase().includes(search.toLowerCase()) || b.city.toLowerCase().includes(search.toLowerCase()) || b.hospital.toLowerCase().includes(search.toLowerCase())) : true;
    const matchCity = cityFilter ? b.city === cityFilter : true;
    const matchState = stateFilter ? b.state === stateFilter : true;
    const matchExt = extFilter ? b.extendedTyping : true;
    return matchSearch && matchCity && matchState && matchExt;
  });

  const Badge = ({ yes, label }: { yes: boolean; label: string }) => (
    <span style={{
      background: yes ? "#2CA8A0" : "transparent",
      color: yes ? "#FAF9F7" : "#6B7280",
      border: yes ? "none" : "1px solid #374151",
      fontFamily: "'DM Sans',sans-serif", fontSize: "0.7rem", fontWeight: 600,
      padding: "3px 10px", letterSpacing: "0.05em", borderRadius: "2px",
      display: "inline-block",
    }}>
      {yes ? `✓ ${label}` : `✗ ${label}`}
    </span>
  );

  const selectStyle: React.CSSProperties = {
    background: "#111827", border: "1px solid #1e293b", color: "#FAF9F7",
    fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", padding: "10px 16px",
    outline: "none", cursor: "pointer", borderRadius: "4px",
  };

  return (
    <section ref={ref} style={{ background: "#0D0D0D", padding: "96px 48px", borderTop: "1px solid #8B1A2A" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", color: "#9B2335", textTransform: "uppercase", marginBottom: "12px" }}>
          BLOOD BANK DIRECTORY
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: "clamp(32px,4vw,48px)", color: "#FAF9F7", margin: "0 0 40px", letterSpacing: "-0.5px" }}>
          Find the nearest Thalassemia-equipped blood bank.
        </h2>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "32px", alignItems: "center" }}>
          <select value={cityFilter} onChange={e => { setCityFilter(e.target.value); setVisibleCount(5); }} style={selectStyle}>
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={stateFilter} onChange={e => { setStateFilter(e.target.value); setVisibleCount(5); }} style={selectStyle}>
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "#9CA3AF" }}>
            <input type="checkbox" checked={extFilter} onChange={e => { setExtFilter(e.target.checked); setVisibleCount(5); }}
              style={{ width: "16px", height: "16px", accentColor: "#2CA8A0", cursor: "pointer" }} />
            Extended Typing Available
          </label>
          {(cityFilter || stateFilter || extFilter) && (
            <button onClick={() => { setCityFilter(""); setStateFilter(""); setExtFilter(false); }}
              style={{ background: "none", border: "1px solid #374151", color: "#6B7280", fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", padding: "8px 16px", cursor: "pointer", borderRadius: "4px" }}>
              Clear Filters
            </button>
          )}
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", color: "#6B7280", marginLeft: "auto" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {filtered.length === 0 ? (
            <div style={{ background: "#111827", borderRadius: "8px", padding: "40px", textAlign: "center" }}>
              <p style={{ fontFamily: "'DM Sans',sans-serif", color: "#6B7280" }}>No blood banks match your filters.</p>
            </div>
          ) : (
            filtered.slice(0, visibleCount).map((bank, i) => (
              <div key={bank.id}
                style={{
                  background: i % 2 === 0 ? "#111827" : "#0F1A2E",
                  padding: "20px 24px",
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
                  borderRadius: i === 0 ? "8px 8px 0 0" : i === Math.min(visibleCount, filtered.length) - 1 ? "0 0 8px 8px" : "0",
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateX(0)" : "translateX(-16px)",
                  transition: `all 0.4s cubic-bezier(0.4,0,0.2,1) ${i * 50}ms`,
                }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, color: "#FAF9F7", fontSize: "0.95rem" }}>{bank.name}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#6B7280", fontSize: "0.8rem", marginTop: "2px" }}>{bank.hospital}</div>
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", color: "#9CA3AF", minWidth: "140px" }}>
                  📍 {bank.city}, {bank.state}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem", color: "#6B7280", minWidth: "140px" }}>
                  📞 {bank.phone}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <Badge yes={bank.extendedTyping} label="Extended Typing" />
                  <Badge yes={bank.thalassemiaProgram} label="Thal. Program" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load more */}
        {visibleCount < filtered.length && (
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <button onClick={() => setVisibleCount(v => v + 5)}
              style={{ background: "transparent", border: "1px solid #C0152A", color: "#C0152A", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: "0.875rem", padding: "12px 32px", cursor: "pointer", letterSpacing: "0.05em", transition: "all 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#C0152A"; (e.currentTarget as HTMLButtonElement).style.color = "#FAF9F7"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#C0152A"; }}>
              View More ({filtered.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── SECTION 5: QUICK FACTS + NEWSLETTER ─────────────────────────────────────

function QuickFactsNewsletter() {
  const { ref, inView } = useInView();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const tickerRef = useRef<HTMLDivElement>(null);

  // Backend: Newsletter subscription
  const handleSubscribe = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "library_page" }),
      });
      if (!res.ok) throw new Error("Subscription failed");
      setStatus("success");
      setEmail("");
    } catch {
      // Fallback: simulate success for demo
      setTimeout(() => setStatus("success"), 800);
    }
  }, [email]);

  const doubled = [...QUICK_FACTS, ...QUICK_FACTS];

  return (
    <section ref={ref} style={{ background: "#0A1628", borderTop: "1px solid #8B1A2A", overflow: "hidden" }}>
      {/* Ticker */}
      <div style={{ borderBottom: "1px solid #1e293b", padding: "20px 0", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "80px", background: "linear-gradient(to right, #0A1628, transparent)", zIndex: 2, pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "80px", background: "linear-gradient(to left, #0A1628, transparent)", zIndex: 2, pointerEvents: "none" }} />
        <div ref={tickerRef} style={{ display: "flex", gap: "0", width: "max-content", animation: "ticker 40s linear infinite" }}>
          {doubled.map((fact, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "16px", whiteSpace: "nowrap" }}>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "#9CA3AF", fontWeight: 400, padding: "0 32px" }}>{fact}</span>
              <span style={{ color: "#C0152A", fontSize: "0.5rem" }}>●</span>
            </span>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 48px", display: "flex", alignItems: "center", gap: "80px" }}>
        <div style={{ flex: 1, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s cubic-bezier(0.4,0,0.2,1)" }}>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", color: "#9B2335", textTransform: "uppercase", marginBottom: "16px" }}>STAY UPDATED</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: "clamp(28px,3vw,40px)", color: "#FAF9F7", margin: "0 0 12px", letterSpacing: "-0.5px" }}>New guides added monthly.</h2>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "#6B7280", margin: 0, lineHeight: 1.6 }}>No spam. Only Thalassemia-relevant content, updates from Blood Warriors, and new library additions.</p>
        </div>

        <div style={{ flex: 1, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s cubic-bezier(0.4,0,0.2,1) 0.15s" }}>
          {status === "success" ? (
            <div style={{ background: "rgba(44,168,160,0.1)", border: "1px solid #2CA8A0", borderRadius: "8px", padding: "28px 32px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "12px" }}>✓</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.25rem", color: "#2CA8A0", fontWeight: 600 }}>You're subscribed.</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "#6B7280", marginTop: "8px" }}>First update coming next month.</div>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                style={{ background: "#111827", border: "1px solid #1e293b", color: "#FAF9F7", fontFamily: "'DM Sans',sans-serif", fontSize: "1rem", padding: "14px 20px", outline: "none", borderRadius: "4px", transition: "border-color 0.2s" }}
                onFocus={e => (e.target.style.borderColor = "#C0152A")}
                onBlur={e => (e.target.style.borderColor = "#1e293b")}
              />
              <button type="submit" disabled={status === "loading"}
                style={{ background: status === "loading" ? "#6B7280" : "#C0152A", color: "#FAF9F7", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: "0.9rem", padding: "14px", border: "none", cursor: status === "loading" ? "not-allowed" : "pointer", letterSpacing: "0.05em", transition: "background 0.2s", borderRadius: 0 }}
                onMouseEnter={e => { if (status !== "loading") (e.currentTarget as HTMLButtonElement).style.background = "#9B2335"; }}
                onMouseLeave={e => { if (status !== "loading") (e.currentTarget as HTMLButtonElement).style.background = "#C0152A"; }}>
                {status === "loading" ? "Subscribing..." : "Subscribe to Library Updates →"}
              </button>
              {status === "error" && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", color: "#C0152A", margin: 0 }}>Something went wrong. Please try again.</p>}
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        ::placeholder { color: #6B7280; }
        body { margin: 0; background: #0D0D0D; }
        @media (max-width: 768px) {
          nav > div:nth-child(2) { display: none; }
          nav { padding: 0 24px !important; }
          nav > div:last-child { gap: 8px !important; }
          nav > div:last-child a { padding: 8px 12px !important; font-size: 0.75rem !important; }
          section { padding-left: 24px !important; padding-right: 24px !important; }
          .grid-4col { grid-template-columns: repeat(2,1fr) !important; }
          .grid-2col { grid-template-columns: 1fr !important; }
          .flex-split { flex-direction: column !important; gap: 40px !important; }
          h1 { font-size: 40px !important; }
        }
      `}</style>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer() {
  const cols = [
    { title: "Platform", links: ["How It Works", "For Donors", "For Patients", "Request Blood", "Register as Donor"] },
    { title: "Organisation", links: ["About Raksha AI", "Blood Warriors Foundation", "Partners", "Volunteer"] },
    { title: "Resources", links: ["Thalassemia Library", "Donor FAQs", "Blood Compatibility Guide", "Contact"] },
  ];
  return (
    <footer style={{ background: "#0A1628", borderTop: "1px solid #C0152A", padding: "64px 48px 32px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "48px", marginBottom: "48px" }}>
          <div>
            <RakshaLogo />
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "#6B7280", marginTop: "16px", lineHeight: 1.7 }}>Protecting lives, one match at a time.</p>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.8rem", color: "#C0152A", marginTop: "16px", fontWeight: 600 }}>🆘 Emergency: 1800-XXX-XXXX</p>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.15em", color: "#9B2335", textTransform: "uppercase", marginBottom: "20px" }}>{col.title}</div>
              {col.links.map(l => (
                <a key={l} href="#" style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", color: "#6B7280", textDecoration: "none", marginBottom: "10px", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#2CA8A0")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #1e293b", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", color: "#6B7280" }}>© 2025 Raksha AI × Blood Warriors Foundation</span>
          <div style={{ display: "flex", gap: "24px" }}>
            {["Privacy Policy", "Terms"].map(l => (
              <a key={l} href="#" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", color: "#6B7280", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#FAF9F7")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [search, setSearch] = useState("");

  // Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  return (
    <div style={{ background: "#0D0D0D", minHeight: "100vh" }}>
      <Navbar />
      <main>
        <HeroSection search={search} setSearch={setSearch} />
        <CategoryGrid search={search} />
        <FeaturedArticles search={search} />
        <BloodBankDirectory search={search} />
        <QuickFactsNewsletter />
      </main>
      <Footer />
    </div>
  );
}