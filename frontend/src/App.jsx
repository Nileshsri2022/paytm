import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { Signup } from "./pages/Signup";
import { Signin } from "./pages/Signin";
import { Dashboard } from "./pages/Dashboard";
import { SendMoney } from "./pages/SendMoney";
import { AddMoney } from "./pages/AddMoney";
import { WithdrawMoney } from "./pages/WithdrawMoney";
import { TransactionHistory } from "./pages/TransactionHistory";
import { ScanPay } from "./pages/ScanPay";
import { Profile } from "./pages/Profile";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/send" element={<SendMoney />} />
          <Route path="/add-money" element={<AddMoney />} />
          <Route path="/withdraw" element={<WithdrawMoney />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/scan-pay" element={<ScanPay />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
