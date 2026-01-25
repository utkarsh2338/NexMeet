import { Meeting } from '../models/meeting.model.js';
import httpStatus from 'http-status';

/**
 * Create a new meeting with security settings
 */
export const createMeeting = async (req, res, next) => {
    try {
        const {
            meetingCode,
            hostClerkUserId,
            hostUsername,
            password,
            waitingRoomEnabled,
            settings
        } = req.body;

        // Check if meeting code already exists
        const existingMeeting = await Meeting.findOne({ meetingCode, isActive: true });
        if (existingMeeting) {
            return res.status(httpStatus.CONFLICT).json({
                success: false,
                message: 'Meeting code already in use'
            });
        }

        // Create new meeting
        const meeting = new Meeting({
            meetingCode,
            hostClerkUserId,
            hostUsername,
            password: password || undefined,
            isPasswordProtected: !!password,
            waitingRoomEnabled: waitingRoomEnabled || false,
            settings: settings || {},
            participants: [{
                clerkUserId: hostClerkUserId,
                username: hostUsername,
                isHost: true,
                joinedAt: new Date()
            }]
        });

        await meeting.save();

        // Return meeting without password
        const meetingData = meeting.toObject();
        delete meetingData.password;

        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Meeting created successfully',
            data: meetingData
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify meeting password
 */
export const verifyMeetingPassword = async (req, res, next) => {
    try {
        const { meetingCode, password } = req.body;

        const meeting = await Meeting.findOne({
            meetingCode,
            isActive: true
        }).select('+password');

        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        if (!meeting.isPasswordProtected) {
            return res.json({
                success: true,
                message: 'No password required',
                data: { verified: true }
            });
        }

        const isValid = meeting.verifyPassword(password);

        res.json({
            success: true,
            data: { verified: isValid }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get meeting info (public data only)
 */
export const getMeetingInfo = async (req, res, next) => {
    try {
        const { meetingCode } = req.params;

        const meeting = await Meeting.findOne({
            meetingCode,
            isActive: true
        }).select('-password -chatHistory');

        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        const activeParticipants = meeting.participants.filter(p => !p.leftAt).length;

        res.json({
            success: true,
            data: {
                meetingCode: meeting.meetingCode,
                hostUsername: meeting.hostUsername,
                isPasswordProtected: meeting.isPasswordProtected,
                waitingRoomEnabled: meeting.waitingRoomEnabled,
                activeParticipants,
                maxParticipants: meeting.settings.maxParticipants,
                startTime: meeting.startTime,
                settings: meeting.settings
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Admit participant from waiting room
 */
export const admitParticipant = async (req, res, next) => {
    try {
        const { meetingCode, socketId, hostClerkUserId } = req.body;

        const meeting = await Meeting.findOne({ meetingCode, isActive: true });

        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // Verify requester is the host
        if (meeting.hostClerkUserId !== hostClerkUserId) {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'Only the host can admit participants'
            });
        }

        await meeting.admitParticipant(socketId);

        res.json({
            success: true,
            message: 'Participant admitted'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove participant from meeting
 */
export const removeParticipantFromMeeting = async (req, res, next) => {
    try {
        const { meetingCode, socketId, hostClerkUserId, reason } = req.body;

        const meeting = await Meeting.findOne({ meetingCode, isActive: true });

        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // Verify requester is the host
        if (meeting.hostClerkUserId !== hostClerkUserId) {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'Only the host can remove participants'
            });
        }

        await meeting.removeParticipant(socketId, reason);

        res.json({
            success: true,
            message: 'Participant removed'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Start recording
 */
export const startRecording = async (req, res, next) => {
    try {
        const { meetingCode, hostClerkUserId } = req.body;

        const meeting = await Meeting.findOne({ meetingCode, isActive: true });

        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // Verify requester is the host
        if (meeting.hostClerkUserId !== hostClerkUserId) {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'Only the host can start recording'
            });
        }

        if (!meeting.settings.allowRecording) {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'Recording is disabled for this meeting'
            });
        }

        meeting.isRecording = true;
        meeting.recordings.push({
            startedAt: new Date(),
            initiatedBy: hostClerkUserId
        });

        await meeting.save();

        res.json({
            success: true,
            message: 'Recording started',
            data: { isRecording: true }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Stop recording
 */
export const stopRecording = async (req, res, next) => {
    try {
        const { meetingCode, hostClerkUserId, recordingUrl } = req.body;

        const meeting = await Meeting.findOne({ meetingCode, isActive: true });

        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // Verify requester is the host
        if (meeting.hostClerkUserId !== hostClerkUserId) {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'Only the host can stop recording'
            });
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

        res.json({
            success: true,
            message: 'Recording stopped',
            data: { isRecording: false }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get meeting analytics
 */
export const getMeetingAnalytics = async (req, res, next) => {
    try {
        const { meetingCode } = req.params;
        const { clerkUserId } = req.query;

        const meeting = await Meeting.findOne({ meetingCode });

        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        // Only host can view analytics
        if (meeting.hostClerkUserId !== clerkUserId) {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'Only the host can view analytics'
            });
        }

        // Update analytics before returning
        meeting.updateAnalytics();
        await meeting.save();

        res.json({
            success: true,
            data: {
                meetingCode: meeting.meetingCode,
                duration: meeting.duration,
                analytics: meeting.analytics,
                participants: meeting.participants.map(p => ({
                    username: p.username,
                    joinedAt: p.joinedAt,
                    leftAt: p.leftAt,
                    totalDuration: p.totalDuration,
                    isHost: p.isHost
                })),
                recordings: meeting.recordings,
                totalMessages: meeting.chatHistory.length,
                startTime: meeting.startTime,
                endTime: meeting.endTime
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's meeting statistics
 */
export const getUserStatistics = async (req, res, next) => {
    try {
        const { clerkUserId } = req.params;

        // Meetings hosted
        const hostedMeetings = await Meeting.find({
            hostClerkUserId: clerkUserId
        });

        // Meetings participated
        const participatedMeetings = await Meeting.find({
            'participants.clerkUserId': clerkUserId
        });

        // Calculate statistics
        const stats = {
            totalMeetingsHosted: hostedMeetings.length,
            totalMeetingsJoined: participatedMeetings.length,
            totalMeetingDuration: hostedMeetings.reduce((sum, m) => sum + (m.duration || 0), 0),
            totalParticipantsHosted: hostedMeetings.reduce((sum, m) =>
                sum + (m.analytics?.totalParticipants || 0), 0
            ),
            averageMeetingDuration: hostedMeetings.length > 0
                ? hostedMeetings.reduce((sum, m) => sum + (m.duration || 0), 0) / hostedMeetings.length
                : 0,
            totalRecordings: hostedMeetings.reduce((sum, m) =>
                sum + (m.recordings?.length || 0), 0
            ),
            recentMeetings: hostedMeetings
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 10)
                .map(m => ({
                    meetingCode: m.meetingCode,
                    startTime: m.startTime,
                    endTime: m.endTime,
                    duration: m.duration,
                    participants: m.analytics?.totalParticipants || 0
                }))
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};
