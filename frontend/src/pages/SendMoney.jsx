import { useSearchParams, useNavigate } from 'react-router-dom';
import api from "../utils/api";
import { useState, useEffect } from 'react';
import { showSuccess, showError, showInfo } from '../utils/toast';

export const SendMoney = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const id = searchParams.get("id");
    const name = searchParams.get("name");
    const [amount, setAmount] = useState(0);
    const [pin, setPin] = useState('');
    const [pinStatus, setPinStatus] = useState({ isSet: false, loading: true });
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [newPin, setNewPin] = useState('');

    // Check PIN status on mount
    useEffect(() => {
        api.get('/pin/status').then(res => {
            setPinStatus({ isSet: res.data.isSet, loading: false });
        }).catch(() => setPinStatus({ isSet: false, loading: false }));
    }, []);

    // Redirect if no recipient specified
    useEffect(() => {
        if (!id || !name) {
            showInfo("Please select a recipient from the dashboard");
            navigate('/dashboard');
        }
    }, [id, name, navigate]);

    const handleSetPin = async () => {
        if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            showError('PIN must be 4 digits');
            return;
        }
        try {
            await api.post('/pin/set', { pin: newPin });
            setPinStatus({ isSet: true, loading: false });
            setShowPinSetup(false);
            showSuccess('PIN set successfully!');
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to set PIN');
        }
    };

    const handleTransfer = async () => {
        if (!amount || Number(amount) <= 0) {
            showError("Please enter an amount greater than 0");
            return;
        }
        if (!pinStatus.isSet) {
            setShowPinSetup(true);
            return;
        }
        if (pin.length !== 4) {
            showError("Enter 4-digit PIN");
            return;
        }
        try {
            await api.post("/account/transfer", {
                to: id,
                amount: Number(amount),
                pin
            });
            showSuccess("Transfer successful!");
            navigate('/dashboard');
        } catch (error) {
            console.error("Transfer failed:", error);
            if (error.response?.data?.needsPinSetup) {
                setShowPinSetup(true);
            } else {
                showError(error.response?.data?.message || "Transfer failed");
            }
        }
    };

    if (!id || !name) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="flex justify-center h-screen bg-gray-100 dark:bg-gray-900">
            <div className="h-full flex flex-col justify-center">
                <div className="border h-min text-card-foreground max-w-md p-4 space-y-8 w-96 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h2 className="text-3xl font-bold text-center dark:text-white">Send Money</h2>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-2xl text-white">{name[0].toUpperCase()}</span>
                            </div>
                            <h3 className="text-2xl font-semibold dark:text-white">{name}</h3>
                        </div>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium dark:text-gray-300">Amount (₹)</label>
                                <input
                                    onChange={(e) => setAmount(e.target.value)}
                                    type="number"
                                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Enter amount"
                                />
                            </div>

                            {/* PIN Setup Modal */}
                            {showPinSetup && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                                        🔒 Set your 4-digit Transaction PIN
                                    </p>
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                        className="w-full h-10 text-center text-2xl tracking-widest border rounded-lg dark:bg-gray-700"
                                        placeholder="••••"
                                    />
                                    <button
                                        onClick={handleSetPin}
                                        className="mt-2 w-full py-2 bg-yellow-500 text-white rounded-lg"
                                    >
                                        Set PIN
                                    </button>
                                </div>
                            )}

                            {/* PIN Input */}
                            {pinStatus.isSet && !showPinSetup && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium dark:text-gray-300">
                                        🔐 Transaction PIN
                                    </label>
                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                        className="flex h-12 w-full rounded-md border px-3 py-2 text-center text-2xl tracking-widest dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="••••"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleTransfer}
                                className="justify-center rounded-md text-sm font-medium h-10 px-4 py-2 w-full bg-green-500 hover:bg-green-600 text-white"
                            >
                                {pinStatus.loading ? 'Loading...' : 'Initiate Transfer'}
                            </button>

                            {pinStatus.isSet && (
                                <button
                                    onClick={() => navigate('/change-pin')}
                                    className="w-full text-center text-sm text-indigo-500 hover:text-indigo-600"
                                >
                                    Forgot PIN? Reset via Email
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
