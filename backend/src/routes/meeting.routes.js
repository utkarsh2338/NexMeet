import { Router } from "express";
import {
    getUserMeetings,
    getMeetingByCode,
    getMeetingHistory,
    deleteOldMeetings,
    getTurnCredentials
} from "../controllers/meeting.controller.js";

const router = Router();

// Get TURN server credentials for WebRTC
router.get("/turn-credentials", getTurnCredentials);

// Get all meetings for a user
router.get("/user/:clerkUserId", getUserMeetings);

// Get meeting by code
router.get("/code/:meetingCode", getMeetingByCode);

// Get meeting history (ended meetings with chat)
router.get("/history/:meetingCode", getMeetingHistory);

// Cleanup old meetings (could be called by a cron job)
router.delete("/cleanup", deleteOldMeetings);

export default router;
