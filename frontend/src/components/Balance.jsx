
// Format number with commas and 2 decimal places
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

export const Balance = ({ value }) => {
    return (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm opacity-80 mb-1">Available Balance</div>
                    <div className="text-3xl font-bold">{formatCurrency(value)}</div>
                </div>
                <div className="text-5xl opacity-30">💰</div>
            </div>
        </div>
    );
}