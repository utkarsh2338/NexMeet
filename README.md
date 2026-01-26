# NexMeet 🎥

Modern video conferencing application with WebRTC, real-time chat, screen sharing, and meeting management.

![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.2.0-blue.svg)

## ✨ Features

- **Video/Audio Calls**: Real-time WebRTC peer-to-peer communication with STUN/TURN support
- **Screen Sharing**: Share your screen with participants
- **In-Meeting Chat**: Real-time text messaging
- **Security**: Password protection, waiting rooms, host controls
- **Recording**: Start/stop meeting recordings with analytics
- **Authentication**: Clerk-based user authentication
- **Responsive Design**: Works on desktop and mobile

## 🛠 Tech Stack

**Backend**: Node.js, Express, Socket.IO, MongoDB  
**Frontend**: React, Vite, Material-UI  
**Authentication**: Clerk  
**Real-time**: WebRTC, Socket.IO

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/yourusername/NexMeet.git
cd NexMeet

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 🔐 Environment Setup

### Backend (.env)
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb+srv://your_connection_string
FRONTEND_URL=http://localhost:5173

# Optional: Xirsys TURN servers (for NAT traversal)
XIRSYS_IDENT=your_username
XIRSYS_SECRET=your_secret_key
XIRSYS_CHANNEL=default

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
```

### Frontend (.env)
```env
VITE_BACKEND_SERVER_URL=http://localhost:4000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
```

## 🚀 Running the App

```bash
# Start backend (from backend folder)
npm run dev

# Start frontend (from frontend folder)
npm run dev
```

**Backend**: `http://localhost:4000`  
**Frontend**: `http://localhost:5173`

## 🎯 Key Features Explained

### WebRTC Connection
- Uses STUN servers for NAT traversal
- Optional TURN servers for restrictive networks (Xirsys integration)
- Perfect negotiation pattern to avoid connection race conditions
- Automatic ICE restart on connection failure

### Security
- Password-protected meetings
- Waiting room with host approval
- Remove/block disruptive participants
- Clerk-based authentication

### Meeting Management
- Create custom 8-character meeting codes
- Persistent meetings (survive server restarts)
- Real-time participant tracking
- Meeting history and analytics

## 🌐 Deployment

**Frontend**: Deploy to Vercel/Netlify  
**Backend**: Deploy to Render/Railway/Heroku

### Important for Production:
1. Set `FRONTEND_URL` to your deployed frontend URL
2. Set `VITE_BACKEND_SERVER_URL` to your deployed backend URL
3. Configure Xirsys TURN servers for reliable connections
4. Use MongoDB Atlas for database
5. Add Clerk production keys

## 🔧 Project Structure

```
NexMeet/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API & Socket logic
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # Express routes
│   │   └── middlewares/     # Error handling, logging
│   └── app.js              # Server entry point
│
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── pages/           # Page components
    │   ├── context/         # React context
    │   └── utils/           # Helper functions
    └── main.jsx            # App entry point
```

## 📝 License

ISC License

---

**Made with ❤️ using WebRTC and React**
