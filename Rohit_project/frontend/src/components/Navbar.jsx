import React from "react";
import logo from "../assets/smartshelfx-logo.svg";
import { NavLink, useNavigate } from "react-router-dom";
import { removeToken } from "../utils/auth";

const Navbar = ({ role }) => {
  const navigate = useNavigate();

  function signOut() {
    removeToken();
    navigate('/signin');
  }

  const nr = (role || '').toString().toLowerCase();

  // Decide which nav links to show based on role
  let links = [];
  if (nr.includes('admin')) {
    links = [
      { to: '/admindashboard', label: 'Dashboard' },
      { to: '/products', label: 'Products' },
      { to: '/purchases', label: 'Purchases' },
      { to: '/transactions', label: 'Transactions' },
      { to: '/forecast', label: 'Demand Forecast' },
      { to: '/suppliers', label: 'Suppliers' },
      { to: '/analytics', label: 'Analytics' },
    ];
  } else if (nr.includes('store') || nr.includes('manager')) {
    // Store Manager
    links = [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/products', label: 'Products' },
      { to: '/purchases', label: 'Purchases' },
      { to: '/transactions', label: 'Transactions' },
      { to: '/forecast', label: 'Forecast' },
      { to: '/suppliers', label: 'Vendors' },
      { to: '/analytics', label: 'Analytics' },
    ];
  } else if (nr.includes('user')) {
    // Regular User / Vendor
    links = [
      { to: '/userdashboard', label: 'Dashboard' },
      { to: '/cart', label: 'Cart' },
      { to: '/purchases', label: 'Purchases' },

    ];
  } else {
    // Default fallback
    links = [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/products', label: 'Products' },
      { to: '/transactions', label: 'Transactions' },
    ];
  }

  return (
    <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="flex items-center">
        <img src={logo} alt="SmartShelfX" className="h-10 object-contain" />
      </div>

      <nav className="flex space-x-6">
        {links.map(l => {
          // Use table-header-like padding and background for all nav links
          const base = 'nav-link-brand-hover nav-label font-medium transition px-4 py-2 text-left bg-gray-100 rounded-md';

          return (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `${base} ${isActive ? 'nav-active' : ''}`}
            >
              {l.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="flex items-center space-x-6">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center space-x-2 nav-label nav-link-brand-hover transition"
          aria-label="Profile"
        >
         <div className="flex items-center">
<div className="flex items-center gap-x-10">
  <button className="w-8 h-8 rounded-full brand-black-bg flex items-center justify-center text-white font-bold">
    U
  </button>

  <button
    onClick={signOut}
    className="nav-label nav-link-brand-hover transition"
    aria-label="Sign Out"
  >
    Sign Out
  </button>
</div>
</div>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
