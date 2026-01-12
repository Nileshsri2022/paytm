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
            <div className="max-w-4xl mx-auto px-4 py-4 md:p-6 overflow-x-hidden">
                {/* Header */}
                <div className="mb-5">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        ⭐ Saved Beneficiaries
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Quick pay to your favorites
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
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
                                className="bg-white dark:bg-gray-800 rounded-xl shadow p-4"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    {/* User Info */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-sm md:text-lg">
                                                {b.beneficiaryId?.firstName?.[0]?.toUpperCase() || '?'}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base truncate">
                                                {b.nickname || `${b.beneficiaryId?.firstName} ${b.beneficiaryId?.lastName}`}
                                            </div>
                                            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                                                {b.beneficiaryId?.username}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleQuickPay(b)}
                                            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
                                        >
                                            ⚡ Pay
                                        </button>
                                        <button
                                            onClick={() => handleRemove(b._id)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg"
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

