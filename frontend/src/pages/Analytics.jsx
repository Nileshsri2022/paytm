import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Appbar } from '../components/Appbar';
import { showError } from '../utils/toast';

export const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/analytics?period=${period}`);
            setData(res.data);
        } catch (error) {
            showError('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const maxMonthlyValue = data?.monthlyBreakdown?.reduce((max, m) =>
        Math.max(max, m.sent, m.received), 0) || 1;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            <Appbar />
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Analytics</h1>
                        <p className="text-gray-500 dark:text-gray-400">Track your spending patterns</p>
                    </div>
                    <div className="flex gap-2">
                        {['week', 'month', 'year', 'all'].map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-lg font-medium capitalize ${period === p
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                                    }`}
                            >
                                {p === 'all' ? 'All Time' : p}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="animate-pulse space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                            ))}
                        </div>
                        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    </div>
                ) : data && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Sent</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {formatAmount(data.summary.totalSent)}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Received</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatAmount(data.summary.totalReceived)}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Net Flow</p>
                                <p className={`text-2xl font-bold ${data.summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {data.summary.netFlow >= 0 ? '+' : ''}{formatAmount(data.summary.netFlow)}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Transactions</p>
                                <p className="text-2xl font-bold text-indigo-600">
                                    {data.summary.transactionCount}
                                </p>
                            </div>
                        </div>

                        {/* Monthly Chart */}
                        {data.monthlyBreakdown?.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
                                <h2 className="text-lg font-bold mb-4 dark:text-white">Monthly Overview</h2>
                                <div className="flex items-end justify-between h-48 gap-2">
                                    {data.monthlyBreakdown.map((m, idx) => (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                            <div className="w-full flex gap-1 h-40 items-end">
                                                {/* Sent bar */}
                                                <div
                                                    className="flex-1 bg-red-400 rounded-t"
                                                    style={{ height: `${(m.sent / maxMonthlyValue) * 100}%`, minHeight: m.sent ? '4px' : '0' }}
                                                    title={`Sent: ${formatAmount(m.sent)}`}
                                                ></div>
                                                {/* Received bar */}
                                                <div
                                                    className="flex-1 bg-green-400 rounded-t"
                                                    style={{ height: `${(m.received / maxMonthlyValue) * 100}%`, minHeight: m.received ? '4px' : '0' }}
                                                    title={`Received: ${formatAmount(m.received)}`}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-500">{months[m._id.month - 1]}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-center gap-6 mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-400 rounded"></div>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Sent</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-400 rounded"></div>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Received</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            {/* Categories Breakdown */}
                            {data.categories?.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                                    <h2 className="text-lg font-bold mb-4 dark:text-white">Spending by Category</h2>
                                    <div className="space-y-3">
                                        {data.categories.map((cat, idx) => {
                                            const total = data.categories.reduce((s, c) => s + c.amount, 0);
                                            const percent = ((cat.amount / total) * 100).toFixed(0);
                                            const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500'];
                                            return (
                                                <div key={idx}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="dark:text-gray-300">{cat.name}</span>
                                                        <span className="text-gray-500">{formatAmount(cat.amount)} ({percent}%)</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${colors[idx % colors.length]} rounded-full`}
                                                            style={{ width: `${percent}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Top Recipients */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                                <h2 className="text-lg font-bold mb-4 dark:text-white">Top Recipients</h2>
                                {data.topRecipients?.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.topRecipients.map((r, idx) => (
                                            <div key={idx} className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium dark:text-white">{r.name}</p>
                                                        <p className="text-xs text-gray-500">{r.count} transactions</p>
                                                    </div>
                                                </div>
                                                <span className="font-semibold text-red-600">{formatAmount(r.totalAmount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No data</p>
                                )}
                            </div>
                        </div>

                        {/* Top Senders */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                            <h2 className="text-lg font-bold mb-4 dark:text-white">Top Senders (Money Received From)</h2>
                            {data.topSenders?.length > 0 ? (
                                <div className="grid md:grid-cols-5 gap-4">
                                    {data.topSenders.map((s, idx) => (
                                        <div key={idx} className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400 font-bold mx-auto mb-2">
                                                {s.name.charAt(0)}
                                            </div>
                                            <p className="font-medium dark:text-white truncate">{s.name}</p>
                                            <p className="text-green-600 font-semibold">{formatAmount(s.totalAmount)}</p>
                                            <p className="text-xs text-gray-500">{s.count} times</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No incoming transactions</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
