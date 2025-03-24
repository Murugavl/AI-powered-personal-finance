"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Send, XCircle, Mic } from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: "user" | "bot" }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  // 🎙️ Speech-to-Text Function
  const startListening = () => {
    const recognition = new window.webkitSpeechRecognition() || new window.SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      setInput(speechText);
      sendMessage(speechText); // Automatically send message
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };
  };

  const sendMessage = async (text?: string) => {
    const messageToSend = text || input;
    if (!messageToSend.trim()) return;

    const userMessage = { text: messageToSend, sender: "user" as const };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const botReply = data.reply || "Sorry, I couldn't process that.";

      setMessages((prev) => [...prev, { text: botReply, sender: "bot" }]);

      // Convert bot response to speech
      speak(botReply);
    } catch {
      setMessages((prev) => [...prev, { text: "Sorry, I couldn't process that.", sender: "bot" }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Text-to-Speech Function
  const speak = (text: string) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    synth.speak(utterance);
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className="fixed bottom-5 right-5 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all"
      >
        {isOpen ? <XCircle size={24} /> : <Bot size={24} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-5 w-96 bg-white shadow-lg rounded-lg flex flex-col">
          <div className="p-3 bg-blue-600 text-white flex justify-between items-center rounded-t-lg">
            <span>Finance Chatbot</span>
            <button onClick={toggleChat}>
              <XCircle size={20} />
            </button>
          </div>

          <div ref={chatContainerRef} className="p-3 h-80 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 my-1 rounded-md max-w-[75%] ${
                  msg.sender === "user" ? "bg-blue-500 text-white ml-auto" : "bg-gray-200"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isTyping && <div className="text-gray-500">Bot is typing...</div>}
          </div>

          <div className="p-3 flex items-center border-t">
            <input
              type="text"
              className="flex-1 border p-2 rounded-md"
              placeholder="Ask me about finances..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={() => sendMessage()} className="ml-2 bg-blue-500 text-white p-2 rounded-md">
              <Send size={18} />
            </button>
            {/* 🎙️ Voice Button */}
            <button onClick={startListening} className="ml-2 bg-green-500 text-white p-2 rounded-md">
              <Mic size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
