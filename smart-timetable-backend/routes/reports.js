import express from "express";
import AttendanceRecord from "../models/AttendanceRecord.js";
import Timetable from "../models/Timetable.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// PDF report
router.get("/pdf", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const records = await AttendanceRecord.find({ user: userId })
      .populate("timetableEntry")
      .sort({ date: -1 });

    // build simple summary
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="report-${userId}.pdf"`
    );

    doc
      .fontSize(20)
      .text("Smart Timetable — Attendance Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // Table-like listing (simple)
    records.forEach((r) => {
      const dateStr = new Date(r.date).toLocaleDateString();
      const subj = r.timetableEntry?.subject || r.subject || "Unknown";
      doc.text(
        `${dateStr} — ${subj} — ${r.status} — Compr: ${
          r.comprehension ?? "N/A"
        } — Mood: ${r.mood ?? ""}`
      );
    });

    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Excel report
router.get("/excel", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const records = await AttendanceRecord.find({ user: userId })
      .populate("timetableEntry")
      .sort({ date: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Attendance");

    sheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Subject", key: "subject", width: 30 },
      { header: "Status", key: "status", width: 10 },
      { header: "Comprehension", key: "comprehension", width: 15 },
      { header: "Mood", key: "mood", width: 10 },
      { header: "Notes", key: "notes", width: 40 },
    ];

    records.forEach((r) => {
      sheet.addRow({
        date: new Date(r.date).toLocaleDateString(),
        subject: r.timetableEntry?.subject || r.subject || "Unknown",
        status: r.status,
        comprehension: r.comprehension ?? "",
        mood: r.mood ?? "",
        notes: r.notes ?? "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report-${userId}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
