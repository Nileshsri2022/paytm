import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appbar } from '../components/Appbar';
import { QRScanner } from '../components/QRScanner';
import { PaymentForm } from '../components/PaymentForm';
import { QRGenerator } from '../components/QRGenerator';

export const ScanPay = () => {
    const [currentView, setCurrentView] = useState('menu'); // menu, scan, payment, qr
    const [scannedData, setScannedData] = useState(null);
    const [paymentResult, setPaymentResult] = useState(null);
    const navigate = useNavigate();

    const handleScanSuccess = (qrData) => {
        if (qrData && qrData.type === 'paytm_payment') {
            setScannedData(qrData);
            setCurrentView('payment');
        } else {
            alert('Invalid QR code. Please scan a valid PayTM payment code.');
        }
    };

    const handleScanError = (error) => {
        console.error('Scan error:', error);
        // Error is already handled in QRScanner component
    };

    const handlePaymentSuccess = (result) => {
        setPaymentResult(result);
        setCurrentView('menu');
        // Refresh balance in dashboard
        if (window.refreshBalance) {
            window.refreshBalance();
        }
        // Redirect to dashboard after short delay
        setTimeout(() => {
            navigate('/dashboard');
        }, 2000);
    };

    const handlePaymentCancel = () => {
        setCurrentView('menu');
        setScannedData(null);
    };

    const showQRGenerator = (amount = null) => {
        setCurrentView('qr');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Appbar />

            <div className="p-8">
                <div className="max-w-md mx-auto">
                    {currentView === 'menu' && (
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-center mb-2">Scan & Pay</h2>
                            <p className="text-gray-600 text-center mb-8">
                                Pay anyone instantly by scanning their QR code
                            </p>

                            <div className="space-y-4">
                                <button
                                    onClick={() => setCurrentView('scan')}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12v4.01M12 12H8l-4 8h16l-4-8z" />
                                    </svg>
                                    <span>Scan QR Code</span>
                                </button>

                                <div className="border-t border-gray-200 pt-4">
                                    <p className="text-sm text-gray-500 text-center mb-4">Or receive payments</p>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => showQRGenerator()}
                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                                        >
                                            Generate QR (Any Amount)
                                        </button>
                                        <button
                                            onClick={() => showQRGenerator(100)}
                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                                        >
                                            Generate QR (₹100)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {paymentResult && (
                                <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium">Payment Successful!</span>
                                    </div>
                                    <p className="text-sm mt-1">Redirecting to dashboard...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {currentView === 'scan' && (
                        <QRScanner
                            onScanSuccess={handleScanSuccess}
                            onScanError={handleScanError}
                            onClose={() => setCurrentView('menu')}
                        />
                    )}

                    {currentView === 'payment' && scannedData && (
                        <PaymentForm
                            qrData={scannedData}
                            onPaymentSuccess={handlePaymentSuccess}
                            onCancel={handlePaymentCancel}
                        />
                    )}

                    {currentView === 'qr' && (
                        <QRGenerator
                            amount={null}
                            onClose={() => setCurrentView('menu')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
