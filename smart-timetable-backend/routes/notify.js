import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import axios from "axios";
import { sendExpoPush } from "../utils/notifications.js";

const router = express.Router();

router.post("/check", protect, async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);
  const records = await AttendanceRecord.find({ userId })
    .sort({ date: -1 })
    .limit(10);

  // compute simple metrics
  const total = records.length;
  const present = records.filter((r) => r.status === "Present").length;
  const attendance_pct = total ? (present / total) * 100 : 0;
  const avgComp =
    records
      .filter((r) => r.comprehension)
      .reduce((s, r) => s + r.comprehension, 0) /
    (records.filter((r) => r.comprehension).length || 1);

  // call prediction endpoint (internal)
  let prediction;
  try {
    const resp = await axios.get("http://localhost:5000/api/predict", {
      headers: {
        Authorization: `Bearer ${req.headers.authorization.split(" ")[1]}`,
      },
    });
    prediction = resp.data;
  } catch (err) {
    prediction = { predicted_grade: 0, risk: "high" };
  }

  // decide notification
  if (prediction.risk === "high") {
    await sendExpoPush(
      user.expoPushToken,
      "Academic risk detected",
      `Your predicted grade is ${prediction.predicted_grade}. Let's schedule a study session.`
    );
    return res.json({ notified: true, reason: "high risk" });
  }

  // also notify if avg comprehension < 3
  if (avgComp && avgComp < 3) {
    await sendExpoPush(
      user.expoPushToken,
      "Low comprehension noticed",
      `Your recent comprehension avg is ${avgComp.toFixed(
        1
      )} — try a quick review of weak topics.`
    );
    return res.json({ notified: true, reason: "low comprehension" });
  }

  res.json({ notified: false });
});

export default router;
