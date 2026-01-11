import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { Appbar } from "../components/Appbar";
import { Heading } from "../components/Heading";
import { InputBox } from "../components/InputBox";
import { SubHeading } from "../components/SubHeading";
import { showSuccess, showError } from '../utils/toast';

export const WithdrawMoney = () => {
    const [amount, setAmount] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifscCode, setIfscCode] = useState("");
    const [accountHolderName, setAccountHolderName] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasBankLinked, setHasBankLinked] = useState(false);
    const [linkingBank, setLinkingBank] = useState(false);
    const [userBalance, setUserBalance] = useState(0);
    const navigate = useNavigate();

    // Fetch user profile and balance on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const [profileRes, balanceRes] = await Promise.all([
                    api.get("/user/me"),
                    api.get("/account/balance")
                ]);

                setHasBankLinked(!!profileRes.data.user?.razorpayFundAccountId);
                setUserBalance(balanceRes.data.balance);
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            }
        };
        fetchUserData();
    }, []);

    const handleLinkBank = async () => {
        if (!accountNumber || !ifscCode || !accountHolderName) {
            showError("Please fill in all bank details");
            return;
        }

        setLinkingBank(true);
        try {
            await api.post(
                "/razorpay/add-bank-account",
                {
                    accountName: accountHolderName,
                    ifsc: ifscCode,
                    accountNumber: accountNumber
                }
            );

            showSuccess("✅ Bank account linked successfully!");
            setHasBankLinked(true);
        } catch (error) {
            console.error("Failed to link bank:", error);
            showError(error.response?.data?.message || "Failed to link bank account");
        } finally {
            setLinkingBank(false);
        }
    };

    const handleWithdraw = async () => {
        if (!amount || Number(amount) <= 0) {
            showError("Please enter a valid amount");
            return;
        }

        if (Number(amount) > userBalance) {
            showError("Insufficient balance");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post(
                "/razorpay/payout",
                { amount: Number(amount) }
            );

            showSuccess(`💸 ${response.data.message}`);
            navigate("/dashboard");
        } catch (error) {
            console.error("Failed to withdraw:", error);
            showError(error.response?.data?.message || "Withdrawal failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Appbar />
            <div className="flex justify-center items-center p-8">
                <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8">
                    <Heading label={"Withdraw Money"} />
                    <SubHeading label={"Withdraw to your bank account via RazorpayX"} />

                    <div className="space-y-6 my-6">
                        {/* Balance Display */}
                        <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-4 rounded-xl">
                            <p className="text-sm text-gray-500">Available Balance</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₹{userBalance.toLocaleString('en-IN')}
                            </p>
                        </div>

                        {!hasBankLinked ? (
                            // Bank Account Linking Form
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Link Bank Account</h3>

                                <InputBox
                                    placeholder="John Doe"
                                    label={"Account Holder Name"}
                                    value={accountHolderName}
                                    onChange={(e) => setAccountHolderName(e.target.value)}
                                />

                                <InputBox
                                    placeholder="1234567890123"
                                    label={"Account Number"}
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                />

                                <InputBox
                                    placeholder="SBIN0001234"
                                    label={"IFSC Code"}
                                    value={ifscCode}
                                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                                />

                                <div className="bg-yellow-50 p-3 rounded-lg">
                                    <p className="text-sm text-yellow-700">
                                        ⚠️ <strong>Test Mode:</strong> Use any random bank details
                                    </p>
                                </div>

                                <button
                                    onClick={handleLinkBank}
                                    disabled={linkingBank}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
                                >
                                    {linkingBank ? "Linking..." : "Link Bank Account"}
                                </button>
                            </div>
                        ) : (
                            // Withdrawal Form
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                                    <p className="text-green-700 font-medium">✅ Bank account linked</p>
                                </div>

                                <InputBox
                                    placeholder="Enter amount"
                                    label={"Withdrawal Amount (₹)"}
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />

                                <button
                                    onClick={handleWithdraw}
                                    disabled={loading || !amount}
                                    className={`w-full py-4 rounded-xl text-lg font-semibold transition-all ${loading || !amount
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-lg hover:-translate-y-0.5"
                                        }`}
                                >
                                    {loading ? "Processing..." : `Withdraw ₹${amount || "0"}`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
