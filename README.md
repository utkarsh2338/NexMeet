# NexMeet 🎥

A modern, feature-rich video conferencing application built with WebRTC, Socket.IO, React, and Express. NexMeet provides secure, real-time video communication with advanced meeting management features including password protection, waiting rooms, host controls, recording capabilities, and comprehensive analytics.

![NexMeet](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.2.0-blue.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Socket Events](#-socket-events)
- [Database Schema](#-database-schema)
- [Security Features](#-security-features)
- [Architecture](#-architecture)
- [Usage Guide](#-usage-guide)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Video Conferencing
- **Peer-to-Peer Video/Audio**: Real-time WebRTC-based video and audio communication
- **Screen Sharing**: Share your screen with meeting participants
- **Chat Messaging**: In-meeting text chat functionality
- **Dynamic Participant Management**: Real-time join/leave notifications

### Security & Access Control
- **Password Protection**: Secure meetings with optional password authentication
- **Waiting Rooms**: Host-controlled admission of participants
- **Host Controls**: Remove disruptive participants from meetings
- **Participant Verification**: Verify passwords before allowing access
- **Removed Participant Blocking**: Prevent removed users from rejoining

### Meeting Management
- **Custom Meeting Codes**: Create meetings with custom 8-character codes
- **Meeting Settings**: Configure max participants, recording permissions, and more
- **Persistent Meetings**: Meetings survive server restarts via MongoDB persistence
- **Active Meeting Restoration**: Automatically restore active meetings on server startup
- **Meeting History**: Track all meetings created by users

### Recording & Analytics
- **Meeting Recording**: Start and stop recording with timestamps
- **Analytics Dashboard**: Track participant count, duration, join/leave events
- **User Statistics**: View personal meeting statistics (total meetings, total duration, recordings)
- **Real-time Analytics Updates**: Live analytics updates via WebSocket

### Authentication
- **Clerk Integration**: Secure user authentication with Clerk
- **Anonymous Users**: Allow guest participation without registration
- **User Profiles**: Track user identity across meetings

### User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Material-UI Components**: Modern, accessible UI components
- **Loading States**: Comprehensive loading indicators for all async operations
- **Error Handling**: Graceful error handling with user-friendly messages
- **Reconnection Logic**: Automatic socket reconnection with exponential backoff

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 5.2.1
- **Real-time Communication**: Socket.IO 4.8.3
- **Database**: MongoDB 7.0.0 with Mongoose 9.0.2
- **Authentication**: Clerk (server-side verification)
- **Environment Management**: dotenv 17.2.3
- **CORS**: cors 2.8.5
- **HTTP Status Codes**: http-status 2.1.0

### Frontend
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **Routing**: React Router DOM 7.12.0
- **UI Library**: Material-UI 7.3.7
- **Authentication**: @clerk/clerk-react 5.59.3
- **WebRTC**: Simple-peer (via Socket.IO)
- **HTTP Client**: Axios 1.13.2
- **Icons**: React Icons 5.5.0
- **Socket Client**: socket.io-client 4.8.3

### DevOps & Tools
- **Process Manager**: PM2 (production)
- **Development**: Nodemon 3.1.11
- **Linting**: ESLint 9.39.1
- **Code Quality**: ESLint with React hooks plugin

---

## 📁 Project Structure

```
NexMeet/
├── backend/
│   ├── app.js                          # Express server setup and configuration
│   ├── package.json                    # Backend dependencies
│   └── src/
│       ├── controllers/
│       │   ├── socketManager.js        # Socket.IO event handlers and WebRTC signaling
│       │   ├── user.controller.js      # User-related API handlers
│       │   └── meetingSecurity.controller.js  # Security & analytics API handlers
│       ├── middlewares/
│       │   ├── errorHandler.js         # Global error handling middleware
│       │   └── logger.js               # Request logging middleware
│       ├── models/
│       │   ├── meeting.model.js        # Meeting schema with security features
│       │   └── user.model.js           # User schema
│       └── routes/
│           ├── meeting.routes.js       # Basic meeting routes
│           ├── meetingSecurity.routes.js  # Security & analytics routes
│           └── users.routes.js         # User routes
│
├── frontend/
│   ├── index.html                      # HTML entry point
│   ├── package.json                    # Frontend dependencies
│   ├── vite.config.js                  # Vite configuration
│   ├── eslint.config.js                # ESLint configuration
│   └── src/
│       ├── main.jsx                    # React app entry point
│       ├── App.jsx                     # Main app component with routing
│       ├── App.css                     # Global styles
│       ├── index.css                   # Base CSS
│       ├── assets/                     # Static assets (images, fonts)
│       ├── components/
│       │   ├── CreateMeetingModal.jsx  # Meeting creation modal
│       │   ├── CreateMeetingModal.css  # Modal styles
│       │   ├── HostControls.jsx        # Host control panels (waiting room, participants, recording)
│       │   └── HostControls.css        # Host controls styles
│       ├── context/
│       │   └── AppContext.jsx          # Global app context (socket, connections)
│       ├── pages/
│       │   ├── landing.jsx             # Landing/home page
│       │   ├── videoMeet.jsx           # Video meeting room
│       │   └── home.jsx                # User dashboard/meeting join
│       ├── styles/
│       │   └── videoMeet.css           # Video meeting styles
│       └── utils/                      # Utility functions
│
└── README.md                           # This file
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **MongoDB**: v7.0.0 or higher ([Download](https://www.mongodb.com/try/download/community))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Clerk Account**: For authentication ([Sign up](https://clerk.com/))

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/NexMeet.git
cd NexMeet
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## 🔐 Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/nexmeet
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nexmeet?retryWrites=true&w=majority

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
# For multiple origins, use comma-separated values:
# FRONTEND_URL=http://localhost:5173,https://yourdomain.com

# Clerk Authentication (optional, for enhanced security)
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:4000

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Getting Clerk Keys

1. Sign up at [Clerk.com](https://clerk.com/)
2. Create a new application
3. Go to **API Keys** in your Clerk dashboard
4. Copy your **Publishable Key** and **Secret Key**
5. Add them to your `.env` files

---

## 🏃 Running the Application

### Development Mode

#### Start MongoDB
```bash
# If using local MongoDB
mongod

# If using MongoDB Atlas, ensure your connection string is in .env
```

#### Start Backend Server
```bash
cd backend
npm run dev
```
Server will start on `http://localhost:4000`

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend will start on `http://localhost:5173`

### Production Mode

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Start Backend with PM2
```bash
cd backend
npm run prod
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:4000/api/v1
```

### Endpoints

#### Health Check
```http
GET /api/health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-26T12:00:00.000Z"
}
```

---

### Meeting Security Endpoints

#### 1. Create Meeting
```http
POST /api/v1/security/create
```
**Request Body:**
```json
{
  "meetingCode": "ABCD1234",
  "hostClerkUserId": "user_123",
  "hostUsername": "John Doe",
  "password": "secret123",
  "waitingRoomEnabled": true,
  "settings": {
    "maxParticipants": 50,
    "allowRecording": true,
    "autoAdmit": false
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "meetingCode": "ABCD1234",
    "hostClerkUserId": "user_123",
    "isPasswordProtected": true,
    "waitingRoomEnabled": true,
    "_id": "507f1f77bcf86cd799439011"
  }
}
```

#### 2. Verify Meeting Password
```http
POST /api/v1/security/verify-password
```
**Request Body:**
```json
{
  "meetingCode": "ABCD1234",
  "password": "secret123"
}
```
**Response:**
```json
{
  "success": true,
  "isValid": true
}
```

#### 3. Get Meeting Info
```http
GET /api/v1/security/meeting/:meetingCode
```
**Response:**
```json
{
  "success": true,
  "data": {
    "meetingCode": "ABCD1234",
    "hostUsername": "John Doe",
    "isPasswordProtected": true,
    "waitingRoomEnabled": true,
    "participantCount": 5,
    "isActive": true,
    "settings": {
      "maxParticipants": 50,
      "allowRecording": true
    }
  }
}
```

#### 4. Admit Participant from Waiting Room
```http
POST /api/v1/security/admit-participant
```
**Request Body:**
```json
{
  "meetingCode": "ABCD1234",
  "socketId": "socket_123",
  "clerkUserId": "user_456"
}
```

#### 5. Remove Participant from Meeting
```http
POST /api/v1/security/remove-participant
```
**Request Body:**
```json
{
  "meetingCode": "ABCD1234",
  "socketId": "socket_123",
  "clerkUserId": "user_456"
}
```

#### 6. Start Recording
```http
POST /api/v1/security/start-recording
```
**Request Body:**
```json
{
  "meetingCode": "ABCD1234",
  "recordingId": "rec_123"
}
```

#### 7. Stop Recording
```http
POST /api/v1/security/stop-recording
```
**Request Body:**
```json
{
  "meetingCode": "ABCD1234",
  "recordingId": "rec_123"
}
```

#### 8. Get Meeting Analytics
```http
GET /api/v1/security/analytics/:meetingCode
```
**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "totalParticipants": 10,
      "currentParticipants": 5,
      "peakParticipants": 8,
      "totalDuration": 3600,
      "participantJoinEvents": 10,
      "participantLeaveEvents": 5,
      "messagesCount": 45,
      "screenShareCount": 3,
      "recordingsCount": 1
    }
  }
}
```

#### 9. Get User Statistics
```http
GET /api/v1/security/user-stats/:clerkUserId
```
**Response:**
```json
{
  "success": true,
  "data": {
    "totalMeetingsHosted": 15,
    "totalDuration": 18000,
    "totalRecordings": 5,
    "averageMeetingDuration": 1200,
    "totalParticipantsHosted": 75
  }
}
```

---

## 🔌 Socket Events

### Client → Server Events

#### 1. Join Call
```javascript
socket.emit('join-call', {
  path: 'ABCD1234',
  username: 'John Doe',
  clerkUserId: 'user_123',
  creatingMeeting: false,
  password: 'secret123'  // optional
});
```

#### 2. Request to Join (Waiting Room)
```javascript
socket.emit('request-to-join', {
  meetingCode: 'ABCD1234',
  username: 'John Doe',
  clerkUserId: 'user_123'
});
```

#### 3. Admit Participant (Host Only)
```javascript
socket.emit('admit-participant', {
  meetingCode: 'ABCD1234',
  socketId: 'socket_456',
  clerkUserId: 'user_456'
});
```

#### 4. Remove Participant (Host Only)
```javascript
socket.emit('remove-participant', {
  meetingCode: 'ABCD1234',
  socketId: 'socket_456',
  clerkUserId: 'user_456',
  reason: 'Disruptive behavior'
});
```

#### 5. Start Recording (Host Only)
```javascript
socket.emit('start-recording', {
  meetingCode: 'ABCD1234',
  recordingId: 'rec_123'
});
```

#### 6. Stop Recording (Host Only)
```javascript
socket.emit('stop-recording', {
  meetingCode: 'ABCD1234',
  recordingId: 'rec_123'
});
```

#### 7. Update Analytics
```javascript
socket.emit('update-analytics', {
  meetingCode: 'ABCD1234',
  analyticsData: {
    messagesCount: 1,      // increment by 1
    screenShareCount: 1    // increment by 1
  }
});
```

#### 8. WebRTC Signaling Events
```javascript
// Send offer
socket.emit('make-offer', {
  offer: rtcSessionDescription,
  to: 'socket_456'
});

// Send answer
socket.emit('make-answer', {
  answer: rtcSessionDescription,
  to: 'socket_123'
});

// Send ICE candidate
socket.emit('addIceCandidate', {
  candidate: iceCandidate,
  to: 'socket_456'
});
```

#### 9. Chat Message
```javascript
socket.emit('chat-message', {
  message: 'Hello everyone!',
  username: 'John Doe',
  timestamp: new Date().toISOString()
});
```

---

### Server → Client Events

#### 1. User Joined
```javascript
socket.on('user-joined', (data) => {
  console.log(`${data.username} joined the meeting`);
  // data: { id: 'socket_123', username: 'John Doe' }
});
```

#### 2. User Left
```javascript
socket.on('user-left', (data) => {
  console.log(`${data.username} left the meeting`);
  // data: { id: 'socket_123', username: 'John Doe' }
});
```

#### 3. All Users
```javascript
socket.on('all-users', (users) => {
  console.log('Current participants:', users);
  // users: [{ id: 'socket_123', username: 'John' }, ...]
});
```

#### 4. Join Request (Waiting Room - Host Only)
```javascript
socket.on('join-request', (data) => {
  // Show waiting room notification to host
  // data: { socketId, username, clerkUserId }
});
```

#### 5. Admitted to Meeting
```javascript
socket.on('admitted', () => {
  // User was admitted from waiting room
  console.log('You have been admitted to the meeting');
});
```

#### 6. Removed from Meeting
```javascript
socket.on('removed-from-meeting', (data) => {
  // User was removed by host
  // data: { reason: 'Disruptive behavior' }
  // Disconnect and redirect user
});
```

#### 7. Recording Started
```javascript
socket.on('recording-started', (data) => {
  // data: { recordingId, startedBy }
  console.log('Recording started');
});
```

#### 8. Recording Stopped
```javascript
socket.on('recording-stopped', (data) => {
  // data: { recordingId, duration }
  console.log('Recording stopped');
});
```

#### 9. Analytics Updated
```javascript
socket.on('analytics-updated', (analytics) => {
  // Real-time analytics data
  console.log('Meeting analytics:', analytics);
});
```

#### 10. Host Status
```javascript
socket.on('host-status', (data) => {
  // data: { isHost: true }
  console.log('You are the host');
});
```

#### 11. Password Required
```javascript
socket.on('password-required', () => {
  // Meeting requires password
  // Show password prompt
});
```

#### 12. Invalid Password
```javascript
socket.on('invalid-password', () => {
  // Incorrect password entered
  alert('Invalid password');
});
```

#### 13. Access Denied
```javascript
socket.on('access-denied', (data) => {
  // data: { reason: 'You have been removed from this meeting' }
  alert(data.reason);
});
```

#### 14. WebRTC Signaling Events
```javascript
// Receive offer
socket.on('offer', ({ offer, from }) => {
  // Handle WebRTC offer
});

// Receive answer
socket.on('answer', ({ answer, from }) => {
  // Handle WebRTC answer
});

// Receive ICE candidate
socket.on('addIceCandidate', ({ candidate, from }) => {
  // Add ICE candidate to peer connection
});
```

#### 15. Chat Message
```javascript
socket.on('chat-message', (data) => {
  // data: { message, username, timestamp }
  console.log(`${data.username}: ${data.message}`);
});
```

---

## 🗄 Database Schema

### Meeting Model

```javascript
{
  meetingCode: String,              // Unique 8-character code
  hostClerkUserId: String,          // Host's Clerk user ID
  hostUsername: String,             // Host's display name
  
  // Participants
  participants: [{
    clerkUserId: String,            // Participant's Clerk ID
    username: String,               // Participant's name
    socketId: String,               // Socket connection ID
    isHost: Boolean,                // Host flag
    joinedAt: Date,                 // Join timestamp
    leftAt: Date                    // Leave timestamp
  }],
  
  // Security Features
  password: String,                 // Hashed meeting password
  isPasswordProtected: Boolean,     // Password protection flag
  waitingRoomEnabled: Boolean,      // Waiting room enabled flag
  waitingRoom: [{                   // Participants in waiting room
    socketId: String,
    username: String,
    clerkUserId: String,
    requestedAt: Date
  }],
  allowedParticipants: [String],    // Clerk IDs of allowed users
  removedParticipants: [{           // Removed participants
    clerkUserId: String,
    socketId: String,
    removedAt: Date,
    reason: String
  }],
  
  // Analytics
  analytics: {
    totalParticipants: Number,      // Total unique participants
    currentParticipants: Number,    // Current participant count
    peakParticipants: Number,       // Maximum concurrent participants
    totalDuration: Number,          // Total duration in seconds
    participantJoinEvents: Number,  // Total joins
    participantLeaveEvents: Number, // Total leaves
    messagesCount: Number,          // Chat messages sent
    screenShareCount: Number,       // Screen shares initiated
    recordingsCount: Number,        // Recordings created
    lastUpdated: Date               // Last analytics update
  },
  
  // Recordings
  recordings: [{
    recordingId: String,            // Unique recording ID
    startedAt: Date,                // Recording start time
    stoppedAt: Date,                // Recording stop time
    duration: Number,               // Duration in seconds
    startedBy: String               // Clerk ID of initiator
  }],
  
  // Settings
  settings: {
    maxParticipants: Number,        // Maximum allowed participants
    allowRecording: Boolean,        // Recording permission
    autoAdmit: Boolean,             // Auto-admit from waiting room
    muteOnEntry: Boolean,           // Mute participants on join
    allowScreenShare: Boolean       // Screen sharing permission
  },
  
  // Meeting Status
  isActive: Boolean,                // Active meeting flag
  createdAt: Date,                  // Creation timestamp
  endedAt: Date                     // End timestamp
}
```

### User Model

```javascript
{
  clerkUserId: String,              // Unique Clerk user ID
  username: String,                 // Display name
  email: String,                    // Email address
  meetingsHosted: [ObjectId],       // Reference to Meeting documents
  meetingsAttended: [ObjectId],     // Reference to Meeting documents
  createdAt: Date,                  // Account creation date
  lastActive: Date                  // Last activity timestamp
}
```

---

## 🔒 Security Features

### 1. Password Protection
- Meetings can be password-protected during creation
- Passwords are stored securely (can be hashed using bcrypt)
- Participants must provide correct password to join
- Invalid password attempts are rejected

### 2. Waiting Room
- Host can enable waiting room for their meetings
- Participants wait for host approval before joining
- Host sees join requests with user information
- Host can admit or reject participants individually

### 3. Host Controls
- **Remove Participants**: Host can remove disruptive users
- **Prevent Rejoining**: Removed users cannot rejoin the same meeting
- **Recording Control**: Only host can start/stop recordings
- **Waiting Room Management**: Host controls who enters

### 4. Access Control
- Clerk-based authentication for registered users
- Anonymous users supported with limitations
- User identity tracked across meetings
- Meeting ownership verification

### 5. Data Privacy
- MongoDB connection string secured via environment variables
- CORS configured to allow only specified origins
- Sensitive data (passwords) can be hashed before storage
- Socket connections validated before allowing actions

---

## 🏗 Architecture

### System Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │◄───────►│   Backend   │◄───────►│   MongoDB   │
│  (React)    │ WebSocket│  (Express)  │         │  Database   │
│             │  Socket.IO              │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
       │                      │
       │                      │
       ▼                      ▼
┌─────────────┐         ┌─────────────┐
│    Clerk    │         │   WebRTC    │
│    Auth     │         │  Signaling  │
└─────────────┘         └─────────────┘
```

### WebRTC Signaling Flow

```
Peer A                    Server                    Peer B
  │                         │                         │
  │─────create offer───────►│                         │
  │                         │─────forward offer──────►│
  │                         │                         │
  │                         │◄────create answer───────│
  │◄────forward answer──────│                         │
  │                         │                         │
  │──ICE candidates────────►│──ICE candidates────────►│
  │◄───ICE candidates───────│◄───ICE candidates───────│
  │                         │                         │
  └─────────────────────────┴────Peer Connection──────┘
```

### Component Hierarchy

```
App
├── AppContextProvider
│   ├── Landing Page
│   ├── Home Page
│   │   ├── CreateMeetingModal
│   │   └── Meeting Join Form
│   └── VideoMeet Page
│       ├── Video Grid
│       ├── HostControls
│       │   ├── WaitingRoomPanel
│       │   ├── ParticipantList
│       │   └── RecordingControls
│       ├── Chat Panel
│       └── Control Bar
│           ├── Mic Toggle
│           ├── Camera Toggle
│           ├── Screen Share
│           └── Leave Button
```

---

## 📖 Usage Guide

### Creating a Meeting

1. **Sign in** with Clerk or continue as guest
2. Click **"Create Meeting"** button on home page
3. Configure meeting settings:
   - Enter custom meeting code (8 characters) or use generated code
   - Optionally set a password
   - Enable/disable waiting room
   - Set maximum participants
   - Configure recording permissions
4. Click **"Create Meeting"**
5. Share the meeting code with participants

### Joining a Meeting

1. Enter the **meeting code** on home page
2. Enter **password** if required
3. If waiting room is enabled, wait for host to admit you
4. Click **"Join"** to enter the meeting

### Host Controls

As a meeting host, you can:
- **Admit participants** from the waiting room
- **Remove disruptive participants** from the meeting
- **Start/stop recordings** of the meeting
- **View real-time analytics** (participant count, duration, etc.)
- **Monitor waiting room** for join requests

### During a Meeting

- **Toggle microphone** - Mute/unmute your audio
- **Toggle camera** - Turn video on/off
- **Share screen** - Share your screen with participants
- **Send chat messages** - Text chat with other participants
- **Leave meeting** - Exit the call

### Viewing Statistics

1. Go to **User Dashboard**
2. View your statistics:
   - Total meetings hosted
   - Total duration
   - Number of recordings
   - Average meeting duration
   - Total participants hosted

---

## 💻 Development

### Project Setup for Development

1. **Install dependencies** for both frontend and backend
2. **Set up MongoDB** locally or use MongoDB Atlas
3. **Configure environment variables** in both `.env` files
4. **Start MongoDB** (if using local instance)
5. **Run backend** in development mode: `npm run dev`
6. **Run frontend** in development mode: `npm run dev`

### Code Structure Guidelines

#### Backend
- **Controllers**: Handle business logic and data processing
- **Models**: Define MongoDB schemas with Mongoose
- **Routes**: Define API endpoints and route handlers
- **Middlewares**: Request processing, error handling, logging
- **Socket Manager**: WebRTC signaling and real-time events

#### Frontend
- **Pages**: Top-level route components
- **Components**: Reusable UI components
- **Context**: Global state management
- **Utils**: Helper functions and utilities
- **Styles**: Component-specific CSS files

### Adding New Features

#### Backend API Endpoint
1. Create controller function in `src/controllers/`
2. Define route in `src/routes/`
3. Register route in `app.js`
4. Test endpoint with Postman or cURL

#### Socket Event
1. Add event handler in `src/controllers/socketManager.js`
2. Define event name constant
3. Handle event on frontend in `AppContext.jsx`
4. Test real-time functionality

#### Frontend Component
1. Create component file in `src/components/`
2. Create corresponding CSS file
3. Import and use in parent component
4. Test UI and functionality

### Testing

```bash
# Backend tests (when implemented)
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test

# Linting
cd frontend
npm run lint
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
**Error**: `MongooseError: Could not connect to MongoDB`

**Solution**:
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in backend `.env`
- Verify network connectivity for MongoDB Atlas
- Check firewall settings

#### 2. Socket Connection Failed
**Error**: `WebSocket connection failed`

**Solution**:
- Verify backend server is running on correct port
- Check `VITE_BACKEND_URL` in frontend `.env`
- Ensure CORS is configured correctly in `app.js`
- Check browser console for CORS errors

#### 3. Duplicate Key Error (E11000)
**Error**: `MongoServerError: E11000 duplicate key error`

**Solution**:
- This occurs when trying to create a meeting with existing code
- Use a different meeting code
- Delete the existing meeting from database
- The system now handles this automatically by checking database first

#### 4. Clerk Authentication Issues
**Error**: `Clerk: publishable key is required`

**Solution**:
- Verify `VITE_CLERK_PUBLISHABLE_KEY` in frontend `.env`
- Ensure Clerk keys are correct from dashboard
- Check that keys match your Clerk application
- Restart development server after adding keys

#### 5. WebRTC Connection Issues
**Problem**: Video/audio not working

**Solution**:
- Grant browser permissions for camera and microphone
- Check if HTTPS is used (required for WebRTC in production)
- Verify ICE servers configuration
- Check firewall/NAT settings
- Test in different browser

#### 6. Recording Not Starting
**Problem**: Recording button doesn't work

**Solution**:
- Ensure you are the meeting host
- Check `allowRecording` setting is enabled
- Verify backend recording endpoint is accessible
- Check browser console for errors

### Debug Mode

Enable detailed logging:

**Backend**:
```env
NODE_ENV=development
```

**Frontend**:
Add to `AppContext.jsx`:
```javascript
socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

### Performance Issues

- **High latency**: Check network connection and server location
- **CPU usage**: Limit maximum participants or reduce video quality
- **Memory leaks**: Ensure proper cleanup of WebRTC connections
- **Database slow**: Add indexes on frequently queried fields

---

## 🤝 Contributing

We welcome contributions to NexMeet! Here's how you can help:

### Reporting Bugs

1. Check if the bug has already been reported
2. Create a new issue with detailed description
3. Include steps to reproduce
4. Add screenshots if applicable
5. Specify your environment (OS, browser, versions)

### Suggesting Features

1. Open an issue with `[Feature Request]` prefix
2. Describe the feature and its benefits
3. Provide use cases
4. Discuss implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages: `git commit -m 'Add amazing feature'`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Follow existing code style and conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Write clean, readable code

### Commit Messages

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

---

## 📄 License

This project is licensed under the ISC License.

```
ISC License

Copyright (c) 2026 Utkarsh Shukla

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

---

## 📞 Support

For support, please:
- Open an issue on GitHub
- Contact via email: support@nexmeet.com
- Join our Discord community: [NexMeet Discord](#)

---

## 🙏 Acknowledgments

- **WebRTC** - Real-time communication technology
- **Socket.IO** - Real-time bidirectional communication
- **Clerk** - Authentication and user management
- **Material-UI** - React component library
- **MongoDB** - NoSQL database
- **Vite** - Next-generation frontend tooling

---

## 🗺 Roadmap

### Planned Features

- [ ] End-to-end encryption for enhanced privacy
- [ ] Breakout rooms for group discussions
- [ ] Virtual backgrounds and filters
- [ ] Meeting scheduling and calendar integration
- [ ] File sharing during meetings
- [ ] Polls and reactions
- [ ] Meeting transcription and AI summaries
- [ ] Mobile app (React Native)
- [ ] White boarding and collaborative tools
- [ ] Integration with third-party services (Slack, Teams, etc.)

---

## 📊 Project Stats

- **Lines of Code**: ~5,000+
- **Backend Files**: 12
- **Frontend Files**: 20+
- **API Endpoints**: 15+
- **Socket Events**: 20+
- **Components**: 10+

---

<div align="center">

**Made with ❤️ by Utkarsh Shukla**

[Website](https://nexmeet.com) • [Documentation](#) • [Report Bug](https://github.com/utkarshshukla/NexMeet/issues) • [Request Feature](https://github.com/utkarshshukla/NexMeet/issues)

---

### Creator

**Utkarsh Shukla**  
🚀 Full Stack Developer | Video Conferencing Enthusiast  
📧 utkarshshukla@nexmeet.com  
🔗 [GitHub](https://github.com/utkarshshukla) • [LinkedIn](https://linkedin.com/in/utkarshshukla) • [Twitter](https://twitter.com/utkarshshukla)

</div>
