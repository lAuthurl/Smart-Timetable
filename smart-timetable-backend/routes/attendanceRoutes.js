import express from "express";
import Attendance from "../models/Attendance.js";

const router = express.Router();

// 📝 Mark attendance
router.post("/", async (req, res) => {
  const { userId, subject, date, status, comprehension, mood, notes } =
    req.body;

  const record = new Attendance({
    userId,
    subject,
    date,
    status,
    comprehension,
    mood,
    notes,
  });

  await record.save();
  res.json({ message: "Attendance logged successfully" });
});

// 📊 Get attendance history
router.get("/", async (req, res) => {
  const data = await Attendance.find({ userId: "test-user" });
  res.json(data);
});

// 📊 Calculate attendance stats
router.get("/stats", async (req, res) => {
  const records = await Attendance.find({ userId: "test-user" });
  const subjects = {};

  records.forEach((r) => {
    if (!subjects[r.subject])
      subjects[r.subject] = { total: 0, present: 0, avgComprehension: 0 };
    subjects[r.subject].total++;
    if (r.status === "Present") subjects[r.subject].present++;
    subjects[r.subject].avgComprehension += r.comprehension || 0;
  });

  const stats = Object.entries(subjects).map(([subject, data]) => ({
    subject,
    attendanceRate: ((data.present / data.total) * 100).toFixed(1),
    avgComprehension: (data.avgComprehension / data.total).toFixed(1),
  }));

  res.json(stats);
});

export default router;
