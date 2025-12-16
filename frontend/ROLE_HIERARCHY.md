# 👥 SmartShelfX Role Hierarchy & Permissions

## 🏢 Complete Role Structure

```
ADMIN (Top Level)
    ↓
STORE MANAGER (Warehouse Manager)
    ↓
USER (Regular Staff)
```

---

## 🔴 ADMIN - System Administrator

### Primary Route
- **Dashboard:** `/admindashboard`

### Full Capabilities
✅ **All Store Manager Permissions PLUS:**
- Create/Edit/Delete Users
- Create/Edit/Delete Store Managers
- Assign users to warehouses
- Assign Store Managers to warehouses
- Approve Purchase Orders
- Reject Purchase Orders
- Change system configuration
- Configure AI settings (algorithm, forecast period)
- Enable/disable email alerts
- Enable/disable system notifications
- Access ALL warehouses (cross-warehouse view)
- View system-wide analytics
- Export global reports
- Manage vendor/supplier accounts

### Exclusive Features
1. **User Management Tab**
   - Full CRUD on users and store managers
   - Role assignment
   - Warehouse assignment
   - Account activation/deactivation

2. **Purchase Order Approval**
   - Approve/Reject buttons (visible only to admins)
   - Rejection reason tracking
   - Approval history

3. **System Settings Tab**
   - Email alert toggles
   - System notification toggles
   - AI algorithm selection (5 options)
   - Forecast period configuration (1-12 weeks)

4. **Multi-Warehouse Overview**
   - View all warehouses
   - See all store managers
   - Access any warehouse data

### Navigation Links
Navigation Links
- Dashboard
- Products (all warehouses)
- Transactions (all warehouses)
- Demand Forecast (system-wide)
- Purchase Orders (approve/reject)
- Warehouses (all locations)
- Analytics (global)

---

## 🟡 STORE MANAGER - Warehouse Manager

### Primary Route
- **Dashboard:** `/storemanager`

| Top Purchased | ✅ All | ✅ Warehouse | ❌ |
✅ **Can Do:**
- Add/Edit/Delete Products (in assigned warehouse)
- Update Stock-In/Out transactions
- View Inventory Dashboard
- View low-stock alerts
- Generate Purchase Orders
- Request Admin approval for POs
- View vendor/supplier list
- Export warehouse reports
- View AI demand forecasts
- View warehouse analytics
- Monitor team member activity
- View users in assigned warehouse

❌ **Cannot Do:**
- Create/Edit/Delete Users ❌
- Approve Purchase Orders ❌
- Change system configuration ❌
- Access other warehouses ❌
- Assign users to warehouses ❌
- Configure AI settings ❌

### Key Features
1. **Product Management**
   - CRUD operations on inventory
   - CSV bulk import
   - Filtering and search
   - Low stock monitoring

2. **Stock Transactions**
   - Record stock-in (receiving)
   - Record stock-out (shipping/sales)
   - Transaction history
   - Handler tracking

3. **Purchase Orders**
   - Create manual POs
   - View AI-suggested POs
   - Submit for admin approval
   - Track PO status

4. **Warehouse Dashboard**
   - 6 stat cards (products, alerts, orders, transactions, value, team)
   - Recent activity feed
   - Low stock alerts
   - Pending approval tracker

5. **Team View**
   - See warehouse users
   - Monitor activity
   - Track handlers

### Navigation Links
- Dashboard
- Products (warehouse only)
- Transactions (warehouse only)
- Forecast (warehouse predictions)
- Purchase Orders (create/view)
- Vendors (supplier list)
- Analytics (warehouse reports)

---

## 🟢 USER - Regular Staff

### Primary Route
- **Dashboard:** `/userdashboard`

### Full Capabilities
✅ **Can Do:**
- View Products (read-only)
- Record Stock-In/Out transactions
- View own transaction history
- View low-stock alerts
- View pending orders (read-only)
- View own profile
- Browse inventory catalog

❌ **Cannot Do:**
- Add/Edit/Delete Products ❌
- Create Purchase Orders ❌
- Approve Purchase Orders ❌
- Access analytics ❌
- View AI forecasts ❌
- Export reports ❌
- Manage vendors ❌
- View system settings ❌
- Create users ❌
- Access admin features ❌

### Key Features
1. **Product Viewing**
   - Browse inventory catalog
   - Search and filter products
   - View stock levels
   - See product details

2. **Transaction Recording**
   - Log stock-in movements
   - Log stock-out movements
   - Add transaction notes
   - View personal history

3. **Dashboard Overview**
   - 4 stat cards (products, alerts, orders, forecasts)
   - Quick action buttons
   - Recent alerts feed
   - Personal notifications

### Navigation Links (Limited)
- Dashboard (user home)
- Products (view only)
- Transactions (record movements)
- Orders (view only)

---

## 📊 Permission Comparison Matrix

| Feature | Admin | Store Manager | User |
|---------|-------|---------------|------|
| **User Management** | ✅ | ❌ | ❌ |
| **Add Products** | ✅ | ✅ | ❌ |
| **Edit Products** | ✅ | ✅ | ❌ |
| **Delete Products** | ✅ | ✅ | ❌ |
| **View Products** | ✅ | ✅ | ✅ |
| **Record Stock-In** | ✅ | ✅ | ✅ |
| **Record Stock-Out** | ✅ | ✅ | ✅ |
| **Create Purchase Orders** | ✅ | ✅ | ❌ |
| **Approve Purchase Orders** | ✅ | ❌ | ❌ |
| **View AI Forecasts** | ✅ | ✅ | ❌ |
| **Export Reports** | ✅ | ✅ | ❌ |
| **View Analytics** | ✅ | ✅ | ❌ |
| **Manage Vendors** | ✅ | ✅ (view) | ❌ |
| **System Settings** | ✅ | ❌ | ❌ |
| **Cross-Warehouse Access** | ✅ | ❌ | ❌ |
| **Assign Store Managers** | ✅ | ❌ | ❌ |
| **Configure AI** | ✅ | ❌ | ❌ |

---

## 🔐 Authentication & Authorization

### Login Flow
1. User enters credentials at `/signin`
2. Backend validates and returns JWT token
3. Token includes: `userId`, `role`, `warehouse` (if applicable)
4. Frontend stores token in `localStorage`
5. `getProfile()` decodes token for role-based routing

### Role Detection
```javascript
// utils/roles.js
export const isAdmin = (role) => role?.toLowerCase().includes('admin');
export const isStoreManager = (role) => role?.toLowerCase().includes('store') || role?.toLowerCase().includes('manager');
export const isUser = (role) => role?.toLowerCase().includes('user');
```

### Dashboard Routing
```javascript
// After login, redirect based on role:
if (isAdmin(role)) {
  navigate('/admindashboard');
} else if (isStoreManager(role)) {
  navigate('/storemanager');
} else {
  navigate('/userdashboard');
}
```

---

## 🏭 Multi-Warehouse Architecture

### Warehouse Assignment
```javascript
// User/Store Manager profile includes:
{
  userId: 123,
  fullName: "John Smith",
  email: "john@company.com",
  role: "Store Manager",
  warehouseId: 1,
  warehouse: "North Warehouse"
}
```

### Data Isolation
- **Store Managers** see only their `warehouseId` data
- **Admins** see all warehouses (no filter)
- **Users** see only their assigned warehouse

### Warehouse Structure
```javascript
{
  id: 1,
  name: "North Warehouse",
  location: "New York, NY",
  storeManager: { /* manager details */ },
  users: [ /* array of users */ ],
  stats: {
    totalProducts: 450,
    lowStock: 12,
    pendingOrders: 5
  }
}
```

---

## 🚀 Quick Setup Guide

### For Admins
1. Login → `/admindashboard`
2. Create warehouses (if needed)
3. Create Store Manager accounts
4. Assign Store Managers to warehouses
5. Create User accounts
6. Assign Users to warehouses
7. Configure system settings
8. Set AI algorithm preferences

### For Store Managers
1. Login → `/storemanager`
2. Review dashboard stats
3. Add initial products (or CSV import)
4. Set reorder levels for all products
5. Train team on transaction recording
6. Create first purchase orders
7. Request admin approval

### For Users
1. Login → `/userdashboard`
2. Browse product catalog
3. Learn transaction recording
4. Follow daily workflow
5. Report issues to Store Manager

---

## 📱 Mobile Responsiveness

All dashboards are fully responsive:
- **Desktop:** Full grid layouts with sidebars
- **Tablet:** Condensed 2-column grids
- **Mobile:** Stacked single-column layout

---

## 🔔 Notification System

### Event-Driven Notifications
```javascript
// Trigger notification
window.dispatchEvent(new CustomEvent('notify', { 
  detail: { 
    type: 'success', // success, error, warning, info
    message: 'Product added successfully' 
  } 
}));
```

### Notification Types
- **Success** (Green): Operation completed
- **Error** (Red): Operation failed
- **Warning** (Yellow): Caution needed
- **Info** (Blue): General information

---

## 📈 Analytics Access Levels

| Report Type | Admin | Store Manager | User |
|-------------|-------|---------------|------|
| Inventory Trend | ✅ All | ✅ Warehouse | ❌ |
| Purchase vs Sales | ✅ All | ✅ Warehouse | ❌ |
| Category Distribution | ✅ All | ✅ Warehouse | ❌ |
| Top Restocked | ✅ All | ✅ Warehouse | ❌ |
| Demand Forecast | ✅ All | ✅ Warehouse | ❌ |
| User Activity | ✅ All | ✅ Own Team | ❌ |
| Financial Reports | ✅ All | ✅ Warehouse | ❌ |

---

## 🛡️ Security Best Practices

### Role-Based UI Rendering
- Always check `role` before showing sensitive components
- Use `isAdmin()`, `isStoreManager()` utility functions
- Hide action buttons for unauthorized roles

### API Authorization
- Backend must validate JWT token on every request
- Check role permissions server-side
- Never trust client-side role checks alone

### Data Filtering
- Store Managers: Filter by `warehouseId`
- Users: Filter by `warehouseId` AND limited features
- Admins: No filtering (full access)

---

## 📞 Support Escalation Path

```
USER Issue
    ↓
Contact Store Manager
    ↓
Store Manager Issue
    ↓
Contact Admin
    ↓
Admin Issue
    ↓
Contact IT Support / System Administrator
```

---

## 🎯 Key Takeaways

1. **Admins** = Full system control
2. **Store Managers** = Warehouse operations
3. **Users** = Daily transaction recording

4. **Separation of Duties:**
   - Users record → Store Managers manage → Admins approve

5. **Data Isolation:**
   - Each warehouse operates independently
   - Only admins have cross-warehouse visibility

6. **Approval Workflow:**
   - Store Managers create POs → Admins approve/reject

---

## 📚 Related Documentation
- [STORE_MANAGER_GUIDE.md](./STORE_MANAGER_GUIDE.md) - Complete Store Manager manual
- [RESTRUCTURE_SUMMARY.md](./RESTRUCTURE_SUMMARY.md) - System architecture
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Developer quick reference
- [DEVELOPER_NOTES.md](./DEVELOPER_NOTES.md) - Backend integration guide
