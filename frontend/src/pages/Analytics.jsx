import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Appbar } from '../components/Appbar';
import { showError } from '../utils/toast';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

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

    // Transform monthly data for recharts
    const monthlyChartData = data?.monthlyBreakdown?.map(m => ({
        name: months[m._id.month - 1],
        Sent: m.sent,
        Received: m.received
    })) || [];

    // Colors for pie chart
    const COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#ec4899'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            <Appbar />
            <div className="max-w-6xl mx-auto px-3 md:p-6 py-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">📊 Analytics</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Spending patterns</p>
                    </div>
                    <div className="flex gap-1.5 md:gap-2 overflow-x-auto">
                        {['week', 'month', 'year', 'all'].map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm font-medium capitalize transition ${period === p
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                                    }`}
                            >
                                {p === 'all' ? 'All' : p}
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
                        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    </div>
                ) : data && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mb-4 md:mb-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 md:p-5 border border-gray-100 dark:border-gray-700">
                                <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-1">Total Sent</p>
                                <p className="text-lg md:text-2xl font-bold text-red-500">
                                    {formatAmount(data.summary.totalSent)}
                                </p>
                                <span className="text-xs text-gray-400">↑ Outgoing</span>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Received</p>
                                <p className="text-2xl font-bold text-green-500">
                                    {formatAmount(data.summary.totalReceived)}
                                </p>
                                <span className="text-xs text-gray-400">↓ Incoming</span>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Net Flow</p>
                                <p className={`text-2xl font-bold ${data.summary.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {data.summary.netFlow >= 0 ? '+' : ''}{formatAmount(data.summary.netFlow)}
                                </p>
                                <span className="text-xs text-gray-400">{data.summary.netFlow >= 0 ? '📈 Profit' : '📉 Loss'}</span>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Transactions</p>
                                <p className="text-2xl font-bold text-indigo-500">
                                    {data.summary.transactionCount}
                                </p>
                                <span className="text-xs text-gray-400">Total count</span>
                            </div>
                        </div>

                        {/* Monthly Bar Chart */}
                        {monthlyChartData.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6 border border-gray-100 dark:border-gray-700">
                                <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4 dark:text-white">Monthly Overview</h2>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={monthlyChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="name" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip
                                            formatter={(value) => formatAmount(value)}
                                            contentStyle={{
                                                backgroundColor: '#1f2937',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="Sent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Received" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            {/* Category Pie Chart */}
                            {data.categories?.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                                    <h2 className="text-lg font-bold mb-4 dark:text-white">Spending by Category</h2>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={data.categories}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={2}
                                                dataKey="amount"
                                                nameKey="name"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {data.categories.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatAmount(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Top Recipients */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                                <h2 className="text-lg font-bold mb-4 dark:text-white">Top Recipients</h2>
                                {data.topRecipients?.length > 0 ? (
                                    <div className="space-y-4">
                                        {data.topRecipients.map((r, idx) => (
                                            <div key={idx} className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium dark:text-white">{r.name}</p>
                                                        <p className="text-xs text-gray-500">{r.count} transactions</p>
                                                    </div>
                                                </div>
                                                <span className="font-semibold text-red-500">{formatAmount(r.totalAmount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No data available</p>
                                )}
                            </div>
                        </div>

                        {/* Top Senders - Area Chart Style */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-bold mb-4 dark:text-white">Money Received From</h2>
                            {data.topSenders?.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {data.topSenders.map((s, idx) => (
                                        <div key={idx} className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-lg">
                                                {s.name.charAt(0).toUpperCase()}
                                            </div>
                                            <p className="font-medium dark:text-white truncate">{s.name}</p>
                                            <p className="text-green-600 font-bold text-lg">{formatAmount(s.totalAmount)}</p>
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
