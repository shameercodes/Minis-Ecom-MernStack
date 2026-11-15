MINIS --- Full-Stack MERN E-Commerce Platform

MINIS is a full-stack e-commerce web application built using the MERN
stack (MongoDB, Express.js, React.js, and Node.js). It provides a
complete online shopping experience with product browsing, shopping
cart, wishlist, secure authentication, checkout, order management,
inventory tracking, promotional coupons, and an administrative
dashboard.

The platform is designed to provide a smooth shopping experience for
customers while giving administrators the tools to manage products,
customers, orders, inventory, and store operations.

Live Demo: https://minis-ecom-mern-stack-fxdr.vercel.app

Backend API: https://minis-ecom-mernstack.onrender.com
Features
1. Customer Features
- User registration and login.
- JWT-based authentication.
- Secure HTTP-only authentication cookies.
- Session-based bearer-token fallback.
- Browse available products.
- View product details.
- Browse products by categories.
- Product reviews and ratings.
- Add products to shopping cart.
- Update cart quantities.
- Remove products from cart.
- Add and remove wishlist products.
- Manage checkout information.
- Enter shipping and contact details.
- Apply promotional coupon codes.
- View order confirmation.
- View personal order history.
- View individual order details.
- Track order status.
- Download order invoices in PDF format.
- Receive order-related email notifications.
2. Product Management
- Create and manage products.
- Store product names, descriptions, prices, and images.
- Support original prices and discounted pricing.
- Organize products into categories.
- Support product sizes and colors.
- Manage product stock quantities.
- Enable or disable inventory tracking.
- Maintain product availability.
- Display featured products.
3. Shopping Cart and Checkout
- Add products to the shopping cart.
- Update product quantities.
- Validate product availability.
- Retrieve current product information before checkout.
- Validate shipping information.
- Calculate item subtotals.
- Calculate shipping charges.
- Calculate taxes.
- Apply coupon discounts.
- Calculate the final order total using server-side product prices.
- Prevent duplicate products in an order.
- Validate product quantities and IDs before order creation.
4. Coupon and Discount System
- Public coupon availability endpoint.
- Percentage-based discounts.
- Fixed-amount discounts.
- Minimum order amount validation.
- Maximum discount limits.
- Coupon expiration validation.
- Coupon usage limits.
- Per-customer usage restrictions.
- Coupon usage tracking.
- Checkout discount calculation.
- Server-side coupon validation.
5. Order Management
- Create customer orders.
- Store complete order information.
- Store customer shipping details.
- Maintain individual order items and prices.
- Maintain order payment information.
- Track order status.
- View customer order history.
- View individual order details.
- Generate downloadable PDF invoices.
- Send order confirmation emails.
- Send order status update emails.
Supported order statuses:
- Pending
- Processing
- Shipped
- Delivered
- Cancelled
6. Inventory Management
- Maintain product stock quantities.
- Automatically deduct stock when orders are created.
- Validate available stock before order creation.
- Prevent orders exceeding available inventory.
- Use MongoDB transactions for order and inventory operations.
- Restore inventory when eligible orders are cancelled.
- Prevent duplicate inventory restoration.
- Display inventory information in the admin dashboard.
- Provide low-stock product information.
7. Payment Management
Currently supported checkout payment options:
- Cash on Delivery (COD)
- Bank Transfer
- EasyPaisa
- JazzCash
Current implementation status:
- Cash on Delivery order creation.
- Admin confirmation of COD payments.
- Payment status tracking through isPaid and paidAt.
- Payment method information stored with orders.
Planned integration:
- Official JazzCash hosted checkout.
- Official Easypaisa hosted checkout.
- Server-side payment verification.
- Payment success, failure, and cancellation handling.
- Secure payment callbacks.
Note: Selecting JazzCash or Easypaisa in the current checkout does not
mean that live gateway processing is already integrated.
8. Admin Dashboard
Administrative functionality includes:
- Dashboard statistics.
- Revenue and order information.
- Product management.
- Customer management.
- Order management.
- Order status updates.
- Payment status management.
- Inventory management.
- Low-stock product monitoring.
- Coupon management.
Administrative routes are protected through authentication and admin
authorization middleware.
9. Email Notifications
The application uses the Brevo email API for transactional email
delivery.

Email functionality includes:
- Order confirmation emails.
- Order status update notifications.
- Customer order information.
- Order-related links.
- Estimated delivery information.
Email delivery is handled by the backend.
10. PDF Invoice Generation
MINIS supports downloadable order invoices generated using PDFKit.

Invoice functionality includes:
- Customer information.
- Order information.
- Product details.
- Item quantities.
- Product prices.
- Shipping information.
- Order totals.
- Payment information.
Invoices are generated dynamically from stored order data.
Technology Stack
Frontend
- React.js
- JavaScript (JSX)
- Tailwind CSS
- Axios
- React Router
- React Hot Toast
Backend
- Node.js
- Express.js
- JavaScript
- Mongoose
- MongoDB
- JSON Web Tokens (JWT)
- Express Async Handler
Database
- MongoDB Atlas
- Mongoose ODM
Authentication and Security
- JWT authentication
- HTTP-only cookies
- Password hashing
- Authentication middleware
- Admin authorization
- Server-side validation
- Protected API endpoints
Email and Documents
- Brevo API
- PDFKit
Deployment
- Vercel --- Frontend
- Render --- Backend
- MongoDB Atlas --- Database
Application Architecture
MINIS follows a client-server architecture.
                 CUSTOMER
                    |
                    v
          React Frontend (Vercel)
                    |
                    | Axios / HTTP
                    v
          Express Backend (Render)
                    |
          +---------+---------+
          |         |         |
          v         v         v
       MongoDB    Brevo    PDFKit
       Atlas      Email    Invoices
          |
          v
     Application Data
The frontend communicates with the backend through REST API endpoints.
The backend handles authentication, business logic, validation, order
processing, inventory operations, and database communication.
Project Structure
The application contains separate frontend and backend codebases.
Backend
backend/
│
├── config/
├── handlers/
├── middleware/
├── models/
├── routes/
├── utils/
│
├── server.js
├── package.json
└── .env
Folder responsibilities:
- config/ --- Database and application configuration.
- handlers/ --- Application request handlers.
- middleware/ --- Authentication, authorization, and request
  processing.
- models/ --- Mongoose database schemas.
- routes/ --- REST API routes.
- utils/ --- Reusable utilities, email services, and invoice
  generation.
- server.js --- Backend application entry point.
Frontend
The React frontend contains the application's pages, reusable
components, contexts, API utilities, and styling.
API Overview
The backend exposes REST API endpoints under /api.
Orders
  Method   Endpoint                    Purpose
  POST     /api/orders               Create an order
GET      /api/orders/my            Get logged-in customer's orders
GET      /api/orders/:id           Get an individual order
GET      /api/orders/:id/invoice   Download order invoice
PATCH    /api/orders/:id/pay       Admin confirms COD payment
Products
The product API supports product retrieval, featured products,
categories, and product management.
Authentication
Authentication endpoints support customer registration, login, logout,
and protected account operations.
Coupons
The coupon API supports public coupon retrieval, validation, and coupon
management.
Administration
Administrative endpoints support dashboard statistics, product
management, customer management, orders, and inventory operations.

All protected endpoints require appropriate authentication and
authorization.
Environment Variables
Create environment files locally. Never commit real credentials or
secrets to GitHub.
Backend .env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_COOKIE_NAME=minis_auth

FRONTEND_URL=http://localhost:5173

BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=your_verified_sender_email
Use the exact environment variable names required by your current
backend configuration. Additional configuration may be required for
authentication cookies, CORS, and other services.
Frontend .env
VITE_API_URL=http://localhost:5000
In production, configure VITE_API_URL with your deployed backend URL.
Local Development Setup
Prerequisites
- Node.js
- npm
- MongoDB Atlas account or local MongoDB
- Git
1. Clone the repository
git clone https://github.com/shameercodes/Minis-Ecom-MernStack.git
2. Navigate to the project
Open the project directory in your code editor.
3. Install backend dependencies
Navigate to the backend directory:
cd backend
npm install
Configure the backend .env file before starting the server.
4. Start the backend
npm run dev
The backend runs on the configured port.
5. Install frontend dependencies
Open another terminal, navigate to the frontend directory, and run:
npm install
Configure the frontend .env file.
6. Start the frontend
npm run dev
Open the local development URL displayed by Vite.
Production Deployment
MINIS uses the following deployment architecture:

  Service    Platform
  Frontend   Vercel
Backend    Render
Database   MongoDB Atlas
Email      Brevo
Deployment considerations
- Configure production environment variables.
- Configure frontend API URL.
- Configure backend CORS origins.
- Configure MongoDB Atlas network access.
- Keep secret keys on the backend.
- Verify authentication cookies in production.
- Test email delivery.
- Test checkout and order creation.
- Verify inventory updates.
- Test invoice downloads.
Security Considerations
- Never expose backend secrets in frontend code.
- Never commit .env files.
- Validate all important data on the backend.
- Calculate product prices using trusted database records.
- Protect customer orders from unauthorized access.
- Restrict administrative operations to authorized administrators.
- Verify online payment transactions on the backend before marking
  orders as paid.
- Use HTTPS in production.
Future Improvements
The following enhancements are planned or require completion:
- Official JazzCash hosted checkout integration.
- Official Easypaisa hosted checkout integration.
- Secure payment callback verification.
- Payment failure and cancellation handling.
- Additional checkout and payment testing.
- Further performance and security improvements.
- Additional automated testing.
Developer
Shameer Ali

MERN Stack Developer
- GitHub: https://github.com/shameercodes
- LinkedIn: https://www.linkedin.com/in/shameer-ali-8420a6322/
License
This project is developed as a personal full-stack development project.

Copyright © 2026 Shameer Ali. All rights reserved.