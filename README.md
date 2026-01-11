# 💰 PayTM Clone

A full-stack digital wallet application inspired by PayTM, built with React and Node.js. Features include wallet-to-wallet transfers, QR payments, Google Contacts import, and Razorpay integration.

![PayTM Clone](https://img.shields.io/badge/Status-Complete-brightgreen) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18-blue) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

## ✨ Features

### 💳 Wallet Management
- **Add Money** - Add funds via Razorpay (UPI/Card/NetBanking)
- **Withdraw** - Withdraw to linked bank account (simulated)
- **Balance Tracking** - Real-time wallet balance

### 💸 Money Transfer
- **Send Money** - Instant wallet-to-wallet transfers
- **QR Scan & Pay** - Scan QR codes to pay anyone
- **QR Generator** - Generate your personal payment QR

### 📱 Contacts Integration
- **Google Contacts** - Import contacts from Google
- **Smart Matching** - Auto-detect contacts already on PayTM
- **User Search** - Find users by name or email

### 👤 User Features
- **Authentication** - JWT-based login/signup
- **Profile Management** - Update personal details
- **Transaction History** - View all past transactions

---

## 🏗️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime |
| **Express** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM |
| **JWT** | Authentication |
| **Razorpay** | Payment gateway |
| **Google APIs** | Contacts import |
| **Zod** | Validation |
| **bcrypt** | Password hashing |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool |
| **TailwindCSS** | Styling |
| **React Router** | Navigation |
| **Axios** | HTTP client |
| **QRCode** | QR generation |
| **React Webcam** | QR scanning |

---

## 📁 Project Structure

```
paytm-complete-solution/
├── backend/
│   ├── routes/
│   │   ├── user.js        # Auth & user management
│   │   ├── account.js     # Balance & transfers
│   │   ├── google.js      # Google OAuth & contacts
│   │   └── razorpay.js    # Payments & payouts
│   ├── services/
│   │   ├── razorpay.js    # Razorpay API wrapper
│   │   └── googleContacts.js
│   ├── db.js              # MongoDB schemas
│   ├── middleware.js      # JWT auth middleware
│   └── config.js          # Environment config
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SendMoney.jsx
│   │   │   ├── AddMoney.jsx
│   │   │   ├── WithdrawMoney.jsx
│   │   │   ├── ScanPay.jsx
│   │   │   ├── TransactionHistory.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Signin.jsx
│   │   │   └── Signup.jsx
│   │   └── components/
│   │       ├── Users.jsx       # Contacts list
│   │       ├── QRScanner.jsx   # Camera QR reader
│   │       ├── QRGenerator.jsx # Payment QR
│   │       └── Appbar.jsx      # Navigation
│   └── .env.example
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Razorpay account (test mode)
- Google Cloud Project (for contacts)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/paytm-clone.git
cd paytm-clone
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Open App
Visit `http://localhost:5173`

---

## ⚙️ Environment Variables

### Backend (.env)
```env
# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# MongoDB
MONGODB_URI=mongodb://localhost:27017/paytm

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/google/callback

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/user/signup` | Register user |
| POST | `/api/v1/user/signin` | Login |
| GET | `/api/v1/user/me` | Get profile |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/account/balance` | Get balance |
| POST | `/api/v1/account/transfer` | Send money |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/razorpay/create-order` | Add money |
| POST | `/api/v1/razorpay/payout` | Withdraw |

### Google
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/google/auth` | OAuth URL |
| GET | `/api/v1/google/contacts` | Get contacts |

---

## 🧪 Test Credentials (Razorpay)

| Type | Value |
|------|-------|
| Card | `4111 1111 1111 1111` |
| UPI | `success@razorpay` |
| Bank | Any random details |

---

## 📸 Screenshots

| Dashboard | Send Money | QR Pay |
|-----------|------------|--------|
| Wallet balance & quick actions | User search & transfer | Scan & generate QR |

---

## 🚧 Future Improvements

- [ ] Transaction PIN
- [ ] Request money
- [ ] Split bill
- [ ] Dark mode
- [ ] Push notifications
- [ ] Email receipts

---

## 📄 License

MIT License - feel free to use for learning!

---

## 🤝 Contributing

Pull requests welcome! For major changes, open an issue first.

---

Made with ❤️ for learning purposes
