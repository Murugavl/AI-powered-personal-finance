"use client";

import { useState, useEffect } from "react";
import { Plus, CreditCard, Wallet, Briefcase, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { toast } from "react-toastify";

// Interfaces
interface Account {
  name: string;
  institution: string;
  type: string;
  balance: number;
}

interface Transaction {
  date: string;
  description: string;
  amount: number;
}

// State
export default function AccountsPageComponent() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [newAccount, setNewAccount] = useState<Account>({
    name: "", type: "", balance: 0, institution: ""
  });


  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  // Fetch accounts from FastAPI
  useEffect(() => {
    fetch(`${apiUrl}/accounts`)
      .then((res) => res.json())
      .then((data) => setAccounts(data))
      .catch((err) => console.error("Error fetching accounts:", err));
  }, []);

  // Fetch transactions when an account is selected
  useEffect(() => {
    if (selectedAccount) {
      fetch(`${apiUrl}transactions/${selectedAccount.name}`)
        .then((res) => res.json())
        .then((data) => setTransactions(data))
        .catch((err) => console.error("Error fetching transactions:", err));
    }
  }, [selectedAccount]);

  // Add new account
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`${apiUrl}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAccount),
    })
      .then((res) => res.json())
      .then(() => {
        setNewAccount({ name: "", type: "", balance: 0, institution: "" });

        // Show toast notification with longer duration
        toast.success("Account added successfully!", {
          autoClose: 3000, // Display for 3 seconds
          position: "top-right",
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        setTimeout(() => {
          window.location.reload();
        }, 3000); // Reload after 3 seconds to let the toast be visible
      })
      .catch((err) => console.error("Error adding account:", err));
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((account) => {
    if (filter !== "all" && account.type !== filter) return false;
    if (searchTerm && !account.name.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    return true;
  });

  // Account type icons
  const getAccountIcon = (type: string) => {
    switch (type) {
      case "bank": return <Wallet className="h-4 w-4" />;
      case "credit": return <CreditCard className="h-4 w-4" />;
      case "investment": return <Briefcase className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
              <DialogDescription>Enter the details of your new account here.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddAccount} className="grid gap-4 py-4">
              <Label>Account Name</Label>
              <Input required value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} />
              <Label>Account Type</Label>
              <Select required onValueChange={(value) => setNewAccount({ ...newAccount, type: value })}>
                <SelectTrigger><SelectValue placeholder="Select account type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>
              <Label>Institution</Label>
              <Input required value={newAccount.institution} onChange={(e) => setNewAccount({ ...newAccount, institution: e.target.value })} />
              <Label>Initial Balance</Label>
              <Input required type="number" value={newAccount.balance} onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) })} />
              <DialogFooter>
                <Button type="submit">Add Account</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAccounts.map((account) => (
          <Card key={account.name} onClick={() => setSelectedAccount(account)} className="cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
              {getAccountIcon(account.type)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{account.balance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{account.institution}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
