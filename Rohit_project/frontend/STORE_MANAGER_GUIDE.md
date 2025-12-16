# 📦 Store Manager Dashboard - Complete Guide

## Overview
The Store Manager Dashboard is the central hub for warehouse managers to handle daily operations, manage inventory, and coordinate with their team.

## 🔑 Access
- **Route:** `/storemanager`
- **Role Required:** Store Manager
- **Navigation:** Automatically displayed when logged in as Store Manager

---

## ✅ Store Manager Capabilities

### 1. **Product Management**
- ➕ **Add Products** - Create new inventory items with SKU, pricing, and stock levels
- ✏️ **Edit Products** - Update product details, pricing, and reorder levels
- 🗑️ **Delete Products** - Remove discontinued items (with confirmation)
- 🔍 **Filter Products** - Search by name, SKU, category, vendor, stock status
- 📤 **CSV Import** - Bulk upload products via CSV file
- 📊 **View Low Stock** - Monitor items below reorder level

### 2. **Stock Transaction Management**
- 📦 **Stock-In** - Record incoming inventory with product SKU, quantity, handler, notes
- 📤 **Stock-Out** - Record outgoing inventory (sales, damages, returns)
- 📝 **Transaction History** - View all stock movements with timestamps
- 👤 **Handler Tracking** - Track which team member handled each transaction

### 3. **Purchase Order Management**
- ➕ **Create Manual PO** - Generate purchase orders for vendors
- 🤖 **AI-Generated POs** - View AI-suggested purchase orders
- ⏳ **Request Admin Approval** - Submit POs for admin authorization
- 👁️ **View PO Status** - Track pending, approved, rejected, completed orders
- 📋 **PO Details** - Product, quantity, vendor, amount, submission time

### 4. **Inventory Dashboard**
- 📊 **Real-time Stats:**
  - Total Products in warehouse
  - Low Stock Items (critical alerts)
  - Pending Orders awaiting approval
  - Today's Transactions count
  - Warehouse Value (total inventory worth)
  - Team Members count
- 🕒 **Recent Activity Feed** - Live updates of team actions
- ⚠️ **Low Stock Alerts** - Critical items needing immediate attention
- ⏳ **Pending Approvals** - POs waiting for admin review

### 5. **Vendor Management**
- 🏭 **View Vendors** - Access supplier contact information
- 📞 **Vendor Details** - Name, contact, email for all suppliers
- 🔗 **Link to POs** - Quick PO creation from vendor list

### 6. **AI Demand Forecasting**
-- 📈 **View Predictions** - AI-generated demand forecasts (8-week outlook)
-- 🎯 **Risk Analysis** - High/Medium/Low risk indicators
-- 📊 **Trend Charts** - Visual representation of forecasted demand
-- 🤖 **AI Suggestions** - Recommended purchase quantities

### 7. **Analytics & Reports**
- 📊 **Dashboard Charts:**
  - Inventory Trend (line chart)
  - Purchase vs Sales (bar chart)
  - Category Distribution (pie chart)
  - Top Purchased Products (horizontal bar)
  - Purchase vs Demand Comparison (line chart)
- 📤 **Export Reports** - Excel/PDF export functionality
- 📅 **Time Filters** - Daily, Weekly, Monthly, Yearly views
- 💰 **Financial Insights** - Inventory value tracking

### 8. **Team Coordination**
- 👥 **View Team Members** - See all users assigned to warehouse
- 🕒 **Activity Tracking** - Monitor recent actions by team
- 📝 **Handler Assignment** - Track who performed each transaction

---

## ❌ Store Manager Restrictions

### 1. **User Management**
- ❌ Cannot create new user accounts
- ❌ Cannot edit user profiles or permissions
- ❌ Cannot delete users
- ❌ Cannot assign users to warehouses
- **Reason:** User management is Admin-only to maintain security and organizational structure

### 2. **Purchase Order Approval**
- ❌ Cannot approve own purchase orders
- ❌ Cannot reject purchase orders
- ✅ Can only **request** admin approval
- **Reason:** Separation of duties - prevents unauthorized spending

### 3. **System Configuration**
- ❌ Cannot change system settings
- ❌ Cannot modify AI algorithm selection
- ❌ Cannot configure email/alert preferences
- ❌ Cannot adjust forecast periods
- **Reason:** System-wide settings require admin privileges

### 4. **Multi-Warehouse Access**
- ❌ Cannot view other warehouses' inventory
- ❌ Cannot access other store managers' data
- ❌ Cannot transfer stock between warehouses (without admin)
- **Reason:** Data isolation for warehouse-specific operations

---

## 🎯 Typical Daily Workflow

### Morning Routine:
1. **Check Dashboard** - Review overnight stats and alerts
2. **Low Stock Review** - Identify items needing replenishment
3. **Create POs** - Generate purchase orders for critical items
4. **Submit for Approval** - Request admin authorization for POs

### During Operations:
5. **Record Transactions** - Log all stock-in/stock-out activities
6. **Monitor Alerts** - Watch for new low-stock warnings
7. **Team Coordination** - Track team member activities
8. **Vendor Communication** - Contact suppliers as needed

### End of Day:
9. **Review Activity** - Check transaction summary
10. **Export Reports** - Generate daily reports for records
11. **Plan Next Day** - Review AI forecasts for upcoming needs

---

## 📊 Dashboard Statistics Explained

| Stat | Description | Action Needed |
|------|-------------|---------------|
| **Total Products** | All items in warehouse inventory | Monitor growth |
| **Low Stock Items** | Products below reorder level | **URGENT** - Create POs |
| **Pending Orders** | POs awaiting admin approval | Follow up with admin |
| **Today's Transactions** | Stock-in/out movements today | Review for accuracy |
| **Warehouse Value** | Total inventory worth ($) | Financial tracking |
| **Team Members** | Users assigned to warehouse | Coordinate tasks |

---

## 🚨 Alert Priority Levels

### 🔴 Critical (Immediate Action)
- **Low Stock Alert** - Current stock < 30% of reorder level
- **Action:** Create purchase order immediately

### 🟡 Warning (Action Soon)
- **Low Stock Warning** - Current stock < 70% of reorder level
- **Action:** Plan purchase order within 48 hours

### 🟢 Normal
- **Stock Adequate** - Current stock > reorder level
- **Action:** Regular monitoring

---

## 🔗 Quick Navigation

| Page | Purpose | Access |
|------|---------|--------|
| `/storemanager` | Main dashboard | Home button |
| `/products` | Inventory catalog | Add/Edit/Delete products |
| `/transactions` | Stock movements | Record stock-in/out |
| `/purchase-orders` | Purchase orders | Create/View POs |
| `/suppliers` | Vendor list | View warehouse & team |
| `/forecast` | AI predictions | View demand forecasts |
| `/analytics` | Reports & charts | Export data |
| `/profile` | Personal settings | Update profile |

---

## 💡 Best Practices

### 1. **Daily Stock Checks**
- Review low stock alerts every morning
- Create POs proactively (before critical levels)
- Monitor AI forecasts weekly

### 2. **Accurate Transaction Recording**
- Log ALL stock movements immediately
- Include handler name and notes
- Double-check quantities

### 3. **Purchase Order Management**
- Request approval early (allow 24-48hrs)
- Include clear notes for admin review
- Follow up on pending approvals

### 4. **Team Coordination**
- Assign clear responsibilities
- Review team activity daily
- Communicate critical alerts

### 5. **Report Generation**
- Export weekly summaries
- Share insights with admin
- Track trends over time

---

## 🆘 Common Issues & Solutions

### Issue: Cannot Approve Own PO
**Solution:** This is by design. Request admin approval via the system. Contact admin directly if urgent.

### Issue: Cannot See Other Warehouses
**Solution:** Store Managers are restricted to their assigned warehouse. Contact admin for cross-warehouse queries.

### Issue: Low Stock Alert Not Clearing
**Solution:** Ensure reorder level is set correctly in product settings. Record stock-in transaction when inventory arrives.

### Issue: Cannot Add Users
**Solution:** User creation is admin-only. Contact admin to add new team members to your warehouse.

---

## 📞 Support & Escalation

### For Technical Issues:
- Check error notifications in top-right
- Review recent activity for conflicts
- Contact IT support

### For Business Decisions:
- **User Management** → Contact Admin
- **PO Approvals** → Contact Admin  
- **System Settings** → Contact Admin
- **Cross-Warehouse** → Contact Admin

---

## 🎓 Training Checklist

- [ ] Complete dashboard tour
- [ ] Practice adding a product
- [ ] Record test stock-in transaction
- [ ] Create sample purchase order
- [ ] Review AI forecast page
- [ ] Export a test report
- [ ] View team member list
- [ ] Understand alert priorities
- [ ] Know restriction boundaries
- [ ] Complete first week operations

---

## 📝 Quick Reference Card

```
STORE MANAGER QUICK ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CAN DO:
  • Add/Edit/Delete Products
  • Record Stock-In/Out
  • Create Purchase Orders
  • View AI Forecasts
  • Export Reports
  • View Vendor List
  • Monitor Team Activity

❌ CANNOT DO:
  • Create Users
  • Approve POs
  • Change Settings
  • Access Other Warehouses

🚨 URGENT ACTIONS:
  1. Check Low Stock Alerts
  2. Create POs for Critical Items
  3. Request Admin Approval
  4. Record All Transactions

📞 NEED HELP?
  → Admin Dashboard → Contact Admin
```

---

## 🔄 Version History
- **v1.0** - Initial Store Manager Dashboard release
- Includes: Product CRUD, Transactions, PO management, AI Forecasting, Analytics
- Role-based restrictions enforced
- Multi-warehouse support enabled
