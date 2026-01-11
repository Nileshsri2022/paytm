import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import api from '../utils/api';
import { Appbar } from '../components/Appbar';
import { showSuccess, showError } from '../utils/toast';

export const ChangePin = () => {
    const [step, setStep] = useState('confirm'); // 'confirm' | 'otp' | 'newpin'
    const [code, setCode] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user, isLoaded } = useUser();

    // Request email verification
    const handleSendVerification = async () => {
        setLoading(true);
        try {
            const primaryEmail = user.primaryEmailAddress;
            if (!primaryEmail) {
                showError('No email found');
                setLoading(false);
                return;
            }

            // If already verified, skip OTP
            if (primaryEmail.verification?.status === 'verified') {
                setStep('newpin');
                showSuccess('Email already verified! Set your new PIN');
                setLoading(false);
                return;
            }

            await primaryEmail.prepareVerification({ strategy: 'email_code' });
            setStep('otp');
            showSuccess('Verification code sent to your email!');
        } catch (error) {
            console.error('Verification error:', error);
            showError(error.errors?.[0]?.message || 'Failed to send code');
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOTP = async () => {
        if (code.length !== 6) {
            showError('Enter 6-digit code');
            return;
        }
        setLoading(true);
        try {
            const result = await user.primaryEmailAddress.attemptVerification({ code });
            if (result.verification.status === 'verified') {
                setStep('newpin');
                showSuccess('Verified! Now set your new PIN');
            }
        } catch (error) {
            console.error('Verify error:', error);
            showError(error.errors?.[0]?.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    // Set new PIN
    const handleChangePin = async () => {
        if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            showError('PIN must be 4 digits');
            return;
        }
        if (newPin !== confirmPin) {
            showError('PINs do not match');
            return;
        }
        setLoading(true);
        try {
            await api.post('/pin/reset', { newPin });
            showSuccess('PIN changed successfully!');
            navigate('/dashboard');
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to change PIN');
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    const userEmail = user?.primaryEmailAddress?.emailAddress || 'your email';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            <Appbar />
            <div className="max-w-md mx-auto p-6 pt-20">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <h1 className="text-2xl font-bold text-center mb-2 dark:text-white">
                        🔐 Change PIN
                    </h1>
                    <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
                        Verify your email to reset PIN
                    </p>

                    {/* Step 1: Confirm */}
                    {step === 'confirm' && (
                        <div className="space-y-4">
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    We'll send a verification code to:
                                </p>
                                <p className="font-semibold text-gray-900 dark:text-white mt-1">
                                    {userEmail}
                                </p>
                            </div>
                            <button
                                onClick={handleSendVerification}
                                disabled={loading}
                                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send Verification Code'}
                            </button>
                            <button
                                onClick={() => navigate(-1)}
                                className="w-full py-2 text-gray-500"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Step 2: OTP */}
                    {step === 'otp' && (
                        <div className="space-y-4">
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                Enter the 6-digit code sent to {userEmail}
                            </p>
                            <input
                                type="text"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                className="w-full p-4 text-center text-3xl tracking-widest border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="••••••"
                            />
                            <button
                                onClick={handleVerifyOTP}
                                disabled={loading}
                                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>
                            <button
                                onClick={() => setStep('confirm')}
                                className="w-full py-2 text-gray-500 hover:text-gray-700"
                            >
                                ← Resend Code
                            </button>
                        </div>
                    )}

                    {/* Step 3: New PIN */}
                    {step === 'newpin' && (
                        <div className="space-y-4">
                            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-center">
                                <span className="text-green-700 dark:text-green-300">✓ Email verified</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                                    New 4-digit PIN
                                </label>
                                <input
                                    type="password"
                                    maxLength={4}
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full p-4 text-center text-2xl tracking-widest border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                                    Confirm PIN
                                </label>
                                <input
                                    type="password"
                                    maxLength={4}
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full p-4 text-center text-2xl tracking-widest border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="••••"
                                />
                            </div>
                            <button
                                onClick={handleChangePin}
                                disabled={loading}
                                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? 'Changing...' : 'Change PIN'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
