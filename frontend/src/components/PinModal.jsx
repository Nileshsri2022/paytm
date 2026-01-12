import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { showError } from '../utils/toast';

// Reusable PIN verification modal - ONLY for verification, not setup
export const PinModal = ({ isOpen, onClose, onSubmit, amount, description }) => {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
            const errorData = error.response?.data;
            // If user needs PIN setup, redirect to setup page
            if (errorData?.needsPinSetup) {
                onClose();
                navigate('/setup-pin', { state: { returnUrl: window.location.pathname } });
            }
            // Other errors handled by parent
        }
        setLoading(false);
        setPin('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-80 shadow-xl">
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
            </div>
        </div>
    );
};
