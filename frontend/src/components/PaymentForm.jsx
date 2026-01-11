import { useState } from 'react';
import api from '../utils/api';

export const PaymentForm = ({ qrData, onPaymentSuccess, onCancel }) => {
    const [amount, setAmount] = useState(qrData.amount || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAmountChange = (e) => {
        const value = e.target.value;
        // Only allow numbers and decimal point
        if (/^\d*\.?\d*$/.test(value) || value === '') {
            setAmount(value);
        }
    };

    const validateAndPay = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // First validate the payment
            const validationResponse = await api.post("/account/scan-pay", {
                qrData: qrData,
                amount: parseFloat(amount)
            });

            // If validation successful, confirm payment
            const confirmResponse = await api.post("/account/confirm-payment", {
                recipientId: qrData.userId,
                amount: parseFloat(amount),
                description: `Scan & Pay to ${qrData.userName}`
            });

            onPaymentSuccess(confirmResponse.data);
        } catch (error) {
            console.error('Payment failed:', error);
            setError(error.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Confirm Payment</h3>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Recipient Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-white font-semibold">
                                    {qrData.userName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{qrData.userName}</div>
                                <div className="text-sm text-gray-500">PayTM User</div>
                            </div>
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount (₹)
                        </label>
                        <input
                            type="text"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Enter amount"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            disabled={loading}
                        />
                        {qrData.amount && (
                            <p className="text-xs text-gray-500 mt-1">
                                Requested amount: ₹{qrData.amount}
                            </p>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={validateAndPay}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </>
                            ) : (
                                `Pay ₹${amount || '0'}`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
