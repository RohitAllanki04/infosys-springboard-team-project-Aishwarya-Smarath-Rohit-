
# 🧠 SmartShelfX – AI-Based Inventory Forecast and Auto-Restock

## 📌 Overview

**SmartShelfX** is an AI-driven inventory management system designed to **predict stock demand**, **automate restocking**, and **reduce human error** in warehouse management.
Currently, the backend foundation using **Spring Boot** and **MySQL** is implemented with entity modeling, database connectivity, and service structure ready for expansion into AI-based forecasting.

---

## 🚀 Current Progress

**Completed so far:**

* ✅ Spring Boot backend setup
* ✅ MySQL database connection and configuration
* ✅ JPA / Hibernate integration
* ✅ Entity and Repository layers created
* ✅ Basic Service and Controller setup
* ✅ Initial testing and debugging

---

## 🏗️ Tech Stack (Backend)

* **Java 21**
* **Spring Boot 3**
* **Spring Data JPA**
* **MySQL**
* **Maven**
* **IntelliJ IDEA**

---

## ⚙️ Project Structure

```
SmartShelfX-AI
│
├── src/
│   ├── main/
│   │   ├── java/com/example/smartshelfx/
│   │   │   ├── controller/
│   │   │   ├── model/
│   │   │   ├── repository/
│   │   │   └── service/
│   │   └── resources/
│   │       ├── application.properties
│   │       └── static/ (for frontend later)
│   └── test/
│
└── pom.xml
```

---

## ⚙️ Database Configuration

**File:** `src/main/resources/application.properties`

```properties
spring.application.name=SmartShelfX-AI

# ======================================
# MySQL Database Configuration
# ======================================
spring.datasource.url=jdbc:mysql://localhost:3306/intern
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# ======================================
# JPA / Hibernate Settings
# ======================================
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
```

---

## 🧩 Example Entity

```java
@Entity
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int quantity;
    private double price;
    private String category;
    private LocalDate lastRestocked;

    // Getters and Setters
}
```

---

## 🧠 Upcoming Features

* [ ] AI-based demand forecasting
* [ ] Automatic restock triggering
* [ ] Admin dashboard for monitoring
* [ ] Authentication & access control
* [ ] Visual analytics and reports

---
