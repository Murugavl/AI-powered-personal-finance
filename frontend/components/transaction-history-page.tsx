"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Search, Plus, Upload } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const categories = [
  { label: "Food & Dining", value: "food", icon: "🍽️" },
  { label: "Transportation", value: "transportation", icon: "🚗" },
  { label: "Housing", value: "housing", icon: "🏠" },
  { label: "Utilities", value: "utilities", icon: "💡" },
  { label: "Entertainment", value: "entertainment", icon: "🎭" },
  { label: "Shopping", value: "shopping", icon: "🛍️" },
  { label: "Health", value: "health", icon: "🏥" },
  { label: "Travel", value: "travel", icon: "✈️" },
  { label: "Education", value: "education", icon: "📚" },
  { label: "Personal", value: "personal", icon: "👤" },
  { label: "Income", value: "income", icon: "💰" },
];

export function TransactionHistoryPageComponent() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch transactions function
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/transactions/`);
      if (!response.ok) throw new Error("Failed to fetch transactions");

      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);

      toast.info(`Selected file: ${selectedFile.name}`, { autoClose: 3000 });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/bills/upload/`, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Error parsing JSON:", err);
        toast.error("Unexpected server response. Check console.");
        return;
      }

      if (response.ok) {
        toast.success("Bill uploaded successfully!");
        window.location.reload();

        if (data.transactions) {
          setTransactions((prev) => [...prev, ...data.transactions]);
        } else {
          toast.warn("Bill uploaded, but no transactions were returned.");
        }
      } else {
        toast.error(`Upload failed! Server Response: ${data.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Upload error: Check console logs.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header with "Add Transaction" and "Upload Bill" Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <div className="flex gap-4 items-center">
          <Button variant="default" onClick={() => router.push("/add-transaction")}>
            <Plus className="h-4 w-4 mr-2" /> Add Transaction
          </Button>

          {/* Hidden File Input */}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

          {/* Button to Open File Dialog */}
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Upload Bill
          </Button>

          {/* Show Selected File Name */}
          {file && <span className="text-gray-700">{file.name}</span>}

          {/* Upload & Process Button (Only visible if file selected) */}
          {file && (
            <Button variant="default" onClick={handleUpload}>
              Process Bill
            </Button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <p className="text-center text-gray-500">Loading transactions...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : transactions.length === 0 ? (
        <p className="text-center text-gray-500">No transactions found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const matchedCategory = categories.find(
                (cat) => cat.value.toLowerCase() === transaction.category.toLowerCase()
              );

              return (
                <TableRow key={transaction.id}>
                  <TableCell>{format(new Date(transaction.date), "PPP")}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    {matchedCategory?.icon} {matchedCategory?.label || transaction.category}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-bold",
                      transaction.type === "income" ? "text-green-500" : "text-red-500"
                    )}
                  >
                    ₹{Math.abs(transaction.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
