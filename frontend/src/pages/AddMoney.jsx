import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { Appbar } from "../components/Appbar";
import { Heading } from "../components/Heading";
import { InputBox } from "../components/InputBox";
import { SubHeading } from "../components/SubHeading";
import { showSuccess, showError } from '../utils/toast';

export const AddMoney = () => {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleAddMoney = async () => {
        if (!amount || Number(amount) <= 0) {
            showError("Please enter a valid amount");
            return;
        }

        setLoading(true);

        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            showError("Failed to load payment gateway. Please try again.");
            setLoading(false);
            return;
        }

        try {
            // Create order on backend
            const orderResponse = await api.post(
                "/razorpay/create-order",
                { amount: Number(amount) }
            );

            const { orderId, keyId } = orderResponse.data;

            // Open Razorpay checkout
            const options = {
                key: keyId,
                amount: Number(amount) * 100,
                currency: "INR",
                name: "PayTM Clone",
                description: "Add money to wallet",
                order_id: orderId,
                handler: async function (response) {
                    try {
                        // Verify payment on backend
                        await api.post(
                            "/razorpay/verify-payment",
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                amount: Number(amount)
                            }
                        );
                        showSuccess("💰 Money added successfully!");
                        navigate("/dashboard");
                    } catch (error) {
                        console.error("Payment verification failed:", error);
                        showError("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    email: "test@example.com"
                },
                theme: {
                    color: "#6366f1"
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error("Failed to create order:", error);
            showError(error.response?.data?.message || "Failed to initiate payment");
            setLoading(false);
        }
    };

    const quickAmounts = [100, 500, 1000, 2000];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Appbar />
            <div className="flex justify-center items-center p-8">
                <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8">
                    <Heading label={"Add Money"} />
                    <SubHeading label={"Add money to your wallet using Razorpay"} />

                    <div className="space-y-6 my-6">
                        {/* Quick Amount Buttons */}
                        <div className="grid grid-cols-4 gap-2">
                            {quickAmounts.map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => setAmount(amt.toString())}
                                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${amount === amt.toString()
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    ₹{amt}
                                </button>
                            ))}
                        </div>

                        <InputBox
                            placeholder="Enter amount"
                            label={"Custom Amount (₹)"}
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-700">
                                💳 <strong>Test Mode:</strong> Use card <code>4111 1111 1111 1111</code> or UPI <code>success@razorpay</code>
                            </p>
                        </div>

                        <button
                            onClick={handleAddMoney}
                            disabled={loading || !amount}
                            className={`w-full py-4 rounded-xl text-lg font-semibold transition-all ${loading || !amount
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:-translate-y-0.5"
                                }`}
                        >
                            {loading ? "Processing..." : `Add ₹${amount || "0"}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
