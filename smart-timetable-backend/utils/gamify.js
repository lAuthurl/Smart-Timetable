import User from "../models/User.js";
import dayjs from "dayjs";

export async function processAttendanceGamification(userId, attendanceRecord) {
  // attendanceRecord: { status: 'Present'|'Absent'|'Late', comprehension: number }
  const user = await User.findById(userId);
  if (!user) return;

  const today = dayjs().startOf("day");
  const last = user.lastAttendanceDate
    ? dayjs(user.lastAttendanceDate).startOf("day")
    : null;

  // Points: present = +10, late = +5, absent = 0
  let pointsGain = 0;
  if (attendanceRecord.status === "Present") pointsGain = 10;
  else if (attendanceRecord.status === "Late") pointsGain = 5;

  // Extra points for comprehension: +1 point per comprehension star above 3
  if (attendanceRecord.comprehension) {
    pointsGain += Math.max(0, attendanceRecord.comprehension - 3);
  }

  // Update streak:
  // If lastAttendanceDate is yesterday and current is present -> streak+1
  // If lastAttendanceDate is today -> no change
  // Else if present -> streak = 1
  if (attendanceRecord.status === "Present") {
    if (last && last.add(1, "day").isSame(today, "day")) {
      user.streak += 1;
    } else if (last && last.isSame(today, "day")) {
      // already counted today — no change
    } else {
      user.streak = 1;
    }
  } else {
    // if absent, reset streak
    if (attendanceRecord.status === "Absent") user.streak = 0;
  }

  // Update points & lastAttendanceDate
  user.points += pointsGain;
  user.lastAttendanceDate = new Date();

  // Badge awarding examples:
  const badgesGranted = [];
  // Perfect Week badge: streak >= 5
  if (user.streak === 5 && !user.badges.some((b) => b.key === "perfect_week")) {
    const badge = {
      key: "perfect_week",
      name: "Perfect Week",
      dateAwarded: new Date(),
    };
    user.badges.push(badge);
    badgesGranted.push(badge);
  }
  // Knowledge Climber badge: points >= 100
  if (
    user.points >= 100 &&
    !user.badges.some((b) => b.key === "knowledge_climber")
  ) {
    const badge = {
      key: "knowledge_climber",
      name: "Knowledge Climber",
      dateAwarded: new Date(),
    };
    user.badges.push(badge);
    badgesGranted.push(badge);
  }
  // High comprehension streak badge (example): if comprehension >=4 and streak>7
  if (
    user.streak >= 7 &&
    attendanceRecord.comprehension >= 4 &&
    !user.badges.some((b) => b.key === "consistency")
  ) {
    const badge = {
      key: "consistency",
      name: "Consistency Champion",
      dateAwarded: new Date(),
    };
    user.badges.push(badge);
    badgesGranted.push(badge);
  }

  await user.save();
  return {
    pointsGain,
    badgesGranted,
    newStreak: user.streak,
    totalPoints: user.points,
  };
}
