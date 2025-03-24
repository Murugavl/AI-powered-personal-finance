"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { AlertTriangle, Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "react-toastify"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFA07A']

export function BudgetingPageComponent() {
  const [budgets, setBudgets] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [newBudget, setNewBudget] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false) // Track dialog state

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/budgets/`)
        const data = await response.json()
        setBudgets(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching budgets:", error)
      }
    }

    const fetchTransactions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/transactions/`)
        const data = await response.json()
        setTransactions(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching transactions:", error)
      }
    }

    fetchBudgets()
    fetchTransactions()
  }, [])

  const totalBudget = budgets.reduce((sum, item) => sum + item.budget, 0)
  const totalSpent = budgets.reduce((sum, budget) => {
    const spent = transactions
      .filter(tx => tx.category.toLowerCase() === budget.category.toLowerCase())
      .reduce((total, tx) => total + tx.amount, 0)
    return sum + spent
  }, 0)

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
  }

  const addNewBudget = async () => {
    if (!newCategory || !newBudget) {
      setError("Category and Budget Amount are required!")
      return
    }
    setError(null)

    const formattedCategory = formatCategory(newCategory)

    try {
      const response = await fetch(`${API_BASE_URL}/budgets/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: formattedCategory, budget: parseFloat(newBudget) }),
      })
      if (!response.ok) throw new Error("Failed to add budget")

      const updatedBudgets = await fetch(`${API_BASE_URL}/budgets/`).then(res => res.json())
      setBudgets(updatedBudgets)

      setNewCategory("")
      setNewBudget("")
      setIsDialogOpen(false) // Close dialog after successful addition
      toast.success("Budget added successfully!")
    } catch (error) {
      console.error("Error adding budget:", error)
      setError("An error occurred while adding the budget.")
    }
  }

  const deleteBudget = async (category: string) => {
    try {
      await fetch(`${API_BASE_URL}/budgets/${category}`, { method: "DELETE" })
      setBudgets(budgets.filter(budget => budget.category !== category))
      toast.success("Budget deleted successfully!")
    } catch (error) {
      console.error("Error deleting budget:", error)
      toast.error("Failed to delete budget")
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Budgeting</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Budget Overview</CardTitle>
            <CardDescription>Your budget usage across all categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Budget:</span>
                <span className="font-bold">₹{totalBudget.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Spent:</span>
                <span className="font-bold">₹{totalSpent.toFixed(2)}</span>
              </div>
              <Progress value={(totalSpent / totalBudget) * 100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Distribution</CardTitle>
            <CardDescription>Visual breakdown of your budget allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={budgets}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="budget"
                    nameKey="category"
                  >
                    {budgets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">Category Budgets</h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((item, index) => {
          const spent = transactions
            .filter(tx => tx.category.toUpperCase() === item.category.toUpperCase())
            .reduce((sum, tx) => sum + tx.amount, 0)

          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{formatCategory(item.category)}</CardTitle>
                <CardDescription>
                  Budget: ₹{item.budget.toFixed(2)} | Spent: ₹{spent.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={(spent / item.budget) * 100} />
              </CardContent>
              <CardFooter>
                {spent / item.budget > 0.9 && (
                  <div className="flex items-center text-yellow-500">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span>Nearing budget limit</span>
                  </div>
                )}
              </CardFooter>
            </Card>
          )
        })}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Card className="flex items-center justify-center cursor-pointer hover:bg-muted/50">
              <CardContent>
                <Plus className="h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Add New Budget</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Budget</DialogTitle>
              <DialogDescription>Set a new budget for a category.</DialogDescription>
            </DialogHeader>
            <Label>Category</Label>
            <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <Label>Budget Amount</Label>
            <Input value={newBudget} onChange={(e) => setNewBudget(e.target.value)} />
            <DialogFooter>
              <Button onClick={addNewBudget}>Add Budget</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
