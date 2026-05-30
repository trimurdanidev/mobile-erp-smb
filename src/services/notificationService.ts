import api from '@/services/api';

export const getNotifications = async (userId: number) => {
    const token = localStorage.getItem('access_token');
    const res   = await api.get(`/notifications/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

export const markAsRead = async (docId: string) => {
    const token = localStorage.getItem('access_token');
    await api.put(`/notifications/${docId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
    });
};