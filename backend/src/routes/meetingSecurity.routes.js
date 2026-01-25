import express from 'express';
import {
    createMeeting,
    verifyMeetingPassword,
    getMeetingInfo,
    admitParticipant,
    removeParticipantFromMeeting,
    startRecording,
    stopRecording,
    getMeetingAnalytics,
    getUserStatistics
} from '../controllers/meetingSecurity.controller.js';

const router = express.Router();

// Meeting management
router.post('/create', createMeeting);
router.get('/info/:meetingCode', getMeetingInfo);
router.post('/verify-password', verifyMeetingPassword);

// Participant management
router.post('/admit-participant', admitParticipant);
router.post('/remove-participant', removeParticipantFromMeeting);

// Recording
router.post('/start-recording', startRecording);
router.post('/stop-recording', stopRecording);

// Analytics
router.get('/analytics/:meetingCode', getMeetingAnalytics);
router.get('/user-statistics/:clerkUserId', getUserStatistics);

export default router;
