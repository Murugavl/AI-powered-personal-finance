"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { API_URL } from "@/lib/config";
const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f97316", "#ec4899", "#f59e0b"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15,23,42,0.98)", border: "1px solid rgba(124,58,237,0.3)",
      borderRadius: "10px", padding: "10px 14px",
    }}>
      <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "6px" }}>{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: e.color }} />
          <span style={{ color: "#e2e8f0", fontSize: "0.82rem" }}>
            {e.name}: <strong>₹{Number(e.value).toLocaleString()}</strong>
          </span>
        </div>
      ))}
    </div>
  );
};

export function ReportsInsightsPageComponent() {
  const { getAuthHeaders } = useAuth();
  const [timeframe, setTimeframe] = useState("monthly");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/transactions/?t=${Date.now()}`, {
        headers: getAuthHeaders(), cache: "no-store",
      });
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : (data.items || []));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { fetchTransactions(); }, [timeframe, fetchTransactions]);

  // Monthly / Yearly chart data
  const chartData = (() => {
    const map: Record<string, { name: string; income: number; expenses: number }> = {};
    transactions.forEach(({ amount, type, date }) => {
      const d = new Date(date);
      const key = timeframe === "monthly" ? MONTHS[d.getMonth()] : d.getFullYear().toString();
      if (!map[key]) map[key] = { name: key, income: 0, expenses: 0 };
      if (type === "income") map[key].income += amount;
      else map[key].expenses += amount;
    });
    if (timeframe === "monthly") return MONTHS.filter(m => map[m]).map(m => map[m]);
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  })();

  // Category breakdown
  const categoryData = (() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      const cat = (t.category || "other").trim().toLowerCase();
      map[cat] = (map[cat] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .sort((a, b) => b.value - a.value);
  })();

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "36px", height: "36px", margin: "0 auto 1rem", border: "2px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#64748b" }}>Loading reports...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return <p style={{ color: "#f87171", textAlign: "center", padding: "2rem" }}>{error}</p>;

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, margin: 0 }}>Reports & Insights</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {transactions.length} transactions analyzed
          </p>
        </div>
        {/* Timeframe toggle */}
        <div style={{ display: "flex", gap: "0.5rem", padding: "4px", borderRadius: "10px", border: "1px solid rgba(100,116,139,0.2)" }}>
          {["monthly", "yearly"].map(t => (
            <button key={t} onClick={() => setTimeframe(t)} style={{
              padding: "0.4rem 1rem", borderRadius: "7px", fontSize: "0.82rem", fontWeight: 500,
              cursor: "pointer", border: "none", textTransform: "capitalize",
              background: timeframe === t ? "linear-gradient(135deg, #7c3aed, #3b82f6)" : "transparent",
              color: timeframe === t ? "white" : "#64748b",
              transition: "all 0.2s",
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }} className="summary-grid">
        {[
          { label: "Total Income", value: totalIncome, color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
          { label: "Total Expenses", value: totalExpenses, color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)" },
          { label: "Net Savings", value: netSavings, color: netSavings >= 0 ? "#3b82f6" : "#f87171", bg: netSavings >= 0 ? "rgba(59,130,246,0.1)" : "rgba(248,113,113,0.1)", border: netSavings >= 0 ? "rgba(59,130,246,0.25)" : "rgba(248,113,113,0.25)" },
        ].map(item => (
          <div key={item.label} style={{
            borderRadius: "1rem", padding: "1.5rem",
            background: item.bg, border: `1px solid ${item.border}`,
          }}>
            <p style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 500, margin: "0 0 0.5rem" }}>{item.label}</p>
            <p style={{ color: item.color, fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
              {netSavings < 0 && item.label === "Net Savings" ? "-" : ""}₹{Math.abs(item.value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h3 style={{ fontWeight: 600, marginBottom: "1.25rem" }}>
          📈 Income vs Expenses — {timeframe === "monthly" ? "Monthly" : "Yearly"} Breakdown
        </h3>
        {chartData.length === 0 ? (
          <div style={{ height: "280px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
            No data available for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
              <Area type="monotone" dataKey="income" name="Income" stroke="#7c3aed" strokeWidth={2.5} fill="url(#incG)" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f87171" strokeWidth={2.5} fill="url(#expG)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="cat-grid">
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "1rem" }}>🛒 Spending by Category</h3>
          {categoryData.length === 0 ? (
            <div style={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>No expense data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`₹${v.toLocaleString()}`, ""]} />
                <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "1rem" }}>💸 Top Expense Categories</h3>
          {categoryData.length === 0 ? (
            <div style={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip formatter={(v: any) => [`₹${v.toLocaleString()}`, "Spent"]} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {categoryData.slice(0, 5).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .summary-grid, .cat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
