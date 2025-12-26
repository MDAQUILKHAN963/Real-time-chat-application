import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo) {
            setUser(userInfo);
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const { data } = await axios.post('http://localhost:5001/api/users/login', { username, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (username, password) => {
        try {
            const { data } = await axios.post('http://localhost:5001/api/users/register', { username, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const updateProfile = async (username, bio) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.put('http://localhost:5001/api/users/profile', { username, bio }, config);
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Update failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
