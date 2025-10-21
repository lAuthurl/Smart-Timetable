import express from "express";
import AttendanceRecord from "../models/AttendanceRecord.js";
import { protect } from "../middleware/authMiddleware.js";
import { processAttendanceGamification } from "../utils/gamify.js";

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const { timetableEntryId, date, status, comprehension, mood, notes } =
      req.body;
    const rec = new AttendanceRecord({
      user: req.user.id, // from protect middleware
      timetableEntry: timetableEntryId,
      date: date || new Date(),
      status,
      comprehension,
      mood,
      notes,
    });
    await rec.save();

    // process gamification
    const gamifyResult = await processAttendanceGamification(req.user.id, {
      status,
      comprehension,
    });

    res.json({ success: true, record: rec, gamify: gamifyResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
