import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { Appbar } from '../components/Appbar';
import { showSuccess, showError } from '../utils/toast';

export const SetupPIN = () => {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState(1); // 1: enter, 2: confirm
    const [loading, setLoading] = useState(false);
    const [pinStatus, setPinStatus] = useState({ isSet: false, loading: true });
    const navigate = useNavigate();
    const location = useLocation();
    const returnUrl = location.state?.returnUrl || '/dashboard';

    useEffect(() => {
        api.get('/pin/status').then(res => {
            setPinStatus({ isSet: res.data.isSet, loading: false });
            if (res.data.isSet) {
                navigate(returnUrl);
            }
        }).catch(() => setPinStatus({ isSet: false, loading: false }));
    }, []);

    const handleContinue = () => {
        if (pin.length !== 4 || !/^\d+$/.test(pin)) {
            showError('PIN must be 4 digits');
            return;
        }
        setStep(2);
    };

    const handleSetPin = async () => {
        if (confirmPin !== pin) {
            showError('PINs do not match');
            setConfirmPin('');
            return;
        }
        setLoading(true);
        try {
            await api.post('/pin/set', { pin });
            showSuccess('PIN set successfully! 🔐');
            navigate(returnUrl);
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to set PIN');
        }
        setLoading(false);
    };

    if (pinStatus.loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="text-xl dark:text-white">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            <Appbar />
            <div className="max-w-md mx-auto p-6 pt-20">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-4">🔐</div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {step === 1 ? 'Set Transaction PIN' : 'Confirm PIN'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            {step === 1
                                ? 'Create a 4-digit PIN to secure your payments'
                                : 'Re-enter your PIN to confirm'}
                        </p>
                    </div>

                    {step === 1 ? (
                        <>
                            <input
                                type="password"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="• • • •"
                                autoFocus
                                className="w-full p-4 text-center text-3xl tracking-[1rem] border-2 rounded-xl mb-6 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-indigo-500 outline-none"
                            />
                            <button
                                onClick={handleContinue}
                                disabled={pin.length !== 4}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-indigo-700 transition"
                            >
                                Continue
                            </button>
                        </>
                    ) : (
                        <>
                            <input
                                type="password"
                                maxLength={4}
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="• • • •"
                                autoFocus
                                className="w-full p-4 text-center text-3xl tracking-[1rem] border-2 rounded-xl mb-6 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-indigo-500 outline-none"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setStep(1); setConfirmPin(''); }}
                                    className="flex-1 py-4 border-2 rounded-xl font-semibold dark:border-gray-600 dark:text-white"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSetPin}
                                    disabled={loading || confirmPin.length !== 4}
                                    className="flex-1 py-4 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-green-700 transition"
                                >
                                    {loading ? 'Setting...' : 'Set PIN'}
                                </button>
                            </div>
                        </>
                    )}

                    <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        <p>💡 Choose a PIN you'll remember</p>
                        <p>This PIN will be required for all payments</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
