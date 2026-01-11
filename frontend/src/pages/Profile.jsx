import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Appbar } from "../components/Appbar";
import { Button } from "../components/Button";
import { InputBox } from "../components/InputBox";
import { Heading } from "../components/Heading";
import { SubHeading } from "../components/SubHeading";

export const Profile = () => {
    const [user, setUser] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    // Password change state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get("http://localhost:3000/api/v1/user/me", {
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token")
                }
            });
            setUser(response.data.user);
            setFirstName(response.data.user.firstName);
            setLastName(response.data.user.lastName);
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            if (error.response?.status === 403) {
                navigate("/signin");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        setSaving(true);
        setMessage("");
        try {
            await axios.put("http://localhost:3000/api/v1/user", {
                firstName,
                lastName
            }, {
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token")
                }
            });
            setMessage("Profile updated successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            setMessage("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setPasswordMessage("New passwords don't match");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordMessage("Password must be at least 6 characters");
            return;
        }

        setChangingPassword(true);
        setPasswordMessage("");
        try {
            await axios.post("http://localhost:3000/api/v1/user/change-password", {
                currentPassword,
                newPassword
            }, {
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token")
                }
            });
            setPasswordMessage("Password changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setPasswordMessage(""), 3000);
        } catch (error) {
            setPasswordMessage(error.response?.data?.message || "Failed to change password");
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div>
                <Appbar />
                <div className="flex justify-center items-center h-96">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Appbar />
            <div className="max-w-2xl mx-auto p-8">
                {/* Profile Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <Heading label={"Profile Settings"} />
                    <SubHeading label={"Manage your account information"} />

                    <div className="mt-6 space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-600">Email</label>
                            <div className="text-lg font-medium">{user?.username}</div>
                        </div>

                        <InputBox
                            label={"First Name"}
                            placeholder={"Enter first name"}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />

                        <InputBox
                            label={"Last Name"}
                            placeholder={"Enter last name"}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />

                        {message && (
                            <div className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
                                {message}
                            </div>
                        )}

                        <Button
                            label={saving ? "Saving..." : "Save Changes"}
                            onClick={handleUpdateProfile}
                        />
                    </div>
                </div>

                {/* Password Change Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4">Change Password</h2>

                    <div className="space-y-4">
                        <InputBox
                            label={"Current Password"}
                            placeholder={"Enter current password"}
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />

                        <InputBox
                            label={"New Password"}
                            placeholder={"Enter new password"}
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />

                        <InputBox
                            label={"Confirm New Password"}
                            placeholder={"Confirm new password"}
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />

                        {passwordMessage && (
                            <div className={`text-sm ${passwordMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>
                                {passwordMessage}
                            </div>
                        )}

                        <Button
                            label={changingPassword ? "Changing..." : "Change Password"}
                            onClick={handleChangePassword}
                        />
                    </div>
                </div>

                {/* Back to Dashboard */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="text-blue-600 hover:underline"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};
