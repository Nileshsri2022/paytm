import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Appbar } from '../components/Appbar';
import { SkeletonUserList } from '../components/Skeleton';
import { showSuccess, showError } from '../utils/toast';

export const Beneficiaries = () => {
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBeneficiaries();
    }, []);

    const fetchBeneficiaries = async () => {
        try {
            const response = await api.get('/beneficiaries');
            setBeneficiaries(response.data.beneficiaries);
        } catch (error) {
            showError('Failed to load beneficiaries');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id) => {
        if (!confirm('Remove this beneficiary?')) return;
        try {
            await api.delete(`/beneficiaries/${id}`);
            setBeneficiaries(prev => prev.filter(b => b._id !== id));
            showSuccess('Beneficiary removed');
        } catch (error) {
            showError('Failed to remove');
        }
    };

    const handleQuickPay = (beneficiary) => {
        const user = beneficiary.beneficiaryId;
        navigate(`/send?id=${user._id}&name=${user.firstName} ${user.lastName}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            <Appbar />
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            ⭐ Saved Beneficiaries
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Quick pay to your favorite recipients
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        + Add from Users
                    </button>
                </div>

                {loading ? (
                    <SkeletonUserList count={4} />
                ) : beneficiaries.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                        <span className="text-6xl">👤</span>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">
                            No saved beneficiaries yet
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg"
                        >
                            Go to Dashboard to Add
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {beneficiaries.map((b) => (
                            <div
                                key={b._id}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">
                                            {b.beneficiaryId?.firstName?.[0]?.toUpperCase() || '?'}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                            {b.nickname || `${b.beneficiaryId?.firstName} ${b.beneficiaryId?.lastName}`}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {b.beneficiaryId?.username}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleQuickPay(b)}
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                                    >
                                        ⚡ Pay
                                    </button>
                                    <button
                                        onClick={() => handleRemove(b._id)}
                                        className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
