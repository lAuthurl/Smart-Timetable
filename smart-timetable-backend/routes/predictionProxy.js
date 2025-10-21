import express from "express";
import axios from "axios";
import AttendanceRecord from "../models/AttendanceRecord.js";
import Timetable from "../models/Timetable.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

function computeTrend(lastRatings) {
  // simple slope: average difference
  if (!lastRatings || lastRatings.length < 2) return 0;
  let diffs = 0;
  for (let i = 1; i < lastRatings.length; i++)
    diffs += lastRatings[i] - lastRatings[i - 1];
  return diffs / (lastRatings.length - 1);
}

router.get("/", protect, async (req, res) => {
  // compute user features
  const userId = req.user.id;
  const records = await AttendanceRecord.find({ user: userId }).sort({
    date: -1,
  });

  const bySubject = {};
  let total = 0,
    present = 0,
    compSum = 0,
    compCount = 0;
  const recentComps = [];

  records.forEach((r) => {
    total++;
    if (r.status === "Present") present++;
    if (r.comprehension) {
      compSum += r.comprehension;
      compCount++;
      recentComps.push(r.comprehension);
    }
  });

  const attendance_pct = total ? (present / total) * 100 : 0;
  const avg_comprehension = compCount ? compSum / compCount : 0;
  const last_4 = recentComps.slice(0, 4).reverse(); // latest first
  const trend = computeTrend(last_4);

  // call Python microservice
  try {
    const resp = await axios.post(
      "http://localhost:6000/predict",
      {
        attendance_pct,
        avg_comprehension,
        last_4_comp_trend: trend,
        streak: req.user.streak || 0,
      },
      { timeout: 5000 }
    );

    // optionally store prediction in DB (not shown)
    res.json(resp.data);
  } catch (err) {
    // fallback to heuristic in case microservice unreachable
    const grade =
      attendance_pct * 0.55 +
      (avg_comprehension / 5) * 100 * 0.35 +
      (req.user.streak || 0) * 1.5 +
      trend * 10;
    const clipped = Math.max(0, Math.min(100, grade));
    const risk = clipped >= 75 ? "low" : clipped >= 60 ? "medium" : "high";
    res.json({
      predicted_grade: Number(clipped.toFixed(2)),
      risk,
      explanation: { attendance_pct, avg_comprehension, trend },
    });
  }
});

export default router;
