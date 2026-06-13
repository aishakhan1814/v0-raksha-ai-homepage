"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

// Interface for article
interface ArticleDetail {
  title: string;
  tag: string;
  readTime: string;
  date: string;
  content: string;
}

// Fallback data in case the API call fails or is offline
const FALLBACK_ARTICLES: Record<string, ArticleDetail> = {
  "recurring-donor-necessity": {
    title: "Why Thalassemia Patients Need the Same Donor to Come Back",
    tag: "FOR DONORS",
    readTime: "5 min read",
    date: "Updated January 2025",
    content: `
      <div class="article-content">
        <p class="lead">Most blood donation platforms treat every donation as a one-time transaction. For Thalassemia patients, that model is dangerous. Here's why recurring, compatible donation is a medical necessity.</p>
        
        <h2>The Challenge of Chronic Transfusions</h2>
        <p>Thalassemia patients depend on regular blood transfusions every 2 to 5 weeks to survive. Over a lifetime, a patient might receive hundreds of units of blood. When a patient is exposed to many different blood donors, their immune system is exposed to hundreds of foreign red blood cell antigens.</p>
        
        <h2>What is Alloimmunization?</h2>
        <p>Alloimmunization occurs when the patient's immune system recognizes minor antigens on the transfused red cells as foreign and produces antibodies against them. Once these antibodies are formed, finding compatible blood becomes extremely difficult. It can lead to acute or delayed hemolytic transfusion reactions, where the body destroys the transfused blood, rendering the treatment ineffective and causing severe clinical complications.</p>
        
        <h2>The Power of a Dedicated Donor Pool</h2>
        <p>By pairing a patient with a small, dedicated pool of recurring donors who have matching minor antigens (Rh phenotype, Kell, etc.), we can minimize the variety of foreign antigens the patient's immune system encounters. This dramatically reduces the risk of alloimmunization, ensures the longevity of transfused cells, and protects the patient from life-threatening immune responses.</p>
        
        <h2>Why Your Commitment Matters</h2>
        <p>When you register as a recurring donor on Raksha AI, you aren't just giving a random unit of blood. You are committing to becoming a lifeline for a specific patient. Regular donations (every 3 months for men, every 4 months for women) provide stable, compatible blood and ensure the patient's hemoglobin levels remain in a safe, healthy zone.</p>
      </div>
    `
  },
  "parents-guide-transfusion": {
    title: "The Parent's Guide to Managing Transfusion Schedules",
    tag: "FOR FAMILIES",
    readTime: "8 min read",
    date: "Updated December 2024",
    content: `
      <div class="article-content">
        <p class="lead">Managing transfusion-dependent thalassemia requires meticulous planning, emotional resilience, and active coordination. This guide helps parents navigate the schedule and support their child effectively.</p>
        
        <h2>1. Tracking Hemoglobin Levels</h2>
        <p>Always maintain a detailed logbook of your child's pre-transfusion hemoglobin (Hb) levels. The goal is usually to keep pre-transfusion Hb around 9.0 - 9.5 g/dL to suppress the body's ineffective red blood cell production and promote normal growth. If you notice a sudden drop in Hb or symptoms of fatigue and irritability before the scheduled date, contact your hematologist immediately.</p>
        
        <h2>2. Scheduling and Coordination</h2>
        <p>Book transfusion appointments at least 1 week in advance. Coordinate with your blood bank to ensure that cross-matched, filtered, and leucodepleted blood is ready. Leucodepletion is critical because it removes white blood cells, reducing febrile non-hemolytic transfusion reactions and CMV transmission.</p>
        
        <h2>3. Managing Iron Overload</h2>
        <p>Every unit of transfused blood contains iron that the body cannot excrete naturally. This leads to iron accumulation in vital organs like the heart, liver, and endocrine glands. Monitor serum ferritin levels regularly (usually every 3 months). Work closely with your hematologist to start oral or subcutaneous iron chelation therapy (e.g., Deferasirox, Deferiprone, or Desferrioxamine) when ferritin exceeds 1,000 ng/mL.</p>
        
        <h2>4. Preparing Your Child</h2>
        <p>Transfusions can be stressful for a child. Be honest about the procedure. Bring their favorite books, toys, or a tablet to keep them distracted during the 2-4 hour transfusion. Keep them well-hydrated before the session to make vein access easier.</p>
      </div>
    `
  },
  "alloimmunization-risk": {
    title: "Alloimmunization: The Hidden Risk in Unmatched Transfusions",
    tag: "MEDICAL",
    readTime: "6 min read",
    date: "Updated November 2024",
    content: `
      <div class="article-content">
        <p class="lead">Each time a patient receives blood with incompatible minor antigens, their immune system builds resistance. Over hundreds of transfusions, this becomes life-threatening.</p>
        
        <h2>Minor Antigens and Clinical Immunology</h2>
        <p>While standard blood matching focuses on ABO and RhD antigens, red blood cells contain hundreds of other minor antigens belonging to systems like Kell (K, k), Rh (C, c, E, e), Duffy (Fya, Fyb), Kidd (Jka, Jkb), and MNS. For patients receiving chronic transfusions, standard ABO/RhD matching is insufficient.</p>
        
        <h2>Mechanism of Antibody Formation</h2>
        <p>When there is a mismatch in these minor antigens, the recipient's immune system identifies them as foreign, triggering B-lymphocytes to produce specific alloantibodies. Upon subsequent transfusions with cells carrying the same antigens, the antibodies bind to the donor cells, leading to extravascular hemolysis (destruction of red cells in the spleen or liver).</p>
        
        <h2>Consequences of Alloimmunization</h2>
        <ul>
          <li><strong>Difficult Cross-matching:</strong> Finding compatible blood becomes a search for a needle in a haystack, causing critical delays in treatment.</li>
          <li><strong>Hemolytic Transfusion Reactions:</strong> Can cause fever, chills, jaundice, renal failure, and severe chest or back pain.</li>
          <li><strong>Hyperhemolysis Syndrome:</strong> A rare, life-threatening condition where the patient destroys both the transfused cells and their own native red blood cells.</li>
          <li><strong>Preventative Strategies:</strong> The primary method to prevent alloimmunization is extended antigen typing (phenotyping) of both the patient and the donor pool. Matching for at least the Kell and Rh sub-antigens (C, c, E, e) is now recommended as standard care for all newly diagnosed thalassemia patients.</li>
        </ul>
      </div>
    `
  },
  "what-is-thalassemia": {
    title: "What Is Thalassemia?",
    tag: "FOR FAMILIES",
    readTime: "4 min read",
    date: "Updated February 2025",
    content: `
      <div class="article-content">
        <p class="lead">Thalassemia is an inherited blood disorder characterized by less oxygen-carrying protein (hemoglobin) and fewer red blood cells in the body than normal.</p>
        
        <h2>The Genetic Basis</h2>
        <p>Thalassemia is caused by mutations in the DNA of cells that make hemoglobin. Hemoglobin molecules are made of alpha and beta chains. In thalassemia, the production of either the alpha or beta chains is reduced, leading to alpha-thalassemia or beta-thalassemia.</p>
        
        <h2>Thalassemia Major vs. Minor</h2>
        <ul>
          <li><strong>Thalassemia Minor (Carrier):</strong> If you receive only one mutated gene from one parent, you have thalassemia minor. Carriers usually have no symptoms or very mild anemia and do not require treatment.</li>
          <li><strong>Thalassemia Major (TDT):</strong> If you receive mutated genes from both parents, you have thalassemia major (Transfusion-Dependent Thalassemia). Symptoms usually appear within the first two years of life, causing severe anemia, fatigue, pale skin, and slow growth.</li>
        </ul>
        
        <h2>Treatment & Management</h2>
        <p>Patients with Thalassemia Major require lifelong medical care, including regular blood transfusions (every few weeks) to maintain healthy hemoglobin levels, combined with iron chelation therapy to remove excess iron from the body. For some patients, a bone marrow transplant can offer a permanent cure.</p>
      </div>
    `
  },
  "blood-compatibility": {
    title: "Understanding Blood Compatibility",
    tag: "MEDICAL",
    readTime: "7 min read",
    date: "Updated March 2025",
    content: `
      <div class="article-content">
        <p class="lead">Blood compatibility goes far beyond the basic A, B, AB, and O blood groups. For patients who receive chronic transfusions, understanding extended typing is a life-saving necessity.</p>
        
        <h2>The ABO and RhD Systems</h2>
        <p>ABO and RhD are the primary antigens checked during any standard blood transfusion. While O-negative is the universal donor for emergency situations, chronic transfusion recipients cannot rely on basic compatibility because of the hundreds of other minor proteins present on the surface of red blood cells.</p>
        
        <h2>The Importance of Extended Phenotypical Matching</h2>
        <p>Extended phenotyping involves checking for minor antigens in other blood group systems, particularly the Rh subgroups (C, c, E, e) and the Kell system (K, k). Matching these antigens between the donor and recipient reduces the probability of the patient developing antibodies (alloimmunization) by more than 80%.</p>
        
        <h2>How Raksha AI Bridges the Gap</h2>
        <p>Raksha AI catalogs the extended phenotypical profiles of registered donors and matches them with patient profiles. By finding exact or highly compatible antigen matches in local databases, we prevent immune reactions before they start, ensuring safe, effective, and sustainable transfusions.</p>
      </div>
    `
  },
  "transfusion-dependent": {
    title: "Transfusion-Dependent Thalassemia",
    tag: "FOR FAMILIES",
    readTime: "6 min read",
    date: "Updated February 2025",
    content: `
      <div class="article-content">
        <p class="lead">Transfusion-Dependent Thalassemia (TDT), historically known as Thalassemia Major, is a severe genetic blood disorder where the body cannot produce sufficient functional hemoglobin, requiring lifelong blood transfusions to survive.</p>
        
        <h2>The Role of Lifelong Transfusions</h2>
        <p>For individuals with TDT, red blood cells are fragile and break down rapidly. Standard therapy involves regular blood transfusions every 2 to 4 weeks. These transfusions supply the body with healthy donor red blood cells, enabling oxygen delivery and suppressing the body’s own overactive bone marrow, which prevents skeletal deformities and other severe complications.</p>
        
        <h2>Maintaining Target Hemoglobin Levels</h2>
        <p>To ensure growth, development, and high quality of life, the clinical target is usually to maintain pre-transfusion hemoglobin levels between 9.0 and 10.0 g/dL. If pre-transfusion Hb drops below this threshold, patients may experience fatigue, rapid heart rate, poor sleep, and developmental delays. Regular monitoring is key to preventing these symptoms.</p>
        
        <h2>A Coordinated Approach to Care</h2>
        <p>Managing TDT requires a multi-specialty medical team, including hematologists, cardiologists, and endocrinologists. Through Raksha AI, patient profiles are synchronized with compatible donor groups to ensure that every transfusion is matched for major and minor antigens, protecting patients from immunization risks over their lifetime.</p>
      </div>
    `
  },
  "iron-overload-chelation": {
    title: "Iron Overload & Chelation Therapy",
    tag: "FOR FAMILIES",
    readTime: "7 min read",
    date: "Updated March 2025",
    content: `
      <div class="article-content">
        <p class="lead">Chronic blood transfusions introduce massive amounts of iron into the patient’s body. Because the human body lacks a natural mechanism to excrete excess iron, it accumulates in vital organs, requiring proactive chelation therapy.</p>
        
        <h2>Why Iron Overload Happens</h2>
        <p>Each unit of transfused red blood cells contains approximately 200 mg of iron. Over a year of monthly transfusions, this amounts to a significant iron burden. If left untreated, the excess iron deposits in the liver, heart, and endocrine glands, leading to organ failure, heart disease, diabetes, and stunted growth.</p>
        
        <h2>What is Chelation Therapy?</h2>
        <p>Chelation therapy uses specialized medications (chelators) that bind to free iron in the bloodstream and tissues, allowing it to be excreted safely through urine or stool. The three commonly used chelators are Deferasirox (oral tablets), Deferiprone (oral liquid or tablets), and Desferrioxamine (subcutaneous infusion via a pump).</p>
        
        <h2>Monitoring Iron Levels</h2>
        <p>Serum ferritin levels are checked every 3 months as a primary indicator of iron stores, with a general clinical goal of keeping ferritin below 1,000 ng/mL. Additionally, non-invasive MRI scans (T2*) of the heart and liver are performed annually to assess organ-specific iron concentrations and adjust chelation dosages accordingly.</p>
      </div>
    `
  },
  "bone-marrow-transplant": {
    title: "Bone Marrow Transplant",
    tag: "MEDICAL",
    readTime: "8 min read",
    date: "Updated April 2025",
    content: `
      <div class="article-content">
        <p class="lead">For patients with Transfusion-Dependent Thalassemia, a Bone Marrow Transplant (BMT) — also known as a Hematopoietic Stem Cell Transplant — currently offers the only established, permanent cure.</p>
        
        <h2>How BMT Works</h2>
        <p>The goal of a BMT is to replace the patient's defective blood-forming stem cells in the bone marrow with healthy stem cells from a compatible donor. If successful, the new stem cells will produce healthy red blood cells containing normal hemoglobin, permanently eliminating the need for transfusions and chelation therapy.</p>
        
        <h2>Finding a Matching Donor</h2>
        <p>The success of a BMT relies heavily on human leukocyte antigen (HLA) matching. The ideal donor is a fully matched sibling (known as a matched related donor, or MRD), which offers the highest success rates (over 90%). If a sibling match is not available, searches are conducted in international registries for a matched unrelated donor (MUD) or haploidentical (half-match) parent donors.</p>
        
        <h2>The Transplant Procedure</h2>
        <p>The BMT process starts with "conditioning," where the patient receives chemotherapy to destroy their own defective bone marrow. This is followed by the infusion of healthy donor stem cells, which travel to the bone marrow and begin producing new cells (engraftment). The patient remains in a highly sterile, isolated room for several weeks to prevent infections while their new immune system develops.</p>
      </div>
    `
  },
  "thalassemia-at-school": {
    title: "Thalassemia at School",
    tag: "FOR FAMILIES",
    readTime: "5 min read",
    date: "Updated April 2025",
    content: `
      <div class="article-content">
        <p class="lead">Children with Transfusion-Dependent Thalassemia can and should participate fully in school life. Simple adjustments, open communication, and supportive peer environments make all the difference.</p>
        
        <h2>Informing the School Administration</h2>
        <p>At the start of the school year, parents should meet with teachers and the school nurse. Explain Thalassemia in simple terms, detail the transfusion schedule, and discuss signs of low hemoglobin (such as pale skin, extreme fatigue, or shortness of breath). Provide emergency contact details and letters from your child's hematologist.</p>
        
        <h2>Physical Activity and Rest</h2>
        <p>Children with Thalassemia can participate in physical education, but teachers should allow them to rest when fatigued. Because their oxygen-carrying capacity is lower, especially in the week leading up to a transfusion, they may need frequent breaks. Proper hydration during school hours is also essential to manage fatigue.</p>
        
        <h2>Managing Absenteeism</h2>
        <p>Since transfusions require a full day at the day-care center or hospital every few weeks, children will periodically miss school. Work with teachers to obtain homework assignments in advance, and utilize educational support materials so that your child remains on track academically.</p>
      </div>
    `
  },
  "donor-faqs": {
    title: "Donor FAQs",
    tag: "FOR DONORS",
    readTime: "6 min read",
    date: "Updated May 2025",
    content: `
      <div class="article-content">
        <p class="lead">Have questions about blood donation? We've compiled the most common questions from first-time and recurring donors to help you understand the process and your impact.</p>
        
        <h2>Does donating blood hurt?</h2>
        <p>You will feel a quick pinch when the needle is inserted, which lasts only a second. During the actual donation, which takes about 8 to 10 minutes, you should feel no pain. Our trained medical staff monitor you throughout the process to ensure you are comfortable.</p>
        
        <h2>How often can I donate blood?</h2>
        <p>Healthy male donors can donate whole blood every 90 days (3 months), and female donors can donate every 120 days (4 months). This interval ensures that your body has fully replenished its red blood cells and iron stores before your next donation.</p>
        
        <h2>What is extended antigen typing?</h2>
        <p>Extended typing goes beyond standard ABO/Rh blood groups to check for minor antigens on your red blood cells (like Rh subgroups C, c, E, e and the Kell system). For Thalassemia patients who receive chronic transfusions, matching these minor antigens is critical to prevent alloimmunization and ensure transfusion safety.</p>
        
        <h2>Are there any side effects?</h2>
        <p>Most donors feel fine after donation. Some may experience mild lightheadedness, which quickly resolves after resting for 10-15 minutes and having a light snack and water. We recommend avoiding strenuous physical activity or heavy lifting for the rest of the day.</p>
      </div>
    `
  },
  "blood-bank-directory": {
    title: "Blood Bank Directory",
    tag: "FOR FAMILIES",
    readTime: "5 min read",
    date: "Updated June 2025",
    content: `
      <div class="article-content">
        <p class="lead">Finding a blood bank equipped with phenotypically matched blood and specialized Thalassemia day-care facilities is critical for patient care. Below is our national directory of partner blood banks.</p>
        
        <h2>Partner Blood Banks in Major Cities</h2>
        <p>Our partner blood banks support extended antigen typing and leucodepletion, ensuring that the blood delivered is compatible and safe for chronic transfusion recipients. You can find their contact details and locations below:</p>
        
        <ul>
          <li><strong>Apollo Blood Bank (Hyderabad, Telangana)</strong><br>Phone: 040-2360-7777 | Thalassemia Program: Yes | Extended Typing: No</li>
          <li><strong>KEM Hospital Blood Bank (Mumbai, Maharashtra)</strong><br>Phone: 022-2410-7000 | Thalassemia Program: Yes | Extended Typing: Yes</li>
          <li><strong>AIIMS Blood Bank (New Delhi, Delhi)</strong><br>Phone: 011-2659-3308 | Thalassemia Program: Yes | Extended Typing: Yes</li>
          <li><strong>CMC Blood Bank (Vellore, Tamil Nadu)</strong><br>Phone: 0416-228-1000 | Thalassemia Program: Yes | Extended Typing: Yes</li>
          <li><strong>Prathama Blood Centre (Ahmedabad, Gujarat)</strong><br>Phone: 079-2754-5757 | Thalassemia Program: Yes | Extended Typing: Yes</li>
        </ul>
        
        <h2>Accessing the Interactive Directory</h2>
        <p>To use our real-time interactive search tool, apply filters by city or state, or look up specific blood banks, please visit the <a href="/library#blood-bank-directory" style="color: #2CA8A0; text-decoration: underline;">Interactive Directory Section</a> on the main Library page.</p>
      </div>
    `
  }
};

// Navbar logo
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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
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
      transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      padding: "0 48px",
      height: "68px",
      display: "flex", alignItems: "center", justifyBetween: "space-between",
      justifyContent: "space-between",
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
      <div style={{ display: "flex", gap: "12px" }}>
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

function Footer() {
  const cols = [
    { title: "Platform", links: ["How It Works", "For Donors", "For Patients", "Request Blood", "Register as Donor"] },
    { title: "Organisation", links: ["About Raksha AI", "Blood Warriors Foundation", "Partners", "Volunteer"] },
    { title: "Resources", links: ["Thalassemia Library", "Donor FAQs", "Blood Compatibility Guide", "Contact"] },
  ];
  return (
    <footer style={{ background: "#0A1628", borderTop: "1px solid #C0152A", padding: "64px 48px 32px", marginTop: "auto" }}>
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

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"API" | "FALLBACK" | null>(null);

  // Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      setLoading(true);
      try {
        // Fetch from local Next.js API integrated with MongoDB first
        const res = await fetch(`/api/library/article/${slug}`);
        if (!res.ok) throw new Error("Failed to fetch article");
        const data = await res.json();
        if (data.success) {
          setArticle(data);
          setSource("API");
        } else {
          throw new Error("Article data invalid");
        }
      } catch (err) {
        console.warn("MongoDB API fetching failed. Relying on frontend premium fallback catalog:", err);
        if (FALLBACK_ARTICLES[slug]) {
          setArticle(FALLBACK_ARTICLES[slug]);
          setSource("FALLBACK");
        } else {
          setArticle(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  const getTagStyles = (tag: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      "FOR DONORS": { bg: "#C0152A", color: "#FAF9F7" },
      "FOR FAMILIES": { bg: "#2CA8A0", color: "#FAF9F7" },
      "MEDICAL": { bg: "#D4A847", color: "#0D0D0D" },
    };
    return styles[tag] || { bg: "#374151", color: "#FAF9F7" };
  };

  return (
    <div style={{ background: "#0D0D0D", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, paddingTop: "120px", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px" }}>
          
          {/* Back button */}
          <a href="/library" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            color: "#6B7280", textDecoration: "none", fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.9rem", marginBottom: "32px", transition: "color 0.2s"
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#2CA8A0")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}
          >
            ← Back to Library
          </a>

          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              <div className="spinner" style={{
                width: "40px", height: "40px", border: "3px solid rgba(44, 168, 160, 0.2)",
                borderTopColor: "#2CA8A0", borderRadius: "50%", animation: "spin 1s linear infinite",
                margin: "0 auto 20px"
              }} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B7280" }}>Loading article content...</p>
            </div>
          ) : article ? (
            <article>
              {/* Tag and meta */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                <span style={{
                  background: getTagStyles(article.tag).bg,
                  color: getTagStyles(article.tag).color,
                  fontFamily: "'DM Sans',sans-serif", fontSize: "0.65rem", fontWeight: 600,
                  letterSpacing: "0.12em", padding: "4px 10px", textTransform: "uppercase"
                }}>
                  {article.tag}
                </span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", color: "#6B7280" }}>
                  {article.readTime} · {article.date}
                </span>
                {source === "FALLBACK" && (
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "#2CA8A0",
                    border: "1px solid #2CA8A0", padding: "2px 6px", borderRadius: "3px", opacity: 0.8
                  }}>
                    OFFLINE CACHE
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 700, color: "#FAF9F7", lineHeight: 1.15, letterSpacing: "-1px",
                margin: "0 0 40px"
              }}>
                {article.title}
              </h1>

              {/* Content body */}
              <div 
                dangerouslySetInnerHTML={{ __html: article.content }} 
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "1.05rem",
                  color: "#D1D5DB",
                  lineHeight: "1.8",
                  fontWeight: 300,
                }}
              />
            </article>
          ) : (
            <div style={{
              background: "#111827", border: "1px solid #8B1A2A", borderRadius: "8px",
              padding: "48px 32px", textAlign: "center"
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", color: "#FAF9F7", margin: "0 0 12px", fontWeight: 700 }}>Article Not Found</h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B7280", maxWidth: "480px", margin: "0 auto 24px" }}>
                We couldn't locate the article with slug "<span style={{ color: "#C0152A" }}>{slug}</span>". Please check the address or return to the library browse page.
              </p>
              <a href="/library" style={{
                background: "#C0152A", color: "#FAF9F7", fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600, fontSize: "0.875rem", padding: "12px 28px", textDecoration: "none",
                display: "inline-block", transition: "background 0.2s"
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "#9B2335")}
                onMouseLeave={e => (e.currentTarget.style.background = "#C0152A")}
              >
                Browse All Articles
              </a>
            </div>
          )}

        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .article-content p {
          margin-bottom: 24px;
        }
        .article-content p.lead {
          font-size: 1.25rem;
          color: #FAF9F7;
          lineHeight: 1.6;
          margin-bottom: 32px;
          font-weight: 400;
        }
        .article-content h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.8rem;
          color: #FAF9F7;
          margin-top: 48px;
          margin-bottom: 16px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }
        .article-content ul {
          margin-bottom: 24px;
          padding-left: 20px;
        }
        .article-content li {
          margin-bottom: 12px;
        }
        .article-content strong {
          color: #FAF9F7;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
