import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatPage from './pages/ChatPage';

const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
    const { user } = useAuth();
    return !user ? children : <Navigate to="/chat" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app-container">
                    <Routes>
                        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                        <Route
                            path="/chat"
                            element={
                                <PrivateRoute>
                                    <ChatPage />
                                </PrivateRoute>
                            }
                        />
                        <Route path="/" element={<Navigate to="/login" />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
