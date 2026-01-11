import { useState, useEffect } from "react";
import api from "../utils/api";
import { Appbar } from "../components/Appbar";
import { Heading } from "../components/Heading";
import { SubHeading } from "../components/SubHeading";

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

export const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const [txRes, userRes] = await Promise.all([
                    api.get("/account/transactions"),
                    api.get("/user/me")
                ]);
                setTransactions(txRes.data.transactions);
                setCurrentUserId(userRes.data.user?._id);
            } catch (error) {
                console.error("Failed to fetch transactions:", error);
                alert("Failed to fetch transaction history");
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTransactionTypeColor = (type) => {
        switch (type) {
            case 'deposit':
                return 'text-green-600 bg-green-100';
            case 'withdrawal':
                return 'text-red-600 bg-red-100';
            case 'transfer':
                return 'text-blue-600 bg-blue-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getTransactionDescription = (transaction) => {
        switch (transaction.type) {
            case 'deposit':
                return `Added ₹${transaction.amount} via ${transaction.paymentMethod}`;
            case 'withdrawal':
                return `Withdrew ₹${transaction.amount} via ${transaction.paymentMethod}`;
            case 'transfer':
                const isIncoming = currentUserId && transaction.toUserId._id === currentUserId;
                const otherParty = isIncoming
                    ? `${transaction.fromUserId.firstName} ${transaction.fromUserId.lastName}`
                    : `${transaction.toUserId.firstName} ${transaction.toUserId.lastName}`;
                return isIncoming
                    ? `Received ₹${transaction.amount} from ${otherParty}`
                    : `Sent ₹${transaction.amount} to ${otherParty}`;
            default:
                return transaction.description || 'Transaction';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Appbar />
                <div className="flex justify-center items-center p-8">
                    <div className="text-center">Loading transaction history...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Appbar />
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <Heading label={"Transaction History"} />
                    <SubHeading label={"View all your wallet transactions"} />

                    {transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No transactions found
                        </div>
                    ) : (
                        <div className="space-y-4 mt-6">
                            {transactions.map((transaction) => (
                                <div
                                    key={transaction._id}
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                                                    {transaction.type.toUpperCase()}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {formatDate(transaction.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-gray-900 font-medium">
                                                {getTransactionDescription(transaction)}
                                            </p>
                                            {transaction.description && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {transaction.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold text-lg ${transaction.type === 'deposit' || (transaction.type === 'transfer' && currentUserId && transaction.toUserId._id === currentUserId)
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                }`}>
                                                {transaction.type === 'deposit' || (transaction.type === 'transfer' && currentUserId && transaction.toUserId._id === currentUserId)
                                                    ? '+' : '-'
                                                }₹{transaction.amount}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {transaction.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
