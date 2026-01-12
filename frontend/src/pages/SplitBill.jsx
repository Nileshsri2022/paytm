import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Appbar } from '../components/Appbar';
import { SkeletonUserList } from '../components/Skeleton';
import { showSuccess, showError, showInfo } from '../utils/toast';

export const SplitBill = () => {
    const [created, setCreated] = useState([]);
    const [participating, setParticipating] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        totalAmount: '',
        selectedParticipants: []
    });
    const [activeTab, setActiveTab] = useState('created');
    const navigate = useNavigate();

    useEffect(() => {
        fetchBills();
        fetchBeneficiaries();
    }, []);

    const fetchBills = async () => {
        try {
            const res = await api.get('/splitbill');
            setCreated(res.data.created);
            setParticipating(res.data.participating);
        } catch (error) {
            showError('Failed to load bills');
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
        if (!formData.title || !formData.totalAmount || !formData.selectedParticipants.length) {
            showError('Fill all fields and select participants');
            return;
        }
        try {
            const res = await api.post('/splitbill', {
                title: formData.title,
                totalAmount: Number(formData.totalAmount),
                participants: formData.selectedParticipants.map(id => ({ userId: id })),
                splitType: 'equal'
            });
            setCreated([res.data.bill, ...created]);
            setShowForm(false);
            setFormData({ title: '', totalAmount: '', selectedParticipants: [] });
            showSuccess('Split bill created!');
        } catch (error) {
            showError(error.response?.data?.message || 'Failed');
        }
    };

    const handlePay = async (id) => {
        try {
            await api.post(`/splitbill/${id}/pay`);
            fetchBills();
            showSuccess('Paid successfully!');
        } catch (error) {
            showError(error.response?.data?.message || 'Payment failed');
        }
    };

    const handleDecline = async (id) => {
        try {
            await api.post(`/splitbill/${id}/decline`);
            fetchBills();
            showInfo('Declined');
        } catch (error) {
            showError('Failed');
        }
    };

    const handleRemind = async (id) => {
        try {
            await api.post(`/splitbill/${id}/remind`);
            showSuccess('Reminders sent!');
        } catch (error) {
            showError('Failed');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/splitbill/${id}`);
            setCreated(created.filter(b => b._id !== id));
            showInfo('Bill cancelled');
        } catch (error) {
            showError('Failed');
        }
    };

    const toggleParticipant = (id) => {
        setFormData(prev => ({
            ...prev,
            selectedParticipants: prev.selectedParticipants.includes(id)
                ? prev.selectedParticipants.filter(p => p !== id)
                : [...prev.selectedParticipants, id]
        }));
    };

    const getStatusColor = (status) => ({
        pending: 'bg-yellow-100 text-yellow-700',
        paid: 'bg-green-100 text-green-700',
        declined: 'bg-red-100 text-red-700'
    }[status] || 'bg-gray-100');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            <Appbar />
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💵 Split Bill</h1>
                        <p className="text-gray-500 dark:text-gray-400">Split expenses with friends</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        {showForm ? 'Cancel' : '+ New Split'}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Bill title (e.g., Dinner)"
                                required
                            />
                            <input
                                type="number"
                                value={formData.totalAmount}
                                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Total Amount (₹)"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                                Select Participants (from favorites)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {beneficiaries.map(b => (
                                    <button
                                        key={b._id}
                                        type="button"
                                        onClick={() => toggleParticipant(b.beneficiaryId._id)}
                                        className={`px-3 py-1 rounded-full text-sm ${formData.selectedParticipants.includes(b.beneficiaryId._id)
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        {b.nickname || b.beneficiaryId.firstName}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {formData.totalAmount && formData.selectedParticipants.length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg mb-4 text-center">
                                <span className="text-blue-700 dark:text-blue-300">
                                    Each person pays ₹{Math.round(formData.totalAmount / (formData.selectedParticipants.length + 1))}
                                </span>
                            </div>
                        )}
                        <button type="submit" className="w-full py-2 bg-green-600 text-white rounded-lg">
                            Create Split
                        </button>
                    </form>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('created')}
                        className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'created'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                    >
                        📤 Created ({created.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('participating')}
                        className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'participating'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                    >
                        📥 My Share ({participating.filter(b =>
                            b.participants.find(p => p.status === 'pending')
                        ).length})
                    </button>
                </div>

                {loading ? (
                    <SkeletonUserList count={4} />
                ) : (
                    <div className="space-y-4">
                        {(activeTab === 'created' ? created : participating).length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                                <span className="text-5xl">📝</span>
                                <p className="mt-2 text-gray-500">No split bills</p>
                            </div>
                        ) : (
                            (activeTab === 'created' ? created : participating).map(bill => {
                                const myShare = bill.participants.find(p =>
                                    p.userId._id?.toString() === bill.createdBy?._id?.toString() ? false :
                                        participating.some(pb => pb._id === bill._id)
                                );

                                return (
                                    <div key={bill._id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-lg dark:text-white">{bill.title}</h3>
                                                <p className="text-gray-500">Total: ₹{bill.totalAmount}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs ${bill.status === 'settled' ? 'bg-green-100 text-green-700' :
                                                    bill.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {bill.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-3">
                                            {bill.participants.map((p, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span className="dark:text-gray-300">
                                                        {p.userId?.firstName || 'User'}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="dark:text-gray-400">₹{p.amount}</span>
                                                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(p.status)}`}>
                                                            {p.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {activeTab === 'created' && bill.status === 'active' && (
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={() => handleRemind(bill._id)}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm"
                                                >
                                                    🔔 Remind
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bill._id)}
                                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}

                                        {activeTab === 'participating' && (
                                            <div className="flex gap-2 mt-3">
                                                {bill.participants.map((p, idx) => {
                                                    if (p.status === 'pending') {
                                                        return (
                                                            <div key={idx} className="flex gap-2">
                                                                <button
                                                                    onClick={() => handlePay(bill._id)}
                                                                    className="px-4 py-2 bg-green-500 text-white rounded-lg"
                                                                >
                                                                    ✓ Pay ₹{p.amount}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDecline(bill._id)}
                                                                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
