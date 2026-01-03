# Aura Chat 🌟

A modern, real-time chat application with a premium glassmorphic design.

![Aura Chat Preview](file:///c:/Users/aquil/Desktop/Real%20time%20chat%20application/preview.png)

## ✨ Features

- **Real-Time Messaging**: Built with Socket.IO for instant communication.
- **Media Sharing**: Upload and view images, videos, and documents seamlessly.
- **Modern UI/UX**: Premium glassmorphic design with smooth animations.
- **Profile Customization**: Update your username and bio.
- **User Search**: Easily find and start chats with other users.
- **Typing Indicators**: See when someone is typing.
- **Sound Notifications**: Get notified of new messages.
- **Mobile Responsive**: Fully optimized for mobile devices.

## 🚀 Tech Stack

- **Frontend**: React, Vite, Axios, Socket.IO Client, Lucide-React.
- **Backend**: Node.js, Express, Socket.IO, Mongoose (MongoDB).
- **Authentication**: JWT (JSON Web Tokens) and bcryptjs.
- **File Handling**: Multer for media uploads.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB (Local or Atlas)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/aura-chat.git
   cd aura-chat
   ```

2. Install dependencies for both client and server:
   ```bash
   # In the root directory
   cd client && npm install
   cd ../server && npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```

4. Run the application:
   ```bash
   # Start the server (from server directory)
   npm start

   # Start the client (from client directory)
   npm run dev
   ```

## 📜 License

MIT License
