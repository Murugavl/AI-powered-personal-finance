import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { theme as designTheme } from "@/lib/theme";
import {
  Home, CreditCard, DollarSign, PieChart, FileText,
  HelpCircle, Sun, Moon, LogOut, Upload, TrendingUp, User, Settings,
  Menu, X
} from "lucide-react";
import { useState } from "react";


const navItems = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Accounts", path: "/accounts", icon: CreditCard },
  { name: "Transactions", path: "/transactions", icon: DollarSign },
  { name: "Budgeting", path: "/budgeting", icon: PieChart },
  { name: "Reports", path: "/reports", icon: FileText },
  { name: "Export", path: "/export", icon: Upload },
  { name: "Help", path: "/help", icon: HelpCircle },
];

export function Navbar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="app-navbar" style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        maxWidth: "1400px", margin: "0 auto",
        padding: "0 1.5rem",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        height: "60px",
      }}>
        {/* Left: Logo & Mobile Hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="mobile-menu-toggle"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center",
              padding: "4px", borderRadius: "6px",
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: designTheme.gradients.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <TrendingUp size={18} color="white" />
            </div>
            <span style={{
              fontSize: "1.1rem", fontWeight: 700,
              background: designTheme.gradients.primary,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              FinanceAI
            </span>
          </Link>
        </div>

        {/* Desktop Nav links */}
        <ul className="desktop-nav-list" style={{
          display: "flex", alignItems: "center", gap: "0.25rem",
          listStyle: "none", margin: 0, padding: 0,
        }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  aria-label={item.name}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "0.5rem",
                    textDecoration: "none",
                    fontSize: "0.82rem", fontWeight: 500,
                    transition: "all 0.2s ease",
                    background: isActive ? "rgba(124,58,237,0.15)" : "transparent",
                    color: isActive ? "#a78bfa" : "#94a3b8",
                    border: isActive ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.08)";
                      (e.currentTarget as HTMLElement).style.color = "#c4b5fd";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                    }
                  }}
                >
                  <Icon size={15} />
                  <span className="nav-label">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
            style={{
              width: "34px", height: "34px", borderRadius: "8px",
              background: "rgba(30,41,59,0.6)", border: "1px solid rgba(30,41,59,1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#94a3b8",
              transition: "all 0.2s",
            }}
          >
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* User menu */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="User menu"
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.75rem",
                background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
                borderRadius: "8px", cursor: "pointer",
                color: "#a78bfa", fontSize: "0.8rem", fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              <div style={{
                width: "24px", height: "24px", borderRadius: "50%",
                background: designTheme.gradients.primary,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <User size={13} color="white" />
              </div>
              <span style={{ maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.username || "User"}
              </span>
            </button>

            {userMenuOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 8px)",
                background: "var(--card-bg)", backdropFilter: "blur(20px)",
                border: "1px solid var(--card-border)",
                borderRadius: "12px", padding: "0.5rem",
                minWidth: "190px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                zIndex: 200,
                color: "var(--text-main)",
              }}>
                <div style={{
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid var(--card-border)",
                  marginBottom: "0.25rem",
                }}>
                  <p style={{ color: "var(--text-main)", fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>
                    {user?.username}
                  </p>
                  <p style={{ color: "var(--text-sub)", fontSize: "0.75rem", margin: "0.15rem 0 0" }}>{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.6rem 1rem", borderRadius: "8px",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-main)", fontSize: "0.875rem", fontWeight: 500,
                    textDecoration: "none",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  <Settings size={15} color="#7c3aed" />
                  Profile & Settings
                </Link>
                <div style={{ borderTop: "1px solid var(--card-border)", margin: "0.25rem 0" }} />
                <button
                  onClick={() => { setUserMenuOpen(false); logout(); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.6rem 1rem", borderRadius: "8px",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#f87171", fontSize: "0.875rem", fontWeight: 500,
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (< 768px) */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" style={{
          background: "var(--card-bg, #0f172a)",
          borderBottom: "1px solid var(--card-border, rgba(124,58,237,0.2))",
          padding: "0.75rem 1.5rem",
          display: "flex", flexDirection: "column", gap: "0.5rem",
        }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "0.5rem",
                  textDecoration: "none",
                  fontSize: "0.9rem", fontWeight: 500,
                  background: isActive ? "rgba(124,58,237,0.15)" : "transparent",
                  color: isActive ? "#a78bfa" : "#94a3b8",
                  border: isActive ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                }}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        .mobile-menu-toggle { display: flex; }
        @media (min-width: 768px) {
          .mobile-menu-toggle { display: none !important; }
          .mobile-nav-drawer { display: none !important; }
          .nav-label { display: inline !important; }
        }
        @media (max-width: 767px) {
          .nav-label { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
