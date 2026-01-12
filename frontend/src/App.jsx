import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { Signup } from "./pages/Signup";
import { Signin } from "./pages/Signin";
import { Dashboard } from "./pages/Dashboard";
import { SendMoney } from "./pages/SendMoney";
import { AddMoney } from "./pages/AddMoney";
import { WithdrawMoney } from "./pages/WithdrawMoney";
import { TransactionHistory } from "./pages/TransactionHistory";
import { ScanPay } from "./pages/ScanPay";
import { Profile } from "./pages/Profile";
import { Beneficiaries } from "./pages/Beneficiaries";
import { ScheduledPayments } from "./pages/ScheduledPayments";
import { RequestMoney } from "./pages/RequestMoney";
import { ChangePin } from "./pages/ChangePin";
import { SplitBill } from "./pages/SplitBill";
import { setTokenGetter } from "./utils/api";

// Component to set up token getter
const AuthSetup = ({ children }) => {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  return children;
};

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/signin" replace />
      </SignedOut>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <AuthSetup>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/send" element={
            <ProtectedRoute><SendMoney /></ProtectedRoute>
          } />
          <Route path="/add-money" element={
            <ProtectedRoute><AddMoney /></ProtectedRoute>
          } />
          <Route path="/withdraw" element={
            <ProtectedRoute><WithdrawMoney /></ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute><TransactionHistory /></ProtectedRoute>
          } />
          <Route path="/scan-pay" element={
            <ProtectedRoute><ScanPay /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/beneficiaries" element={
            <ProtectedRoute><Beneficiaries /></ProtectedRoute>
          } />
          <Route path="/scheduled" element={
            <ProtectedRoute><ScheduledPayments /></ProtectedRoute>
          } />
          <Route path="/requests" element={
            <ProtectedRoute><RequestMoney /></ProtectedRoute>
          } />
          <Route path="/change-pin" element={
            <ProtectedRoute><ChangePin /></ProtectedRoute>
          } />
          <Route path="/split" element={
            <ProtectedRoute><SplitBill /></ProtectedRoute>
          } />
        </Routes>
      </AuthSetup>
    </BrowserRouter>
  );
}

export default App
