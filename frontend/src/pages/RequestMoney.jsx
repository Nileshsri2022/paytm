import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Appbar } from '../components/Appbar';
import { SkeletonUserList } from '../components/Skeleton';
import { showSuccess, showError, showInfo } from '../utils/toast';
import { PinModal } from '../components/PinModal';

export const RequestMoney = () => {
    const [sent, setSent] = useState([]);
    const [received, setReceived] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [formData, setFormData] = useState({ toUserId: '', amount: '', message: '' });
    const [activeTab, setActiveTab] = useState('received');
    const [pinModal, setPinModal] = useState({ open: false, requestId: null, amount: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        fetchRequests();
        fetchBeneficiaries();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/requests');
            setSent(res.data.sent);
            setReceived(res.data.received);
        } catch (error) {
            showError('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchBeneficiaries = async () => {
        try {
            const res = await api.get('/beneficiaries');
            setBeneficiaries(res.data.beneficiaries);
        } catch (error) { }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.toUserId || !formData.amount) {
            showError('Please fill required fields');
            return;
        }
        try {
            const res = await api.post('/requests', formData);
            setSent([res.data.request, ...sent]);
            setShowForm(false);
            setFormData({ toUserId: '', amount: '', message: '' });
            showSuccess('Request sent!');
        } catch (error) {
            showError(error.response?.data?.message || 'Failed');
        }
    };

    const openPinModal = (requestId, amount) => {
        setPinModal({ open: true, requestId, amount });
    };

    const handlePay = async (pin) => {
        try {
            await api.post(`/requests/${pinModal.requestId}/pay`, { pin });
            fetchRequests();
            showSuccess('Paid successfully!');
        } catch (error) {
            showError(error.response?.data?.message || 'Payment failed');
            throw error;
        }
    };

    const handleDecline = async (id) => {
        try {
            await api.post(`/requests/${id}/decline`);
            setReceived(received.map(r => r._id === id ? { ...r, status: 'declined' } : r));
            showInfo('Request declined');
        } catch (error) {
            showError('Failed');
        }
    };

    const handleCancel = async (id) => {
        try {
            await api.delete(`/requests/${id}`);
            setSent(sent.filter(r => r._id !== id));
            showInfo('Request cancelled');
        } catch (error) {
            showError('Failed');
        }
    };

    const getStatusColor = (status) => ({
        pending: 'bg-yellow-100 text-yellow-700',
        paid: 'bg-green-100 text-green-700',
        declined: 'bg-red-100 text-red-700',
        expired: 'bg-gray-100 text-gray-700'
    }[status] || 'bg-gray-100');

    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short'
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            <Appbar />
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💸 Request Money</h1>
                        <p className="text-gray-500 dark:text-gray-400">Send and manage payment requests</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        {showForm ? 'Cancel' : '+ New Request'}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select
                                value={formData.toUserId}
                                onChange={(e) => setFormData({ ...formData, toUserId: e.target.value })}
                                className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                required
                            >
                                <option value="">Request from...</option>
                                {beneficiaries.map(b => (
                                    <option key={b._id} value={b.beneficiaryId._id}>
                                        {b.nickname || `${b.beneficiaryId.firstName}`}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Amount (₹)"
                                required
                            />
                            <input
                                type="text"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Message (optional)"
                            />
                        </div>
                        <button type="submit" className="mt-4 w-full py-2 bg-green-600 text-white rounded-lg">
                            Send Request
                        </button>
                    </form>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('received')}
                        className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'received'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                    >
                        📥 Received ({received.filter(r => r.status === 'pending').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'sent'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                    >
                        📤 Sent
                    </button>
                </div>

                {loading ? (
                    <SkeletonUserList count={4} />
                ) : (
                    <div className="space-y-3">
                        {(activeTab === 'received' ? received : sent).length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                                <span className="text-5xl">📭</span>
                                <p className="mt-2 text-gray-500">No {activeTab} requests</p>
                            </div>
                        ) : (
                            (activeTab === 'received' ? received : sent).map(req => (
                                <div key={req._id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </span>
                                            <div className="font-semibold text-gray-900 dark:text-white mt-1">
                                                ₹{req.amount} {activeTab === 'received' ? 'from' : 'to'}{' '}
                                                {activeTab === 'received'
                                                    ? `${req.fromUserId?.firstName}`
                                                    : `${req.toUserId?.firstName}`}
                                            </div>
                                            <div className="text-sm text-gray-500">{req.message} • {formatDate(req.createdAt)}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            {activeTab === 'received' && req.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => openPinModal(req._id, req.amount)}
                                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                                    >
                                                        ✓ Pay ₹{req.amount}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDecline(req._id)}
                                                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            )}
                                            {activeTab === 'sent' && req.status === 'pending' && (
                                                <button
                                                    onClick={() => handleCancel(req._id)}
                                                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
            <PinModal
                isOpen={pinModal.open}
                onClose={() => setPinModal({ open: false, requestId: null, amount: 0 })}
                onSubmit={handlePay}
                amount={pinModal.amount}
                description="Pay request"
            />
        </div>
    );
};
