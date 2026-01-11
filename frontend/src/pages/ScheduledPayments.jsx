import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Appbar } from '../components/Appbar';
import { SkeletonUserList } from '../components/Skeleton';
import { showSuccess, showError } from '../utils/toast';

export const ScheduledPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [formData, setFormData] = useState({
        beneficiaryId: '',
        amount: '',
        description: '',
        frequency: 'once',
        nextRunDate: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchPayments();
        fetchBeneficiaries();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await api.get('/scheduled');
            setPayments(res.data.payments);
        } catch (error) {
            showError('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const fetchBeneficiaries = async () => {
        try {
            const res = await api.get('/beneficiaries');
            setBeneficiaries(res.data.beneficiaries);
        } catch (error) {
            console.error('Failed to load beneficiaries');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.beneficiaryId || !formData.amount || !formData.nextRunDate) {
            showError('Please fill all required fields');
            return;
        }
        try {
            const res = await api.post('/scheduled', formData);
            setPayments([res.data.payment, ...payments]);
            setShowForm(false);
            setFormData({ beneficiaryId: '', amount: '', description: '', frequency: 'once', nextRunDate: '' });
            showSuccess('Payment scheduled!');
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to schedule');
        }
    };

    const handleToggle = async (id) => {
        try {
            const res = await api.patch(`/scheduled/${id}/toggle`);
            setPayments(payments.map(p => p._id === id ? res.data.payment : p));
            showSuccess(`Payment ${res.data.payment.status}`);
        } catch (error) {
            showError('Failed to update');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this scheduled payment?')) return;
        try {
            await api.delete(`/scheduled/${id}`);
            setPayments(payments.filter(p => p._id !== id));
            showSuccess('Deleted');
        } catch (error) {
            showError('Failed to delete');
        }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    const getStatusColor = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-700',
            paused: 'bg-yellow-100 text-yellow-700',
            completed: 'bg-gray-100 text-gray-700',
            failed: 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            <Appbar />
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📅 Scheduled Payments</h1>
                        <p className="text-gray-500 dark:text-gray-400">Auto-pay on specific dates</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        {showForm ? 'Cancel' : '+ New Schedule'}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Recipient *
                                </label>
                                <select
                                    value={formData.beneficiaryId}
                                    onChange={(e) => setFormData({ ...formData, beneficiaryId: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    required
                                >
                                    <option value="">Select beneficiary</option>
                                    {beneficiaries.map(b => (
                                        <option key={b._id} value={b.beneficiaryId._id}>
                                            {b.nickname || `${b.beneficiaryId.firstName} ${b.beneficiaryId.lastName}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="1000"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Frequency
                                </label>
                                <select
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="once">One-time</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Start Date *
                                </label>
                                <input
                                    type="date"
                                    value={formData.nextRunDate}
                                    onChange={(e) => setFormData({ ...formData, nextRunDate: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="Monthly rent, etc."
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="mt-4 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Schedule Payment
                        </button>
                    </form>
                )}

                {loading ? (
                    <SkeletonUserList count={4} />
                ) : payments.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                        <span className="text-6xl">📅</span>
                        <p className="mt-4 text-gray-500">No scheduled payments yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {payments.map(p => (
                            <div key={p._id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
                                                {p.status}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {p.frequency}
                                            </span>
                                        </div>
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                            ₹{p.amount} → {p.beneficiaryId?.firstName} {p.beneficiaryId?.lastName}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {p.description} • Next: {formatDate(p.nextRunDate)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {p.status !== 'completed' && (
                                            <button
                                                onClick={() => handleToggle(p._id)}
                                                className={`px-3 py-1 rounded-lg text-sm ${p.status === 'active'
                                                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    }`}
                                            >
                                                {p.status === 'active' ? '⏸️' : '▶️'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(p._id)}
                                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
