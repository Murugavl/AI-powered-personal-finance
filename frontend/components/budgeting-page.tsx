"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import { AlertTriangle, Plus, Trash2, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import { API_URL } from "@/lib/config";

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f97316", "#ec4899", "#f59e0b", "#06b6d4"];

// Budget category groups (same as add-transaction for consistency)
const BUDGET_GROUPS = [
  {
    group: "🍽️ Food & Dining", categories: [
      { label: "Groceries", value: "groceries", icon: "🛒" },
      { label: "Restaurants", value: "restaurants", icon: "🍽️" },
      { label: "Coffee", value: "coffee", icon: "☕" },
      { label: "Food Delivery", value: "food_delivery", icon: "🛵" },
    ]
  },
  {
    group: "🚗 Transportation", categories: [
      { label: "Fuel", value: "fuel", icon: "⛽" },
      { label: "Public Transport", value: "public_transport", icon: "🚌" },
      { label: "Taxi / Ride Share", value: "taxi", icon: "🚕" },
      { label: "Parking", value: "parking", icon: "🅿️" },
    ]
  },
  {
    group: "🏠 Housing", categories: [
      { label: "Rent", value: "rent", icon: "🏠" },
      { label: "Utilities", value: "utilities", icon: "💡" },
      { label: "Internet", value: "internet", icon: "🌐" },
      { label: "Mobile", value: "mobile", icon: "📱" },
    ]
  },
  {
    group: "🛍️ Lifestyle", categories: [
      { label: "Shopping", value: "shopping", icon: "🛍️" },
      { label: "Fitness", value: "fitness", icon: "🏋️" },
      { label: "Entertainment", value: "entertainment", icon: "🎭" },
      { label: "Streaming", value: "streaming", icon: "📺" },
    ]
  },
  {
    group: "💳 Finance", categories: [
      { label: "Insurance", value: "insurance", icon: "🛡️" },
      { label: "Taxes", value: "taxes", icon: "📋" },
      { label: "Loan Payment", value: "loan_payment", icon: "💰" },
      { label: "Savings", value: "savings", icon: "🏦" },
    ]
  },
  {
    group: "🏥 Health", categories: [
      { label: "Pharmacy", value: "pharmacy", icon: "💊" },
      { label: "Doctor", value: "doctor", icon: "👨‍⚕️" },
      { label: "Gym", value: "gym", icon: "🏋️" },
    ]
  },
  {
    group: "📚 Education", categories: [
      { label: "Tuition", value: "tuition", icon: "🎓" },
      { label: "Books", value: "books", icon: "📚" },
      { label: "Courses", value: "courses", icon: "💻" },
    ]
  },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "rgba(15,23,42,0.98)", border: "1px solid rgba(124,58,237,0.3)",
        borderRadius: "10px", padding: "10px 14px",
      }}>
        <p style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 600 }}>{payload[0].name}</p>
        <p style={{ color: "#7c3aed", fontSize: "0.9rem", fontWeight: 700 }}>₹{payload[0].value?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export function BudgetingPageComponent() {
  const { getAuthHeaders } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const headers = getAuthHeaders();
    try {
      const [bRes, tRes] = await Promise.all([
        fetch(`${API_URL}/budgets/`, { headers }),
        fetch(`${API_URL}/transactions/`, { headers }),
      ]);
      if (bRes.ok) {
        const bData = await bRes.json();
        setBudgets(Array.isArray(bData) ? bData : (bData.items || []));
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setTransactions(Array.isArray(tData) ? tData : (tData.items || []));
      }
    } catch (e) {
      console.error("Budgeting fetch error:", e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const getSpent = (category: string) => transactions
    .filter(t => t.category?.toLowerCase() === category?.toLowerCase() && t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + getSpent(b.category), 0);

  const addBudget = async () => {
    if (!newCategory || !newBudget) { setError("Both fields are required."); return; }
    setError(null);
    try {
      const res = await fetch(`${API_URL}/budgets/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ category: newCategory, budget: parseFloat(newBudget), spent: 0 }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      await fetchData();
      setNewCategory(""); setNewBudget(""); setShowDialog(false);
      toast.success("Budget added!");
    } catch (e: any) {
      setError(e.message || "Failed to add budget");
    }
  };

  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  const performDeleteBudget = async (category: string) => {
    try {
      const res = await fetch(`${API_URL}/budgets/${encodeURIComponent(category.toLowerCase())}`, {
        method: "DELETE", headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      setBudgets(prev => prev.filter(b => b.category !== category));
      toast.success("Budget deleted");
    } catch {
      toast.error("Failed to delete budget");
    }
  };

  const inputStyle = {
    width: "100%", padding: "0.75rem 1rem",
    background: "rgba(15,23,42,0.9)", border: "1px solid rgba(30,41,59,1)",
    borderRadius: "0.75rem", color: "#e2e8f0", fontSize: "0.9rem", outline: "none",
  };

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      <ConfirmDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Delete Budget"
        description={deletingCategory ? `Are you sure you want to delete the budget for "${deletingCategory}"?` : ""}
        onConfirm={() => deletingCategory && performDeleteBudget(deletingCategory)}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, margin: 0 }}>Budgeting</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Track spending against your goals
          </p>
        </div>
        <button onClick={() => setShowDialog(true)} style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          padding: "0.625rem 1.25rem",
          background: "linear-gradient(135deg, #7c3aed, #3b82f6)", border: "none",
          borderRadius: "0.75rem", color: "white", fontSize: "0.875rem", fontWeight: 600,
          cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
        }}>
          <Plus size={15} /> Add Budget
        </button>
      </div>

      {/* Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }} className="budget-grid">
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "1.25rem" }}>Monthly Overview</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Total Budget</span>
              <span style={{ fontWeight: 700 }}>₹{totalBudget.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Total Spent</span>
              <span style={{ color: totalSpent > totalBudget ? "#f87171" : "#10b981", fontWeight: 700 }}>
                ₹{totalSpent.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Remaining</span>
              <span style={{ color: (totalBudget - totalSpent) < 0 ? "#f87171" : "#3b82f6", fontWeight: 700 }}>
                ₹{Math.abs(totalBudget - totalSpent).toLocaleString()}
              </span>
            </div>
            {/* Progress bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Utilization</span>
                <span style={{ color: "#64748b", fontSize: "0.75rem" }}>
                  {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
                </span>
              </div>
              <div style={{ height: "8px", background: "rgba(100,116,139,0.2)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min((totalSpent / (totalBudget || 1)) * 100, 100)}%`,
                  background: totalSpent > totalBudget
                    ? "linear-gradient(90deg, #ef4444, #dc2626)"
                    : "linear-gradient(90deg, #7c3aed, #3b82f6)",
                  borderRadius: "4px", transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Budget Distribution</h3>
          {budgets.length === 0 ? (
            <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
              No budgets yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={budgets} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                  dataKey="budget" nameKey="category" paddingAngle={3}>
                  {budgets.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
        {budgets.map((item, idx) => {
          const spent = getSpent(item.category);
          const pct = item.budget > 0 ? (spent / item.budget) * 100 : 0;
          const isOver = pct > 100;
          const isNearing = pct > 80 && !isOver;
          return (
            <div key={idx} className="glass-card" style={{
              padding: "1.5rem",
              borderColor: isOver ? "rgba(239,68,68,0.4)" : isNearing ? "rgba(245,158,11,0.4)" : undefined,
              transition: "all 0.3s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: "0.95rem", margin: 0, textTransform: "capitalize" }}>
                    {item.category}
                  </h4>
                  <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "0.2rem" }}>
                    ₹{spent.toLocaleString()} / ₹{item.budget.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setDeletingCategory(item.category)}
                  aria-label="Delete budget"
                  style={{
                    width: "28px", height: "28px", borderRadius: "6px",
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#f87171", transition: "all 0.2s",
                  }}>
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Progress */}
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ height: "6px", background: "rgba(30,41,59,1)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${Math.min(pct, 100)}%`,
                    background: isOver ? "linear-gradient(90deg, #ef4444, #dc2626)"
                      : isNearing ? "linear-gradient(90deg, #f59e0b, #d97706)"
                        : `linear-gradient(90deg, ${COLORS[idx % COLORS.length]}, ${COLORS[(idx + 1) % COLORS.length]})`,
                    borderRadius: "3px", transition: "width 0.5s ease",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35rem" }}>
                  <span style={{ color: "#475569", fontSize: "0.72rem" }}>{Math.round(pct)}% used</span>
                  {isOver && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#f87171", fontSize: "0.72rem" }}>
                      <AlertTriangle size={11} /> Over budget
                    </span>
                  )}
                  {isNearing && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b", fontSize: "0.72rem" }}>
                      <AlertTriangle size={11} /> Nearing limit
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Budget Dialog */}
      {showDialog && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
          padding: "1rem",
        }}>
          <div className="glass-card" style={{
            padding: "1.75rem", width: "100%", maxWidth: "520px",
            boxShadow: "var(--card-shadow-hover)", maxHeight: "85vh", overflowY: "auto",
          }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.4rem", color: "var(--text-main)" }}>
              Add New Budget
            </h3>
            <p style={{ color: "var(--text-sub)", fontSize: "0.82rem", marginBottom: "1.25rem" }}>
              Select a spending category and set your monthly limit.
            </p>

            {/* Category Chip Picker */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ color: "var(--text-sub)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Category
              </label>
              {newCategory && (
                <div style={{ marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-sub)" }}>Selected:</span>
                  <span style={{
                    padding: "0.2rem 0.65rem", borderRadius: "999px",
                    background: "rgba(124,58,237,0.18)", border: "1px solid #7c3aed",
                    color: "#a78bfa", fontSize: "0.82rem", fontWeight: 600,
                  }}>
                    {BUDGET_GROUPS.flatMap(g => g.categories).find(c => c.value === newCategory)?.icon}{" "}
                    {BUDGET_GROUPS.flatMap(g => g.categories).find(c => c.value === newCategory)?.label || newCategory}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {BUDGET_GROUPS.map(group => (
                  <div key={group.group}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", margin: "0 0 0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {group.group}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {group.categories.map(cat => (
                        <button key={cat.value} type="button"
                          className={`category-chip${newCategory === cat.value ? " selected" : ""}`}
                          style={{ fontSize: "0.76rem", padding: "0.35rem 0.6rem" }}
                          onClick={() => setNewCategory(cat.value)}
                        >
                          {cat.icon} {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Custom category input */}
              <div style={{ marginTop: "0.75rem" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Or enter a custom category:</p>
                <input
                  style={inputStyle}
                  value={BUDGET_GROUPS.flatMap(g => g.categories).find(c => c.value === newCategory) ? "" : newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="e.g. Vacation, Pets..."
                />
              </div>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ color: "var(--text-sub)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Budget Amount (₹)</label>
              <input style={inputStyle} type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)}
                placeholder="Enter monthly limit" />
            </div>

            {error && <p style={{ color: "#f87171", fontSize: "0.8rem", margin: "0 0 1rem" }}>{error}</p>}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => { setShowDialog(false); setError(null); }} style={{
                flex: 1, padding: "0.75rem",
                background: "var(--input-bg)", border: "1px solid var(--card-border)",
                borderRadius: "0.75rem", color: "var(--text-main)", cursor: "pointer", fontSize: "0.875rem",
              }}>Cancel</button>
              <button onClick={addBudget} style={{
                flex: 1, padding: "0.75rem",
                background: "linear-gradient(135deg, #7c3aed, #3b82f6)", border: "none",
                borderRadius: "0.75rem", color: "white", cursor: "pointer",
                fontSize: "0.875rem", fontWeight: 600,
              }}>Add Budget</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) { .budget-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
