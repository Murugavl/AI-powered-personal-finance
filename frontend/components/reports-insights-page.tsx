"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// API Endpoint
const TRANSACTIONS_API = `${process.env.NEXT_PUBLIC_API_URL}/transactions`;
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export function ReportsInsightsPageComponent() {
  const [timeframe, setTimeframe] = useState("monthly");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${TRANSACTIONS_API}?timestamp=${Date.now()}`, { cache: "no-store" });

        if (!response.ok) throw new Error("Failed to fetch transactions");

        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [timeframe]);

  // ✅ Process transactions for the Income vs. Expenses Trends graph
  const processTransactions = () => {
    const data = {};
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
    transactions.forEach(({ amount, type, date }) => {
      const month = new Date(date).toLocaleString("default", { month: "short" });
      const year = new Date(date).getFullYear().toString();
      const key = timeframe === "monthly" ? month : year;
  
      if (!data[key]) {
        data[key] = { name: key, income: 0, expenses: 0 };
      }
  
      if (type === "income") {
        data[key].income += amount;
      } else {
        data[key].expenses += amount;
      }
    });
  
    // Convert object to sorted array based on month order
    return Object.values(data).sort((a, b) => {
      if (timeframe === "monthly") {
        return monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name);
      }
      return a.name.localeCompare(b.name); // Sort years numerically
    });
  };
  

  // ✅ Process spending categories
  const processSpendingCategories = () => {
    const categoryMap = {};

    transactions.forEach(({ category, amount, type }) => {
      if (type === "expense") {
        const normalizedCategory = category.trim().toLowerCase();
        categoryMap[normalizedCategory] = (categoryMap[normalizedCategory] || 0) + amount;
      }
    });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const data = processTransactions();
  const spendingCategories = processSpendingCategories();
  const topSpendingCategories = spendingCategories.slice(0, 5); // ✅ Highest Expenses

  const totalExpenses = transactions
    .filter(({ type }) => type === "expense")
    .reduce((sum, { amount }) => sum + amount, 0);
  const totalIncome = transactions
    .filter(({ type }) => type === "income")
    .reduce((sum, { amount }) => sum + amount, 0);
  const netSavings = totalIncome - totalExpenses;

  if (loading) return <p className="text-center text-lg">Loading...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📊 Reports & Insights</h1>

      <div className="mb-6">
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">📅 Monthly</SelectItem>
            <SelectItem value="yearly">📆 Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Income vs. Expenses Trends */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>📈 Income vs. Expenses Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#0088FE" />
              <Line type="monotone" dataKey="expenses" stroke="#FF8042" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Financial Overview */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card className="bg-blue-100 border-l-4 border-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-700">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">
              ₹{totalIncome.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-100 border-l-4 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-700">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-700">
              ₹{totalExpenses.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-100 border-l-4 border-green-500">
          <CardHeader>
            <CardTitle className="text-green-700">Net Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">
              ₹{netSavings.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Spending Categories Breakdown */}
        {/* Spending Categories Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>🛒 Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={spendingCategories}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) =>
                    `${name} ${(value / totalExpenses * 100).toFixed(2)}%`
                  }
                >
                  {spendingCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>


        {/* Highest Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>💸 Highest Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSpendingCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
