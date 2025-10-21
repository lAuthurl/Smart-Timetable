import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema({
  userId: String,
  subject: String,
  day: String,
  time: String,
});

export default mongoose.model("Timetable", timetableSchema);
