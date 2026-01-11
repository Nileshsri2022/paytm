// Toast notification utility - wraps react-hot-toast
import toast from 'react-hot-toast';

// Success notifications
export const showSuccess = (message) => {
    toast.success(message, {
        duration: 3000,
        position: 'top-right',
        style: {
            background: '#10B981',
            color: '#fff',
        },
        iconTheme: {
            primary: '#fff',
            secondary: '#10B981',
        },
    });
};

// Error notifications
export const showError = (message) => {
    toast.error(message, {
        duration: 4000,
        position: 'top-right',
        style: {
            background: '#EF4444',
            color: '#fff',
        },
    });
};

// Info notifications
export const showInfo = (message) => {
    toast(message, {
        duration: 3000,
        position: 'top-right',
        icon: 'ℹ️',
    });
};

// Loading notification (returns dismiss function)
export const showLoading = (message) => {
    return toast.loading(message, {
        position: 'top-right',
    });
};

// Dismiss a specific toast
export const dismissToast = (toastId) => {
    toast.dismiss(toastId);
};

// Promise-based toast (for async operations)
export const showPromise = (promise, messages) => {
    return toast.promise(promise, {
        loading: messages.loading || 'Processing...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong',
    }, {
        position: 'top-right',
    });
};
