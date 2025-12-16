# 🎯 SmartShelfX - AI-Based Inventory Forecast & Auto-Restock

## 🚀 Frontend Application

**Status:** ✅ Production Ready  
**Version:** 2.0  
**Last Updated:** November 13, 2025

---

## ✨ Overview

SmartShelfX is a next-generation inventory management platform with AI-powered demand forecasting. The frontend is built with React, Vite, and Tailwind CSS, providing a modern, responsive interface for inventory optimization.

---

## 🎯 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# Opens at http://localhost:5174/

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📋 Project Features

### ✅ Implemented Modules

1. **User & Role Management**
   - SignIn/SignUp pages
   - JWT authentication
   - Role-based dashboards (Admin/Manager/User)

2. **Inventory Management**
   - Product catalog with CRUD operations
   - SKU-based tracking
   - Category management

3. **Stock Transactions** (Enhanced)
   - Stock-In/Stock-Out forms
   - Handler tracking
   - Transaction history

4. **AI Demand Forecasting** (NEW)
   - Predictive analytics with charts
   - Risk level indicators
   - Trend visualization

5. **Purchase Orders**
   - Purchase order management
   - Vendor tracking

6. **Supplier Management**
   - Vendor information
   - Contact management

7. **Analytics Dashboard** (NEW)
   - Multiple chart types
   - Export to Excel/PDF
   - Performance metrics

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Route pages
│   ├── utils/          # Helper functions (api, auth)
│   ├── assets/         # Static files
│   └── App.jsx         # Main app with routes
│
├── RESTRUCTURE_SUMMARY.md    # Complete change log
├── QUICK_REFERENCE.md        # Developer guide
├── DEVELOPER_NOTES.md        # Backend integration
└── README.md                 # This file
```

---

## 🛠️ Tech Stack

- **Framework:** React 18+ with Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Charts:** Chart.js + react-chartjs-2
- **Animations:** Framer Motion, Lottie
- **Auth:** JWT tokens

---

## 📖 Documentation

### Essential Reading
1. **RESTRUCTURE_SUMMARY.md** - All changes and features
2. **QUICK_REFERENCE.md** - Routes, components, usage
3. **DEVELOPER_NOTES.md** - Backend integration guide

---

## 🗺️ Route Map

### Public
- `/` → Redirects to `/signin`
- `/signin` - Login
- `/signup` - Registration

### Protected (Requires Auth)
- `/dashboard` - Store Manager dashboard
- `/admindashboard` - Admin overview
- `/userdashboard` - User home
- `/products` - Inventory catalog
- `/transactions` - Stock-in/out
- `/forecast` - AI predictions (NEW)
-- `/purchase-orders` - Purchase orders
- `/suppliers` - Vendor management
- `/analytics` - Reports & charts (NEW)
- `/profile` - User settings

---

## 🎨 Key Components

### New Pages
- `DemandForecast.jsx` - AI forecasting with charts
- `Analytics.jsx` - Comprehensive analytics

### Enhanced Pages
- `Transactions.jsx` - Added Stock-In/Out forms
- `UserDashboard.jsx` - Redesigned with alerts

### Maintained
- `SignIn.jsx` & `SignUp.jsx` - Authentication
- All other existing components

---

## 📦 Dependencies

```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "chart.js": "^4.x",
  "react-chartjs-2": "^5.x",
  "tailwindcss": "^3.x",
  "framer-motion": "^x.x",
  "lottie-react": "^x.x"
}
```

---

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Environment Variables
Create `.env` file:
```env
VITE_API_URL=http://localhost:8081/api
```

---

## 🧪 Testing Checklist

- [x] Application builds without errors
- [x] All routes accessible
- [x] Charts render correctly
- [x] Forms functional
- [x] Responsive design working
- [ ] API integration (pending backend)

---

## 🚀 Deployment

### Build
```bash
npm run build
# Output: dist/ folder
```

### Deploy Options
- Netlify
- Vercel
- AWS S3 + CloudFront
- Docker container

---

## 🔄 Backend Integration

The frontend is ready for backend API integration. See `DEVELOPER_NOTES.md` for:
- Required API endpoints
- Spring Boot controller examples
- Database schema suggestions
- AI service integration

---

## 📞 Support

For detailed information:
- **Features:** See `RESTRUCTURE_SUMMARY.md`
- **Usage:** See `QUICK_REFERENCE.md`
- **Integration:** See `DEVELOPER_NOTES.md`

---

## ✅ Status

- **Frontend:** ✅ Complete
- **Backend:** 🔄 Pending integration
- **AI Service:** 🔄 Pending implementation
- **Documentation:** ✅ Complete

---

**Built with React + Vite + Tailwind CSS**
