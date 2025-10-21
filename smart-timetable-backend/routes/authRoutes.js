import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists)
    return res.status(400).json({ message: "User already exists" });

  const user = await User.create({ name, email, password });
  res.json({
    _id: user.id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// protected test route
router.get("/", protect, async (req, res) => {
  try {
    res.json({ msg: "protected route ok", user: req.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
