"use client";

import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { theme } from "@/lib/theme";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank,
  Plus, ArrowRight, CreditCard, Activity,
} from "lucide-react";
import { API_URL } from "@/lib/config";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(15,23,42,0.98)", border: "1px solid rgba(124,58,237,0.3)",
        borderRadius: "12px", padding: "12px 16px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
      }}>
        <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "8px" }}>{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: entry.color }} />
            <span style={{ color: "#e2e8f0", fontSize: "0.85rem" }}>
              {entry.name}: <strong>₹{entry.value.toLocaleString()}</strong>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function Dashboard() {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const headers = getAuthHeaders();
      try {
        const [txRes, accRes] = await Promise.all([
          fetch(`${API_URL}/transactions/`, { headers }),
          fetch(`${API_URL}/accounts/`, { headers }),
        ]);
        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(Array.isArray(txData) ? txData : (txData.items || []));
        }
        if (accRes.ok) {
          const accData = await accRes.json();
          setAccounts(Array.isArray(accData) ? accData : (accData.items || []));
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [getAuthHeaders]);

  const { totalBalance, totalIncome, totalExpenses, netSavings, recentTransactions, monthlyData, stats } = useMemo(() => {
    const accountsBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
    const inc = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const exp = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const net = inc - exp;
    const bal = accounts.length > 0 ? accountsBalance : net;

    const recent = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const map: Record<string, { name: string; income: number; expenses: number }> = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = MONTH_NAMES[d.getMonth()];
      if (!map[key]) map[key] = { name: key, income: 0, expenses: 0 };
      if (t.type === "income") map[key].income += t.amount;
      else map[key].expenses += t.amount;
    });
    const monthly = MONTH_NAMES.filter(m => map[m]).map(m => map[m]);

    const statList = [
      {
        label: "Total Balance",
        value: `₹${bal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
        icon: Wallet, color: "#7c3aed", bgClass: "stat-purple",
        sub: `${accounts.length} account${accounts.length !== 1 ? "s" : ""}`,
      },
      {
        label: "Total Income",
        value: `₹${inc.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
        icon: TrendingUp, color: "#10b981", bgClass: "stat-teal",
        sub: `${transactions.filter(t => t.type === "income").length} transactions`,
      },
      {
        label: "Total Expenses",
        value: `₹${exp.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
        icon: TrendingDown, color: "#f87171", bgClass: "stat-orange",
        sub: `${transactions.filter(t => t.type === "expense").length} transactions`,
      },
      {
        label: "Net Savings",
        value: `₹${Math.abs(net).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
        icon: PiggyBank, color: net >= 0 ? "#3b82f6" : "#f87171",
        bgClass: net >= 0 ? "stat-blue" : "stat-orange",
        sub: net >= 0 ? "Positive savings" : "Overspent",
      },
    ];

    return {
      totalBalance: bal,
      totalIncome: inc,
      totalExpenses: exp,
      netSavings: net,
      recentTransactions: recent,
      monthlyData: monthly,
      stats: statList,
    };
  }, [transactions, accounts]);

  if (loading) {
    return (
      <div style={{ padding: "2rem 1.5rem", maxWidth: "1400px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ marginBottom: "2rem" }}>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", marginBottom: "2rem" }}>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "2rem 1.5rem", maxWidth: "1400px", margin: "0 auto",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, margin: 0 }}>Dashboard</h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.25rem" }}>
          Your financial overview at a glance
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={stat.bgClass} style={{
              borderRadius: "1rem", padding: "1.5rem",
              transition: "all 0.3s ease", cursor: "default",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: "var(--foreground-muted, #64748b)", fontSize: "0.8rem", fontWeight: 500, margin: "0 0 0.75rem" }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 0.35rem" }}>
                    {stat.value}
                  </p>
                  <p style={{ color: "var(--foreground-sub, #94a3b8)", fontSize: "0.75rem", margin: 0 }}>
                    {stat.sub}
                  </p>
                </div>
                <div style={{
                  padding: "0.6rem", borderRadius: "12px",
                  background: `${stat.color}18`, color: stat.color,
                }}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>Income vs Expenses</h2>
              <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>Monthly aggregate breakdown</p>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#94a3b8", fontSize: "0.75rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#7c3aed" }} /> Income
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#94a3b8", fontSize: "0.75rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f87171" }} /> Expenses
              </span>
            </div>
          </div>
          {monthlyData.length === 0 ? (
            <div style={{ height: "280px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
              <Activity size={40} color="#334155" />
              <p style={{ color: "#475569", fontSize: "0.875rem" }}>No transaction data yet</p>
              <button onClick={() => navigate("/add-transaction")} style={{
                padding: "0.5rem 1rem", background: theme.gradients.primary,
                border: "none", borderRadius: "8px", color: "white", fontSize: "0.8rem",
                cursor: "pointer",
              }}>
                Add your first transaction
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.8)" />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#7c3aed" strokeWidth={2} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} fill="url(#expGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Actions + Recent */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Quick Actions */}
          <div className="glass-card" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1rem" }}>Quick Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {[
                { label: "Add Transaction", path: "/add-transaction", color: "#7c3aed" },
                { label: "Set Budget", path: "/budgeting", color: "#3b82f6" },
                { label: "View Reports", path: "/reports", color: "#10b981" },
              ].map(action => (
                <button key={action.path} onClick={() => navigate(action.path)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  background: `${action.color}10`, border: `1px solid ${action.color}25`,
                  borderRadius: "10px", cursor: "pointer",
                  color: "inherit", fontSize: "0.875rem", fontWeight: 500,
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${action.color}20`; (e.currentTarget as HTMLElement).style.borderColor = `${action.color}50`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${action.color}10`; (e.currentTarget as HTMLElement).style.borderColor = `${action.color}25`; }}
                >
                  <span>{action.label}</span>
                  <ArrowRight size={14} color={action.color} />
                </button>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass-card" style={{ padding: "1.25rem", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600 }}>Recent</h3>
              <Link to="/transactions" style={{ color: "#7c3aed", fontSize: "0.75rem", textDecoration: "none" }}>View all</Link>
            </div>
            {recentTransactions.length === 0 ? (
              <p style={{ color: "#475569", fontSize: "0.8rem", textAlign: "center", padding: "1rem 0" }}>No transactions yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {recentTransactions.map((t, i) => (
                  <div key={t._id || i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "0.5rem 0",
                    borderBottom: i < recentTransactions.length - 1 ? "1px solid rgba(30,41,59,0.5)" : "none",
                  }}>
                    <div>
                      <p style={{ color: "#e2e8f0", fontSize: "0.82rem", fontWeight: 500, margin: 0 }}>
                        {t.description}
                      </p>
                      <p style={{ color: "#475569", fontSize: "0.72rem", margin: "2px 0 0" }}>
                        {t.category} · {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span style={{
                      color: t.type === "income" ? "#10b981" : "#f87171",
                      fontWeight: 600, fontSize: "0.85rem",
                    }}>
                      {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .charts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
