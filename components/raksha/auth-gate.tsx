"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert, LogOut, LayoutDashboard } from "lucide-react";

interface AuthGateProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = [
  "/signin",
  "/register/donor",
  "/register/patient",
  "/forgot-password",
];

export default function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(true);

  useEffect(() => {
    function checkAuth() {
      if (typeof window === "undefined") return;

      const userStr = localStorage.getItem("raksha_user");
      const user = userStr ? JSON.parse(userStr) : null;
      
      const isPublic = PUBLIC_ROUTES.includes(pathname);

      if (!user) {
        setIsAuthenticated(false);
        setUserRole(null);
        
        if (!isPublic) {
          // Redirect to signin if accessing protected page
          router.replace("/signin");
          return;
        }
        setIsAuthorized(true);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      const role = user.role || "donor";
      setUserRole(role);

      // Check authorization based on path and role
      let authorized = true;

      if (pathname.startsWith("/console")) {
        // Console requires coordinator or admin role
        authorized = role === "coordinator" || role === "admin";
      } else if (pathname.startsWith("/patient/search")) {
        // Patient search requires coordinator, admin or patient role
        authorized = role === "coordinator" || role === "admin" || role === "patient";
      } else if (pathname.startsWith("/donor/profile")) {
        // Donor profile details require coordinator or admin
        authorized = role === "coordinator" || role === "admin";
      } else if (pathname.startsWith("/dashboard/donor")) {
        authorized = role === "donor";
      } else if (pathname.startsWith("/dashboard/patient")) {
        authorized = role === "patient";
      }

      setIsAuthorized(authorized);
      setLoading(false);
    }

    checkAuth();
  }, [pathname, router]);

  // Handle Logout action
  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("raksha_user");
      // Redirect to signin
      window.location.href = "/signin";
    }
  };

  // Resolve path to go to correct dashboard based on role
  const handleGoToDashboard = () => {
    if (userRole === "donor") {
      router.push("/dashboard/donor");
    } else if (userRole === "patient") {
      router.push("/dashboard/patient");
    } else if (userRole === "coordinator" || userRole === "admin") {
      router.push("/console");
    } else {
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <span style={styles.spinner} />
        <div style={styles.loaderText}>Authenticating secure connection...</div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!isAuthorized && isAuthenticated) {
    /* Unauthorized warning screen overlay */
    return (
      <div style={styles.deniedOverlay}>
        <div style={styles.deniedCard}>
          <div style={styles.header}>
            <ShieldAlert size={36} style={{ color: "#C0152A" }} />
            <span style={styles.headerText}>SECURITY PROTOCOL ALERT</span>
          </div>

          <div style={styles.body}>
            <h1 style={styles.heading}>UNAUTHORIZED CLINICAL ACCESS</h1>
            <div style={styles.errorCode}>ERR_SECURITY_CLR_LEVEL_INSUFFICIENT</div>
            
            <p style={styles.message}>
              You do not possess the required clearance level to access this portal segment ({pathname}). This unauthorized attempt has been logged for safety auditing.
            </p>

            <div style={styles.userMeta}>
              <div>Authenticated Email: <strong style={{ color: "#FAF9F7" }}>{typeof window !== "undefined" ? JSON.parse(localStorage.getItem("raksha_user") || "{}").email : ""}</strong></div>
              <div style={{ marginTop: "4px" }}>Assigned Role: <strong style={{ color: "#C0152A", textTransform: "uppercase" }}>{userRole}</strong></div>
            </div>

            <div style={styles.actions}>
              <button onClick={handleGoToDashboard} style={styles.btnDashboard}>
                <LayoutDashboard size={16} /> RETURN TO DASHBOARD
              </button>
              <button onClick={handleSignOut} style={styles.btnSignOut}>
                <LogOut size={16} /> SIGN OUT
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

const styles: Record<string, React.CSSProperties> = {
  loaderContainer: {
    minHeight: "100vh",
    background: "#060C16",
    color: "#FAF9F7",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #111827",
    borderTopColor: "#9B2335",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },
  loaderText: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "1.25rem",
    color: "#9CA3AF",
  },
  deniedOverlay: {
    position: "fixed",
    inset: 0,
    background: "#060C16",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 9999,
    fontFamily: "'DM Sans', sans-serif",
  },
  deniedCard: {
    background: "#0A1628",
    border: "2px solid #8B1A2A",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 20px 50px rgba(139, 26, 42, 0.25)",
  },
  header: {
    background: "rgba(192, 21, 42, 0.08)",
    borderBottom: "1px solid rgba(139, 26, 42, 0.3)",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.15em",
    color: "#C0152A",
  },
  body: {
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  heading: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "#FAF9F7",
    lineHeight: 1.1,
    margin: 0,
  },
  errorCode: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.7rem",
    color: "#C0152A",
    letterSpacing: "0.05em",
    background: "rgba(192, 21, 42, 0.1)",
    border: "1px solid rgba(192, 21, 42, 0.2)",
    padding: "6px 10px",
    alignSelf: "flex-start",
  },
  message: {
    fontSize: "0.88rem",
    color: "#9CA3AF",
    lineHeight: 1.6,
    margin: 0,
  },
  userMeta: {
    background: "rgba(3, 7, 18, 0.4)",
    border: "1px solid #1e293b",
    padding: "12px 16px",
    fontSize: "0.78rem",
    color: "#9CA3AF",
  },
  actions: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  },
  btnDashboard: {
    flex: 1,
    background: "#9B2335",
    color: "#FAF9F7",
    border: "none",
    padding: "12px 16px",
    fontSize: "0.78rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    cursor: "pointer",
    borderRadius: "2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "background 0.15s ease",
  },
  btnSignOut: {
    flex: 1,
    background: "transparent",
    color: "#9CA3AF",
    border: "1px solid #1e293b",
    padding: "12px 16px",
    fontSize: "0.78rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    cursor: "pointer",
    borderRadius: "2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.15s ease",
  },
};
