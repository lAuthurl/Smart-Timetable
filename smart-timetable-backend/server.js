import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import gamificationRoutes from "./routes/gamification.js";
import reportsRoutes from "./routes/reports.js";
import predictionRoutes from "./routes/predictionProxy.js";
import User from "./models/User.js";
import cron from "node-cron";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/gamify", gamificationRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/predict", predictionRoutes);

cron.schedule("0 20 * * *", async () => {
  console.log("Running daily gamification checks...");
  try {
    const users = await User.find({}, "_id").lean();

    const baseUrl =
      process.env.INTERNAL_BASE_URL ||
      `http://localhost:${process.env.PORT || 5000}`;

    for (const u of users) {
      try {
        // Prefer calling an internal util if available
        let usedUtil = false;
        try {
          const mod = await import("./utils/gamify.js");
          if (mod && typeof mod.runDailyChecksForUser === "function") {
            await mod.runDailyChecksForUser(u._id);
            usedUtil = true;
          }
        } catch (e) {
          // ignore dynamic-import errors, fallback below
        }

        if (usedUtil) continue;

        // Fallback: call internal HTTP endpoint (make sure route exists)
        // Node 18+ has global fetch. If using older Node, install node-fetch and replace.
        await fetch(`${baseUrl}/api/gamify/daily-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: u._id }),
        });
      } catch (err) {
        console.error(`Daily gamify check failed for user ${u._id}:`, err);
      }
    }

    console.log("Daily gamification checks completed.");
  } catch (err) {
    console.error("Daily gamification job failed:", err);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
