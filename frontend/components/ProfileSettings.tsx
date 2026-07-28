"use client";

import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import {
  User, Settings, Bell, Shield, Palette, Globe, CreditCard,
  Camera, ChevronRight, Check, ArrowLeft, LogOut, AlertTriangle,
  Moon, Sun, Monitor, Lock, Eye, EyeOff, Save, Edit3,
} from "lucide-react";
import { toast } from "react-toastify";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProfileData {
  displayName: string;
  email: string;
  phone: string;
  bio: string;
  occupation: string;
  company: string;
  country: string;
  timezone: string;
  currency: string;
  language: string;
  jobTitle: string;
  industry: string;
}

type SidebarSection = "profile" | "preferences" | "security" | "notifications" | "privacy";

const CURRENCIES = ["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)", "AED (د.إ)", "SGD (S$)", "AUD (A$)", "CAD (C$)", "JPY (¥)"];
const TIMEZONES = ["Asia/Kolkata (IST)", "UTC", "America/New_York (EST)", "America/Los_Angeles (PST)", "Europe/London (GMT)", "Asia/Singapore (SGT)"];
const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "Singapore", "UAE", "Germany", "France"];
const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Spanish", "French", "German"];
const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Education", "Retail", "Manufacturing", "Media", "Real Estate", "Consulting", "Other"];

const sidebarNav: { id: SidebarSection; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "profile",      label: "Profile",        icon: User,    desc: "Personal info & details" },
  { id: "preferences",  label: "Preferences",    icon: Palette, desc: "Theme, currency & display" },
  { id: "security",     label: "Security",       icon: Shield,  desc: "Password & account safety" },
  { id: "notifications",label: "Notifications",  icon: Bell,    desc: "Alert preferences" },
  { id: "privacy",      label: "Privacy",        icon: Lock,    desc: "Data & privacy controls" },
];

// ── Profile completion calculator ─────────────────────────────────────────────
function calcCompletion(data: ProfileData): number {
  const fields = [data.displayName, data.email, data.phone, data.bio, data.occupation, data.company, data.country];
  const filled = fields.filter(f => f?.trim()).length;
  return Math.round((filled / fields.length) * 100);
}

// ── Input component ────────────────────────────────────────────────────────────
function SettingsInput({ label, value, onChange, placeholder, type = "text", disabled = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-sub)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="finance-input"
        style={{
          width: "100%", padding: "0.65rem 0.875rem", borderRadius: "0.625rem",
          fontSize: "0.9rem", border: "1px solid var(--card-border)",
          outline: "none", transition: "border-color 0.2s",
          opacity: disabled ? 0.5 : 1,
        }}
      />
    </div>
  );
}

// ── Select component ───────────────────────────────────────────────────────────
function SettingsSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-sub)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="finance-input"
        style={{
          width: "100%", padding: "0.65rem 0.875rem", borderRadius: "0.625rem",
          fontSize: "0.9rem", border: "1px solid var(--card-border)",
          outline: "none", cursor: "pointer",
        }}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--card-border)" }}>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.25rem" }}>{title}</h2>
      <p style={{ color: "var(--text-sub)", fontSize: "0.84rem", margin: 0 }}>{desc}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProfileSettings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<SidebarSection>("profile");
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>({
    displayName: user?.username || "",
    email: user?.email || "",
    phone: "",
    bio: "",
    occupation: "",
    company: "",
    country: "India",
    timezone: "Asia/Kolkata (IST)",
    currency: "INR (₹)",
    language: "English",
    jobTitle: "",
    industry: "Technology",
  });

  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);

  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    transactionAlerts: true,
    weeklyReport: true,
    monthlyReport: false,
    tips: true,
  });

  const updateProfile = useCallback((key: keyof ProfileData, val: string) => {
    setProfile(prev => ({ ...prev, [key]: val }));
    setHasChanges(true);
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900)); // Simulate API call
    setSaving(false);
    setHasChanges(false);
    toast.success("✅ Profile updated successfully!");
  };

  const completion = calcCompletion(profile);

  // ── Render section content ──────────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {

      case "profile":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <SectionHeader title="Profile Information" desc="Update your personal details and public profile." />

            {/* Avatar upload */}
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.25rem", borderRadius: "0.875rem", background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)" }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: "72px", height: "72px", borderRadius: "50%",
                  background: avatarUrl ? "transparent" : "linear-gradient(135deg, #7c3aed, #3b82f6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", border: "3px solid rgba(124,58,237,0.3)",
                  boxShadow: "0 4px 16px rgba(124,58,237,0.25)",
                }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "1.6rem", color: "white", fontWeight: 700 }}>
                      {(profile.displayName || user?.username || "?")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: "absolute", bottom: "0", right: "0",
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: "#7c3aed", border: "2px solid var(--bg-color)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Camera size={12} color="white" />
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
              <div>
                <p style={{ fontWeight: 600, margin: "0 0 0.25rem", fontSize: "0.95rem" }}>{profile.displayName || user?.username}</p>
                <p style={{ color: "var(--text-sub)", fontSize: "0.82rem", margin: "0 0 0.5rem" }}>{profile.email}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "0.3rem 0.75rem", fontSize: "0.78rem", fontWeight: 500,
                    background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)",
                    borderRadius: "0.5rem", color: "#a78bfa", cursor: "pointer",
                  }}
                >
                  Change Photo
                </button>
              </div>
            </div>

            {/* Profile completion */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-sub)", fontWeight: 500 }}>Profile Completion</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: completion >= 80 ? "#10b981" : completion >= 50 ? "#f59e0b" : "#f87171" }}>{completion}%</span>
              </div>
              <div style={{ height: "6px", borderRadius: "3px", background: "rgba(124,58,237,0.1)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "3px",
                  width: `${completion}%`,
                  background: completion >= 80 ? "linear-gradient(90deg,#059669,#10b981)" : completion >= 50 ? "linear-gradient(90deg,#d97706,#f59e0b)" : "linear-gradient(90deg,#dc2626,#f87171)",
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>

            {/* Form fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <SettingsInput label="Full Name" value={profile.displayName} onChange={v => updateProfile("displayName", v)} placeholder="Your name" />
              <SettingsInput label="Email" value={profile.email} onChange={v => updateProfile("email", v)} placeholder="your@email.com" type="email" />
              <SettingsInput label="Phone" value={profile.phone} onChange={v => updateProfile("phone", v)} placeholder="+91 9876543210" type="tel" />
              <SettingsInput label="Occupation" value={profile.occupation} onChange={v => updateProfile("occupation", v)} placeholder="Software Engineer" />
              <SettingsInput label="Company" value={profile.company} onChange={v => updateProfile("company", v)} placeholder="Acme Corp" />
              <SettingsInput label="Job Title" value={profile.jobTitle} onChange={v => updateProfile("jobTitle", v)} placeholder="Senior Developer" />
              <SettingsSelect label="Country" value={profile.country} onChange={v => updateProfile("country", v)} options={COUNTRIES} />
              <SettingsSelect label="Industry" value={profile.industry} onChange={v => updateProfile("industry", v)} options={INDUSTRIES} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-sub)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.4rem" }}>Bio</label>
              <textarea
                value={profile.bio}
                onChange={e => updateProfile("bio", e.target.value)}
                placeholder="Tell us a bit about yourself..."
                rows={3}
                className="finance-input"
                style={{
                  width: "100%", padding: "0.65rem 0.875rem", borderRadius: "0.625rem",
                  fontSize: "0.9rem", border: "1px solid var(--card-border)", outline: "none",
                  resize: "vertical", fontFamily: "inherit", lineHeight: 1.6,
                }}
              />
            </div>
          </div>
        );

      case "preferences":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <SectionHeader title="Preferences" desc="Customize how FinanceAI looks and behaves." />

            {/* Theme */}
            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: "0 0 0.25rem" }}>Appearance</p>
              <p style={{ color: "var(--text-sub)", fontSize: "0.82rem", margin: "0 0 1rem" }}>Choose your preferred color mode</p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {([
                  { val: "light", label: "Light", icon: Sun },
                  { val: "dark",  label: "Dark",  icon: Moon },
                  { val: "system", label: "System", icon: Monitor },
                ] as const).map(({ val, label, icon: Icon }) => {
                  const isActive = theme === val || (val === "system" && !["light", "dark"].includes(theme));
                  return (
                    <button
                      key={val}
                      onClick={() => { if (val !== "system") toggleTheme(); setHasChanges(true); }}
                      style={{
                        flex: 1, padding: "0.875rem", borderRadius: "0.75rem",
                        background: isActive ? "rgba(124,58,237,0.12)" : "transparent",
                        border: `1px solid ${isActive ? "rgba(124,58,237,0.4)" : "var(--card-border)"}`,
                        color: isActive ? "#a78bfa" : "var(--text-sub)",
                        cursor: "pointer", display: "flex", flexDirection: "column",
                        alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontWeight: 500,
                        transition: "all 0.2s",
                      }}
                    >
                      <Icon size={18} />
                      {label}
                      {isActive && <Check size={12} style={{ color: "#7c3aed" }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <SettingsSelect label="Default Currency" value={profile.currency} onChange={v => updateProfile("currency", v)} options={CURRENCIES} />
              <SettingsSelect label="Language" value={profile.language} onChange={v => updateProfile("language", v)} options={LANGUAGES} />
              <SettingsSelect label="Timezone" value={profile.timezone} onChange={v => updateProfile("timezone", v)} options={TIMEZONES} />
            </div>
          </div>
        );

      case "security":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <SectionHeader title="Security" desc="Manage your password and account security." />

            <div className="glass-card" style={{ padding: "1.25rem", borderColor: "rgba(124,58,237,0.15)" }}>
              <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: "0 0 1rem" }}>Change Password</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {[
                  { label: "Current Password", key: "current" as const },
                  { label: "New Password",     key: "newPass" as const },
                  { label: "Confirm Password", key: "confirm" as const },
                ].map(({ label, key }) => (
                  <div key={key} style={{ position: "relative" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-sub)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.4rem" }}>{label}</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPw ? "text" : "password"}
                        value={passwords[key]}
                        onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                        className="finance-input"
                        style={{
                          width: "100%", padding: "0.65rem 2.5rem 0.65rem 0.875rem",
                          borderRadius: "0.625rem", fontSize: "0.9rem",
                          border: "1px solid var(--card-border)", outline: "none",
                        }}
                      />
                      {key === "current" && (
                        <button
                          type="button"
                          onClick={() => setShowPw(v => !v)}
                          style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-sub)" }}
                        >
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    if (!passwords.newPass || passwords.newPass !== passwords.confirm) {
                      toast.error("Passwords do not match"); return;
                    }
                    toast.success("Password changed successfully!");
                    setPasswords({ current: "", newPass: "", confirm: "" });
                  }}
                  style={{
                    padding: "0.75rem", marginTop: "0.25rem",
                    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
                    border: "none", borderRadius: "0.75rem",
                    color: "white", fontWeight: 600, fontSize: "0.875rem",
                    cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
                  }}
                >
                  Update Password
                </button>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "1.25rem", borderColor: "rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <AlertTriangle size={18} color="#f87171" />
                <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0, color: "#f87171" }}>Danger Zone</p>
              </div>
              <p style={{ color: "var(--text-sub)", fontSize: "0.82rem", margin: "0 0 1rem", lineHeight: 1.5 }}>
                Logging out will clear your session. Deleting your account is permanent and cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={logout}
                  style={{
                    padding: "0.6rem 1.25rem", borderRadius: "0.625rem",
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                    color: "#f87171", fontSize: "0.83rem", fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "0.4rem",
                  }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <SectionHeader title="Notifications" desc="Control which alerts and reports you receive." />
            {Object.entries(notifications).map(([key, enabled]) => {
              const labels: Record<string, { title: string; desc: string }> = {
                budgetAlerts:     { title: "Budget Alerts",     desc: "Get notified when you exceed a budget limit" },
                transactionAlerts:{ title: "Transaction Alerts",desc: "Real-time alerts for new transactions" },
                weeklyReport:     { title: "Weekly Report",     desc: "Weekly summary of your spending sent every Monday" },
                monthlyReport:    { title: "Monthly Report",    desc: "Detailed monthly financial overview" },
                tips:             { title: "Finance Tips",      desc: "Personalized tips based on your spending habits" },
              };
              const info = labels[key];
              return (
                <div
                  key={key}
                  className="glass-card"
                  style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: "0 0 0.2rem" }}>{info?.title}</p>
                    <p style={{ color: "var(--text-sub)", fontSize: "0.8rem", margin: 0 }}>{info?.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      setNotifications(prev => ({ ...prev, [key]: !enabled }));
                      setHasChanges(true);
                    }}
                    style={{
                      width: "44px", height: "24px", borderRadius: "12px", flexShrink: 0,
                      background: enabled ? "linear-gradient(135deg,#7c3aed,#3b82f6)" : "rgba(100,116,139,0.3)",
                      border: "none", cursor: "pointer", position: "relative",
                      transition: "background 0.2s",
                    }}
                  >
                    <span style={{
                      position: "absolute", top: "3px",
                      left: enabled ? "22px" : "3px",
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: "white", transition: "left 0.2s ease",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    }} />
                  </button>
                </div>
              );
            })}
          </div>
        );

      case "privacy":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <SectionHeader title="Privacy & Data" desc="Control your data and privacy settings." />
            {[
              { title: "Export My Data", desc: "Download a copy of all your financial data.", action: "Export Data", color: "#3b82f6", href: "/export" },
            ].map(item => (
              <div key={item.title} className="glass-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: "0 0 0.2rem" }}>{item.title}</p>
                  <p style={{ color: "var(--text-sub)", fontSize: "0.82rem", margin: 0 }}>{item.desc}</p>
                </div>
                <button
                  onClick={() => navigate(item.href)}
                  style={{
                    padding: "0.5rem 1rem", borderRadius: "0.5rem",
                    background: `rgba(59,130,246,0.1)`, border: `1px solid rgba(59,130,246,0.25)`,
                    color: item.color, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  {item.action}
                </button>
              </div>
            ))}
            <div className="glass-card" style={{ padding: "1.25rem", borderColor: "rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.02)" }}>
              <p style={{ fontWeight: 600, color: "#f87171", margin: "0 0 0.5rem" }}>Delete Account</p>
              <p style={{ color: "var(--text-sub)", fontSize: "0.82rem", margin: "0 0 1rem", lineHeight: 1.5 }}>
                Permanently deletes your account and all associated data. This cannot be undone.
              </p>
              <button
                onClick={() => toast.error("Please contact support to delete your account.")}
                style={{
                  padding: "0.6rem 1.25rem", borderRadius: "0.625rem",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                  color: "#f87171", fontSize: "0.83rem", fontWeight: 600, cursor: "pointer",
                }}
              >
                Delete My Account
              </button>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div style={{
      padding: "2rem 1.5rem",
      maxWidth: "1000px",
      margin: "0 auto",
      fontFamily: "'Inter', sans-serif",
      animation: "fadeInUp 0.4s ease both",
    }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-sub)", fontSize: "0.83rem", marginBottom: "1.25rem",
          padding: "0.4rem 0", transition: "color 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#7c3aed")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-sub)")}
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Page header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Settings</h1>
        <p style={{ color: "var(--text-sub)", fontSize: "0.875rem", marginTop: "0.3rem" }}>
          Manage your profile, preferences, and account settings
        </p>
      </div>

      {/* Layout */}
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }} className="settings-layout">

        {/* Sidebar */}
        <div className="glass-card settings-sidebar" style={{ padding: "0.5rem", width: "220px", flexShrink: 0 }}>
          {sidebarNav.map(({ id, label, icon: Icon, desc }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.75rem 0.875rem", borderRadius: "0.75rem",
                  background: isActive ? "rgba(124,58,237,0.1)" : "transparent",
                  border: `1px solid ${isActive ? "rgba(124,58,237,0.3)" : "transparent"}`,
                  cursor: "pointer", textAlign: "left", marginBottom: "0.2rem",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.05)"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Icon size={16} color={isActive ? "#a78bfa" : "var(--text-sub)"} />
                <div>
                  <p style={{ fontSize: "0.83rem", fontWeight: 600, margin: 0, color: isActive ? "#a78bfa" : "var(--text-main)" }}>{label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <div className="glass-card" style={{ flex: 1, padding: "1.75rem", minWidth: 0 }}>
          {renderSection()}

          {/* Save / unsaved indicator */}
          {hasChanges && (
            <div style={{
              marginTop: "1.5rem", padding: "0.875rem 1.25rem",
              background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
              borderRadius: "0.75rem",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              animation: "fadeInUp 0.3s ease both",
            }}>
              <p style={{ color: "var(--text-sub)", fontSize: "0.83rem", margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Edit3 size={14} color="#a78bfa" /> You have unsaved changes
              </p>
              <div style={{ display: "flex", gap: "0.625rem" }}>
                <button
                  onClick={() => setHasChanges(false)}
                  style={{ padding: "0.4rem 0.875rem", borderRadius: "0.5rem", background: "transparent", border: "1px solid var(--card-border)", color: "var(--text-sub)", fontSize: "0.8rem", cursor: "pointer" }}
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "0.4rem 1rem", borderRadius: "0.5rem",
                    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
                    border: "none", color: "white", fontSize: "0.8rem", fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: "0.4rem",
                  }}
                >
                  <Save size={13} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 700px) {
          .settings-layout { flex-direction: column !important; }
          .settings-sidebar { width: 100% !important; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.3rem; }
        }
        @media (max-width: 420px) {
          .settings-sidebar { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
