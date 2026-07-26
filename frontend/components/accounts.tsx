"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Plus, Trash2, Wallet, CreditCard, Briefcase, Search } from "lucide-react";
import { toast } from "react-toastify";

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

const inputStyle = {
  width: "100%", padding: "0.75rem 1rem",
  borderRadius: "0.75rem", fontSize: "0.9rem", outline: "none",
};

const TYPE_ICONS: Record<string, any> = {
  bank: Wallet, credit: CreditCard, investment: Briefcase,
};
const TYPE_COLORS: Record<string, string> = {
  bank: "#7c3aed", credit: "#3b82f6", investment: "#10b981",
};

export default function AccountsPageComponent() {
  const { getAuthHeaders } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({ name: "", type: "bank", balance: "", institution: "" });
  const [saving, setSaving] = useState(false);

  const fetchAccounts = async () => {
    const res = await fetch(`${API_URL}/accounts/`, { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : (data.items || []));
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/accounts/`, {
        method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ ...newAccount, balance: parseFloat(newAccount.balance) || 0 }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Account added!");
      setShowDialog(false);
      setNewAccount({ name: "", type: "bank", balance: "", institution: "" });
      fetchAccounts();
    } catch {
      toast.error("Failed to create account");
    } finally {
      setSaving(false);
    }
  };

  const performDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/accounts/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Delete failed");
      setAccounts(prev => prev.filter(a => a._id !== id && a.id !== id));
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const filtered = accounts.filter(a => {
    const matchType = filterType === "all" || a.type === filterType;
    const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (a.institution || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Account"
        description="Are you sure you want to delete this account? This action cannot be undone."
        onConfirm={() => deletingId && performDelete(deletingId)}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, margin: 0 }}>Accounts</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {accounts.length} account{accounts.length !== 1 ? "s" : ""} · Total Balance: <strong style={{ color: "#7c3aed" }}>₹{totalBalance.toLocaleString()}</strong>
          </p>
        </div>
        <button onClick={() => setShowDialog(true)} style={{
          display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.625rem 1.25rem",
          background: "linear-gradient(135deg, #7c3aed, #3b82f6)", border: "none",
          borderRadius: "0.75rem", color: "white", fontSize: "0.875rem", fontWeight: 600,
          cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
        }}>
          <Plus size={15} /> Add Account
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", padding: "1rem 1.5rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={16} color="#64748b" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
          <input type="text" placeholder="Search accounts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "2.25rem" }} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["all", "bank", "credit", "investment"].map(type => (
            <button key={type} onClick={() => setFilterType(type)} style={{
              padding: "0.4rem 0.875rem", borderRadius: "0.625rem", fontSize: "0.78rem", fontWeight: 500,
              cursor: "pointer", border: "1px solid",
              background: filterType === type ? "rgba(124,58,237,0.15)" : "transparent",
              borderColor: filterType === type ? "rgba(124,58,237,0.4)" : "rgba(100,116,139,0.3)",
              color: filterType === type ? "#7c3aed" : "inherit",
              transition: "all 0.2s", textTransform: "capitalize",
            }}>{type}</button>
          ))}
        </div>
      </div>

      {/* Account Cards */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          {accounts.length === 0 ? "No accounts yet. Add one to get started." : "No accounts match your filters."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {filtered.map(account => {
            const Icon = TYPE_ICONS[account.type] || Wallet;
            const color = TYPE_COLORS[account.type] || "#7c3aed";
            const id = account._id || account.id;
            return (
              <div key={id} className="glass-card" style={{
                padding: "1.5rem",
                transition: "all 0.3s",
                borderColor: `${color}30`,
              }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: `${color}15`, border: `1px solid ${color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={20} color={color} />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{
                      padding: "0.2rem 0.6rem", borderRadius: "6px",
                      background: `${color}15`, border: `1px solid ${color}25`,
                      color: color, fontSize: "0.7rem", fontWeight: 600, textTransform: "capitalize",
                    }}>{account.type}</span>
                    <button onClick={() => setDeletingId(id)} aria-label="Delete account" style={{
                      width: "28px", height: "28px", borderRadius: "6px",
                      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#f87171",
                    }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <h3 style={{ fontWeight: 600, fontSize: "1rem", margin: "0 0 0.25rem" }}>{account.name}</h3>
                <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "0 0 1rem" }}>{account.institution}</p>
                <p style={{ color: color, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
                  ₹{(account.balance || 0).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Dialog */}
      {showDialog && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div className="glass-card" style={{
            padding: "2rem", width: "100%", maxWidth: "420px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
          }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>Add New Account</h3>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ color: "#64748b", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>Account Name</label>
                <input style={inputStyle} required value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })} placeholder="e.g. HDFC Savings" />
              </div>
              <div>
                <label style={{ color: "#64748b", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>Account Type</label>
                <select value={newAccount.type} onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="bank">Bank</option>
                  <option value="credit">Credit Card</option>
                  <option value="investment">Investment</option>
                </select>
              </div>
              <div>
                <label style={{ color: "#64748b", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>Institution</label>
                <input style={inputStyle} required value={newAccount.institution} onChange={e => setNewAccount({ ...newAccount, institution: e.target.value })} placeholder="e.g. HDFC Bank" />
              </div>
              <div>
                <label style={{ color: "#64748b", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>Initial Balance (₹)</label>
                <input style={inputStyle} type="number" required value={newAccount.balance} onChange={e => setNewAccount({ ...newAccount, balance: e.target.value })} placeholder="0" />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowDialog(false)} style={{
                  flex: 1, padding: "0.75rem", background: "rgba(100,116,139,0.15)", border: "1px solid rgba(100,116,139,0.3)",
                  borderRadius: "0.75rem", color: "inherit", cursor: "pointer", fontSize: "0.875rem",
                }}>Cancel</button>
                <button type="submit" disabled={saving} style={{
                  flex: 1, padding: "0.75rem", background: "linear-gradient(135deg, #7c3aed, #3b82f6)", border: "none",
                  borderRadius: "0.75rem", color: "white", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
                }}>{saving ? "Adding..." : "Add Account"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
