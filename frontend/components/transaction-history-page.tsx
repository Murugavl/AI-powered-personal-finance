"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format, isValid, parseISO, startOfDay, endOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Upload, Trash2, X, AlertCircle, ArrowLeft, ArrowUpDown, Calendar } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const API_URL = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const categories = [
  { label: "Food & Dining", value: "food", icon: "🍽️" },
  { label: "Groceries", value: "groceries", icon: "🛒" },
  { label: "Restaurants", value: "restaurants", icon: "🍽️" },
  { label: "Transportation", value: "transportation", icon: "🚗" },
  { label: "Fuel", value: "fuel", icon: "⛽" },
  { label: "Housing", value: "housing", icon: "🏠" },
  { label: "Rent", value: "rent", icon: "🏠" },
  { label: "Utilities", value: "utilities", icon: "💡" },
  { label: "Entertainment", value: "entertainment", icon: "🎭" },
  { label: "Shopping", value: "shopping", icon: "🛍️" },
  { label: "Health", value: "health", icon: "🏥" },
  { label: "Travel", value: "travel", icon: "✈️" },
  { label: "Education", value: "education", icon: "📚" },
  { label: "Personal", value: "personal", icon: "👤" },
  { label: "Salary", value: "salary", icon: "💼" },
  { label: "Freelance", value: "freelance", icon: "💻" },
  { label: "Investments", value: "investments", icon: "📈" },
  { label: "Income", value: "income", icon: "💰" },
];

const formatDateSafely = (dateVal: any): string => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (!isValid(d)) return String(dateVal);
    return format(d, "dd MMM yyyy");
  } catch {
    return String(dateVal);
  }
};

export function TransactionHistoryPageComponent() {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/transactions/`, {
        headers: { ...getAuthHeaders() },
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.items || []);
      setTransactions(items);
      setFiltered(items);
    } catch (err: any) {
      setError("Failed to load transactions. Please check your backend connection.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Filter logic — type, search, date range
  useEffect(() => {
    let result = Array.isArray(transactions) ? [...transactions] : [];
    if (filterType !== "all") {
      result = result.filter(t => t.type === filterType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        (t.description || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      const from = startOfDay(new Date(dateFrom));
      result = result.filter(t => t.date && new Date(t.date) >= from);
    }
    if (dateTo) {
      const to = endOfDay(new Date(dateTo));
      result = result.filter(t => t.date && new Date(t.date) <= to);
    }
    setFiltered(result);
  }, [transactions, searchQuery, filterType, dateFrom, dateTo]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const performDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      setTransactions(prev => prev.filter(t => (t._id || t.id) !== id));
      toast.success("Transaction deleted successfully");
    } catch {
      toast.error("Failed to delete transaction");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      toast.info(`Selected bill: ${e.target.files[0].name}`, { autoClose: 2000 });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a bill image first!");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/bills/upload/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Bill processed and transaction saved! ✓");
        setFile(null);
        fetchTransactions();
      } else {
        toast.error(data.detail || "Bill processing failed");
      }
    } catch {
      toast.error("Upload error — please try again");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      padding: "2rem 1.5rem",
      maxWidth: "1200px",
      margin: "0 auto",
      fontFamily: "'Inter', sans-serif",
      animation: "fadeInUp 0.4s ease both",
    }}>
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        onConfirm={() => deletingId && performDelete(deletingId)}
      />

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: "2rem", flexWrap: "wrap", gap: "1rem",
      }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
            Transactions
          </h1>
          <p style={{ color: "var(--text-sub)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: "none" }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.625rem 1.125rem",
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.25)",
              borderRadius: "0.75rem", color: "#a78bfa", fontSize: "0.875rem", fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            <Upload size={15} /> Upload Bill
          </button>

          {file && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#a78bfa", fontSize: "0.8rem", fontWeight: 500 }}>
                {file.name}
                <button onClick={() => setFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-sub)", padding: 0 }}>
                  <X size={14} />
                </button>
              </span>
              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  padding: "0.625rem 1.125rem",
                  background: "linear-gradient(135deg, #7c3aed, #3b82f6)", border: "none",
                  borderRadius: "0.75rem", color: "white", fontSize: "0.875rem", fontWeight: 600,
                  cursor: uploading ? "not-allowed" : "pointer",
                }}
              >
                {uploading ? "Processing..." : "Process Bill"}
              </button>
            </div>
          )}

          <button
            onClick={() => navigate("/add-transaction")}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.625rem 1.125rem",
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)", border: "none",
              borderRadius: "0.75rem", color: "white", fontSize: "0.875rem", fontWeight: 600,
              cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
              transition: "all 0.2s",
            }}
          >
            <Plus size={15} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ marginBottom: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", padding: "1rem 1.25rem", alignItems: "center" }}>
        {/* Search Input */}
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: "180px" }}>
          <Search size={16} color="var(--text-sub)" style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search description or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="finance-input"
            style={{ width: "100%", padding: "0.625rem 0.875rem 0.625rem 2.5rem", borderRadius: "0.625rem", fontSize: "0.875rem" }}
          />
        </div>

        {/* Date Range */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "1 1 280px" }}>
          <Calendar size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            title="From date"
            className="finance-input"
            style={{ padding: "0.55rem 0.7rem", borderRadius: "0.5rem", fontSize: "0.82rem", flex: 1 }}
          />
          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", flexShrink: 0 }}>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            title="To date"
            className="finance-input"
            style={{ padding: "0.55rem 0.7rem", borderRadius: "0.5rem", fontSize: "0.82rem", flex: 1 }}
          />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); }} title="Clear dates"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "0.2rem" }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["all", "income", "expense"].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: "0.5rem 1rem", borderRadius: "0.625rem", fontSize: "0.82rem", fontWeight: 600,
                cursor: "pointer", border: "1px solid",
                background: filterType === type ? "rgba(124,58,237,0.15)" : "transparent",
                borderColor: filterType === type ? "rgba(124,58,237,0.4)" : "var(--card-border)",
                color: filterType === type ? "#a78bfa" : "var(--text-sub)",
                transition: "all 0.2s", textTransform: "capitalize",
              }}
            >
              {type === "all" ? "All" : type === "income" ? "💰 Income" : "💸 Expense"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-sub)" }}>
            <div style={{
              width: "38px", height: "38px", margin: "0 auto 1rem",
              border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ margin: 0, fontSize: "0.9rem" }}>Loading transactions...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#f87171" }}>
            <AlertCircle size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.8 }} />
            <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3.5rem 1rem", color: "var(--text-sub)" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%", margin: "0 auto 1rem",
              background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Search size={24} color="#a78bfa" />
            </div>
            <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "0.35rem" }}>No transactions found</p>
            <p style={{ fontSize: "0.825rem", margin: 0 }}>Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  {["Date", "Description", "Category", "Amount", "Actions"].map(h => (
                    <th key={h} style={{
                      padding: "0.875rem 1rem", textAlign: h === "Amount" ? "right" : h === "Actions" ? "center" : "left",
                      color: "var(--text-sub)", fontSize: "0.75rem", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const id = t._id || t.id;
                  const catVal = (t.category || "").toLowerCase();
                  const catObj = categories.find(c => c.value.toLowerCase() === catVal || c.label.toLowerCase() === catVal);
                  const isIncome = t.type === "income";

                  return (
                    <tr key={id || i} style={{
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--card-border)" : "none",
                      transition: "background 0.2s",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "1rem", color: "var(--text-sub)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                        {formatDateSafely(t.date)}
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)" }}>
                        <span>{t.description || "—"}</span>
                        {(t.isRecurring || (t.recurrence_rule && t.recurrence_rule !== "none") || t.recurring_parent_id) && (
                          <span style={{
                            padding: "0.15rem 0.45rem", borderRadius: "4px",
                            background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
                            color: "#60a5fa", fontSize: "0.7rem", fontWeight: 600, marginLeft: "0.5rem",
                            display: "inline-flex", alignItems: "center", gap: "0.2rem"
                          }}>
                            🔄 {t.recurrence_rule && t.recurrence_rule !== "none" ? t.recurrence_rule.toUpperCase() : "RECURRING"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "0.35rem",
                          padding: "0.3rem 0.65rem",
                          background: "rgba(124,58,237,0.1)", borderRadius: "6px",
                          border: "1px solid rgba(124,58,237,0.2)",
                          color: "#a78bfa", fontSize: "0.78rem", fontWeight: 600,
                        }}>
                          {catObj?.icon || (isIncome ? "💰" : "🔖")} {catObj?.label || t.category || "General"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <span style={{
                          color: isIncome ? "#10b981" : "#f87171",
                          fontWeight: 700, fontSize: "0.95rem",
                        }}>
                          {isIncome ? "+" : "−"}₹{Math.abs(t.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center", whiteSpace: "nowrap" }}>
                        {t.image_url && (
                          <button
                            onClick={() => setSelectedReceipt(`${API_URL}${t.image_url}`)}
                            title="View Original Receipt"
                            style={{
                              padding: "0.25rem 0.5rem", borderRadius: "6px",
                              background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
                              color: "#c4b5fd", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                              marginRight: "0.5rem", display: "inline-flex", alignItems: "center", gap: "0.3rem"
                            }}
                          >
                            📄 Receipt
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingId(id)}
                          aria-label="Delete transaction"
                          title="Delete transaction"
                          style={{
                            width: "32px", height: "32px", borderRadius: "8px",
                            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                            cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s", color: "#f87171", margin: "0 auto",
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.2)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.4)";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.25)";
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReceipt && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem"
        }} onClick={() => setSelectedReceipt(null)}>
          <div style={{
            background: "var(--card-bg)", borderRadius: "1rem", padding: "1.25rem",
            maxWidth: "550px", width: "100%", maxHeight: "85vh", overflow: "auto",
            position: "relative", border: "1px solid var(--card-border)"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, color: "var(--text-main)", fontSize: "1rem", fontWeight: 700 }}>Original Receipt Image</h3>
              <button onClick={() => setSelectedReceipt(null)} style={{ background: "none", border: "none", color: "var(--text-sub)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>
            <img src={selectedReceipt} alt="Receipt" style={{ width: "100%", borderRadius: "0.5rem", objectFit: "contain" }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
