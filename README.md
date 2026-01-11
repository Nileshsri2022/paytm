# 💰 PayTM Clone

A full-stack digital wallet app with Clerk authentication, Razorpay payments, QR transfers, and Google Contacts import.

![PayTM Clone](https://img.shields.io/badge/Status-Complete-brightgreen) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18-blue)

## ✨ Features

### 💳 Core Features
- **Wallet** - Add money (Razorpay), withdraw, instant transfers
- **QR Payments** - Scan & pay, generate personal QR
- **Beneficiaries** - Save favorites for one-tap payments
- **Statement Download** - Export transactions as CSV

### 🔐 Security
- **Clerk Authentication** - Secure login with session management
- **Rate Limiting** - API protection (auth/transfer/payout limits)
- **Transaction Limits** - Per-transaction (₹10K), daily (₹50K), monthly (₹500K)
- **Audit Logging** - Track all sensitive operations

### 🎨 UX
- **Toast Notifications** - Elegant feedback (react-hot-toast)
- **Dark Mode** - System preference + toggle
- **Skeleton Loaders** - Smooth loading states

### 📱 Integrations
- **Google Contacts** - Import & auto-match users
- **Razorpay** - Real payment gateway (test mode)

---

## 🏗️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js, Express, MongoDB, Mongoose, Zod |
| **Frontend** | React 18, Vite, TailwindCSS, React Router |
| **Auth** | Clerk |
| **Payments** | Razorpay |
| **Extras** | react-hot-toast, QRCode, express-rate-limit |

---

## 📁 Project Structure

```
├── backend/
│   ├── routes/
│   │   ├── user.js          # Auth & profile
│   │   ├── account.js       # Balance & transfers
│   │   ├── beneficiary.js   # Saved recipients
│   │   ├── security.js      # Audit logs
│   │   ├── statement.js     # CSV export
│   │   ├── google.js        # OAuth & contacts
│   │   └── razorpay.js      # Payments
│   ├── services/
│   │   ├── auditLog.js
│   │   └── transactionLimits.js
│   ├── middleware/
│   │   └── rateLimit.js
│   └── db.js
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Beneficiaries.jsx
│   │   │   ├── TransactionHistory.jsx
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── Skeleton.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── ...
│   │   ├── hooks/useTheme.js
│   │   └── utils/toast.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Clerk account
- Razorpay account (test mode)

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/paytm-clone.git
cd paytm-clone

# Backend
cd backend && npm install
cp .env.example .env  # Edit with your credentials
npm start

# Frontend (new terminal)
cd frontend && npm install
cp .env.example .env  # Add VITE_CLERK_PUBLISHABLE_KEY
npm run dev
```

### 2. Open App
Visit `http://localhost:5173`

---

## ⚙️ Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/paytm
CLERK_SECRET_KEY=sk_test_xxx
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

### Frontend (.env)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

---

## 📡 API Endpoints

### Core
| Endpoint | Description |
|----------|-------------|
| `GET /account/balance` | Get wallet balance |
| `POST /account/transfer` | Send money |
| `GET /account/transactions` | Transaction history |

### Features
| Endpoint | Description |
|----------|-------------|
| `GET /beneficiaries` | List saved recipients |
| `POST /beneficiaries` | Add beneficiary |
| `GET /statement/csv` | Download CSV statement |
| `GET /security/audit-logs` | View audit trail |

---

## 🧪 Test Credentials

| Type | Value |
|------|-------|
| Card | `4111 1111 1111 1111` |
| UPI | `success@razorpay` |

---

## ✅ Implemented Features

- [x] Clerk Authentication
- [x] Rate Limiting (4 tiers)
- [x] Transaction Limits
- [x] Audit Logging
- [x] Toast Notifications
- [x] Dark Mode
- [x] Skeleton Loaders
- [x] Beneficiary Management
- [x] Statement Download (CSV)

---

## 📄 License

MIT License

---

Made with ❤️ for learning purposes
