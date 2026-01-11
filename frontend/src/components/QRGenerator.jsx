import { useState, useEffect } from 'react';
import axios from 'axios';

export const QRGenerator = ({ amount, onClose }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        generateQR();
    }, [amount]);

    const generateQR = async () => {
        setLoading(true);
        setError('');

        try {
            // Get QR data from backend
            const response = await axios.post("http://localhost:3000/api/v1/account/generate-qr", {
                amount: amount || null
            }, {
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token")
                }
            });

            const qrData = response.data.qrData;

            // Generate QR code using a simple online service
            const qrString = JSON.stringify(qrData);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrString)}&format=png`;

            // Test if the QR service is accessible
            try {
                const testResponse = await fetch(qrUrl, { method: 'HEAD' });
                if (testResponse.ok) {
                    setQrCodeUrl(qrUrl);
                } else {
                    throw new Error('QR service unavailable');
                }
            } catch (serviceError) {
                console.error('QR service error:', serviceError);
                // Fallback: Create a simple text-based QR representation
                setError('QR code service unavailable - showing payment details instead');
                setQrCodeUrl(null);
            }
        } catch (error) {
            console.error('Failed to generate QR:', error);
            setError(error.response?.data?.message || 'Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    const downloadQR = async () => {
        if (qrCodeUrl) {
            try {
                const response = await fetch(qrCodeUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `paytm-qr-${amount || 'any-amount'}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                alert('Failed to download QR code');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {amount ? `Receive ₹${amount}` : 'Receive Payment'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {loading && (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        <span className="ml-2 text-gray-600">Generating QR...</span>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {qrCodeUrl && !loading && (
                    <div className="text-center">
                        <div className="mb-4">
                            <img
                                src={qrCodeUrl}
                                alt="Payment QR Code"
                                className="mx-auto border-2 border-gray-200 rounded-lg"
                                style={{ maxWidth: '200px' }}
                            />
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            {amount
                                ? `Show this QR code to receive ₹${amount}`
                                : 'Show this QR code to receive any amount'
                            }
                        </p>

                        <div className="space-y-2">
                            <button
                                onClick={downloadQR}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                Download QR
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {!qrCodeUrl && !loading && error && (
                    <div className="text-center">
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
                            <p className="text-sm text-gray-600">
                                Share these details to receive payment:
                            </p>
                            <div className="mt-2 p-2 bg-white border rounded text-xs font-mono break-all">
                                {JSON.stringify(qrData, null, 2)}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(qrData));
                                    alert('Payment details copied to clipboard!');
                                }}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                Copy Details
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
