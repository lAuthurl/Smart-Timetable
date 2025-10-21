import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Top N leaderboard
router.get("/leaderboard", protect, async (req, res) => {
  const top = await User.find()
    .sort({ points: -1 })
    .limit(20)
    .select("name points streak badges");
  res.json(top);
});

// Get current user's badges & points
router.get("/me", protect, async (req, res) => {
  const u = await User.findById(req.user.id).select(
    "name points streak badges"
  );
  res.json(u);
});

export default router;
