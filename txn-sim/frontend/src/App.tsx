import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./state/authContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TransactionsPage, TransactionDetailPage } from "./pages/TransactionsPage";
import { VerifyTransactionPage } from "./pages/VerifyTransactionPage";
import { ProtocolsPage, ProtocolDetailPage } from "./pages/ProtocolsPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { SettingsPage } from "./pages/SettingsPage";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/transactions/:id" element={<TransactionDetailPage />} />
            <Route path="/verify" element={<VerifyTransactionPage />} />
            <Route path="/protocolsverification" element={<VerifyTransactionPage />} />
            <Route path="/protocols" element={<ProtocolsPage />} />
            <Route path="/protocols/:code" element={<ProtocolDetailPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
