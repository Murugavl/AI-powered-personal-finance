"use client";

import { useState } from "react";
import { Search, MessageSquare, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import CSS

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// FAQs Data
const faqs = [
  { question: "How do I add a new transaction?", answer: "Go to 'Transactions' and click 'Add Transaction'." },
  { question: "How can I set up a budget?", answer: "Go to 'Budgets', click 'Create New Budget', and set your limit." },
  { question: "How do I connect my bank account?", answer: "Go to 'Accounts' and click 'Add Account'." },
  { question: "Can I export my financial data?", answer: "Go to 'Settings' and click 'Export Data'." },
  { question: "How do I set up notifications?", answer: "Go to 'Settings' > 'Notifications' to customize alerts." },
];

export function HelpFaqPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFAQs, setFilteredFAQs] = useState(faqs);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  // Handle Search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(term.toLowerCase()) ||
        faq.answer.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredFAQs(filtered);
  };

  // Handle Send Email
  const handleSendEmail = async () => {
    if (!emailSubject || !emailMessage) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSending(true);
    const response = await fetch("/api/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: emailSubject, message: emailMessage }),
    });

    setIsSending(false);

    if (response.ok) {
      toast.success("Email sent successfully!");
      setEmailSubject("");
      setEmailMessage("");
    } else {
      toast.error("Failed to send email. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Help & FAQ</h1>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search FAQs" value={searchTerm} onChange={(e) => handleSearch(e.target.value)} className="pl-8" />
        </div>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Find answers to common questions about using our platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => (
              <div key={index} className="border-b py-3">
                <p className="font-medium">{faq.question}</p>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))
          ) : (
            <p>No results found.</p>
          )}
        </CardContent>
      </Card>

      {/* Support Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
          <CardDescription>Contact our support team for assistance.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center space-x-4">

          {/* Email Support Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Email Support
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Email Support</DialogTitle>
                <p>Fill in the details below and we'll get back to you.</p>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Label>Subject</Label>
                <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Enter subject" />

                <Label>Message</Label>
                <Textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} placeholder="Enter your message" className="min-h-[100px]" />
              </div>
              <DialogFooter>
                <Button onClick={handleSendEmail} disabled={isSending}>
                  {isSending ? "Sending..." : "Send Message"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
