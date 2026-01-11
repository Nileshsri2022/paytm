# 💰 PayTM Clone

Full-stack digital wallet with Clerk auth, Razorpay payments, QR transfers, and scheduled payments.

![Status](https://img.shields.io/badge/Status-Complete-brightgreen) ![Node](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18-blue)

## ✨ Features

### Core
- 💳 **Wallet** - Add money, withdraw, instant transfers
- 📷 **QR Payments** - Scan & pay, generate QR
- ⭐ **Beneficiaries** - Save favorites for quick pay
- 📅 **Scheduled Payments** - One-time or recurring auto-pay
- 📊 **Statement Download** - Export CSV

### Security
- 🔐 **Clerk Auth** - Secure authentication
- ⏱️ **Rate Limiting** - API protection
- 💰 **Transaction Limits** - ₹10K/₹50K/₹500K limits
- 📝 **Audit Logging** - Track all operations

### UX
- 🌙 **Dark Mode** - Toggle + system preference
- 🔔 **Toast Notifications** - Elegant feedback
- 💀 **Skeleton Loaders** - Smooth loading states

---

## 🏗️ Tech Stack

| Backend | Frontend |
|---------|----------|
| Node, Express, MongoDB | React 18, Vite, Tailwind |
| Clerk, Razorpay | react-hot-toast, QRCode |
| node-cron | React Router |

---

## 🚀 Quick Start

```bash
# Backend
cd backend && npm install
cp .env.example .env
npm start

# Frontend
cd frontend && npm install
npm run dev
```

Visit `http://localhost:5173`

---

## ⚙️ Environment

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/paytm
CLERK_SECRET_KEY=sk_test_xxx
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```

### Frontend (.env)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

---

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/account/balance` | Get balance |
| `/account/transfer` | Send money |
| `/beneficiaries` | CRUD favorites |
| `/scheduled` | CRUD scheduled payments |
| `/statement/csv` | Download statement |
| `/security/audit-logs` | View audit trail |

---

## ✅ All Features

- [x] Clerk Authentication
- [x] Rate Limiting (4 tiers)
- [x] Transaction Limits
- [x] Audit Logging
- [x] Toast Notifications
- [x] Dark Mode
- [x] Skeleton Loaders
- [x] Beneficiary Management
- [x] Statement Download (CSV)
- [x] Scheduled Payments (auto-process hourly)

---

Made with ❤️
