import { useState, useEffect } from 'react';

export const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Listen for install prompt
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        // Listen for successful install
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Don't show again for 7 days
        localStorage.setItem('pwa-dismissed', Date.now().toString());
    };

    // Check if dismissed recently
    useEffect(() => {
        const dismissed = localStorage.getItem('pwa-dismissed');
        if (dismissed) {
            const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                setShowPrompt(false);
            }
        }
    }, []);

    if (isInstalled || !showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl p-4 z-50 animate-slide-up">
            <div className="flex items-start gap-3">
                <div className="text-3xl">📱</div>
                <div className="flex-1">
                    <h3 className="font-bold mb-1">Install PayTM App</h3>
                    <p className="text-sm opacity-90">Add to home screen for quick access</p>
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-white/60 hover:text-white text-xl"
                >
                    ×
                </button>
            </div>
            <div className="flex gap-2 mt-3">
                <button
                    onClick={handleDismiss}
                    className="flex-1 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition"
                >
                    Not Now
                </button>
                <button
                    onClick={handleInstall}
                    className="flex-1 py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold hover:bg-gray-100 transition"
                >
                    Install
                </button>
            </div>
        </div>
    );
};
