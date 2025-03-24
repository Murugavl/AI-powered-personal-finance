"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function Export() {
  const [loading, setLoading] = useState(false);

  // ✅ Function to export transaction history
  const handleExportData = async (format: "csv" | "pdf") => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/export-transactions?format=${format}`);
      if (!response.ok) throw new Error("Failed to export data");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Transaction_History.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Transaction history exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export transaction history");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Export Data</h1>

      <Card>
        <CardHeader>
          <CardTitle>Download Transaction History</CardTitle>
          <CardDescription>Export your transactions in CSV or PDF format.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={() => handleExportData("csv")} variant="outline" disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              {loading ? "Exporting..." : "Export as CSV"}
            </Button>
            <Button onClick={() => handleExportData("pdf")} variant="outline" disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              {loading ? "Exporting..." : "Export as PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
