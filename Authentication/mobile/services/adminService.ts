import Constants from 'expo-constants';

const getBaseUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ip = hostUri.split(':')[0];
        return `http://${ip}:3000/api/admin`;
    }
    return 'http://localhost:3000/api/admin';
};

const API_URL = getBaseUrl();

export const adminService = {
    async getAllUsers(token: string) {
        const response = await fetch(`${API_URL}/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        const data = await response.json();
        if (!response.ok) throw data;
        return data;
    },

    async updateUserStatus(token: string, userId: string, is_active: boolean) {
        const response = await fetch(`${API_URL}/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ is_active }),
        });
        const data = await response.json();
        if (!response.ok) throw data;
        return data;
    },
};