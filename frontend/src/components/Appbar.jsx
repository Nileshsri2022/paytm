import { useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";

// Generate consistent color based on name
const getAvatarColor = (name) => {
    const colors = [
        'from-red-500 to-pink-500',
        'from-blue-500 to-indigo-500',
        'from-green-500 to-emerald-500',
        'from-yellow-500 to-orange-500',
        'from-purple-500 to-violet-500',
        'from-pink-500 to-rose-500',
        'from-indigo-500 to-blue-500',
        'from-teal-500 to-cyan-500'
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
};

export const Appbar = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const { signOut } = useClerk();

    const userName = user?.firstName || "User";
    const userInitial = userName?.[0]?.toUpperCase() || "U";
    const avatarGradient = getAvatarColor(userName);

    const handleLogout = async () => {
        await signOut();
        navigate("/signin");
    };

    return (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-3 md:px-4 h-14 md:h-16 flex justify-between items-center">
                {/* Logo */}
                <div
                    className="flex items-center gap-1.5 md:gap-2 cursor-pointer"
                    onClick={() => navigate("/dashboard")}
                >
                    <span className="text-xl md:text-2xl">💳</span>
                    <span className="font-bold text-lg md:text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        PayTM
                    </span>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-1 md:gap-3">
                    <NotificationBell />
                    <ThemeToggle />

                    {/* Profile - icon on mobile, text on desktop */}
                    <button
                        onClick={() => navigate("/profile")}
                        className="p-2 md:px-3 md:py-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-lg transition-all"
                        title="Profile"
                    >
                        <span className="md:hidden text-lg">👤</span>
                        <span className="hidden md:inline text-sm font-medium">Profile</span>
                    </button>

                    {/* Sign Out - icon on mobile, text on desktop */}
                    <button
                        onClick={handleLogout}
                        className="p-2 md:px-3 md:py-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 rounded-lg transition-all"
                        title="Sign Out"
                    >
                        <span className="md:hidden text-lg">🚪</span>
                        <span className="hidden md:inline text-sm font-medium">Sign Out</span>
                    </button>

                    {/* Avatar */}
                    <div
                        className={`bg-gradient-to-r ${avatarGradient} rounded-full h-8 w-8 md:h-10 md:w-10 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow`}
                        onClick={() => navigate("/profile")}
                    >
                        <span className="text-white font-semibold text-sm md:text-base">
                            {userInitial}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}