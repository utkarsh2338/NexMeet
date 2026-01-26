import { Server } from "socket.io";
import { Meeting } from "../models/meeting.model.js";

// Configuration constants
const MAX_ROOM_SIZE = 50; // Maximum participants per meeting
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const INACTIVE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// In-memory storage (will be cleared on server restart - database is source of truth)
let connections = {};
let messages = {};
let timeOnline = {};
let usernames = {}; // Store usernames mapped to socket IDs
let clerkUserIds = {}; // Store Clerk user IDs mapped to socket IDs
let meetingDocs = {}; // Store meeting document references

/**
 * Cleanup old inactive meetings from database
 */
const cleanupInactiveMeetings = async () => {
    try {
        const cutoffDate = new Date(Date.now() - INACTIVE_TIMEOUT);
        const result = await Meeting.deleteMany({
            isActive: false,
            endTime: { $lt: cutoffDate }
        });
        if (result.deletedCount > 0) {
            console.log(`🧹 Cleaned up ${result.deletedCount} inactive meetings`);
        }
    } catch (error) {
        console.error('❌ Error cleaning up meetings:', error);
    }
};

/**
 * Restore active meetings from database on server restart
 */
const restoreActiveMeetings = async () => {
    try {
        const activeMeetings = await Meeting.find({ isActive: true });
        activeMeetings.forEach(meeting => {
            connections[meeting.meetingCode] = [];
            messages[meeting.meetingCode] = meeting.chatHistory.map(chat => ({
                data: chat.message,
                sender: chat.sender,
                "socket-id-sender": chat.socketId
            }));
            meetingDocs[meeting.meetingCode] = meeting._id;
        });
        console.log(`♻️ Restored ${activeMeetings.length} active meetings from database`);
    } catch (error) {
        console.error('❌ Error restoring meetings:', error);
    }
};

const connectToSocket = (server) => {
    // Configure allowed origins from environment variable
    const allowedOrigins = process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',')
        : ['http://localhost:5173'];

    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    console.log("Socket.IO server initialized and waiting for connections...");

    io.on("connection", (socket) => {
        console.log("✅ Something connected:", socket.id);

        socket.on("join-call", async (path, username, clerkUserId = null, password = null) => {
            try {
                // Initialize room if it doesn't exist
                if (connections[path] === undefined) {
                    connections[path] = [];
                }

                // Check if meeting exists and get meeting settings
                let meeting = await Meeting.findOne({ meetingCode: path, isActive: true }).select('+password');

                // If meeting doesn't exist yet, this will be the host creating it
                const isFirstUser = connections[path].length === 0;

                // For existing meetings, check security
                if (meeting && !isFirstUser) {
                    // Check password
                    if (meeting.isPasswordProtected) {
                        if (!meeting.verifyPassword(password)) {
                            socket.emit('error', {
                                code: 'INVALID_PASSWORD',
                                message: 'Invalid meeting password'
                            });
                            console.log(`⛔ Invalid password attempt for ${path}`);
                            return;
                        }
                    }

                    // Check if user was removed
                    const wasRemoved = meeting.removedParticipants.some(
                        p => p.clerkUserId === clerkUserId
                    );
                    if (wasRemoved) {
                        socket.emit('error', {
                            code: 'ACCESS_DENIED',
                            message: 'You have been removed from this meeting'
                        });
                        console.log(`⛔ Removed user attempted to rejoin: ${clerkUserId}`);
                        return;
                    }

                    // Check room size limit
                    const maxParticipants = meeting.settings?.maxParticipants || MAX_ROOM_SIZE;
                    if (connections[path].length >= maxParticipants) {
                        socket.emit('error', {
                            code: 'ROOM_FULL',
                            message: `Meeting room is full. Maximum ${maxParticipants} participants allowed.`
                        });
                        console.log(`⚠️ Room ${path} is full. Rejected ${socket.id}`);
                        return;
                    }

                    // Check waiting room
                    if (meeting.waitingRoomEnabled) {
                        const isAllowed = meeting.allowedParticipants.some(
                            p => p.clerkUserId === clerkUserId
                        );

                        if (!isAllowed) {
                            // Add to waiting room and notify host
                            await meeting.addToWaitingRoom({
                                clerkUserId,
                                username,
                                socketId: socket.id
                            });

                            socket.emit('in-waiting-room', {
                                message: 'Waiting for host approval'
                            });

                            // Notify host
                            const hostSocketId = Object.keys(usernames).find(
                                sid => clerkUserIds[sid] === meeting.hostClerkUserId
                            );

                            if (hostSocketId) {
                                io.to(hostSocketId).emit('waiting-room-request', {
                                    socketId: socket.id,
                                    username,
                                    clerkUserId
                                });
                            }

                            console.log(`⏳ User ${username} in waiting room for ${path}`);
                            return; // Don't join yet
                        }
                    }
                }

                // Check room size limit (basic check)
                if (connections[path].length >= MAX_ROOM_SIZE) {
                    socket.emit('error', {
                        code: 'ROOM_FULL',
                        message: `Meeting room is full. Maximum ${MAX_ROOM_SIZE} participants allowed.`
                    });
                    console.log(`⚠️ Room ${path} is full. Rejected ${socket.id}`);
                    return;
                }

                // Prevent duplicate joins
                if (connections[path].includes(socket.id)) {
                    console.log(`⚠️ Socket ${socket.id} already in room ${path}`);
                    return;
                }

                // Store the username and Clerk user ID for this socket ID
                if (username) {
                    usernames[socket.id] = username;
                }
                if (clerkUserId) {
                    clerkUserIds[socket.id] = clerkUserId;
                }

                // Store existing users before adding new user
                const existingUsers = [...connections[path]];
                const creatingMeeting = existingUsers.length === 0;

                connections[path].push(socket.id);
                timeOnline[socket.id] = new Date();

                // Check if meeting exists or needs to be created
                if (creatingMeeting) {
                    // Check if meeting already exists in database (e.g., after server restart)
                    if (!meeting) {
                        // Create new meeting
                        meeting = new Meeting({
                            meetingCode: path,
                            hostClerkUserId: clerkUserId || 'anonymous',
                            hostUsername: username || 'Anonymous',
                            participants: [{
                                clerkUserId: clerkUserId || null,
                                username: username || 'Anonymous',
                                socketId: socket.id,
                                isHost: true,
                                joinedAt: new Date()
                            }],
                            isActive: true
                        });
                        await meeting.save();
                        meetingDocs[path] = meeting._id;

                        // Emit host status to the user
                        socket.emit('host-status', { isHost: true });

                        console.log(`📝 Meeting created: ${path}`);
                    } else {
                        // Meeting exists in DB but not in memory (server restarted)
                        // Add participant to existing meeting
                        meeting.participants.push({
                            clerkUserId: clerkUserId || null,
                            username: username || 'Anonymous',
                            socketId: socket.id,
                            isHost: false,
                            joinedAt: new Date()
                        });

                        // Update analytics
                        meeting.analytics.participantJoinEvents += 1;
                        meeting.updateAnalytics();

                        await meeting.save();
                        meetingDocs[path] = meeting._id;
                        console.log(`👤 Participant added to existing meeting: ${path}`);
                    }
                } else {
                    // Add participant to existing meeting
                    meeting = await Meeting.findOne({ meetingCode: path, isActive: true });
                    if (meeting) {
                        meeting.participants.push({
                            clerkUserId: clerkUserId || null,
                            username: username || 'Anonymous',
                            socketId: socket.id,
                            isHost: false,
                            joinedAt: new Date()
                        });

                        // Update analytics
                        meeting.analytics.participantJoinEvents += 1;
                        meeting.updateAnalytics();

                        await meeting.save();
                        console.log(`👤 Participant added to meeting: ${path}`);
                    }
                }

                // Create usernames object for this room (IMPORTANT: Include the newly joined user)
                const roomUsernames = {};
                connections[path].forEach(sid => {
                    if (sid === socket.id) {
                        // Newly joined user
                        roomUsernames[sid] = username || 'Anonymous';
                    } else {
                        roomUsernames[sid] = usernames[sid] || 'Unknown';
                    }
                });

                // Notify existing users about the new user
                existingUsers.forEach(existingUserId => {
                    io.to(existingUserId).emit("user-joined", socket.id, connections[path], roomUsernames);
                });

                // Notify the new user about all existing users
                if (existingUsers.length > 0) {
                    io.to(socket.id).emit("user-joined", socket.id, connections[path], roomUsernames);
                } else {
                    // If first user, still emit to notify them they're connected
                    io.to(socket.id).emit("user-joined", socket.id, connections[path], roomUsernames);
                }

                // Send chat history from database
                const meetingForHistory = await Meeting.findOne({ meetingCode: path, isActive: true });
                if (meetingForHistory && meetingForHistory.chatHistory) {
                    meetingForHistory.chatHistory.forEach(msg => {
                        io.to(socket.id).emit("chat-message", msg.message, msg.sender, msg.socketId);
                    });
                }
            } catch (error) {
                console.error("❌ Error in join-call:", error);
                socket.emit('error', {
                    code: 'JOIN_ERROR',
                    message: 'Failed to join meeting. Please try again.'
                });
            }
        });
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });
        socket.on("chat-message", async (data, sender) => {
            try {
                const [matchingRoom, found] = Object.entries(connections).reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
                    return [room, isFound];
                },
                    ['', false]);

                if (found === true) {
                    // Store in memory
                    if (messages[matchingRoom] === undefined) {
                        messages[matchingRoom] = [];
                    }
                    messages[matchingRoom].push({ "data": data, "sender": sender, "socket-id-sender": socket.id });

                    // Save to database
                    const meeting = await Meeting.findOne({ meetingCode: matchingRoom, isActive: true });
                    if (meeting) {
                        meeting.chatHistory.push({
                            sender: sender,
                            message: data,
                            timestamp: new Date(),
                            socketId: socket.id
                        });
                        await meeting.save();
                    }

                    console.log("message", "key", ":", sender, data);
                    for (let a = 0; a < connections[matchingRoom].length; a++) {
                        io.to(connections[matchingRoom][a]).emit("chat-message", data, sender, socket.id);
                    }
                }
            } catch (error) {
                console.error("❌ Error in chat-message:", error);
                socket.emit('error', {
                    code: 'CHAT_ERROR',
                    message: 'Failed to send message. Please try again.'
                });
            }
        });

        // Waiting room event - participant requests to join
        socket.on("request-to-join", async (path, username, clerkUserId) => {
            try {
                const meeting = await Meeting.findOne({ meetingCode: path, isActive: true });

                if (!meeting) {
                    socket.emit('error', {
                        code: 'MEETING_NOT_FOUND',
                        message: 'Meeting not found'
                    });
                    return;
                }

                if (meeting.waitingRoomEnabled) {
                    // Add to waiting room
                    await meeting.addToWaitingRoom({
                        clerkUserId,
                        username,
                        socketId: socket.id
                    });

                    // Notify host
                    const hostSocketId = Object.keys(usernames).find(
                        sid => clerkUserIds[sid] === meeting.hostClerkUserId
                    );

                    if (hostSocketId) {
                        io.to(hostSocketId).emit('waiting-room-request', {
                            socketId: socket.id,
                            username,
                            clerkUserId
                        });
                    }

                    socket.emit('in-waiting-room', {
                        message: 'Waiting for host approval'
                    });
                } else {
                    // Directly admit
                    socket.emit('admitted', {
                        message: 'You can join the meeting'
                    });
                }
            } catch (error) {
                console.error("❌ Error in request-to-join:", error);
            }
        });

        // Admit participant from waiting room
        socket.on("admit-participant", async (meetingCode, participantSocketId) => {
            try {
                const meeting = await Meeting.findOne({ meetingCode, isActive: true });

                if (!meeting) return;

                // Verify sender is host
                if (clerkUserIds[socket.id] !== meeting.hostClerkUserId) {
                    socket.emit('error', {
                        code: 'UNAUTHORIZED',
                        message: 'Only the host can admit participants'
                    });
                    return;
                }

                await meeting.admitParticipant(participantSocketId);

                // Notify admitted participant
                io.to(participantSocketId).emit('admitted', {
                    message: 'You have been admitted to the meeting'
                });

                console.log(`✅ Participant ${participantSocketId} admitted to ${meetingCode}`);
            } catch (error) {
                console.error("❌ Error admitting participant:", error);
            }
        });

        // Remove participant from meeting
        socket.on("remove-participant", async (meetingCode, participantSocketId, reason) => {
            try {
                const meeting = await Meeting.findOne({ meetingCode, isActive: true });

                if (!meeting) return;

                // Verify sender is host
                if (clerkUserIds[socket.id] !== meeting.hostClerkUserId) {
                    socket.emit('error', {
                        code: 'UNAUTHORIZED',
                        message: 'Only the host can remove participants'
                    });
                    return;
                }

                await meeting.removeParticipant(participantSocketId, reason);

                // Force disconnect the participant
                io.to(participantSocketId).emit('removed-from-meeting', {
                    reason: reason || 'Removed by host'
                });

                // Notify all participants
                if (connections[meetingCode]) {
                    connections[meetingCode].forEach(sid => {
                        io.to(sid).emit('participant-removed', {
                            socketId: participantSocketId,
                            reason
                        });
                    });
                }

                console.log(`🚫 Participant ${participantSocketId} removed from ${meetingCode}`);
            } catch (error) {
                console.error("❌ Error removing participant:", error);
            }
        });

        // Start recording
        socket.on("start-recording", async (meetingCode) => {
            try {
                const meeting = await Meeting.findOne({ meetingCode, isActive: true });

                if (!meeting) return;

                // Verify sender is host
                if (clerkUserIds[socket.id] !== meeting.hostClerkUserId) {
                    socket.emit('error', {
                        code: 'UNAUTHORIZED',
                        message: 'Only the host can start recording'
                    });
                    return;
                }

                if (!meeting.settings.allowRecording) {
                    socket.emit('error', {
                        code: 'RECORDING_DISABLED',
                        message: 'Recording is disabled for this meeting'
                    });
                    return;
                }

                meeting.isRecording = true;
                meeting.recordings.push({
                    startedAt: new Date(),
                    initiatedBy: clerkUserIds[socket.id]
                });
                await meeting.save();

                // Notify all participants
                if (connections[meetingCode]) {
                    connections[meetingCode].forEach(sid => {
                        io.to(sid).emit('recording-started', {
                            startedBy: usernames[socket.id]
                        });
                    });
                }

                console.log(`🔴 Recording started for ${meetingCode}`);
            } catch (error) {
                console.error("❌ Error starting recording:", error);
            }
        });

        // Stop recording
        socket.on("stop-recording", async (meetingCode, recordingUrl) => {
            try {
                const meeting = await Meeting.findOne({ meetingCode, isActive: true });

                if (!meeting) return;

                // Verify sender is host
                if (clerkUserIds[socket.id] !== meeting.hostClerkUserId) {
                    socket.emit('error', {
                        code: 'UNAUTHORIZED',
                        message: 'Only the host can stop recording'
                    });
                    return;
                }

                meeting.isRecording = false;

                // Update the last recording entry
                if (meeting.recordings.length > 0) {
                    const lastRecording = meeting.recordings[meeting.recordings.length - 1];
                    lastRecording.endedAt = new Date();
                    lastRecording.duration = Math.round((lastRecording.endedAt - lastRecording.startedAt) / 1000);
                    lastRecording.url = recordingUrl || '';
                }

                await meeting.save();

                // Notify all participants
                if (connections[meetingCode]) {
                    connections[meetingCode].forEach(sid => {
                        io.to(sid).emit('recording-stopped', {
                            stoppedBy: usernames[socket.id]
                        });
                    });
                }

                console.log(`⏹️ Recording stopped for ${meetingCode}`);
            } catch (error) {
                console.error("❌ Error stopping recording:", error);
            }
        });

        // Update participant analytics (mic, camera, screen share usage)
        socket.on("update-analytics", async (meetingCode, analyticsData) => {
            try {
                const meeting = await Meeting.findOne({ meetingCode, isActive: true });

                if (!meeting) return;

                const participant = meeting.participants.find(
                    p => p.socketId === socket.id && !p.leftAt
                );

                if (participant) {
                    if (analyticsData.microphoneTime !== undefined) {
                        participant.microphoneTime = analyticsData.microphoneTime;
                    }
                    if (analyticsData.cameraTime !== undefined) {
                        participant.cameraTime = analyticsData.cameraTime;
                    }
                    if (analyticsData.screenShareTime !== undefined) {
                        participant.screenShareTime = analyticsData.screenShareTime;
                    }

                    await meeting.save();
                }
            } catch (error) {
                console.error("❌ Error updating analytics:", error);
            }
        });

        socket.on("disconnect", async () => {
            try {
                var diffTime = Math.abs(new Date() - timeOnline[socket.id]);
                var key;
                for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
                    for (let a = 0; a < v.length; a++) {
                        if (v[a] === socket.id) {
                            key = k;
                            for (let b = 0; b < connections[key].length; b++) {
                                io.to(connections[key][b]).emit("user-disconnected", socket.id, diffTime);
                            }

                            // Update participant leftAt time in database
                            const meeting = await Meeting.findOne({ meetingCode: key, isActive: true });
                            if (meeting) {
                                const participant = meeting.participants.find(
                                    p => p.username === usernames[socket.id] && !p.leftAt
                                );
                                if (participant) {
                                    participant.leftAt = new Date();
                                    await meeting.save();
                                }
                            }

                            var index = connections[key].indexOf(socket.id);
                            connections[key].splice(index, 1);

                            // If last person leaves, mark meeting as ended
                            if (connections[key].length === 0) {
                                const endMeeting = await Meeting.findOne({ meetingCode: key, isActive: true });
                                if (endMeeting) {
                                    endMeeting.isActive = false;
                                    endMeeting.endTime = new Date();
                                    endMeeting.calculateDuration();
                                    await endMeeting.save();
                                    console.log(`🔚 Meeting ended: ${key}`);
                                }

                                delete connections[key];
                                delete messages[key];
                                delete meetingDocs[key];
                            }

                        }
                    }
                }
                // Clean up stored data
                delete usernames[socket.id];
                delete clerkUserIds[socket.id];
                delete timeOnline[socket.id];
            } catch (error) {
                console.error("❌ Error in disconnect handler:", error);
            }
        });
    });

    // Restore active meetings on server start
    restoreActiveMeetings();

    // Schedule periodic cleanup
    setInterval(cleanupInactiveMeetings, CLEANUP_INTERVAL);
    console.log(`⏰ Cleanup scheduled every ${CLEANUP_INTERVAL / 1000 / 60} minutes`);

    return io;
}

export default connectToSocket;