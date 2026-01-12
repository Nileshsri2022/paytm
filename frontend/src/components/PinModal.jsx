import { useState, useEffect } from 'react';
import api from '../utils/api';
import { showError, showSuccess } from '../utils/toast';

export const PinModal = ({ isOpen, onClose, onSubmit, amount, description }) => {
    const [pin, setPin] = useState('');
    const [pinStatus, setPinStatus] = useState({ isSet: false, loading: true });
    const [showSetup, setShowSetup] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            api.get('/pin/status').then(res => {
                setPinStatus({ isSet: res.data.isSet, loading: false });
                if (!res.data.isSet) setShowSetup(true);
            }).catch(() => setPinStatus({ isSet: false, loading: false }));
            setPin('');
        }
    }, [isOpen]);

    const handleSetPin = async () => {
        if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            showError('PIN must be 4 digits');
            return;
        }
        setLoading(true);
        try {
            await api.post('/pin/set', { pin: newPin });
            setPinStatus({ isSet: true, loading: false });
            setShowSetup(false);
            setNewPin('');
            showSuccess('PIN set successfully!');
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to set PIN');
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (pin.length !== 4) {
            showError('Enter 4-digit PIN');
            return;
        }
        setLoading(true);
        try {
            await onSubmit(pin);
            onClose();
        } catch (error) {
            // Error handled by parent
        }
        setLoading(false);
        setPin('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-80 shadow-xl">
                {pinStatus.loading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : showSetup ? (
                    <>
                        <h3 className="text-lg font-bold mb-4 dark:text-white">🔐 Set Transaction PIN</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Set a 4-digit PIN to secure your payments
                        </p>
                        <input
                            type="password"
                            maxLength={4}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 4-digit PIN"
                            className="w-full p-3 text-center text-2xl tracking-widest border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2 border rounded-lg dark:border-gray-600 dark:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSetPin}
                                disabled={loading}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {loading ? '...' : 'Set PIN'}
                            </button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <h3 className="text-lg font-bold mb-2 dark:text-white">🔒 Enter PIN</h3>
                        {description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{description}</p>
                        )}
                        {amount && (
                            <p className="text-2xl font-bold text-center text-green-600 mb-4">₹{amount}</p>
                        )}
                        <input
                            type="password"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="• • • •"
                            autoFocus
                            className="w-full p-3 text-center text-2xl tracking-widest border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2 border rounded-lg dark:border-gray-600 dark:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || pin.length !== 4}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {loading ? '...' : 'Confirm'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
