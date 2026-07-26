import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Lock, Mail, User as UserIcon, ArrowRight, Wallet } from "lucide-react";

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
    <div style={{
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "rgba(30, 41, 59, 0.7)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "16px",
        padding: "2.5rem 2rem",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
            marginBottom: "1rem",
            color: "#fff"
          }}>
            <Wallet size={28} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#f8fafc", marginBottom: "0.5rem" }}>
            Welcome Back
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
            Sign in to access your personal finance dashboard
          </p>
        </div>

        {error && (
          <div style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            fontSize: "0.875rem",
            marginBottom: "1.5rem"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.875rem",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.875rem",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: "0.5rem",
              width: "100%",
              padding: "0.75rem 1rem",
              background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.875rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              opacity: isSubmitting ? 0.7 : 1,
              transition: "opacity 0.2s ease"
            }}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.875rem", color: "#94a3b8" }}>
          Don't have an account?{" "}
          <Link to="/auth/register" style={{ color: "#818cf8", fontWeight: "500", textDecoration: "none" }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
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
    <div style={{
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "rgba(30, 41, 59, 0.7)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "16px",
        padding: "2.5rem 2rem",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
            marginBottom: "1rem",
            color: "#fff"
          }}>
            <Wallet size={28} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#f8fafc", marginBottom: "0.5rem" }}>
            Create Account
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
            Join to track expenses and manage your finances
          </p>
        </div>

        {error && (
          <div style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            fontSize: "0.875rem",
            marginBottom: "1.5rem"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
              Username
            </label>
            <div style={{ position: "relative" }}>
              <UserIcon size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.875rem",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.875rem",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1", marginBottom: "0.5rem" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.875rem",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: "0.5rem",
              width: "100%",
              padding: "0.75rem 1rem",
              background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.875rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              opacity: isSubmitting ? 0.7 : 1,
              transition: "opacity 0.2s ease"
            }}
          >
            {isSubmitting ? "Creating account..." : "Sign Up"}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.875rem", color: "#94a3b8" }}>
          Already have an account?{" "}
          <Link to="/auth/login" style={{ color: "#818cf8", fontWeight: "500", textDecoration: "none" }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
