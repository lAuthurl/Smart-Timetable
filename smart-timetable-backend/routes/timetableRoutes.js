import express from "express";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";
import Timetable from "../models/Timetable.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// 📤 Upload timetable (CSV)
router.post("/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const entries = [];

  fs.createReadStream(filePath)
    .pipe(parse({ columns: true, trim: true }))
    .on("data", (row) => {
      entries.push({
        userId: req.body.userId || "test-user",
        subject: row.subject,
        day: row.day,
        time: row.time,
      });
    })
    .on("end", async () => {
      await Timetable.insertMany(entries);
      fs.unlinkSync(filePath);
      res.json({
        message: "Timetable uploaded successfully",
        count: entries.length,
      });
    });
});

// 📅 Get timetable
router.get("/", async (req, res) => {
  const data = await Timetable.find({ userId: "test-user" });
  res.json(data);
});

export default router;
