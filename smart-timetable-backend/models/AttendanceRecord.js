import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    timetableEntry: { type: mongoose.Schema.Types.ObjectId, ref: "Timetable" },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      default: "present",
    },
    comprehension: { type: Number, min: 0, max: 100 },
    mood: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

const AttendanceRecord = mongoose.model(
  "AttendanceRecord",
  attendanceRecordSchema
);

export default AttendanceRecord;
