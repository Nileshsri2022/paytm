import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUser } from "@clerk/clerk-react"
import { Appbar } from "../components/Appbar"
import { Users } from "../components/Users"
import { QRGenerator } from "../components/QRGenerator"
import api from "../utils/api"

// Helper function to decode JWT token
const decodeJWT = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
};

// Format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Quick Action Button Component
const QuickAction = ({ icon, label, onClick, color = "bg-white" }) => (
    <button
        onClick={onClick}
        className={`${color} flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 border border-gray-100`}
    >
        <span className="text-3xl mb-2">{icon}</span>
        <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
);

// Transaction Item Component
const TransactionItem = ({ transaction, currentUserId, onClick }) => {
    const isIncoming = transaction.type === 'deposit' ||
        (transaction.type === 'transfer' && currentUserId && transaction.toUserId?._id === currentUserId);

    const getIcon = () => {
        if (transaction.type === 'deposit') return '↙️';
        if (transaction.type === 'withdrawal') return '↗️';
        return isIncoming ? '↙️' : '↗️';
    };

    const getName = () => {
        if (transaction.type === 'deposit') return 'Money Added';
        if (transaction.type === 'withdrawal') return 'Withdrawn';
        if (isIncoming) {
            return transaction.fromUserId?.firstName
                ? `From ${transaction.fromUserId.firstName}`
                : 'Received';
        }
        return transaction.toUserId?.firstName
            ? `To ${transaction.toUserId.firstName}`
            : 'Sent';
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-4 bg-white rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${isIncoming ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                    {getIcon()}
                </div>
                <div>
                    <div className="font-medium text-gray-900">{getName()}</div>
                    <div className="text-sm text-gray-500">{formatTime(transaction.createdAt)}</div>
                </div>
            </div>
            <div className={`font-semibold text-lg ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
                {isIncoming ? '+' : '-'}{formatCurrency(transaction.amount)}
            </div>
        </div>
    );
};

export const Dashboard = () => {
    const [balance, setBalance] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showQRGenerator, setShowQRGenerator] = useState(false);
    const navigate = useNavigate();
    const { user } = useUser();

    const fetchBalance = async () => {
        try {
            const response = await api.get("/account/balance");
            setBalance(response.data.balance);
        } catch (error) {
            console.error("Failed to fetch balance:", error);
        }
    };

    const fetchRecentTransactions = async () => {
        try {
            const response = await api.get("/account/transactions");
            setRecentTransactions(response.data.transactions.slice(0, 5));
        } catch (error) {
            console.error("Failed to fetch recent transactions:", error);
        }
    };

    const fetchCurrentUserId = async () => {
        try {
            const response = await api.get("/user/me");
            setCurrentUserId(response.data.user?._id);
        } catch (error) {
            console.error("Failed to fetch user:", error);
        }
    };

    useEffect(() => {
        fetchBalance();
        fetchRecentTransactions();
        fetchCurrentUserId();
    }, []);

    useEffect(() => {
        window.refreshBalance = fetchBalance;
        return () => { delete window.refreshBalance; };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Appbar />

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Balance Card */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 text-white shadow-xl mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-white/70 text-sm font-medium mb-1">Total Balance</p>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                {formatCurrency(balance)}
                            </h1>
                            <p className="text-white/60 text-sm mt-2">PayTM Wallet</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                            <span className="text-4xl">💳</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                        <QuickAction icon="💸" label="Send" onClick={() => navigate("/send")} />
                        <QuickAction icon="📥" label="Add Money" onClick={() => navigate("/add-money")} />
                        <QuickAction icon="🏧" label="Withdraw" onClick={() => navigate("/withdraw")} />
                        <QuickAction icon="📷" label="Scan & Pay" onClick={() => navigate("/scan-pay")} />
                        <QuickAction icon="📜" label="History" onClick={() => navigate("/transactions")} />
                        <QuickAction icon="📱" label="My QR" onClick={() => setShowQRGenerator(true)} />
                    </div>
                </div>

                {/* Main Content - Two Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Transactions */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                            <button
                                onClick={() => navigate("/transactions")}
                                className="text-indigo-600 text-sm font-medium hover:underline"
                            >
                                View All
                            </button>
                        </div>

                        {recentTransactions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <span className="text-5xl mb-4 block">📭</span>
                                <p>No transactions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentTransactions.map((transaction) => (
                                    <TransactionItem
                                        key={transaction._id}
                                        transaction={transaction}
                                        currentUserId={currentUserId}
                                        onClick={() => navigate("/transactions")}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Users Section */}
                    <Users />
                </div>
            </div>

            {/* QR Code Generator Modal */}
            {showQRGenerator && (
                <QRGenerator
                    amount={null}
                    onClose={() => setShowQRGenerator(false)}
                />
            )}
        </div>
    );
}
