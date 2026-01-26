import { Meeting } from "../models/meeting.model.js";
import httpStatus from "http-status";

// Get all meetings for a user (as host or participant)
const getUserMeetings = async (req, res) => {
    try {
        const { clerkUserId } = req.params;

        if (!clerkUserId) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Clerk User ID is required"
            });
        }

        // Find meetings where user is host or participant
        const meetings = await Meeting.find({
            $or: [
                { hostClerkUserId: clerkUserId },
                { 'participants.clerkUserId': clerkUserId }
            ]
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .select('-chatHistory'); // Exclude chat history for performance

        res.status(httpStatus.OK).json({
            success: true,
            count: meetings.length,
            meetings
        });
    } catch (error) {
        console.error("Error fetching user meetings:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Failed to fetch meetings"
        });
    }
};

// Get meeting details by code
const getMeetingByCode = async (req, res) => {
    try {
        const { meetingCode } = req.params;

        const meeting = await Meeting.findOne({ meetingCode });

        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: "Meeting not found"
            });
        }

        res.status(httpStatus.OK).json({
            success: true,
            meeting
        });
    } catch (error) {
        console.error("Error fetching meeting:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Failed to fetch meeting"
        });
    }
};

// Get meeting history with chat
const getMeetingHistory = async (req, res) => {
    try {
        const { meetingCode } = req.params;

        const meeting = await Meeting.findOne({ meetingCode, isActive: false });

        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: "Meeting history not found"
            });
        }

        res.status(httpStatus.OK).json({
            success: true,
            meeting
        });
    } catch (error) {
        console.error("Error fetching meeting history:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Failed to fetch meeting history"
        });
    }
};

// Delete old meetings (cleanup)
const deleteOldMeetings = async (req, res) => {
    try {
        const daysToKeep = 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const result = await Meeting.deleteMany({
            isActive: false,
            endTime: { $lt: cutoffDate }
        });

        res.status(httpStatus.OK).json({
            success: true,
            message: `Deleted ${result.deletedCount} old meetings`
        });
    } catch (error) {
        console.error("Error deleting old meetings:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Failed to delete old meetings"
        });
    }
};

// Get TURN server credentials for WebRTC
const getTurnCredentials = async (req, res) => {
    try {
        // STUN servers (free, reliable)
        const iceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
        ];

        // Note: TURN servers will be added from Xirsys or Metered if configured
        console.log(`📡 Configured ${iceServers.length} STUN servers`);

        // Priority 1: Try to fetch TURN credentials from Xirsys if configured
        const xirsysIdent = process.env.XIRSYS_IDENT; // Format: username (from Xirsys dashboard)
        const xirsysSecret = process.env.XIRSYS_SECRET; // Secret key from Xirsys dashboard
        const xirsysChannel = process.env.XIRSYS_CHANNEL || 'default'; // Your channel name

        if (xirsysIdent && xirsysSecret) {
            try {
                const auth = Buffer.from(`${xirsysIdent}:${xirsysSecret}`).toString('base64');
                const response = await fetch(
                    `https://global.xirsys.net/_turn/${xirsysChannel}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.v && data.v.iceServers) {
                        // Xirsys returns in format: { v: { iceServers: [...] } }
                        iceServers.push(...data.v.iceServers);
                        console.log("✅ Fetched TURN credentials from Xirsys:", data.v.iceServers.length, "servers");
                    }
                } else {
                    console.warn("⚠️ Xirsys API returned status:", response.status);
                }
            } catch (error) {
                console.warn("⚠️ Failed to fetch Xirsys TURN credentials:", error.message);
            }
        }

        // Priority 2: Try to fetch TURN credentials from Metered.ca if configured
        const meteredApiKey = process.env.METERED_API_KEY;
        const meteredAppName = process.env.METERED_APP_NAME;

        if (meteredApiKey && meteredAppName) {
            try {
                const response = await fetch(
                    `https://${meteredAppName}.metered.live/api/v1/turn/credentials?apiKey=${meteredApiKey}`
                );

                if (response.ok) {
                    const turnServers = await response.json();
                    iceServers.push(...turnServers);
                    console.log("✅ Fetched TURN credentials from Metered.ca:", turnServers.length, "servers");
                } else {
                    console.warn("⚠️ Metered API returned status:", response.status);
                }
            } catch (error) {
                console.warn("⚠️ Failed to fetch Metered TURN credentials:", error.message);
            }
        }

        // Log final count
        const turnCount = iceServers.filter(s => s.urls?.includes('turn:')).length;
        console.log(`🎯 Final ICE config: ${iceServers.length} total servers (${turnCount} TURN)`);

        res.status(httpStatus.OK).json({
            success: true,
            iceServers,
            iceCandidatePoolSize: 10
        });
    } catch (error) {
        console.error("Error getting TURN credentials:", error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Failed to get TURN credentials"
        });
    }
};

export {
    getUserMeetings,
    getMeetingByCode,
    getMeetingHistory,
    deleteOldMeetings,
    getTurnCredentials
};
