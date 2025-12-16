# Developer Notes - SmartShelfX Frontend

## ✅ Completed Tasks

1. ✓ Removed unnecessary files (Cart, Request, LandingPage, CartBadge, cart.js)
2. ✓ Created DemandForecast page with AI prediction UI
3. ✓ Created Analytics page with comprehensive charts
4. ✓ Updated Transactions page with Stock-In/Out forms
5. ✓ Enhanced UserDashboard with relevant content
6. ✓ Updated App.jsx routing structure
7. ✓ Updated Navbar with new routes (removed cart)
8. ✓ Installed Chart.js dependencies
9. ✓ Fixed all route paths to lowercase
10. ✓ Maintained SignIn/SignUp as requested

---

## 🔨 Backend Integration TODO

### API Endpoints to Implement

#### 1. Transactions API
```javascript
// In utils/api.js, add:

export const createTransaction = async (data) => {
  const response = await fetch('http://localhost:8081/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

**Backend Endpoint:**
```
POST /api/transactions
Body: {
  productSku: string,
  quantity: number,
  type: "IN" | "OUT",
  handler: string,
  notes: string,
  timestamp: string
}
```

---

#### 2. Demand Forecast API
```javascript
// In utils/api.js, add:

export const getForecast = async () => {
  const response = await fetch('http://localhost:8081/api/forecast', {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return response.json();
};

export const refreshForecast = async () => {
  const response = await fetch('http://localhost:8081/api/forecast/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return response.json();
};
```

**Backend Endpoints:**
```
GET /api/forecast
Response: [{
  sku: string,
  name: string,
  currentStock: number,
  forecastedDemand: number,
  action: string,
  riskLevel: "High" | "Medium" | "Low",
  trend: number[]
}]

POST /api/forecast/refresh
Triggers AI model to generate new predictions
```

---

#### 3. Analytics API
```javascript
// In utils/api.js, add:

export const getAnalytics = async (timeframe = 'monthly') => {
  const response = await fetch(`http://localhost:8081/api/analytics?timeframe=${timeframe}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return response.json();
};

export const exportReport = async (format = 'excel') => {
  const response = await fetch(`http://localhost:8081/api/reports/export/${format}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  const blob = await response.blob();
  // Download logic here
  return blob;
};
```

**Backend Endpoints:**
```
GET /api/analytics?timeframe=monthly
Response: {
  inventoryTrend: { labels: [], data: [] },
  purchaseVsSales: { labels: [], purchases: [], sales: [] },
  categoryDistribution: { labels: [], data: [] },
  topRestocked: { labels: [], data: [] },
  stats: {
    totalValue: number,
    totalProducts: number,
    restockOrders: number,
    lowStockItems: number
  }
}

GET /api/reports/export/excel
GET /api/reports/export/pdf
Returns file download
```

---

## 🔧 Frontend TODO

### 1. Update DemandForecast.jsx
**File:** `src/pages/DemandForecast.jsx`

**Line 24-53:** Replace mock data with API call
```javascript
const fetchForecasts = async () => {
  setLoading(true);
  try {
    const response = await getForecast(); // Import from api.js
    setForecasts(response);
  } catch (err) {
    console.error('Failed to fetch forecasts', err);
    window.dispatchEvent(new CustomEvent('notify', { 
      detail: { type: 'error', message: 'Failed to load forecast data' } 
    }));
  } finally {
    setLoading(false);
  }
};
```

**Line 67:** Implement refresh button
```javascript
<button
  onClick={async () => {
    await refreshForecast();
    await fetchForecasts();
  }}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
>
  🔄 Refresh Forecast
</button>
```

---

### 2. Update Analytics.jsx
**File:** `src/pages/Analytics.jsx`

**Add useEffect to fetch data:**
```javascript
useEffect(() => {
  fetchAnalyticsData();
}, [timeframe]);

const fetchAnalyticsData = async () => {
  setLoading(true);
  try {
    const data = await getAnalytics(timeframe); // Import from api.js
    // Update state with real data
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
```

**Update export functions (line 147-152):**
```javascript
const exportReport = async (format) => {
  try {
    const blob = await exportReport(format); // From api.js
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartShelfX-Report-${new Date().toISOString()}.${format}`;
    a.click();
    window.dispatchEvent(new CustomEvent('notify', { 
      detail: { type: 'success', message: `Report exported as ${format.toUpperCase()}` } 
    }));
  } catch (err) {
    window.dispatchEvent(new CustomEvent('notify', { 
      detail: { type: 'error', message: 'Export failed' } 
    }));
  }
};
```

---

### 3. Update Transactions.jsx
**File:** `src/pages/Transactions.jsx`

**Line 25-49:** Complete the submit handler
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const payload = {
      productSku: formData.productSku,
      quantity: parseInt(formData.quantity),
      type: transactionType,
      handler: formData.handler,
      notes: formData.notes,
      timestamp: new Date().toISOString()
    };
    
    await createTransaction(payload); // Import from api.js
    
    window.dispatchEvent(new CustomEvent('notify', { 
      detail: { 
        type: 'success', 
        message: `${transactionType === 'IN' ? 'Stock-In' : 'Stock-Out'} recorded successfully` 
      } 
    }));
    
    setShowForm(false);
    setFormData({ productSku: '', quantity: '', handler: '', notes: '' });
    fetchTransactions();
  } catch (err) {
    window.dispatchEvent(new CustomEvent('notify', { 
      detail: { type: 'error', message: 'Failed to record transaction' } 
    }));
  }
};
```

---

### 4. Update UserDashboard.jsx
**File:** `src/pages/UserDashboard.jsx`

**Line 17-23:** Fetch real stats
```javascript
useEffect(() => {
  const userProfile = getProfile();
  setProfile(userProfile);
  
  // Fetch user-specific stats from API
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/user/stats', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };
  
  fetchStats();
}, []);
```

---

## 📋 Backend Spring Boot TODO

### 1. Create TransactionController
```java
@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    
    @PostMapping
    public ResponseEntity<Transaction> createTransaction(@RequestBody TransactionDTO dto) {
        // Logic to record stock in/out
        // Update inventory levels
        return ResponseEntity.ok(transaction);
    }
    
    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        return ResponseEntity.ok(transactions);
    }
}
```

### 2. Create ForecastController
```java
@RestController
@RequestMapping("/api/forecast")
public class ForecastController {
    
    @Autowired
    private AIPredictionService aiService;
    
    @GetMapping
    public ResponseEntity<List<ForecastDTO>> getForecast() {
        return ResponseEntity.ok(forecasts);
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<String> refreshForecast() {
        aiService.triggerPrediction();
        return ResponseEntity.ok("Forecast refreshed");
    }
}
```

### 3. Create AnalyticsController
```java
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    
    @GetMapping
    public ResponseEntity<AnalyticsDTO> getAnalytics(@RequestParam String timeframe) {
        // Calculate trends, stats
        return ResponseEntity.ok(analytics);
    }
}

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel() {
        // Generate Excel file
    }
    
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPDF() {
        // Generate PDF file
    }
}
```

---

## 🤖 AI/ML Integration

### Python Microservice Setup

**Create a separate Python service:**

```python
# forecast_service.py
from flask import Flask, jsonify
import pandas as pd
from sklearn.linear_model import LinearRegression
# or use TensorFlow/PyTorch for deep learning

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict_demand():
    # Load historical data
    # Train model or use pre-trained model
    # Generate predictions
    predictions = model.predict(data)
    return jsonify(predictions)

if __name__ == '__main__':
    app.run(port=5000)
```

**Call from Spring Boot:**
```java
@Service
public class AIPredictionService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    public ForecastDTO triggerPrediction() {
        String url = "http://localhost:5000/predict";
        // Send historical data
        ResponseEntity<ForecastDTO> response = restTemplate.postForEntity(url, data, ForecastDTO.class);
        return response.getBody();
    }
}
```

---

## 🗄️ Database Schema Updates

### Add Transaction Table
```sql
CREATE TABLE transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_sku VARCHAR(50),
    quantity INT,
    type ENUM('IN', 'OUT'),
    handler VARCHAR(100),
    notes TEXT,
    timestamp DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Add Forecast Table
```sql
CREATE TABLE demand_forecasts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT,
    sku VARCHAR(50),
    current_stock INT,
    forecasted_demand INT,
    risk_level ENUM('High', 'Medium', 'Low'),
    action VARCHAR(100),
    trend_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

---

## 🧪 Testing Checklist

### Frontend Testing
- [ ] Sign In/Sign Up flow works
- [ ] Route navigation works for all roles
- [ ] Product CRUD operations
- [ ] Transaction form submission
- [ ] Forecast page displays (with mock data)
- [ ] Analytics charts render
- [ ] Export buttons trigger actions
- [ ] Notifications show correctly
- [ ] Mobile responsive design

### Backend Testing (To Do)
- [ ] Transaction API endpoints
- [ ] Forecast API endpoints
- [ ] Analytics API endpoints
- [ ] Export API endpoints
- [ ] JWT authentication works
- [ ] Role-based access control
- [ ] Database transactions
- [ ] Error handling

### Integration Testing (To Do)
- [ ] Frontend → Backend API calls
- [ ] AI service → Spring Boot integration
- [ ] Real-time inventory updates
- [ ] Notification system
- [ ] File export functionality

---

## 🔐 Security Considerations

1. **JWT Token Expiration**
   - Implement token refresh logic
   - Handle expired token errors

2. **Role-Based Access**
   - Verify on backend, not just frontend
   - Protect API endpoints with @PreAuthorize

3. **Input Validation**
   - Validate all form inputs
   - Sanitize data before database operations

4. **CORS Configuration**
   - Allow only specific origins
   - Configure in Spring Boot application.properties

---

## 📊 Performance Optimization

1. **Lazy Loading**
   - Implement pagination for large tables
   - Load charts only when visible

2. **Caching**
   - Cache forecast data (refresh periodically)
   - Cache analytics for faster load

3. **API Optimization**
   - Batch API calls where possible
   - Use query parameters for filtering

---

## 🚀 Deployment Preparation

### Frontend (Vite Build)
```bash
npm run build
# Output: dist/ folder
# Deploy to: Netlify, Vercel, AWS S3, etc.
```

### Backend (Spring Boot)
```bash
mvn clean package
# Output: target/app.jar
# Deploy to: AWS EC2, Heroku, Docker, etc.
```

### Environment Variables
```env
# Frontend (.env)
VITE_API_URL=http://localhost:8081/api

# Backend (application.properties)
spring.datasource.url=jdbc:mysql://localhost:3306/smartshelfx
jwt.secret=your-secret-key
ai.service.url=http://localhost:5000
```

---

## 📝 Next Immediate Steps

1. **Backend Developer:**
   - Implement Transaction API
   - Implement Forecast API (with mock AI for now)
   - Implement Analytics API
   - Set up database tables

2. **Frontend Developer (You):**
   - Update api.js with new endpoints
   - Replace mock data in DemandForecast.jsx
   - Replace mock data in Analytics.jsx
   - Test with real backend

3. **AI/ML Developer:**
   - Set up Python microservice
   - Train demand forecasting model
   - Expose prediction endpoint
   - Integrate with Spring Boot

4. **Testing:**
   - Write unit tests
   - Perform integration testing
   - User acceptance testing

---

## 📞 Questions to Clarify

1. **AI Model:** What algorithm to use? (LSTM, ARIMA, Linear Regression?)
2. **Data Sources:** Where is historical sales data stored?
3. **Export Format:** Specific Excel/PDF template requirements?
4. **Notifications:** Email/SMS integration needed?
5. **Deployment:** What hosting platform?

---

**Status:** Frontend restructure complete ✅  
**Next:** Backend API implementation  
**Blocked By:** None  
**Updated:** November 13, 2025
