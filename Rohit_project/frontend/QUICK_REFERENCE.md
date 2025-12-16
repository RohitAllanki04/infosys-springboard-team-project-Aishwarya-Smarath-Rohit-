# SmartShelfX - Quick Reference Guide

## 🚀 Application Running

**Development Server:** http://localhost:5174/

---

## 📋 Available Routes

### Public Routes (No Authentication Required)
- `/` → Redirects to `/signin`
- `/signin` → User login page
- `/signup` → User registration page

### Protected Routes (Authentication Required)

#### Admin Routes
- `/admindashboard` → Admin overview dashboard
- `/products` → Product catalog management
- `/transactions` → Stock-in/out transactions
- `/forecast` → AI demand forecasting
  - `/purchase-orders` → Purchase order management
- `/suppliers` → Vendor/supplier management
- `/analytics` → Reports and analytics
- `/profile` → User profile

#### Store Manager Routes
- `/dashboard` → Manager dashboard
- `/products` → Product management
- `/transactions` → Stock transactions
- `/forecast` → Demand predictions
- `/purchase-orders` → Purchase management
- `/suppliers` → Supplier management
- `/analytics` → Analytics dashboard
- `/profile` → Profile settings

#### User Routes
- `/userdashboard` → User home dashboard
- `/products` → Browse products
- `/transactions` → View transactions
- `/purchase-orders` → View orders
- `/profile` → Profile page

---

## 🎯 Key Features by Module

### 1. Inventory Management (`/products`)
- Add/Edit/Delete products
- Product details: SKU, category, vendor, stock levels
- Search and filter functionality
- Batch operations

### 2. Stock Transactions (`/transactions`)
- **Stock-In:** Record incoming shipments
- **Stock-Out:** Record outgoing dispatches
- Track handler, timestamp, quantity
- Transaction history table
- Real-time inventory updates

### 3. AI Demand Forecast (`/forecast`)
- View AI-generated predictions
- Forecast trend charts (Chart.js)
- Risk level indicators
- Product-wise analysis
- Stockout warnings
- Actionable recommendations

### 4. Restock Management (`/restock-orders`)
- Auto-generated purchase orders
- AI-based restock suggestions
- Vendor approval tracking
- Order status management

### 5. Supplier Management (`/suppliers`)
- Vendor contact information
- Product assignments
- Performance tracking
- Communication logs

### 6. Analytics Dashboard (`/analytics`)
- **Charts:**
  - Inventory Level Trend (Line)
  - Purchase vs Sales (Bar)
  - Category Distribution (Pie)
  - Top Purchased Items (Bar)
  - Purchase vs Demand (Line)
- **Export Options:**
  - Excel format
  - PDF format
- **Time Filters:**
  - Daily, Weekly, Monthly, Yearly

---

## 🎨 Component Structure

### Reusable Components
```
components/
  ├── SignIn.jsx                 → Login form
  ├── SignUp.jsx                 → Registration form
  ├── Navbar.jsx                 → Top navigation (role-based)
  ├── AuthLayout.jsx             → Protected route wrapper
  ├── Notification.jsx           → Toast notifications
  ├── ConfirmDialog.jsx          → Confirmation dialogs
  ├── DashboardCard.jsx          → Stat cards
  ├── ProductForm.jsx            → Add/edit product form
  ├── ProductTable.jsx           → Product listing table
  ├── RestockOrdersTable.jsx     → Purchase orders table
  ├── SupplierTable.jsx          → Supplier listing
  └── TransactionsTable.jsx      → Transaction history
```

### Page Components
```
pages/
  ├── Dashboard.jsx              → Store Manager dashboard
  ├── Admindashboard.jsx         → Admin dashboard
  ├── UserDashboard.jsx          → User dashboard
  ├── Products.jsx               → Product catalog
  ├── Transactions.jsx           → Stock transactions
  ├── DemandForecast.jsx         → AI forecasting (NEW)
  ├── Analytics.jsx              → Analytics & reports (NEW)
  ├── RestockOrders.jsx          → Purchase orders
  ├── Suppliers.jsx              → Supplier management
  └── Profile.jsx                → User profile
```

---

## 🔧 Utilities

### Authentication (`utils/auth.js`)
```javascript
saveToken(token)              // Save JWT token
getToken()                    // Retrieve JWT token
removeToken()                 // Clear token (logout)
getProfileFromToken(token)    // Decode JWT
getProfile()                  // Get user profile
saveProfile(profile)          // Save profile data
```

### API Calls (`utils/api.js`)
```javascript
// Products
getProducts()
createProduct(data)
updateProduct(id, data)
deleteProduct(id)

// Transactions
getTransactions()
createTransaction(data)

// Restock Orders
getRestockOrders()
createRestockOrder(data)

// Suppliers
getSuppliers()
createSupplier(data)

// User
getUserById(id)
```

---

## 🎭 Role-Based Access

### Admin
- Full access to all modules
- User management
- System configuration
- Analytics and reports
- Supplier management

### Store Manager
- Inventory management
- Stock transactions
- Demand forecasting
- Restock orders
- Analytics

### User
- View products
- Record transactions
- View orders
- Limited dashboard

---

## 🎨 Design System

### Colors
- **Primary:** Blue (#3B82F6)
- **Success:** Green (#22C55E)
- **Warning:** Yellow (#EAB308)
- **Danger:** Red (#EF4444)
- **Gray:** Various shades for UI elements

### Typography
- **Headings:** Bold, larger sizes
- **Body:** Regular weight
- **Labels:** Medium weight, uppercase for table headers

### Components
- **Cards:** White background, shadow, rounded corners
- **Buttons:** Rounded, colored backgrounds, hover effects
- **Forms:** Border, rounded, focus rings
- **Tables:** Striped rows, hover effects

---

## 📊 Charts (Chart.js)

### Available Chart Types
1. **Line Chart** - Trends over time
2. **Bar Chart** - Comparisons
3. **Pie Chart** - Distribution
4. **Horizontal Bar** - Rankings

### Chart Options
```javascript
{
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    title: { display: true, text: '...' }
  }
}
```

---

## 🔔 Notifications

### Usage
```javascript
window.dispatchEvent(new CustomEvent('notify', { 
  detail: { 
    type: 'success',  // 'success' | 'error' | 'info' | 'warning'
    message: 'Operation completed' 
  } 
}));
```

---

## 🧪 Testing Guide

### Manual Testing Steps

1. **Authentication Flow**
   - Visit http://localhost:5174/
   - Should redirect to /signin
   - Test login with credentials
   - Verify role-based redirect

2. **Navigation**
   - Check navbar links based on role
   - Verify all routes are accessible
   - Test sign out functionality

3. **Product Management**
   - Add new product
   - Edit existing product
   - Delete product
   - Search/filter products

4. **Transactions**
   - Record Stock-In
   - Record Stock-Out
   - Verify form validation
   - Check transaction history

5. **Demand Forecast**
   - View forecast table
   - Click "View Chart" on items
   - Verify chart rendering
   - Check risk indicators

6. **Analytics**
   - Test time filter (Daily/Weekly/Monthly)
   - Verify all charts render
   - Test export buttons
   - Check summary cards

7. **Responsive Design**
   - Test on mobile viewport
   - Verify grid layouts adjust
   - Check navigation on small screens

---

## 🐛 Common Issues & Solutions

### Issue: Charts not rendering
**Solution:** Ensure `chart.js` and `react-chartjs-2` are installed
```bash
npm install chart.js react-chartjs-2
```

### Issue: Routes not working
**Solution:** Check React Router configuration in App.jsx

### Issue: Authentication redirect fails
**Solution:** Verify token storage in localStorage and auth.js

### Issue: API calls failing
**Solution:** Check backend server is running and CORS is configured

---

## 📦 Dependencies

### Core
- `react` - UI framework
- `react-dom` - React DOM
- `react-router-dom` - Routing

### UI & Styling
- `tailwindcss` - Utility CSS
- `framer-motion` - Animations
- `lottie-react` - Lottie animations

### Data Visualization
- `chart.js` - Chart library
- `react-chartjs-2` - React wrapper for Chart.js

---

## 🚀 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install

# Add new dependency
npm install <package-name>
```

---

## 📝 Code Style Guide

### Component Structure
```jsx
import React, { useState, useEffect } from 'react';

const ComponentName = () => {
  // State
  const [data, setData] = useState([]);
  
  // Effects
  useEffect(() => {
    // Fetch data
  }, []);
  
  // Handlers
  const handleAction = () => {
    // Logic
  };
  
  // Render
  return (
    <div className="p-6">
      {/* Content */}
    </div>
  );
};

export default ComponentName;
```

### Tailwind Classes
- Use utility classes
- Group by category (layout, spacing, colors)
- Use responsive prefixes (md:, lg:)
- Prefer component classes for reusability

---

## 🎯 Best Practices

1. **State Management**
   - Use useState for local state
   - localStorage for persistent data
   - Props for component communication

2. **API Calls**
   - Centralize in utils/api.js
   - Handle errors with try-catch
   - Show loading states

3. **Styling**
   - Use Tailwind utilities
   - Maintain consistent spacing
   - Follow color scheme

4. **Components**
   - Keep components small and focused
   - Extract reusable logic
   - Use meaningful names

---

## 📞 Support & Resources

- **Project Documentation:** See RESTRUCTURE_SUMMARY.md
- **Component Examples:** Check existing components
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Chart.js:** https://www.chartjs.org/docs
- **React Router:** https://reactrouter.com/

---

**Last Updated:** November 13, 2025
**Version:** 2.0
