import { useEffect, useState } from "react"
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Generate consistent color based on name
const getAvatarColor = (name) => {
    const colors = [
        'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
        'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
};

export const Users = () => {
    const [users, setUsers] = useState([]);
    const [googleContacts, setGoogleContacts] = useState([]);
    const [filter, setFilter] = useState("");
    const [googleConnected, setGoogleConnected] = useState(false);
    const [importing, setImporting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const navigate = useNavigate();

    // Fetch current user ID
    useEffect(() => {
        axios.get("http://localhost:3000/api/v1/user/me", {
            headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        }).then(response => {
            setCurrentUserId(response.data.user?._id);
        }).catch(err => console.error("Failed to get current user:", err));
    }, []);

    // Fetch app users
    useEffect(() => {
        axios.get("http://localhost:3000/api/v1/user/bulk?filter=" + filter)
            .then(response => {
                setUsers(response.data.user)
            });
    }, [filter]);

    // Check Google connection status on mount
    useEffect(() => {
        checkGoogleStatus();

        // Check URL params for Google auth result
        const params = new URLSearchParams(window.location.search);
        if (params.get('google_success')) {
            fetchGoogleContacts();
            window.history.replaceState({}, '', '/dashboard');
        }
    }, []);

    const checkGoogleStatus = async () => {
        try {
            const response = await axios.get("http://localhost:3000/api/v1/google/status", {
                headers: { Authorization: "Bearer " + localStorage.getItem("token") }
            });
            setGoogleConnected(response.data.connected);
            if (response.data.connected) {
                fetchGoogleContacts();
            }
        } catch (error) {
            console.error("Failed to check Google status:", error);
        }
    };

    const handleImportContacts = async () => {
        setImporting(true);
        try {
            const response = await axios.get("http://localhost:3000/api/v1/google/auth", {
                headers: { Authorization: "Bearer " + localStorage.getItem("token") }
            });
            // Redirect to Google OAuth
            window.location.href = response.data.authUrl;
        } catch (error) {
            console.error("Failed to start Google auth:", error);
            setImporting(false);
        }
    };

    const fetchGoogleContacts = async () => {
        try {
            const response = await axios.get("http://localhost:3000/api/v1/google/contacts", {
                headers: { Authorization: "Bearer " + localStorage.getItem("token") }
            });
            console.log("📥 Received contacts:", response.data.contacts?.length, response.data.contacts);
            setGoogleContacts(response.data.contacts || []);
            setGoogleConnected(true);
        } catch (error) {
            if (error.response?.data?.needsAuth) {
                setGoogleConnected(false);
            }
            console.error("Failed to fetch contacts:", error);
        }
    };

    // Create a map of emails to user IDs for quick lookup
    const userEmailMap = new Map();
    users.forEach(u => {
        if (u.username) {
            userEmailMap.set(u.username.toLowerCase(), u);
        }
    });

    // Combine app users and Google contacts (with smart matching)
    const allContacts = [
        ...users.map(u => ({ ...u, type: 'app' })),
        ...googleContacts
            // Filter out Google contacts that already appear as app users
            .filter(c => !c.email || !userEmailMap.has(c.email.toLowerCase()))
            .map(c => {
                // Check if this contact's email matches a PayTM user
                const matchedUser = c.email ? userEmailMap.get(c.email.toLowerCase()) : null;
                return {
                    _id: matchedUser?._id,  // Use matched user's ID if found
                    firstName: c.name?.split(' ')[0] || c.name || 'Unknown',
                    lastName: c.name?.split(' ').slice(1).join(' ') || '',
                    username: c.email || c.phone || '',
                    photo: c.photo,
                    type: 'google',
                    hasEmail: !!c.email
                };
            })
    ].filter(contact => {
        // Exclude current user (can't send money to yourself)
        if (contact._id === currentUserId) return false;

        if (!filter) return true;
        const name = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        return name.includes(filter.toLowerCase()) || contact.username?.toLowerCase().includes(filter.toLowerCase());
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg text-gray-800">Send Money</h2>
                <button
                    onClick={handleImportContacts}
                    disabled={importing}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${googleConnected
                        ? 'bg-green-100 text-green-700'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {importing ? 'Connecting...' : googleConnected ? 'Connected' : 'Import Contacts'}
                </button>
            </div>

            <div className="mb-4">
                <input
                    onChange={(e) => setFilter(e.target.value)}
                    type="text"
                    placeholder="Search contacts..."
                    className="w-full px-4 py-2 border-2 rounded-lg border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
                {allContacts.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                        <span className="text-3xl block mb-2">👥</span>
                        No contacts found
                    </div>
                ) : (
                    allContacts.map((contact, idx) => (
                        <ContactCard key={contact._id || idx} contact={contact} navigate={navigate} />
                    ))
                )}
            </div>
        </div>
    );
}

function ContactCard({ contact, navigate }) {
    const avatarColor = getAvatarColor(contact.firstName || 'U');
    const isGoogle = contact.type === 'google';

    return (
        <div className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
                {contact.photo ? (
                    <img src={contact.photo} className="rounded-full h-10 w-10 object-cover" alt="" />
                ) : (
                    <div className={`rounded-full h-10 w-10 ${avatarColor} flex items-center justify-center text-white font-semibold`}>
                        {contact.firstName?.[0]?.toUpperCase() || 'U'}
                    </div>
                )}
                <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                        {contact.firstName} {contact.lastName}
                        {isGoogle && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Google</span>
                        )}
                    </div>
                    <div className="text-sm text-gray-500">{contact.username}</div>
                </div>
            </div>

            <button
                onClick={() => {
                    if (contact._id) {
                        navigate("/send?id=" + contact._id + "&name=" + contact.firstName);
                    } else {
                        // For Google contacts without app account, show message
                        alert(`${contact.firstName} is not on PayTM yet. Invite them!`);
                    }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${contact._id
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    }`}
            >
                {contact._id ? 'Send' : 'Invite'}
            </button>
        </div>
    );
}