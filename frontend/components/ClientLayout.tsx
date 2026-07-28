import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/Footer";
import Chatbot from "@/components/Chatbot";

const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/sign-up"];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { isAuthenticated, isLoading } = useAuth();

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !AUTH_ROUTES.includes(pathname)) {
      navigate("/auth/login");
    }
  }, [isAuthenticated, isLoading, pathname, navigate]);

  const isAuthPage = AUTH_ROUTES.includes(pathname);

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-color)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#7c3aed",
            borderRightColor: "#3b82f6",
            animation: "spin 0.9s linear infinite",
          }} />
          <p style={{ color: "var(--text-sub)", fontSize: "0.875rem", fontWeight: 500 }}>Loading FinanceAI...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {!isAuthPage && isAuthenticated && <Navbar />}
      <main style={{ flex: 1 }}>
        {children}
      </main>
      {!isAuthPage && isAuthenticated && <Footer />}
      {!isAuthPage && isAuthenticated && <Chatbot />}
    </div>
  );
}
