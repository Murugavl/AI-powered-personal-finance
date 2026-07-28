"use client";

import { useState } from "react";
import {
  Download, FileText, Table2, CheckCircle2, AlertCircle,
  Loader2, FileSpreadsheet, Clock, Shield, Zap, BarChart3,
  Info, Calendar, X,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "react-toastify";
import { API_URL } from "@/lib/config";

type ExportFormat = "csv" | "pdf";
type ExportState = "idle" | "loading" | "success" | "error";

interface FormatConfig {
  id: ExportFormat;
  label: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  btnText: string;
}

const formatConfigs: FormatConfig[] = [
  {
    id: "csv",
    label: "CSV Spreadsheet",
    subtitle: "Excel & Google Sheets compatible",
    description: "Export your complete transaction history as a comma-separated values file. Perfect for data analysis, custom reports, and importing into accounting tools.",
    features: ["All transaction fields", "Compatible with Excel & Sheets", "Easy to filter & sort", "Lightweight & fast"],
    icon: <FileSpreadsheet size={28} />,
    iconBg: "rgba(59,130,246,0.12)",
    iconBorder: "rgba(59,130,246,0.25)",
    accent: "#60a5fa",
    accentBg: "rgba(59,130,246,0.08)",
    accentBorder: "rgba(59,130,246,0.2)",
    btnText: "Download CSV",
  },
  {
    id: "pdf",
    label: "PDF Report",
    subtitle: "Print-ready formatted document",
    description: "Generate a professionally formatted PDF report of your transactions. Ideal for sharing with accountants, keeping records, or printing for your files.",
    features: ["Formatted layout", "Print-ready", "Professional report", "Shareable document"],
    icon: <FileText size={28} />,
    iconBg: "rgba(124,58,237,0.12)",
    iconBorder: "rgba(124,58,237,0.25)",
    accent: "#a78bfa",
    accentBg: "rgba(124,58,237,0.08)",
    accentBorder: "rgba(124,58,237,0.2)",
    btnText: "Download PDF",
  },
];

const infoCards = [
  {
    icon: <Zap size={16} color="#f59e0b" />,
    title: "Instant Export",
    desc: "Reports are generated in real-time with your latest data.",
  },
  {
    icon: <Shield size={16} color="#10b981" />,
    title: "Secure & Private",
    desc: "Your data stays in your account — we never share it.",
  },
  {
    icon: <Clock size={16} color="#3b82f6" />,
    title: "Full History",
    desc: "Exports include your complete transaction history.",
  },
  {
    icon: <BarChart3 size={16} color="#a78bfa" />,
    title: "All Fields Included",
    desc: "Date, amount, category, type, and description.",
  },
];

export function Export() {
  const { getAuthHeaders } = useAuth();
  const [states, setStates] = useState<Record<ExportFormat, ExportState>>({ csv: "idle", pdf: "idle" });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleExport = async (format: ExportFormat) => {
    setStates(prev => ({ ...prev, [format]: "loading" }));
    try {
      const params = new URLSearchParams({ format });
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const res = await fetch(`${API_URL}/export/export-transactions?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FinanceAI_Transactions_${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setStates(prev => ({ ...prev, [format]: "success" }));
      toast.success(`✅ ${format.toUpperCase()} downloaded successfully!`);
      setTimeout(() => setStates(prev => ({ ...prev, [format]: "idle" })), 3000);
    } catch (err: any) {
      setStates(prev => ({ ...prev, [format]: "error" }));
      toast.error("Export failed. Please try again.");
      setTimeout(() => setStates(prev => ({ ...prev, [format]: "idle" })), 3000);
    }
  };

  return (
    <div style={{
      padding: "2rem 1.5rem",
      maxWidth: "900px",
      margin: "0 auto",
      fontFamily: "'Inter', sans-serif",
      animation: "fadeInUp 0.4s ease both",
    }}>

      {/* ── Header ─── */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.2))",
            border: "1px solid rgba(124,58,237,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Download size={20} color="#a78bfa" />
          </div>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Export Data</h1>
            <p style={{ color: "var(--text-sub)", fontSize: "0.875rem", margin: 0 }}>
              Download your complete transaction history
            </p>
          </div>
        </div>
      </div>

      {/* ── Date Range Selector ─── */}
      <div className="glass-card" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
          <Calendar size={16} color="#a78bfa" />
          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>Filter by Date Range</span>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>(leave blank to export all)</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "1 1 200px" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-sub)", flexShrink: 0, fontWeight: 500 }}>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="finance-input"
              style={{ flex: 1, padding: "0.55rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.85rem" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "1 1 200px" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-sub)", flexShrink: 0, fontWeight: 500 }}>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="finance-input"
              style={{ flex: 1, padding: "0.55rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.85rem" }} />
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); }}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "rgba(100,116,139,0.12)", border: "1px solid var(--card-border)", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", cursor: "pointer", color: "var(--text-sub)", fontSize: "0.8rem" }}>
              <X size={13} /> Clear
            </button>
          )}
          {dateFrom && dateTo && (
            <span style={{ fontSize: "0.78rem", color: "#10b981", fontWeight: 500 }}>
              ✓ {dateFrom} → {dateTo}
            </span>
          )}
        </div>
      </div>

      {/* ── Format Cards ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}
           className="export-grid">
        {formatConfigs.map((fmt) => {
          const state = states[fmt.id];
          const isLoading = state === "loading";
          const isSuccess = state === "success";
          const isError = state === "error";
          const isDisabled = isLoading || Object.values(states).some(s => s === "loading");

          return (
            <div
              key={fmt.id}
              className="glass-card glass-card-hover"
              style={{
                padding: "1.75rem",
                borderColor: fmt.accentBorder,
                transition: "all 0.3s ease",
              }}
            >
              {/* Icon */}
              <div style={{
                width: "56px", height: "56px", borderRadius: "14px", marginBottom: "1.25rem",
                background: fmt.iconBg, border: `1px solid ${fmt.iconBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: fmt.accent,
              }}>
                {fmt.icon}
              </div>

              {/* Title */}
              <h3 style={{ color: "var(--text-main)", fontWeight: 700, fontSize: "1.1rem", margin: "0 0 0.25rem" }}>
                {fmt.label}
              </h3>
              <p style={{ color: fmt.accent, fontSize: "0.78rem", fontWeight: 500, margin: "0 0 0.875rem" }}>
                {fmt.subtitle}
              </p>
              <p style={{ color: "var(--text-sub)", fontSize: "0.84rem", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
                {fmt.description}
              </p>

              {/* Feature list */}
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {fmt.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-sub)" }}>
                    <span style={{ color: fmt.accent, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleExport(fmt.id)}
                disabled={isDisabled}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  padding: "0.8rem 1rem",
                  background: isSuccess
                    ? "rgba(16,185,129,0.15)"
                    : isError
                      ? "rgba(239,68,68,0.12)"
                      : isLoading
                        ? fmt.accentBg
                        : `linear-gradient(135deg, ${fmt.accentBg}, ${fmt.accentBg})`,
                  border: `1px solid ${isSuccess ? "rgba(16,185,129,0.35)" : isError ? "rgba(239,68,68,0.3)" : fmt.accentBorder}`,
                  borderRadius: "0.875rem",
                  color: isSuccess ? "#10b981" : isError ? "#f87171" : fmt.accent,
                  fontSize: "0.875rem", fontWeight: 600,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  transition: "all 0.25s ease",
                  opacity: isDisabled && !isLoading ? 0.6 : 1,
                }}
                onMouseEnter={e => {
                  if (!isDisabled) {
                    (e.currentTarget as HTMLElement).style.background =
                      `linear-gradient(135deg, ${fmt.accentBg.replace("0.08", "0.15")}, ${fmt.accentBg})`;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${fmt.accentBorder}`;
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = fmt.accentBg;
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {isLoading ? (
                  <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
                ) : isSuccess ? (
                  <><CheckCircle2 size={16} /> Downloaded!</>
                ) : isError ? (
                  <><AlertCircle size={16} /> Failed — Retry</>
                ) : (
                  <><Download size={16} /> {fmt.btnText}</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Info Cards Row ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.875rem", marginBottom: "1.5rem" }}
           className="info-grid">
        {infoCards.map((card) => (
          <div
            key={card.title}
            className="glass-card"
            style={{ padding: "1rem 1.1rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}
          >
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
              background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {card.icon}
            </div>
            <div>
              <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-main)", margin: "0 0 0.2rem" }}>{card.title}</p>
              <p style={{ fontSize: "0.74rem", color: "var(--text-sub)", margin: 0, lineHeight: 1.5 }}>{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Note ─── */}
      <div className="glass-card" style={{
        padding: "1rem 1.25rem",
        background: "rgba(59,130,246,0.04)",
        borderColor: "rgba(59,130,246,0.15)",
        display: "flex", alignItems: "flex-start", gap: "0.75rem",
      }}>
        <Info size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: "2px" }} />
        <p style={{ color: "var(--text-sub)", fontSize: "0.8rem", lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: "var(--text-main)" }}>Note:</strong>{" "}
          Exports are generated instantly and include your full transaction history — date, amount, category, type, and description.
          Large datasets may take a few seconds.
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 640px) {
          .export-grid { grid-template-columns: 1fr !important; }
          .info-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .info-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
