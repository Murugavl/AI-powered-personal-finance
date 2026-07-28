import { useState } from "react";
import { Search, Mail, ChevronDown, HelpCircle, Shield, CreditCard, PieChart, Upload } from "lucide-react";
import { toast } from "react-toastify";

const categories = [
  { name: "All", icon: HelpCircle },
  { name: "Transactions", icon: CreditCard },
  { name: "Budgets", icon: PieChart },
  { name: "Accounts", icon: CreditCard },
  { name: "Export", icon: Upload },
  { name: "Security", icon: Shield },
];

const faqs = [
  { category: "Transactions", question: "How do I add a new transaction?", answer: "Click the '+ Add Transaction' button in the top navigation bar or quick actions on your Dashboard. Fill in the amount, type (Income or Expense), date, and description, then click Save." },
  { category: "Transactions", question: "Can I filter or search through my transactions?", answer: "Yes! Navigate to the Transactions page to use the live search bar or filter tabs (All, Income, Expense) to filter by description or category." },
  { category: "Budgets", question: "How do I set up a budget?", answer: "Go to the 'Budgeting' page and click '+ Add Budget'. Select a category (like Food or Transportation) and enter your monthly limit." },
  { category: "Budgets", question: "What happens when I exceed my budget?", answer: "Your budget card will highlight in red with an 'Over budget' alert badge. You'll also see warning indicators when approaching 80% of your limit." },
  { category: "Accounts", question: "How do I add a bank or credit account?", answer: "Go to the 'Accounts' page and click '+ Add Account'. Enter your account name, type (Bank, Credit, Investment), institution, and starting balance." },
  { category: "Export", question: "Can I export my transaction data?", answer: "Yes! Navigate to the 'Export' page where you can download your full transaction history instantly as either a CSV spreadsheet or a formatted PDF report." },
  { category: "Security", question: "Is my financial data secure?", answer: "Yes! All user accounts are protected with industry-standard bcrypt password hashing and signed HS256 JWT authorization tokens." },
];

export function HelpFaqPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const filteredFAQs = faqs.filter(faq => {
    const matchesCat = selectedCategory === "All" || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject || !emailMessage) {
      toast.error("Please fill in both subject and message.");
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast.success("Support ticket submitted! We'll reply shortly. 📩");
      setEmailSubject("");
      setEmailMessage("");
      setShowSupportModal(false);
    }, 1000);
  };

  return (
    <div style={{ padding: "2.5rem 1.5rem", maxWidth: "960px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      {/* Hero Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "14px", margin: "0 auto 1rem",
          background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.15))",
          border: "1px solid rgba(124,58,237,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <HelpCircle size={24} color="#7c3aed" />
        </div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0 0 0.5rem" }}>
          How can we <span style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>help you?</span>
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Find instant answers to common questions or reach out to our support team
        </p>
      </div>

      {/* Search Input */}
      <div style={{ position: "relative", maxWidth: "600px", margin: "0 auto 2rem" }}>
        <Search size={18} color="#64748b" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
        <input
          type="text"
          placeholder="Search FAQs (e.g., budget, export, add transaction)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: "100%", padding: "0.875rem 1rem 0.875rem 2.75rem",
            borderRadius: "1rem", fontSize: "0.95rem", outline: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)", transition: "all 0.2s",
          }}
        />
      </div>

      {/* Category Pills */}
      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        {categories.map(cat => {
          const Icon = cat.icon;
          const isSel = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.5rem 1rem", borderRadius: "0.75rem",
                fontSize: "0.85rem", fontWeight: 500, cursor: "pointer",
                border: "1px solid",
                background: isSel ? "linear-gradient(135deg, #7c3aed, #3b82f6)" : "transparent",
                borderColor: isSel ? "transparent" : "rgba(100,116,139,0.3)",
                color: isSel ? "white" : "inherit",
                transition: "all 0.2s",
              }}
            >
              <Icon size={14} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* FAQs Accordion */}
      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "2.5rem" }}>
        {filteredFAQs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
            <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No matching FAQs found</p>
            <p style={{ fontSize: "0.85rem" }}>Try adjusting your search query</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filteredFAQs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: isOpen ? "rgba(124,58,237,0.08)" : "rgba(100,116,139,0.05)",
                    border: `1px solid ${isOpen ? "rgba(124,58,237,0.3)" : "rgba(100,116,139,0.2)"}`,
                    borderRadius: "0.75rem", overflow: "hidden", transition: "all 0.2s",
                  }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    style={{
                      width: "100%", padding: "1rem 1.25rem",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: "none", border: "none", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <span style={{ color: isOpen ? "#7c3aed" : "inherit", fontSize: "0.95rem", fontWeight: 600 }}>
                      {faq.question}
                    </span>
                    <ChevronDown size={18} color={isOpen ? "#7c3aed" : "#64748b"} style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s", flexShrink: 0, marginLeft: "1rem",
                    }} />
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 1.25rem 1.25rem", color: "#64748b", fontSize: "0.875rem", lineHeight: 1.6 }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Need More Help Card */}
      <div className="glass-card" style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(59,130,246,0.05))",
        borderColor: "rgba(124,58,237,0.25)", textAlign: "center", padding: "2rem",
      }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Still have questions?
        </h3>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          Our support team is ready to help you with any issue or feedback.
        </p>
        <button
          onClick={() => setShowSupportModal(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)", border: "none",
            borderRadius: "0.75rem", color: "white", fontSize: "0.9rem", fontWeight: 600,
            cursor: "pointer", boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
          }}
        >
          <Mail size={16} /> Contact Support
        </button>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div className="glass-card" style={{
            padding: "2rem", width: "100%", maxWidth: "440px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
          }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.25rem" }}>Email Support</h3>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.25rem" }}>Fill in the details and we'll reply to your email.</p>
            <form onSubmit={handleSendEmail} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ color: "#64748b", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>Subject</label>
                <input
                  required
                  placeholder="What do you need help with?"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  style={{
                    width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem",
                    fontSize: "0.875rem", outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ color: "#64748b", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your issue or question..."
                  value={emailMessage}
                  onChange={e => setEmailMessage(e.target.value)}
                  style={{
                    width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem",
                    fontSize: "0.875rem", outline: "none", resize: "none",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowSupportModal(false)} style={{
                  flex: 1, padding: "0.75rem", background: "rgba(100,116,139,0.15)", border: "1px solid rgba(100,116,139,0.3)",
                  borderRadius: "0.75rem", color: "inherit", cursor: "pointer", fontSize: "0.875rem",
                }}>Cancel</button>
                <button type="submit" disabled={isSending} style={{
                  flex: 1, padding: "0.75rem", background: "linear-gradient(135deg, #7c3aed, #3b82f6)", border: "none",
                  borderRadius: "0.75rem", color: "white", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
                }}>{isSending ? "Sending..." : "Send Ticket"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
