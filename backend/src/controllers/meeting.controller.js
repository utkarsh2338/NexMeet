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

export {
    getUserMeetings,
    getMeetingByCode,
    getMeetingHistory,
    deleteOldMeetings
};
