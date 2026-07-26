import { Routes, Route } from "react-router-dom";
import { ClientLayout } from "@/components/ClientLayout";
import { Dashboard } from "@/components/dashboard";
import AccountsPageComponent from "@/components/accounts";
import { TransactionHistoryPageComponent } from "@/components/transaction-history-page";
import { AddTransactionPageComponent } from "@/components/add-transaction";
import { BudgetingPageComponent } from "@/components/budgeting-page";
import { ReportsInsightsPageComponent } from "@/components/reports-insights-page";
import { Export } from "@/components/export";
import { HelpFaqPage } from "@/components/help-faq-page";
import { ProfileSettings } from "@/components/ProfileSettings";
import GoalsPageComponent from "@/components/goals-page";
import { LoginPage, RegisterPage } from "@/components/AuthPages";

export default function App() {
  return (
    <ClientLayout>
      <Routes>
        <Route path="/"                element={<Dashboard />} />
        <Route path="/accounts"        element={<AccountsPageComponent />} />
        <Route path="/transactions"    element={<TransactionHistoryPageComponent />} />
        <Route path="/add-transaction" element={<AddTransactionPageComponent />} />
        <Route path="/budgeting"       element={<BudgetingPageComponent />} />
        <Route path="/goals"           element={<GoalsPageComponent />} />
        <Route path="/reports"         element={<ReportsInsightsPageComponent />} />
        <Route path="/export"          element={<Export />} />
        <Route path="/help"            element={<HelpFaqPage />} />
        <Route path="/profile"         element={<ProfileSettings />} />
        <Route path="/auth/login"      element={<LoginPage />} />
        <Route path="/auth/register"   element={<RegisterPage />} />
        <Route path="/auth/sign-up"    element={<RegisterPage />} />
      </Routes>
    </ClientLayout>
  );
}
