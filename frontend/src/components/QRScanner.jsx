import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
// import jsQR from 'jsqr';

export const QRScanner = ({ onScanSuccess, onScanError, onClose }) => {
    const [error, setError] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // Back camera
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const scanQR = () => {
            if (webcamRef.current && canvasRef.current) {
                const video = webcamRef.current.video;
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);

                    if (code) {
                        try {
                            const qrData = JSON.parse(code.data);
                            onScanSuccess(qrData);
                        } catch (parseError) {
                            setError('Invalid QR code format');
                            onScanError('Invalid QR code format');
                        }
                    }
                }
            }
        };

        const interval = setInterval(scanQR, 100); // Scan every 100ms
        return () => clearInterval(interval);
    }, []);

    const handleError = (error) => {
        console.error('QR Scanner error:', error);
        setError('Camera access denied or unavailable');
        onScanError('Camera access denied or unavailable');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div className="relative">
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                            facingMode: facingMode
                        }}
                        onUserMediaError={handleError}
                        className="w-full rounded-lg"
                        style={{
                            borderRadius: '8px',
                            objectFit: 'cover'
                        }}
                    />

                    {/* Hidden canvas for QR processing */}
                    <canvas
                        ref={canvasRef}
                        style={{ display: 'none' }}
                    />

                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg"></div>
                    </div>
                </div>

                <div className="mt-4 text-center text-sm text-gray-600">
                    Position QR code within the frame to scan
                </div>

                <div className="mt-4 flex justify-center space-x-2">
                    <button
                        onClick={() => setFacingMode(facingMode === 'environment' ? 'user' : 'environment')}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                    >
                        Switch Camera
                    </button>
                </div>
            </div>
        </div>
    );
};
