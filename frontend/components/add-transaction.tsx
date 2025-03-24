"use client";

import { useRouter } from "next/navigation"; 
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const categories = [
  { label: "Food & Dining", value: "food", icon: "🍽️" },
  { label: "Transportation", value: "transport", icon: "🚗" },
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

const formSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) !== 0, {
    message: "Amount must be a non-zero number.",
  }),
  date: z.date(),
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  category: z.string().min(1, { message: "Category is required." }), // Ensure category is required
  isRecurring: z.boolean().default(false),
  type: z.enum(["expense", "income"]),
});

type FormValues = z.infer<typeof formSchema>;

export function AddTransactionPageComponent() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      date: new Date(),
      description: "",
      category: "", // Ensure default value exists
      isRecurring: false,
      type: "expense",
    },
  });

async function onSubmit(values: FormValues) {
  try {
    console.log("📡 Sending transaction request:", values);

    // Step 1: Add transaction to backend
    const response = await fetch(`${API_BASE_URL}/transactions/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      throw new Error("Failed to add transaction");
    }

    // Step 2: Update spent amount in the budget
    const updateSpentResponse = await fetch(`${API_BASE_URL}/budgets/update_spent/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: values.category,
        amount: parseFloat(values.amount),
      }),
    });

    if (!updateSpentResponse.ok) {
      const errorData = await updateSpentResponse.json();
      throw new Error("Failed to update spent amount");
    }

    // Show success message
    toast.success("Transaction added successfully!");

    // Redirect to Transactions page and refresh
    setTimeout(() => {
      router.push("/transactions"); //  Redirect to transactions page
    }, 1500); // Delay to allow toast to show

  } catch (error) {
    toast.error("Please ensure the Budge it set before adding transaction");
  }
}

  

  
  

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Add Transaction</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Amount Field */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input placeholder="Enter amount" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Transaction Type Dropdown */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">💸 Expense</SelectItem>
                    <SelectItem value="income">💰 Income</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category Dropdown - FIXED */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Picker */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of transaction</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : "Pick a date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description Field */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Enter description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Buttons */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 text-white dark:bg-blue-500">
              Save Transaction
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
