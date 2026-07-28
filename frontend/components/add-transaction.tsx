"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, ArrowLeft, CheckCircle2, AlertCircle, Loader2, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import { useAuth } from "@/components/AuthProvider";
import { theme } from "@/lib/theme";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

// ─── Income Categories ────────────────────────────────────────────────────────
const incomeCategories = [
  { label: "Salary",        value: "salary",       icon: "💼" },
  { label: "Freelance",     value: "freelance",    icon: "💻" },
  { label: "Business",      value: "business",     icon: "🏢" },
  { label: "Investments",   value: "investments",  icon: "📈" },
  { label: "Dividends",     value: "dividends",    icon: "💹" },
  { label: "Interest",      value: "interest",     icon: "🏦" },
  { label: "Rental Income", value: "rental",       icon: "🏠" },
  { label: "Bonus",         value: "bonus",        icon: "🎁" },
  { label: "Cashback",      value: "cashback",     icon: "💳" },
  { label: "Refund",        value: "refund",       icon: "🔄" },
  { label: "Side Hustle",   value: "side_hustle",  icon: "⚡" },
  { label: "Royalties",     value: "royalties",    icon: "🎵" },
  { label: "Gift",          value: "gift_income",  icon: "🎀" },
  { label: "Other Income",  value: "other_income", icon: "💰" },
];

// ─── Expense Categories (Grouped) ─────────────────────────────────────────────
const expenseGroups = [
  {
    group: "🍽️ Food & Dining",
    categories: [
      { label: "Groceries",      value: "groceries",      icon: "🛒" },
      { label: "Restaurants",    value: "restaurants",    icon: "🍽️" },
      { label: "Coffee",         value: "coffee",         icon: "☕" },
      { label: "Food Delivery",  value: "food_delivery",  icon: "🛵" },
    ],
  },
  {
    group: "🚗 Transportation",
    categories: [
      { label: "Fuel",              value: "fuel",              icon: "⛽" },
      { label: "Public Transport",  value: "public_transport",  icon: "🚌" },
      { label: "Taxi / Ride Share", value: "taxi",              icon: "🚕" },
      { label: "Vehicle Maintenance", value: "vehicle_maintenance", icon: "🔧" },
      { label: "Parking",           value: "parking",           icon: "🅿️" },
    ],
  },
  {
    group: "🏠 Housing",
    categories: [
      { label: "Rent",             value: "rent",             icon: "🏠" },
      { label: "Mortgage",         value: "mortgage",         icon: "🏦" },
      { label: "Utilities",        value: "utilities",        icon: "💡" },
      { label: "Internet",         value: "internet",         icon: "🌐" },
      { label: "Mobile",           value: "mobile",           icon: "📱" },
      { label: "Home Maintenance", value: "home_maintenance", icon: "🔨" },
    ],
  },
  {
    group: "🛍️ Lifestyle",
    categories: [
      { label: "Shopping",           value: "shopping",           icon: "🛍️" },
      { label: "Clothing",           value: "clothing",           icon: "👗" },
      { label: "Beauty",             value: "beauty",             icon: "💄" },
      { label: "Fitness",            value: "fitness",            icon: "🏋️" },
      { label: "Entertainment",      value: "entertainment",      icon: "🎭" },
      { label: "Streaming Services", value: "streaming",          icon: "📺" },
      { label: "Hobbies",            value: "hobbies",            icon: "🎨" },
    ],
  },
  {
    group: "💳 Finance",
    categories: [
      { label: "Insurance",           value: "insurance",         icon: "🛡️" },
      { label: "Taxes",               value: "taxes",             icon: "📋" },
      { label: "Loan Payment",        value: "loan_payment",      icon: "💰" },
      { label: "Credit Card Payment", value: "credit_card",       icon: "💳" },
      { label: "Savings",             value: "savings",           icon: "🏦" },
      { label: "Investments",         value: "expense_investments", icon: "📈" },
    ],
  },
  {
    group: "🏥 Health",
    categories: [
      { label: "Pharmacy",     value: "pharmacy",      icon: "💊" },
      { label: "Doctor",       value: "doctor",        icon: "👨‍⚕️" },
      { label: "Hospital",     value: "hospital",      icon: "🏥" },
      { label: "Medical Tests", value: "medical_tests", icon: "🩺" },
    ],
  },
  {
    group: "📚 Education",
    categories: [
      { label: "Tuition",        value: "tuition",       icon: "🎓" },
      { label: "Books",          value: "books",         icon: "📚" },
      { label: "Online Courses", value: "online_courses", icon: "💻" },
      { label: "Certifications", value: "certifications", icon: "🏆" },
    ],
  },
  {
    group: "✈️ Travel",
    categories: [
      { label: "Flights",          value: "flights",          icon: "✈️" },
      { label: "Hotels",           value: "hotels",           icon: "🏨" },
      { label: "Vacation",         value: "vacation",         icon: "🌴" },
      { label: "Travel Insurance", value: "travel_insurance", icon: "🛡️" },
    ],
  },
  {
    group: "👨‍👩‍👧 Family",
    categories: [
      { label: "Child Care", value: "child_care", icon: "👶" },
      { label: "Pets",       value: "pets",       icon: "🐾" },
      { label: "Gifts",      value: "gifts",      icon: "🎁" },
      { label: "Donations",  value: "donations",  icon: "❤️" },
    ],
  },
  {
    group: "💼 Business",
    categories: [
      { label: "Office Supplies", value: "office_supplies", icon: "📎" },
      { label: "Software",        value: "software",        icon: "🖥️" },
      { label: "Marketing",       value: "marketing",       icon: "📣" },
      { label: "Equipment",       value: "equipment",       icon: "🔌" },
    ],
  },
  {
    group: "🔖 Miscellaneous",
    categories: [
      { label: "Miscellaneous", value: "miscellaneous", icon: "🔖" },
      { label: "Emergency",     value: "emergency",     icon: "🚨" },
      { label: "Other",         value: "other",         icon: "❓" },
    ],
  },
];

// ─── Form Schema ──────────────────────────────────────────────────────────────
const formSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Please enter a valid positive amount.",
  }),
  date: z.date({ required_error: "Please pick a date." }),
  description: z.string().min(2, { message: "Description must be at least 2 characters." }).max(200),
  category: z.string().optional(),
  type: z.enum(["expense", "income"]),
  recurrence_rule: z.enum(["none", "weekly", "monthly", "yearly"]).default("none"),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Component ────────────────────────────────────────────────────────────────
export function AddTransactionPageComponent() {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      date: new Date(),
      description: "",
      category: "groceries",
      type: "expense",
    },
  });

  const currentType = form.watch("type");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        amount: parseFloat(values.amount),
        category: values.type === "income"
          ? (values.category || "salary")
          : (values.category || "other"),
      };

      const response = await fetch(`${API_BASE_URL}/transactions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to add transaction");
      }

      setSuccess(true);
      toast.success("Transaction saved successfully! ✓");
      setTimeout(() => navigate("/transactions"), 1200);
    } catch (error: any) {
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      padding: "2rem 1.5rem",
      maxWidth: "640px",
      margin: "0 auto",
      fontFamily: "'Inter', sans-serif",
      animation: "fadeInUp 0.4s ease both",
    }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-sub)", fontSize: "0.83rem", marginBottom: "1.25rem",
          padding: "0.4rem 0", transition: "color 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#7c3aed")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-sub)")}
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Add Transaction</h1>
        <p style={{ color: "var(--text-sub)", fontSize: "0.875rem", marginTop: "0.3rem" }}>
          Record a new income or expense to your ledger
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-card" style={{ padding: "1.75rem 2rem" }}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* ── Type Toggle ─── */}
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <label style={{ color: "var(--text-sub)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Transaction Type
                </label>
                {/* Pill-style toggle */}
                <div style={{
                  display: "flex", padding: "4px",
                  background: "rgba(124,58,237,0.07)",
                  border: "1px solid rgba(124,58,237,0.15)",
                  borderRadius: "1rem", gap: "4px",
                }}>
                  {([
                    { val: "expense", label: "Expense", icon: TrendingDown, color: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
                    { val: "income",  label: "Income",  icon: TrendingUp,   color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
                  ] as const).map(({ val, label, icon: Icon, color, bg, border }) => {
                    const isActive = field.value === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          field.onChange(val);
                          form.setValue("category", val === "income" ? "salary" : "groceries");
                        }}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                          gap: "0.5rem", padding: "0.65rem 1rem",
                          borderRadius: "0.75rem",
                          background: isActive ? bg : "transparent",
                          border: isActive ? `1px solid ${border}` : "1px solid transparent",
                          color: isActive ? color : "var(--text-sub)",
                          fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Icon size={16} />
                        {label}
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── Amount ─── */}
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <label style={{ color: "var(--text-sub)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Amount (₹)
                </label>
                <FormControl>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)",
                      color: "#7c3aed", fontSize: "1.05rem", fontWeight: 700, pointerEvents: "none",
                    }}>₹</span>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="finance-input"
                      style={{ paddingLeft: "2.25rem", fontSize: "1.1rem", fontWeight: 600, height: "48px" }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── Category Chip Grid ─── */}
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <label style={{ color: "var(--text-sub)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Category
                </label>
                {/* Selected value badge */}
                {field.value && (
                  <div style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-sub)" }}>Selected:</span>
                    <span style={{
                      padding: "0.25rem 0.75rem", borderRadius: "999px",
                      background: "rgba(124,58,237,0.18)", border: "1px solid #7c3aed",
                      color: "#a78bfa", fontSize: "0.82rem", fontWeight: 600,
                    }}>
                      {[...incomeCategories, ...expenseGroups.flatMap(g => g.categories)].find(c => c.value === field.value)?.icon}{" "}
                      {[...incomeCategories, ...expenseGroups.flatMap(g => g.categories)].find(c => c.value === field.value)?.label}
                    </span>
                  </div>
                )}
                {currentType === "income" ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {incomeCategories.map(cat => (
                      <button key={cat.value} type="button"
                        className={`category-chip${field.value === cat.value ? " selected" : ""}`}
                        onClick={() => field.onChange(cat.value)}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {expenseGroups.map(group => (
                      <div key={group.group}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", margin: "0 0 0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {group.group}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                          {group.categories.map(cat => (
                            <button key={cat.value} type="button"
                              className={`category-chip${field.value === cat.value ? " selected" : ""}`}
                              onClick={() => field.onChange(cat.value)}
                            >
                              {cat.icon} {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )} />

            {/* ── Date ─── */}
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem>
                <label style={{ color: "var(--text-sub)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                        style={{
                          height: "48px", fontSize: "0.9rem",
                          background: "var(--card-bg)", color: "var(--text-main)",
                          border: "1px solid var(--card-border)", borderRadius: "0.625rem",
                        }}
                      >
                        <CalendarIcon size={16} style={{ marginRight: "0.6rem", color: "#7c3aed", flexShrink: 0 }} />
                        {field.value ? format(field.value, "PPP") : "Pick a date"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── Recurrence ─── */}
            <FormField control={form.control} name="recurrence_rule" render={({ field }) => (
              <FormItem>
                <label style={{ color: "var(--text-sub)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Recurrence
                </label>
                <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                  <FormControl>
                    <SelectTrigger style={{ height: "48px", fontSize: "0.9rem", background: "var(--card-bg)", color: "var(--text-main)", border: "1px solid var(--card-border)" }}>
                      <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">One-time (No Recurrence)</SelectItem>
                    <SelectItem value="weekly">Every Week (Weekly)</SelectItem>
                    <SelectItem value="monthly">Every Month (Monthly)</SelectItem>
                    <SelectItem value="yearly">Every Year (Yearly)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── Description ─── */}
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <label style={{ color: "var(--text-sub)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Description
                </label>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="What was this for?"
                    className="finance-input"
                    style={{ height: "48px", fontSize: "0.9rem" }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* ── Buttons ─── */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
              <button
                type="button"
                onClick={() => { form.reset(); navigate(-1); }}
                style={{
                  flex: 1, padding: "0.875rem",
                  background: "transparent",
                  border: "1px solid var(--card-border)",
                  borderRadius: "0.875rem", color: "var(--text-sub)",
                  fontSize: "0.9rem", fontWeight: 500, cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.4)";
                  (e.currentTarget as HTMLElement).style.color = "#a78bfa";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--card-border)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-sub)";
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || success}
                style={{
                  flex: 2, padding: "0.875rem",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  background: success
                    ? theme.gradients.success
                    : submitting
                      ? "rgba(124,58,237,0.4)"
                      : theme.gradients.primary,
                  border: "none", borderRadius: "0.875rem", color: "white",
                  fontSize: "0.95rem", fontWeight: 600,
                  cursor: (submitting || success) ? "not-allowed" : "pointer",
                  boxShadow: (submitting || success) ? "none" : "0 4px 15px rgba(124,58,237,0.35)",
                  transition: "all 0.3s ease",
                }}
              >
                {success ? (
                  <><CheckCircle2 size={18} /> Saved!</>
                ) : submitting ? (
                  <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Saving...</>
                ) : (
                  <>Save Transaction</>
                )}
              </button>
            </div>

          </form>
        </Form>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
