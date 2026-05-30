# Smart E-Commerce Product Link Analyzer - Project Map

This project is divided into three main services to ensure security, performance, and scalability.

---

## 🎨 Frontend (React)
**Role**: Handles the user interface, product link input, and visualization.

- `src/components/`: Reusable UI elements (Buttons, Inputs).
- `src/pages/`: Main application views (Home, Dashboard).
- `src/services/`: Logic to communicate with Django and Spring Boot.
- `src/styles/`: Plain CSS for styling.

---

## 🐍 Backend (Django)
**Role**: The "brain" of the application. It extracts product data and manages business logic.

- `analyzer/`: Python scripts to scrape e-commerce links (Amazon, eBay, etc.).
- `models/`: Database schema for products and user search history.
- `views/`: API endpoints for the React frontend to fetch analyzed data.

---

## 🛡️ Security Service (Java Spring Boot)
**Role**: Dedicated authentication gatekeeper.

- `auth/`: Handles User Registration and Login using JWT (JSON Web Tokens).
- `security/`: Configures permissions (who can access what).
- `database/`: Stores user credentials securely.

---

## ⛓️ How They Work Together
1. **User Auth**: React ⮕ Spring Boot (Get JWT Token)
2. **Link Analysis**: React ⮕ Django (Send link ⮕ Scrape ⮕ Return Details)
3. **Purchase**: React ⮕ Django (Process order ⮕ Store in SQL)

*Ready to start implementing the first component?*
