import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Lock, Mail, User as UserIcon, ArrowRight, TrendingUp, Shield, Zap, BarChart3, Eye, EyeOff } from "lucide-react";

const features = [
  { icon: <BarChart3 size={18} />, label: "Smart Analytics", desc: "AI-powered insights on your spending" },
  { icon: <Shield size={18} />, label: "Bank-grade Security", desc: "256-bit encrypted & fully private" },
  { icon: <Zap size={18} />, label: "Instant OCR", desc: "Scan receipts, log expenses in seconds" },
];

function AuthLayout({ children, subtitle }: { children: React.ReactNode; subtitle: string }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      fontFamily: "'Inter', sans-serif",
      background: "var(--page-bg, #0a0f1e)",
    }}>
      {/* Left panel — branding */}
      <div style={{
        flex: "0 0 45%", display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "3rem",
        background: "linear-gradient(145deg, #0d0b2a 0%, #12043a 50%, #0c1a3a 100%)",
        position: "relative", overflow: "hidden",
      }} className="auth-left-panel">
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "320px", height: "320px", background: "rgba(124,58,237,0.18)", borderRadius: "50%", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-60px", right: "-60px", width: "260px", height: "260px", background: "rgba(59,130,246,0.15)", borderRadius: "50%", filter: "blur(70px)" }} />
        <div style={{ position: "absolute", top: "50%", right: "-40px", width: "180px", height: "180px", background: "rgba(16,185,129,0.1)", borderRadius: "50%", filter: "blur(60px)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "3.5rem" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(124,58,237,0.5)",
            }}>
              <TrendingUp size={22} color="white" />
            </div>
            <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>FinanceAI</span>
          </div>

          {/* Headline */}
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: "1rem", letterSpacing: "-0.03em" }}>
            Your AI-powered<br />
            <span style={{ background: "linear-gradient(135deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Finance Dashboard
            </span>
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2.5rem", maxWidth: "360px" }}>
            {subtitle}
          </p>

          {/* Feature bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            {features.map(f => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
                  background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa",
                }}>
                  {f.icon}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#e2e8f0" }}>{f.label}</p>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "2.5rem 2rem",
        background: "#ffffff",
        overflowY: "auto",
      }}>
        {children}
      </div>

      <style>{`
        .auth-input {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border: 1.5px solid #cbd5e1 !important;
        }
        .auth-input::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }
        .auth-input:-webkit-autofill,
        .auth-input:-webkit-autofill:hover,
        .auth-input:-webkit-autofill:focus,
        .auth-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
          -webkit-text-fill-color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }
        @media (max-width: 768px) {
          .auth-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function InputField({
  label, type, value, onChange, placeholder, icon, autoComplete,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  icon: React.ReactNode; autoComplete?: string;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const actualType = type === "password" ? (showPwd ? "text" : "password") : type;

  return (
    <div>
      <label style={{
        display: "block", fontSize: "0.8rem", fontWeight: 700,
        color: "#475569", marginBottom: "0.45rem",
        textTransform: "uppercase", letterSpacing: "0.05em"
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: "14px", top: "50%",
          transform: "translateY(-50%)", color: "#64748b",
          pointerEvents: "none", display: "flex"
        }}>
          {icon}
        </span>
        <input
          type={actualType}
          required
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="auth-input"
          style={{
            width: "100%", padding: "0.8rem 1rem 0.8rem 2.75rem",
            background: "#ffffff",
            border: "1.5px solid #cbd5e1",
            borderRadius: "12px",
            color: "#0f172a",
            fontSize: "0.925rem",
            outline: "none",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxSizing: "border-box",
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = "#7c3aed";
            e.currentTarget.style.boxShadow = "0 0 0 4px rgba(124, 58, 237, 0.12)";
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
          }}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPwd(p => !p)}
            aria-label={showPwd ? "Hide password" : "Show password"}
            style={{
              position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "#64748b", display: "flex", padding: 0
            }}
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout subtitle="Track every rupee, forecast your future, and make smarter money decisions — all powered by AI.">
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-main, #0f172a)", margin: "0 0 0.4rem", letterSpacing: "-0.03em" }}>
            Welcome back 👋
          </h1>
          <p style={{ color: "var(--text-sub, #64748b)", fontSize: "0.9rem", margin: 0 }}>
            Sign in to your FinanceAI dashboard
          </p>
        </div>

        {error && (
          <div style={{
            padding: "0.75rem 1rem", borderRadius: "10px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#ef4444", fontSize: "0.85rem", marginBottom: "1.25rem", fontWeight: 500,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <InputField label="Email Address" type="email" value={email} onChange={setEmail} placeholder="name@example.com" icon={<Mail size={16} />} autoComplete="email" />
          <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="Enter your password" icon={<Lock size={16} />} autoComplete="current-password" />

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: "0.5rem", width: "100%", padding: "0.85rem 1rem",
              background: isSubmitting ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
              color: "#ffffff", border: "none", borderRadius: "12px",
              fontWeight: 700, fontSize: "0.925rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              transition: "all 0.2s", boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
              letterSpacing: "0.02em",
            }}
          >
            {isSubmitting ? (
              <><span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Signing in...</>
            ) : (
              <> Sign In <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.75rem" }}>
          <p style={{ color: "var(--text-sub, #64748b)", fontSize: "0.875rem", margin: 0 }}>
            Don't have an account?{" "}
            <Link to="/auth/register" style={{ color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>
              Create one free →
            </Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await register(username, email, password);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout subtitle="Join thousands of users who manage their finances smarter with AI-driven insights and automation.">
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-main, #0f172a)", margin: "0 0 0.4rem", letterSpacing: "-0.03em" }}>
            Create account ✨
          </h1>
          <p style={{ color: "var(--text-sub, #64748b)", fontSize: "0.9rem", margin: 0 }}>
            Start your financial intelligence journey today
          </p>
        </div>

        {error && (
          <div style={{
            padding: "0.75rem 1rem", borderRadius: "10px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#ef4444", fontSize: "0.85rem", marginBottom: "1.25rem", fontWeight: 500,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <InputField label="Username" type="text" value={username} onChange={setUsername} placeholder="johndoe" icon={<UserIcon size={16} />} autoComplete="username" />
          <InputField label="Email Address" type="email" value={email} onChange={setEmail} placeholder="name@example.com" icon={<Mail size={16} />} autoComplete="email" />
          <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="Create a strong password" icon={<Lock size={16} />} autoComplete="new-password" />

          {/* Password strength hint */}
          <p style={{ margin: "-0.5rem 0 0", fontSize: "0.78rem", color: "var(--text-sub, #64748b)" }}>
            Minimum 8 characters, include letters and numbers.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: "0.5rem", width: "100%", padding: "0.85rem 1rem",
              background: isSubmitting ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
              color: "#ffffff", border: "none", borderRadius: "12px",
              fontWeight: 700, fontSize: "0.925rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              transition: "all 0.2s", boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
              letterSpacing: "0.02em",
            }}
          >
            {isSubmitting ? (
              <><span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Creating account...</>
            ) : (
              <> Create Free Account <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.75rem" }}>
          <p style={{ color: "var(--text-sub, #64748b)", fontSize: "0.875rem", margin: 0 }}>
            Already have an account?{" "}
            <Link to="/auth/login" style={{ color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>
              Sign in →
            </Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AuthLayout>
  );
}
