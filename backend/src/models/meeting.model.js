import { Schema } from "mongoose";
import mongoose from "mongoose";

const meetingSchema = new Schema(
    {
        meetingCode: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
            minlength: 3,
            maxlength: 50
        },
        hostClerkUserId: {
            type: String,
            required: true,
            index: true
        },
        hostUsername: {
            type: String,
            required: true
        },
        // Security Features
        password: {
            type: String,
            select: false // Don't return password by default
        },
        isPasswordProtected: {
            type: Boolean,
            default: false
        },
        waitingRoomEnabled: {
            type: Boolean,
            default: false
        },
        waitingRoom: [{
            clerkUserId: String,
            username: { type: String, required: true },
            socketId: String,
            requestedAt: { type: Date, default: Date.now }
        }],
        allowedParticipants: [{
            clerkUserId: String,
            username: String,
            allowedAt: { type: Date, default: Date.now }
        }],
        removedParticipants: [{
            clerkUserId: String,
            username: String,
            removedAt: { type: Date, default: Date.now },
            reason: String
        }],
        // Participants with enhanced tracking
        participants: [{
            clerkUserId: String,
            username: { type: String, required: true },
            socketId: String,
            joinedAt: { type: Date, default: Date.now },
            leftAt: { type: Date },
            isHost: { type: Boolean, default: false },
            // Analytics
            totalDuration: { type: Number, default: 0 }, // in seconds
            microphoneTime: { type: Number, default: 0 }, // time with mic on
            cameraTime: { type: Number, default: 0 }, // time with camera on
            screenShareTime: { type: Number, default: 0 }
        }],
        chatHistory: [{
            sender: { type: String, required: true },
            message: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            socketId: String
        }],
        startTime: {
            type: Date,
            default: Date.now,
            required: true
        },
        endTime: {
            type: Date
        },
        duration: {
            type: Number, // in minutes
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        // Recording Features
        isRecording: {
            type: Boolean,
            default: false
        },
        recordings: [{
            startedAt: Date,
            endedAt: Date,
            duration: Number, // in seconds
            url: String,
            size: Number, // in bytes
            initiatedBy: String // clerkUserId
        }],
        recordingUrl: {
            type: String
        },
        // Analytics
        analytics: {
            totalParticipants: { type: Number, default: 0 },
            peakParticipants: { type: Number, default: 0 },
            totalMessages: { type: Number, default: 0 },
            totalScreenShares: { type: Number, default: 0 },
            averageParticipantDuration: { type: Number, default: 0 }, // in minutes
            participantJoinEvents: { type: Number, default: 0 },
            participantLeaveEvents: { type: Number, default: 0 }
        },
        // Meeting Settings
        settings: {
            maxParticipants: { type: Number, default: 50 },
            muteOnEntry: { type: Boolean, default: false },
            disableChat: { type: Boolean, default: false },
            allowScreenShare: { type: Boolean, default: true },
            allowRecording: { type: Boolean, default: true },
            autoRecording: { type: Boolean, default: false }
        }
    },
    { timestamps: true }
)

// Index for efficient queries
meetingSchema.index({ hostClerkUserId: 1, createdAt: -1 });
meetingSchema.index({ 'participants.clerkUserId': 1 });

// Method to calculate and update duration
meetingSchema.methods.calculateDuration = function () {
    if (this.endTime && this.startTime) {
        this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
    }
    return this.duration;
};

// Method to verify password
meetingSchema.methods.verifyPassword = function (password) {
    if (!this.isPasswordProtected) return true;
    return this.password === password;
};

// Method to add participant to waiting room
meetingSchema.methods.addToWaitingRoom = function (participantData) {
    const existing = this.waitingRoom.find(p => p.socketId === participantData.socketId);
    if (!existing) {
        this.waitingRoom.push(participantData);
    }
    return this.save();
};

// Method to admit participant from waiting room
meetingSchema.methods.admitParticipant = function (socketId) {
    const participant = this.waitingRoom.find(p => p.socketId === socketId);
    if (participant) {
        this.allowedParticipants.push({
            clerkUserId: participant.clerkUserId,
            username: participant.username
        });
        this.waitingRoom = this.waitingRoom.filter(p => p.socketId !== socketId);
    }
    return this.save();
};

// Method to remove participant
meetingSchema.methods.removeParticipant = function (socketId, reason = 'Removed by host') {
    const participant = this.participants.find(p => p.socketId === socketId && !p.leftAt);
    if (participant) {
        participant.leftAt = new Date();
        this.removedParticipants.push({
            clerkUserId: participant.clerkUserId,
            username: participant.username,
            reason
        });
    }
    return this.save();
};

// Method to update analytics
meetingSchema.methods.updateAnalytics = function () {
    const activeParticipants = this.participants.filter(p => !p.leftAt).length;

    // Update peak participants
    if (activeParticipants > this.analytics.peakParticipants) {
        this.analytics.peakParticipants = activeParticipants;
    }

    // Update total participants (unique count)
    const uniqueParticipants = new Set(
        this.participants.map(p => p.clerkUserId || p.socketId)
    );
    this.analytics.totalParticipants = uniqueParticipants.size;

    // Calculate average participant duration
    const participantDurations = this.participants
        .filter(p => p.leftAt)
        .map(p => (p.leftAt - p.joinedAt) / (1000 * 60));

    if (participantDurations.length > 0) {
        this.analytics.averageParticipantDuration =
            participantDurations.reduce((a, b) => a + b, 0) / participantDurations.length;
    }

    // Update message count
    this.analytics.totalMessages = this.chatHistory.length;

    return this;
};

const Meeting = mongoose.model("Meeting", meetingSchema);
export { Meeting };