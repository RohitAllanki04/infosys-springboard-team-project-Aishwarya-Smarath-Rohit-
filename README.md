# 📦 SmartShelfX – AI Based Inventory Forecast & Auto Restock System

SmartShelfX is an **AI-powered inventory management system** that predicts future product demand and automatically assists in restocking decisions.  
It helps businesses avoid **stock-outs, overstocking, and manual forecasting errors** by using machine learning models integrated with a modern full-stack application.

---

## 🚀 Features

- 📊 **AI-based demand forecasting**
- 🔄 **Auto restock recommendation**
- 🏪 Product & inventory management
- 📈 Analytics dashboard for trends & forecasts
- 🔔 Low-stock alerts
- 👨‍💼 Admin & user roles
- 🌐 REST API based backend
- ⚡ Real-time frontend interface

---

## 🛠️ Tech Stack

### Backend
- **Spring Boot**
- **MySQL**
- RESTful APIs
- JPA / Hibernate

### Frontend
- **React.js**
- Axios
- Chart.js (for analytics & graphs)

### Machine Learning Service (Python)
Used for demand forecasting using:
- 📉 **Moving Average**
- 📉 **Exponential Smoothing**
- 📈 **ARIMA (Auto-Regressive Integrated Moving Average)**
- 📊 **Linear Regression**

Python ML service communicates with the backend to provide forecast results.

---

## 🧠 Machine Learning Models Used

| Model | Purpose |
|------|--------|
| Moving Average | Short-term demand smoothing |
| Exponential Smoothing | Trend-based forecasting |
| ARIMA | Time-series forecasting |
| Linear Regression | Sales trend prediction |

---

## 🗂️ Project Architecture

```text
React Frontend
      |
Spring Boot Backend (REST APIs)
      |
MySQL Database
      |
Python ML Service (Forecast Engine)


## 🎥 Demo Video
👉 [[Watch the Project Demo](https://drive.google.com/file/d/148Q_F3eb_N06r-YZ66CxY0MFOo9dzRLA/view?usp=drive_link)]
