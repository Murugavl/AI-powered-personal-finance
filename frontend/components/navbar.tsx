import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { theme as designTheme } from "@/lib/theme";
import {
  Home, CreditCard, DollarSign, PieChart, FileText,
  HelpCircle, Sun, Moon, LogOut, Upload, TrendingUp, User, Settings,
  Menu, X, Bell, Target
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { API_URL as API_BASE_URL } from "@/lib/config";

const navItems = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Accounts", path: "/accounts", icon: CreditCard },
  { name: "Transactions", path: "/transactions", icon: DollarSign },
  { name: "Budgeting", path: "/budgeting", icon: PieChart },
  { name: "Goals", path: "/goals", icon: Target },
  { name: "Reports", path: "/reports", icon: FileText },
  { name: "Export", path: "/export", icon: Upload },
  { name: "Help", path: "/help", icon: HelpCircle },
];

export function Navbar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { theme, toggleTheme } = useTheme();
  const { user, logout, getAuthHeaders } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts/`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.items || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch {
      // ignore
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (user) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 15000);
      return () => clearInterval(interval);
    }
  }, [user, fetchAlerts]);

  const markRead = async (id?: string) => {
    try {
      const url = id ? `${API_BASE_URL}/alerts/${id}/read` : `${API_BASE_URL}/alerts/read-all`;
      await fetch(url, { method: "PATCH", headers: getAuthHeaders() });
      fetchAlerts();
    } catch {
      // ignore
    }
  };

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
            className="nav-icon-btn"
          >
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* Notifications Bell */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setAlertsOpen(!alertsOpen)}
              aria-label="Notifications"
              title="Notifications"
              className="nav-icon-btn"
              style={unreadCount > 0 ? { color: "#f87171" } : {}}
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: "-4px", right: "-4px",
                  width: "16px", height: "16px", borderRadius: "50%",
                  background: "#ef4444", color: "white", fontSize: "0.65rem",
                  fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Alerts Popover Dropdown */}
            {alertsOpen && (
              <div className="notif-dropdown" style={{
                position: "absolute", right: 0, top: "calc(100% + 8px)",
                width: "320px", borderRadius: "12px",
                zIndex: 110, padding: "0.75rem",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--divider)" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={() => markRead()} style={{ background: "none", border: "none", color: "#a78bfa", fontSize: "0.75rem", cursor: "pointer" }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {alerts.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", margin: "1rem 0" }}>No notifications</p>
                  ) : (
                    alerts.map(a => (
                      <div key={a._id} className={`notif-item ${a.read ? "read" : "unread"}`} style={{
                        padding: "0.6rem", borderRadius: "8px",
                        fontSize: "0.78rem",
                        display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem"
                      }}>
                        <p style={{ margin: 0, fontWeight: a.read ? 400 : 600, flex: 1 }}>{a.message}</p>
                        {!a.read && (
                          <button onClick={() => markRead(a._id)} title="Mark as read" style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", padding: 0 }}>
                            ✓
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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
      `}</style>
    </nav>
  );
}
