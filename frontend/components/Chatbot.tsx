import { useState, useEffect, useRef } from "react";
import { Bot, Send, XCircle, Mic } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { theme } from "@/lib/theme";
import { API_URL } from "@/lib/config";

function FormattedMessage({ text, sender }: { text: string; sender: "user" | "bot" }) {
  if (!text) return null;

  const lines = text.split("\n");

  const parseInline = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong
            key={index}
            style={{
              fontWeight: 600,
              color: sender === "user" ? "#ffffff" : "#f8fafc",
            }}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const elements: JSX.Element[] = [];
  let currentList: JSX.Element[] = [];

  const flushList = (keyPrefix: string) => {
    if (currentList.length > 0) {
      elements.push(
        <ul
          key={`ul-${keyPrefix}-${elements.length}`}
          style={{
            margin: "0.3rem 0",
            paddingLeft: "1.1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            listStyleType: "disc",
          }}
        >
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(`${idx}`);
      return;
    }

    const bulletMatch = trimmed.match(/^(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]?\s*)?(?:[*•\-]|(\d+\.))\s+(.*)/u);
    if (bulletMatch && !trimmed.startsWith("http")) {
      const content = bulletMatch[2];
      currentList.push(
        <li
          key={idx}
          style={{
            lineHeight: 1.5,
            color: sender === "user" ? "#ffffff" : "#e2e8f0",
          }}
        >
          {parseInline(content)}
        </li>
      );
    } else {
      flushList(`${idx}`);
      if (trimmed.startsWith("###") || trimmed.startsWith("##") || trimmed.startsWith("#")) {
        const headerText = trimmed.replace(/^#+\s*/, "");
        elements.push(
          <div
            key={idx}
            style={{
              fontWeight: 700,
              fontSize: "0.875rem",
              color: sender === "user" ? "#ffffff" : "#38bdf8",
              marginTop: idx === 0 ? 0 : "0.4rem",
              marginBottom: "0.2rem",
            }}
          >
            {parseInline(headerText)}
          </div>
        );
      } else {
        elements.push(
          <div
            key={idx}
            style={{
              margin: "0.2rem 0",
              lineHeight: 1.5,
              wordBreak: "break-word",
              color: sender === "user" ? "#ffffff" : "#e2e8f0",
            }}
          >
            {parseInline(trimmed)}
          </div>
        );
      }
    }
  });

  flushList("end");

  return <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>{elements}</div>;
}

export default function Chatbot() {
  const { getAuthHeaders } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: "user" | "bot" }[]>([
    { text: "Hi! I'm your FinanceAI assistant. Ask me anything about your finances or how to use the app! 💬", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;

    setMessages(prev => [...prev, { text: msg, sender: "user" }]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ message: msg }),
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      setMessages(prev => [...prev, { text: data.reply || "Sorry, I couldn't process that.", sender: "bot" }]);
    } catch {
      setMessages(prev => [...prev, { text: "Sorry, I'm having trouble reaching the assistant. Please try again.", sender: "bot" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startListening = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setMessages(prev => [...prev, { text: "Voice input is not supported in this browser.", sender: "bot" }]);
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.start();
      recognition.onresult = (event: any) => {
        const speechText = event.results[0][0].transcript;
        setInput(speechText);
        sendMessage(speechText);
      };
      recognition.onerror = () => {
        setMessages(prev => [...prev, { text: "Voice recognition error. Please try typing.", sender: "bot" }]);
      };
    } catch {
      setMessages(prev => [...prev, { text: "Voice input unavailable.", sender: "bot" }]);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle FinanceAI assistant"
        style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem",
          width: "52px", height: "52px", borderRadius: "50%",
          background: theme.gradients.primary,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
          transition: "transform 0.2s, box-shadow 0.2s",
          zIndex: 500,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.1)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      >
        {isOpen ? <XCircle size={24} color="white" /> : <Bot size={24} color="white" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="glass-card" style={{
          position: "fixed", bottom: "5rem", right: "1.5rem",
          width: "380px", maxHeight: "540px", height: "500px",
          borderRadius: "1.25rem",
          boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
          display: "flex", flexDirection: "column",
          fontFamily: "'Inter', sans-serif",
          zIndex: 499,
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "1rem 1.25rem",
            background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.1))",
            borderBottom: "1px solid rgba(124,58,237,0.15)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "8px",
                background: theme.gradients.primary,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bot size={17} color="white" />
              </div>
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>FinanceAI Assistant</p>
                <p style={{ color: "#10b981", fontSize: "0.7rem", margin: 0 }}>● Online AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
            >
              <XCircle size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={chatRef} style={{
            flex: 1, overflowY: "auto", padding: "1rem",
            display: "flex", flexDirection: "column", gap: "0.625rem",
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "85%", padding: "0.625rem 0.875rem",
                  borderRadius: msg.sender === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                  background: msg.sender === "user"
                    ? theme.gradients.primary
                    : "rgba(15, 23, 42, 0.75)",
                  border: msg.sender === "user" ? "none" : "1px solid rgba(124,58,237,0.25)",
                  color: msg.sender === "user" ? "white" : "#e2e8f0", fontSize: "0.845rem", lineHeight: 1.5,
                }}>
                  <FormattedMessage text={msg.text} sender={msg.sender} />
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: "flex", gap: "4px", padding: "0.5rem" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "#7c3aed",
                    animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: "0.75rem 1rem",
            borderTop: "1px solid rgba(30,41,59,0.8)",
            display: "flex", gap: "0.5rem", alignItems: "center",
          }}>
            <input
              type="text"
              placeholder="Ask about your finances..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              style={{
                flex: 1, padding: "0.625rem 0.875rem",
                background: "rgba(15,23,42,0.9)",
                border: "1px solid rgba(30,41,59,1)",
                borderRadius: "0.75rem", color: "#e2e8f0",
                fontSize: "0.8rem", outline: "none",
              }}
            />
            <button
              onClick={() => sendMessage()}
              aria-label="Send message"
              style={{
                width: "36px", height: "36px", borderRadius: "0.625rem",
                background: theme.gradients.primary,
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Send size={15} color="white" />
            </button>
            <button
              onClick={startListening}
              aria-label="Voice input"
              title="Voice input"
              style={{
                width: "36px", height: "36px", borderRadius: "0.625rem",
                background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, color: "#10b981",
              }}
            >
              <Mic size={15} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
