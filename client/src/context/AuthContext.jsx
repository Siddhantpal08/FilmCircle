import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On app load, restore user from stored token
    useEffect(() => {
        const token = localStorage.getItem('fc_token');
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            api.get('/auth/me')
                .then(res => setUser(res.data))
                .catch(() => {
                    // Token invalid/expired — clear it
                    localStorage.removeItem('fc_token');
                    delete api.defaults.headers.common['Authorization'];
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('fc_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('fc_token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    // Merge partial profile updates into user state immediately (no re-login needed)
    const updateUser = (data) => {
        setUser(prev => prev ? { ...prev, ...data } : prev);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
