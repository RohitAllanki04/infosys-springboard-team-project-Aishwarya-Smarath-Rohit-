import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import AuthLayout from "./components/AuthLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import TransactionOrderList from "./pages/TransactionOrderList";
import TransactionOrderForm from "./pages/TransactionOrderForm";
import Suppliers from "./pages/Suppliers";
import Profile from "./pages/Profile";
import Admindashboard from "./pages/Admindashboard";
import Userdashboard from "./pages/UserDashboardClean";
import DemandForecast from "./pages/DemandForecast";
import Analytics from "./pages/Analytics";
import Cart from "./pages/Cart";
import Purchases from "./pages/Purchases";
import PurchaseOrderForm from "./pages/PurchaseOrderForm";
import RealtimeDemo from "./pages/RealtimeDemo";
import Notification from "./components/Notification";
import ConfirmDialog from "./components/ConfirmDialog";

function App() {
  return (
    <Router>
      <Notification />
      <ConfirmDialog />
      <Routes>
        {/* Public routes - Redirect root to signin */}
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes - require authentication */}
        <Route element={<AuthLayout />}>
          {/* Manager/Admin Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admindashboard" element={<Admindashboard />} />
          
          {/* User Dashboard */}
          <Route path="/userdashboard" element={<Userdashboard />} />
          
          {/* Inventory Management */}
          <Route path="/products" element={<Products />} />
          
          {/* Stock Transactions (moved into other pages) */}
          
          {/* AI Demand Forecasting */}
          <Route path="/forecast" element={<DemandForecast />} />
          
          {/* Transaction Orders (stock transactions) */}
          <Route path="/transactions" element={<TransactionOrderList />} />
          <Route path="/transactions/create" element={<TransactionOrderForm />} />
          <Route path="/transactions/edit/:id" element={<TransactionOrderForm />} />
          
          {/* Vendor/Supplier Management */}
          <Route path="/suppliers" element={<Suppliers />} />
          
          {/* Analytics & Reports */}
          <Route path="/analytics" element={<Analytics />} />
          {/* Cart */}
          <Route path="/cart" element={<Cart />} />
          {/* Purchases / Purchase Orders */}
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/purchases/new" element={<PurchaseOrderForm />} />
          <Route path="/purchases/edit/:id" element={<PurchaseOrderForm />} />
          <Route path="/realtime-demo" element={<RealtimeDemo />} />
          
          {/* User Profile */}
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
