import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  getAuthHeaders: () => ({}),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("finance_token");
      const savedUser = localStorage.getItem("finance_user");
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // ignore parse errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Login failed");
    }
    const data = await response.json();
    const userData: User = { id: data.id, username: data.username, email: data.email };
    setToken(data.token);
    setUser(userData);
    localStorage.setItem("finance_token", data.token);
    localStorage.setItem("finance_user", JSON.stringify(userData));
    navigate("/");
  }, [navigate]);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Registration failed");
    }
    const data = await response.json();
    const userData: User = { id: data.id, username: data.username, email: data.email };
    setToken(data.token);
    setUser(userData);
    localStorage.setItem("finance_token", data.token);
    localStorage.setItem("finance_user", JSON.stringify(userData));
    navigate("/");
  }, [navigate]);

  /**
   * SECURITY ARCHITECTURE NOTE:
   * Storing JWT access tokens in localStorage makes them susceptible to theft if an XSS vulnerability exists.
   * HttpOnly cookies provide higher defense-in-depth against XSS token exfiltration, but require backend-managed
   * cookie sessions, CSRF token validation (SameSite=Strict), and strict CORS origin credentials management.
   * To mitigate XSS risks in this architecture:
   * 1. We enforce strict server-side Content-Security-Policy (CSP) headers restricting script execution.
   * 2. Server-side token revocation (jti in MongoDB) allows early invalidation on /auth/logout.
   */
  const logout = useCallback(async () => {
    const currentToken = token || localStorage.getItem("finance_token");
    if (currentToken) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch {
        // Silently ignore network failure on logout; local state clear takes precedence
      }
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem("finance_token");
    localStorage.removeItem("finance_user");
    navigate("/auth/login");
  }, [token, navigate]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      register,
      logout,
      getAuthHeaders,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
