// routes/predict.js
import express from "express";
const router = express.Router();

// Simple heuristic: weighted sum -> numeric grade 0-100
router.post("/", async (req, res) => {
  const {
    attendance_pct = 0,
    avg_comprehension = 0,
    last_4_comp_trend = 0,
    streak = 0,
  } = req.body;
  // Normalize comprehension (1-5) to 0-100
  const comp_score = (avg_comprehension / 5) * 100;
  // Heuristic weights
  const grade =
    attendance_pct * 0.55 +
    comp_score * 0.35 +
    streak * 1.5 +
    last_4_comp_trend * 10;
  const clipped = Math.max(0, Math.min(100, grade));
  const risk = clipped >= 75 ? "low" : clipped >= 60 ? "medium" : "high";
  res.json({
    predicted_grade: Number(clipped.toFixed(2)),
    risk,
    explanation: { attendance_pct, comp_score, last_4_comp_trend, streak },
  });
});

export default router;
