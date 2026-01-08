import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import { LogOut, Send, User as UserIcon, Trash2, Search, ArrowLeft, Paperclip, FileIcon } from 'lucide-react';
import playPopSound from '../utils/sound';

const ENDPOINT = "http://localhost:5001";
let socket;

const ChatPage = () => {
    const { user, logout, updateProfile } = useAuth();
    const [users, setUsers] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [editName, setEditName] = useState(user.username);
    const [editBio, setEditBio] = useState(user.bio || "");
    const [updateStatus, setUpdateStatus] = useState({ type: '', msg: '' });
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", user);
        socket.on("online-users", (users) => setOnlineUsers(users));

        return () => socket.disconnect();
    }, [user]);

    const selectedChatRef = useRef(selectedChat);
    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    useEffect(() => {
        if (!socket) return;

        socket.on("message-received", (newMessageReceived) => {
            if (!selectedChatRef.current || selectedChatRef.current._id !== newMessageReceived.sender._id) {
                // Potential notification logic here
            } else {
                setMessages(prevMessages => [...prevMessages, newMessageReceived]);
                playPopSound();
            }
        });

        socket.on("typing", () => setOtherUserTyping(true));
        socket.on("stop-typing", () => setOtherUserTyping(false));

        return () => {
            socket.off("message-received");
            socket.off("typing");
            socket.off("stop-typing");
        };
    }, [user]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get(`${ENDPOINT}/api/users`, config);
                setUsers(data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, [user, messages]); // Refresh user list when messages change to update previews

    useEffect(() => {
        if (selectedChat) {
            const fetchMessages = async () => {
                try {
                    const config = { headers: { Authorization: `Bearer ${user.token}` } };
                    const { data } = await axios.get(`${ENDPOINT}/api/messages/${selectedChat._id}`, config);
                    setMessages(data);
                    socket.emit("join-chat", selectedChat._id);
                } catch (error) {
                    console.error("Error fetching messages");
                }
            };
            fetchMessages();
        }
    }, [selectedChat, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const typingHandler = (e) => {
        setNewMessage(e.target.value);
        if (!socket || !selectedChat) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.emit("typing", selectedChat._id);
        }
        let lastTypingTime = new Date().getTime();
        let timerLength = 3000;
        setTimeout(() => {
            let timeNow = new Date().getTime();
            let timeDiff = timeNow - lastTypingTime;
            if (timeDiff >= timerLength && isTyping) {
                socket.emit("stop-typing", selectedChat._id);
                setIsTyping(false);
            }
        }, timerLength);
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const sendMessage = async (e) => {
        if (e.key === "Enter" || e.type === "click") {
            if (newMessage && selectedChat) {
                socket.emit("stop-typing", selectedChat._id);
                setIsTyping(false);
                try {
                    const config = { headers: { Authorization: `Bearer ${user.token}` } };
                    const { data } = await axios.post(`${ENDPOINT}/api/messages`, {
                        content: newMessage,
                        receiverId: selectedChat._id
                    }, config);

                    socket.emit("new-message", data);
                    setMessages(prev => [...prev, data]);
                    setNewMessage("");
                } catch (error) {
                    console.error("Error sending message");
                }
            }
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setUpdateStatus({ type: 'loading', msg: 'Updating...' });
        const result = await updateProfile(editName, editBio);
        if (result.success) {
            setUpdateStatus({ type: 'success', msg: 'Profile updated!' });
            setTimeout(() => {
                setShowProfileModal(false);
                setUpdateStatus({ type: '', msg: '' });
            }, 1000);
        } else {
            setUpdateStatus({ type: 'error', msg: result.message });
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedChat) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("receiverId", selectedChat._id);

        try {
            const config = {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.post(`${ENDPOINT}/api/messages/upload`, formData, config);
            socket.emit("new-message", data);
            setMessages((prev) => [...prev, data]);
        } catch (error) {
            console.error("Error uploading file");
        }
    };

    const clearChat = async () => {
        if (window.confirm("Are you sure you want to clear this chat history?")) {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                await axios.delete(`${ENDPOINT}/api/messages/${selectedChat._id}`, config);
                setMessages([]);
            } catch (error) {
                console.error("Error clearing chat");
            }
        }
    };

    const [searchQuery, setSearchQuery] = useState("");

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getAvatarColor = (name) => {
        const colors = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <div className={`chat-layout ${selectedChat ? 'chat-open' : ''}`}>
            {showProfileModal && (
                <div className="modal-overlay glass" onClick={() => setShowProfileModal(false)}>
                    <div className="modal-content glass" onClick={e => e.stopPropagation()}>
                        <h2>Edit Profile</h2>
                        <form onSubmit={handleProfileUpdate}>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Bio</label>
                                <textarea
                                    value={editBio}
                                    onChange={e => setEditBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                            {updateStatus.msg && (
                                <p className={`status-msg ${updateStatus.type}`}>{updateStatus.msg}</p>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowProfileModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={updateStatus.type === 'loading'}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <div className="sidebar glass">
                <div className="sidebar-header">
                    <div className="user-profile-header" onClick={() => setShowProfileModal(true)} style={{ cursor: 'pointer' }}>
                        <div className="avatar small" style={{ backgroundColor: getAvatarColor(user.username) }}>
                            {getInitials(user.username)}
                        </div>
                        <h3>Chats</h3>
                    </div>
                    <button onClick={logout} className="btn-icon"><LogOut size={20} /></button>
                </div>

                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="user-list">
                    {filteredUsers.length > 0 ? filteredUsers.map(u => (
                        <div
                            key={u._id}
                            className={`user-item ${selectedChat?._id === u._id ? 'active' : ''}`}
                            onClick={() => setSelectedChat(u)}
                        >
                            <div className="user-avatar-wrapper">
                                <div className="avatar" style={{ backgroundColor: getAvatarColor(u.username) }}>
                                    {getInitials(u.username)}
                                </div>
                                {onlineUsers.includes(u._id) && <span className="online-indicator"></span>}
                            </div>
                            <div className="user-info">
                                <div className="user-name-row">
                                    <span className="user-name">{u.username}</span>
                                    {u.lastMessage && <span className="last-msg-time">{formatTime(u.lastMessage.createdAt)}</span>}
                                </div>
                                <span className="last-message-preview">
                                    {u.lastMessage ? (
                                        <>
                                            {u.lastMessage.isSent ? 'You: ' : ''}
                                            {u.lastMessage.content.length > 25 ? u.lastMessage.content.substring(0, 25) + '...' : u.lastMessage.content}
                                        </>
                                    ) : (
                                        <span className="user-bio">{u.bio || (onlineUsers.includes(u._id) ? 'Online' : 'Offline')}</span>
                                    )}
                                </span>
                            </div>
                        </div>
                    )) : (
                        <div className="no-users-msg">{searchQuery ? "No matching users" : "No other users found"}</div>
                    )}
                </div>
            </div>

            <div className="chat-window">
                {selectedChat ? (
                    <>
                        <div className="chat-header glass">
                            <div className="chat-header-info">
                                <button onClick={() => setSelectedChat(null)} className="btn-icon mobile-back-btn">
                                    <ArrowLeft size={20} />
                                </button>
                                <h4>{selectedChat.username}</h4>
                            </div>
                            <button onClick={clearChat} className="btn-icon delete-btn" title="Clear Chat">
                                <Trash2 size={20} />
                            </button>
                        </div>
                        <div className="message-container">
                            {messages.map((m, i) => {
                                const senderId = m.sender._id || m.sender;
                                const currentUserId = user._id || user;
                                const isSent = String(senderId) === String(currentUserId);

                                console.log(`Msg ${i}: Sender=${senderId}, Current=${currentUserId}, isSent=${isSent}`);

                                return (
                                    <div key={i} className={`message-wrapper ${isSent ? 'sent' : 'received'}`}>
                                        <div className="message-content glass">
                                            {m.content}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="message-input-area glass">
                            <input
                                type="file"
                                style={{ display: "none" }}
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <button onClick={() => fileInputRef.current.click()} className="btn-icon">
                                <Paperclip size={20} />
                            </button>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={typingHandler}
                                onKeyDown={sendMessage}
                            />
                            <button onClick={sendMessage} className="btn-send"><Send size={20} /></button>
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <p>Select a user to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
