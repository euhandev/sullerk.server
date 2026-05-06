# Keepsake Memorabilia (KSMM) - Project Documentation

## 1. Project Overview
Keepsake Memorabilia (KSMM) is a comprehensive marketplace platform for sports assets, featuring a unique "Performance-Indexed" valuation system. The platform allows users (collectors, buyers, and sellers) to manage a personal portfolio of sports memorabilia, trade or buy items, and track their financial performance. The platform ensures market integrity through an Admin portal that oversees transactions, verifies users, manages disputes, and configures the economic parameters of the pricing engine.

## 2. User Roles & Access

### 2.1 Customer (Buyer/Seller)
Customers utilize the platform to manage their memorabilia portfolios, buy/sell assets, and track their market value over time.

**Credentials:**
- **Email:** buyer@gmail.com
- **Password:** buyer

### 2.2 Admin
Admins have global oversight and control over the marketplace's integrity, financial logic, user verification, and platform economics.

**Credentials:**
- **Email:** admin@ksmm.com
- **Password:** admin

---

## 3. Customer Role - Features & Pages

### 3.1 Member Dashboard
- **Purpose:** Provides an overview of financial performance and platform activity.
- **Key Metrics:** Portfolio Value (£), Active Listings, Pending Orders, Total Earnings (£), Items Owned, Completed Orders, Pending Deliveries, Revenue Growth (%).
- **Features:** 
  - Top Portfolio Movers: Displays item names, current values, and percentage changes.
  - Recent Activity: A timeline of purchases, sales, and order statuses (Shipped, Processing, Delivered).

### 3.2 Listings
- **Purpose:** Manage items listed for sale or trade.
- **Tabs:** All, Active, Paused, Pending.
- **Create New Listing Form Fields:**
  - **Sport & League:** Sport, Team/Country, Player/Manager Name.
  - **Item Details:** Category (Shirt, Boots, Card, etc.), Season/Year, Kit Type, Description, Photos.
  - **Signature:** Type (None, Partial, Full, Dedicated).
  - **Proof:** Photo Proof Level, Authentication (COA, Beckett, PSA), Video Evidence.
  - **Format:** Buy Now, Trade Only, Buy & Trade.
  - **Pricing:** Initial Price (£), Allow Offers, Auto Price Adjustment.

### 3.3 Portfolio
- **Purpose:** Track owned assets and watchlist items.
- **Tabs:** Owned, Watchlist.
- **Features:** Portfolio Value, Items Owned, Watchlist Count, Avg. Item Value. Item tables display Acquired Date, Authentication, Value, Change (%), and Status.

### 3.4 Orders
- **Purpose:** Track purchases and sales.
- **Tabs:** Purchases, Sales.
- **Features:** View Order ID, Status, Item Name, Seller/Buyer details, Date, Amount, and Tracking Number.

### 3.5 Earnings & Payments
- **Purpose:** Financial management and withdrawals.
- **Features:** 
  - View Total Earnings, Available Balance, and Pending Payouts.
  - Manage Payment Methods (Bank Account, PayPal, Visa).
  - Transaction History: Track Date, Amount, Method, Type, and Status of payouts.

### 3.6 Disputes
- **Purpose:** Resolve issues with orders.
- **Features:** View Dispute ID, Type (Dispute/Refund), Status (Open, Under Review, Resolved), related Item, Party Name, and Date.

### 3.7 Settings
- **Purpose:** Account and profile configuration.
- **Forms:**
  - **Profile:** Full Name, Display Name, Email, Phone.
  - **Address:** Shipping/Billing Address.
  - **Security:** Photo ID Verification, Password Management.

---

## 4. Admin Role - Features & Pages

### 4.1 Admin Dashboard
- **Purpose:** Macro-level platform metrics.
- **Key Metrics:** Total Users, Active Listings, Total Transactions, Platform Revenue (£).
- **Features:** Global log of recent user actions, items created, and financial activity.

### 4.2 User Management
- **Purpose:** Audit and moderate user accounts.
- **Features:** View user details (ID, Name, Email, Role, Joined Date, Status). Actions include Verifying users, Suspending users, and viewing detailed profiles.

### 4.3 Inventory & Transactions
- **Purpose:** Monitor all market activity.
- **Features:** 
  - **Listings Ledger:** Monitor Active/Pending listings, seller information, and prices.
  - **Transactions Ledger:** Audit Completed/Pending transactions, buyers, sellers, item details, and value.

### 4.4 Financials & Pricing Engine
- **Purpose:** Configure the algorithm for memorabilia valuation and monitor platform fees.
- **Features:** 
  - **Payments:** Total Transaction Volume, Platform Fees Collected, Global Audit Ledger.
  - **Pricing Engine Config:** Set Base Values for categories (Shirt, Boots, Card, Gloves, etc.) and Multipliers for Sport/Honours to power the automated valuation system.

### 4.5 Disputes & Reports
- **Purpose:** Conflict resolution and safety.
- **Features:** Manage Flagged Users, Open Disputes, and Reported Items. Take actions to resolve disputes and handle audit incidents.

### 4.6 System Settings
- **Purpose:** Internal admin configuration.
- **Features:** Manage Admin profiles, passwords, and compliance documentation.

---

## 5. Database Schema Additions

Based on the required features, the `schema.prisma` has been updated with the following core entities and their relations:

- **Item:** Represents a memorabilia listing with extensive fields for category, authentication, proof, and pricing.
- **Order:** Tracks purchases and trades between Buyers and Sellers.
- **Dispute:** Allows tracking and resolution of conflicts related to specific orders.
- **Watchlist:** Tracks items users are interested in monitoring.
- **PaymentMethod:** Stores linked user financial accounts for deposits/withdrawals.
- **Transaction:** Global financial ledger for payments, payouts, and fees.
- **PricingConfig:** Admin-controlled parameters for the valuation engine.
- **Post:** Social media content with polls and media attachments.

## 6. API Reference
- [Post API Documentation](posts-api-guide.md)
