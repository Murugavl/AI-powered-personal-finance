"use client";

import { useState, useEffect, useCallback } from "react";
import { Target, Plus, TrendingUp, Trash2, DollarSign, Calendar, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { API_URL as API_BASE_URL } from "@/lib/config";

interface GoalItem {
  _id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  category?: string;
  progress_percentage?: number;
}

export default function GoalsPageComponent() {
  const { getAuthHeaders } = useAuth();
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [newGoalName, setNewGoalName] = useState("");
  const [newTargetAmount, setNewTargetAmount] = useState("");
  const [newCurrentAmount, setNewCurrentAmount] = useState("0");
  const [newTargetDate, setNewTargetDate] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/goals/`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch savings goals");
      const data = await res.json();
      setGoals(data || []);
    } catch {
      toast.error("Error loading savings goals");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim() || !newTargetAmount || Number(newTargetAmount) <= 0) {
      toast.error("Please enter a valid goal name and target amount.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/goals/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          name: newGoalName.trim(),
          target_amount: parseFloat(newTargetAmount),
          current_amount: parseFloat(newCurrentAmount || "0"),
          target_date: newTargetDate || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create goal");
      toast.success("Savings Goal created! 🎯");
      setAddModalOpen(false);
      setNewGoalName("");
      setNewTargetAmount("");
      setNewCurrentAmount("0");
      setNewTargetDate("");
      fetchGoals();
    } catch (err: any) {
      toast.error(err.message || "Failed to create goal");
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId || !depositAmount || Number(depositAmount) <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/goals/${depositGoalId}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ amount: parseFloat(depositAmount) }),
      });
      if (!res.ok) throw new Error("Failed to process deposit");
      toast.success("Deposit added to goal! 💰");
      setDepositGoalId(null);
      setDepositAmount("");
      fetchGoals();
    } catch (err: any) {
      toast.error(err.message || "Failed to process deposit");
    }
  };

  const handleDeleteGoal = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/goals/${deletingId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete goal");
      toast.success("Savings Goal deleted");
      setDeletingId(null);
      fetchGoals();
    } catch (err: any) {
      toast.error(err.message || "Error deleting goal");
    }
  };

  const totalSaved = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + (g.target_amount || 0), 0);
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "'Inter', sans-serif" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Target size={28} style={{ color: "#7c3aed" }} /> Savings Goals
          </h1>
          <p style={{ color: "var(--text-sub)", fontSize: "0.9rem", margin: "0.3rem 0 0 0" }}>
            Track and build your financial targets and future savings milestones.
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.75rem 1.25rem", borderRadius: "0.75rem",
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
            color: "#fff", fontWeight: 600, fontSize: "0.9rem", border: "none",
            cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
          }}
        >
          <Plus size={18} /> Add Goal
        </button>
      </div>

      {/* Overall Progress Banner */}
      <div style={{
        background: "var(--card-bg)", border: "1px solid var(--card-border)",
        borderRadius: "1rem", padding: "1.5rem", marginBottom: "2rem",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", alignItems: "center"
      }}>
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-sub)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Saved</span>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#10b981", margin: "0.2rem 0 0 0" }}>
            ₹{totalSaved.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-sub)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Target</span>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-main)", margin: "0.2rem 0 0 0" }}>
            ₹{totalTarget.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-sub)" }}>Overall Progress</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#a78bfa" }}>{overallProgress}%</span>
          </div>
          <div style={{ width: "100%", height: "10px", background: "rgba(124,58,237,0.15)", borderRadius: "5px", overflow: "hidden" }}>
            <div style={{ width: `${overallProgress}%`, height: "100%", background: "linear-gradient(90deg, #7c3aed, #10b981)", transition: "width 0.4s" }} />
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ background: "var(--card-bg)", padding: "1.5rem", borderRadius: "1rem", border: "1px solid var(--card-border)" }}>
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 2rem", background: "var(--card-bg)",
          borderRadius: "1rem", border: "1px dashed var(--card-border)"
        }}>
          <Sparkles size={48} style={{ color: "#a78bfa", marginBottom: "1rem" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>No Savings Goals Yet</h3>
          <p style={{ color: "var(--text-sub)", fontSize: "0.9rem", margin: "0.5rem 0 1.5rem 0" }}>Set up your first financial target to stay motivated!</p>
          <button onClick={() => setAddModalOpen(true)} style={{
            padding: "0.75rem 1.5rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
            color: "#fff", fontWeight: 600, border: "none", cursor: "pointer"
          }}>Create First Goal</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {goals.map(goal => {
            const pct = goal.progress_percentage || 0;
            const isCompleted = pct >= 100;
            return (
              <div key={goal._id} style={{
                background: "var(--card-bg)", border: "1px solid var(--card-border)",
                borderRadius: "1rem", padding: "1.5rem", position: "relative", display: "flex",
                flexDirection: "column", justifyContent: "space-between", gap: "1.25rem",
                transition: "transform 0.2s, box-shadow 0.2s"
              }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>{goal.name}</h3>
                    <button onClick={() => setDeletingId(goal._id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: "0.2rem" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {goal.target_date && (
                    <span style={{ fontSize: "0.78rem", color: "var(--text-sub)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Calendar size={13} /> Target: {goal.target_date}
                    </span>
                  )}
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#10b981" }}>
                      ₹{goal.current_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-sub)", fontWeight: 600 }}>
                      of ₹{goal.target_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div style={{ width: "100%", height: "10px", background: "rgba(124,58,237,0.15)", borderRadius: "5px", overflow: "hidden", marginBottom: "0.4rem" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: isCompleted ? "#10b981" : "linear-gradient(90deg, #7c3aed, #3b82f6)", transition: "width 0.4s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 600, color: isCompleted ? "#10b981" : "var(--text-sub)" }}>
                    <span>{isCompleted ? "🎉 Goal Achieved!" : `${pct}% Completed`}</span>
                    <span>₹{Math.max(0, goal.target_amount - goal.current_amount).toLocaleString("en-IN")} left</span>
                  </div>
                </div>

                <button
                  onClick={() => setDepositGoalId(goal._id)}
                  style={{
                    width: "100%", padding: "0.75rem", borderRadius: "0.75rem",
                    background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)",
                    color: "#a78bfa", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem"
                  }}
                >
                  <TrendingUp size={16} /> Add Deposit
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {addModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "var(--card-bg)", borderRadius: "1rem", padding: "1.5rem", maxWidth: "450px", width: "100%", border: "1px solid var(--card-border)" }}>
            <h3 style={{ margin: "0 0 1.25rem 0", color: "var(--text-main)", fontSize: "1.1rem", fontWeight: 700 }}>Create New Savings Goal</h3>
            <form onSubmit={handleCreateGoal} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-sub)", display: "block", marginBottom: "0.4rem" }}>Goal Name</label>
                <input type="text" placeholder="e.g. Vacation Fund, Emergency Reserve" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} required className="finance-input" style={{ width: "100%", height: "42px" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-sub)", display: "block", marginBottom: "0.4rem" }}>Target Amount (₹)</label>
                <input type="number" step="any" placeholder="e.g. 50000" value={newTargetAmount} onChange={e => setNewTargetAmount(e.target.value)} required className="finance-input" style={{ width: "100%", height: "42px" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-sub)", display: "block", marginBottom: "0.4rem" }}>Initial Amount (₹)</label>
                <input type="number" step="any" placeholder="0" value={newCurrentAmount} onChange={e => setNewCurrentAmount(e.target.value)} className="finance-input" style={{ width: "100%", height: "42px" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-sub)", display: "block", marginBottom: "0.4rem" }}>Target Date (Optional)</label>
                <input type="date" value={newTargetDate} onChange={e => setNewTargetDate(e.target.value)} className="finance-input" style={{ width: "100%", height: "42px" }} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setAddModalOpen(false)} style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", background: "transparent", border: "1px solid var(--card-border)", color: "var(--text-sub)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, #7c3aed, #3b82f6)", color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}>Create Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {depositGoalId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "var(--card-bg)", borderRadius: "1rem", padding: "1.5rem", maxWidth: "400px", width: "100%", border: "1px solid var(--card-border)" }}>
            <h3 style={{ margin: "0 0 1.25rem 0", color: "var(--text-main)", fontSize: "1.1rem", fontWeight: 700 }}>Add Deposit to Goal</h3>
            <form onSubmit={handleDeposit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-sub)", display: "block", marginBottom: "0.4rem" }}>Deposit Amount (₹)</label>
                <input type="number" step="any" placeholder="e.g. 5000" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} required autoFocus className="finance-input" style={{ width: "100%", height: "42px" }} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setDepositGoalId(null)} style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", background: "transparent", border: "1px solid var(--card-border)", color: "var(--text-sub)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", background: "#10b981", color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}>Add Deposit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deletingId} onOpenChange={open => !open && setDeletingId(null)} title="Delete Savings Goal" description="Are you sure you want to delete this savings goal? This action cannot be undone." confirmLabel="Delete Goal" onConfirm={handleDeleteGoal} />
    </div>
  );
}
