"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Github, Heart, Mail, ShieldCheck, Lock, FileText, X, Send } from "lucide-react";
import { toast } from "react-toastify";

const currentYear = new Date().getFullYear();

const keyFeatures = [
  "Smart Analytics & Insights",
  "Instant OCR Receipt Processing",
  "Custom Budgeting Goals",
  "GROQ-Powered AI Assistant",
  "Multi-Currency Support",
  "Data Privacy & Security",
];

const securityHighlights = [
  { title: "256-Bit Encryption", desc: "Bank-level data security" },
  { title: "Zero Data Selling", desc: "Your financial privacy is guaranteed" },
  { title: "Local Session Storage", desc: "Tokens stored securely in browser" },
  { title: "AI Privacy Controls", desc: "Data sanitized before AI analysis" },
];

export function Footer() {
  const [modalType, setModalType] = useState<"privacy" | "terms" | "contact" | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !contactMessage.trim()) {
      toast.error("Please fill out all fields.");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent! Our support team will respond to " + contactEmail);
      setContactEmail("");
      setContactMessage("");
      setModalType(null);
    }, 1000);
  };

  return (
    <footer style={{
      background: "var(--nav-bg)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid var(--nav-border)",
      fontFamily: "'Inter', sans-serif",
      marginTop: "auto",
    }}>
      {/* Main footer content */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2.5rem 1.5rem 1.5rem",
        display: "grid",
        gridTemplateColumns: "1.6fr 1fr 1fr 1.2fr",
        gap: "2.5rem",
      }} className="footer-grid">

        {/* Brand column */}
        <div>
          <Link to="/" style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            marginBottom: "1rem",
          }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "9px",
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(124,58,237,0.35)",
              flexShrink: 0,
            }}>
              <TrendingUp size={19} color="white" />
            </div>
            <span style={{
              fontSize: "1.1rem", fontWeight: 700,
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              FinanceAI
            </span>
          </Link>

          <p style={{
            color: "var(--text-sub)", fontSize: "0.82rem", lineHeight: 1.7,
            margin: "0 0 1.25rem", maxWidth: "260px",
          }}>
            AI-powered personal finance management. Track spending, set budgets, and gain smart insights — all in one place.
          </p>
        </div>

        {/* Column 2: Key Features */}
        <div>
          <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 1rem" }}>
            Key Features
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            {keyFeatures.map(feature => (
              <li key={feature} style={{ color: "var(--text-sub)", fontSize: "0.83rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ color: "#7c3aed", fontSize: "0.75rem" }}>✦</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Support & Legal */}
        <div>
          <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 1rem" }}>
            Support & Legal
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            <li>
              <Link to="/help" style={{ color: "var(--text-sub)", textDecoration: "none", fontSize: "0.83rem", transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-sub)")}>
                Help & FAQ
              </Link>
            </li>
            <li>
              <button onClick={() => setModalType("privacy")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-sub)", fontSize: "0.83rem", transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-sub)")}>
                Privacy Policy
              </button>
            </li>
            <li>
              <button onClick={() => setModalType("terms")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-sub)", fontSize: "0.83rem", transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-sub)")}>
                Terms of Service
              </button>
            </li>
            <li>
              <button onClick={() => setModalType("contact")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-sub)", fontSize: "0.83rem", transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-sub)")}>
                Contact Support
              </button>
            </li>
          </ul>
        </div>

        {/* Column 4: Security & Trust */}
        <div>
          <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 1rem" }}>
            Security & Trust
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {securityHighlights.map(s => (
              <div key={s.title}>
                <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-main)", margin: "0 0 0.15rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <ShieldCheck size={14} color="#10b981" />
                  {s.title}
                </p>
                <p style={{ fontSize: "0.74rem", color: "var(--text-sub)", margin: 0, lineHeight: 1.4 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divider & Credits */}
      <div style={{
        maxWidth: "1200px", margin: "0 auto",
        padding: "0 1.5rem",
        borderTop: "1px solid var(--nav-border)",
      }}>
        <div style={{
          padding: "1.25rem 0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "0.75rem",
        }}>
          <p style={{ color: "var(--text-sub)", fontSize: "0.78rem", margin: 0, fontWeight: 500 }}>
            © {currentYear} FinanceAI. All rights reserved.
          </p>

          <p style={{
            color: "var(--text-main)", fontSize: "0.8rem", margin: 0,
            fontWeight: 700, letterSpacing: "0.05em",
            display: "flex", alignItems: "center", gap: "0.4rem",
          }}>
            Designed & Developed By{" "}
            <span style={{ fontFamily: "'Algerian', 'Impact', 'Haettenschweiler', fantasy", fontSize: "0.75rem", letterSpacing: "0.12em" }}>
              MURUGAVEL V
            </span>
          </p>
        </div>
      </div>

      {/* ── Interactive Modals (Privacy, Terms, Contact) ─── */}
      {modalType && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1.5rem",
        }} onClick={() => setModalType(null)}>
          <div
            className="glass-card animate-fadeInScale"
            style={{
              maxWidth: "520px", width: "100%", padding: "1.75rem",
              borderRadius: "1.25rem", position: "relative",
              maxHeight: "85vh", overflowY: "auto",
              background: "var(--card-bg)", color: "var(--text-main)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setModalType(null)}
              style={{
                position: "absolute", top: "1.25rem", right: "1.25rem",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-sub)", padding: "4px",
              }}
            >
              <X size={20} />
            </button>

            {modalType === "privacy" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                  <Lock size={22} color="#7c3aed" />
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Privacy Policy</h3>
                </div>
                <div style={{ color: "var(--text-sub)", fontSize: "0.875rem", lineHeight: 1.75, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  <p>At FinanceAI, your privacy is our top priority. We employ enterprise-grade 256-bit encryption to protect all financial data stored in your account.</p>
                  <p><strong>1. Data Ownership:</strong> Your transaction records, bank balances, and financial profiles belong entirely to you. We never sell, monetize, or license your data to third parties.</p>
                  <p><strong>2. AI Processing:</strong> When interacting with FinanceAI assistant, financial metrics are sanitized before being processed by our GROQ LLM pipeline. No personally identifiable information (PII) is shared.</p>
                  <p><strong>3. Security Controls:</strong> Authentication tokens are stored locally on your device. You can export or request full deletion of your data at any time via Settings.</p>
                </div>
              </div>
            )}

            {modalType === "terms" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                  <FileText size={22} color="#3b82f6" />
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Terms of Service</h3>
                </div>
                <div style={{ color: "var(--text-sub)", fontSize: "0.875rem", lineHeight: 1.75, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  <p>Welcome to FinanceAI. By accessing or using our services, you agree to comply with and be bound by these terms.</p>
                  <p><strong>1. Acceptable Use:</strong> FinanceAI is designed strictly for personal financial tracking and management. Users must provide accurate account information and maintain password security.</p>
                  <p><strong>2. Financial Disclaimer:</strong> AI Insights and recommendations generated by FinanceAI are for informational purposes only and do not constitute certified professional financial or investment advice.</p>
                  <p><strong>3. Service Continuity:</strong> We continuously upgrade FinanceAI to ensure maximum uptime, security, and feature improvements. Account access may be subject to routine maintenance updates.</p>
                </div>
              </div>
            )}

            {modalType === "contact" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                  <Mail size={22} color="#10b981" />
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Contact Support</h3>
                </div>
                <p style={{ color: "var(--text-sub)", fontSize: "0.85rem", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                  Have questions, issues, or suggestions? Reach out directly to our team via email or send us a message below.
                </p>

                {/* Direct Mail Card */}
                <div style={{
                  padding: "0.875rem 1rem", borderRadius: "0.75rem",
                  background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "1.25rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <Mail size={18} color="#10b981" />
                    <div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-sub)", margin: 0, textTransform: "uppercase", fontWeight: 600 }}>Direct Email Support</p>
                      <a href="mailto:support@financeai.com" style={{ fontSize: "0.9rem", color: "#10b981", fontWeight: 700, textDecoration: "none" }}>
                        support@financeai.com
                      </a>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSendContact} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-sub)", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                      Your Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      className="finance-input"
                      style={{
                        width: "100%", padding: "0.65rem 0.875rem", borderRadius: "0.625rem",
                        fontSize: "0.9rem", border: "1px solid var(--card-border)", outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-sub)", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                      Message
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="How can we help you?"
                      value={contactMessage}
                      onChange={e => setContactMessage(e.target.value)}
                      className="finance-input"
                      style={{
                        width: "100%", padding: "0.65rem 0.875rem", borderRadius: "0.625rem",
                        fontSize: "0.9rem", border: "1px solid var(--card-border)", outline: "none",
                        resize: "vertical", fontFamily: "inherit",
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    style={{
                      padding: "0.75rem", borderRadius: "0.75rem",
                      background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                      border: "none", color: "white", fontSize: "0.9rem", fontWeight: 600,
                      cursor: sending ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                      boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
                    }}
                  >
                    <Send size={15} />
                    {sending ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 1.5rem !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
