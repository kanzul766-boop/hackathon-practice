import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/users.model.js";

const TOKEN_EXPIRY = "1h";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

function createToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    secret,
    { expiresIn: TOKEN_EXPIRY },
  );
}

function serializeUser(user) {
  const serializedUser = {
    id: user._id,
    userName: user.userName,
    email: user.email,
    role: user.role,
  };
  if (user.role === "doctor") {
    serializedUser.doctorApprovalStatus = user.doctorApprovalStatus ?? "approved";
  }
  return serializedUser;
}

async function registerUser(req, res) {
  try {
    const { userName, email, password } = req.body ?? {};
    if (
      typeof userName !== "string" ||
      !userName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "userName, email, and password are required",
      });
    }

    const normalizedUserName = userName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await userModel.findOne({
      $or: [{ userName: normalizedUserName }, { email: normalizedEmail }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "A user with that email or username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await userModel.create({
      userName: normalizedUserName,
      email: normalizedEmail,
      password: hashedPassword,
    });
    const token = createToken(user);

    res.cookie("token", token, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: serializeUser(user),
      token,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "A user with that email or username already exists",
      });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid user data" });
    }

    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function registerDoctor(req, res) {
  try {
    const { userName, email, password, specialization, experience } = req.body ?? {};
    if (
      typeof userName !== "string" ||
      !userName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password ||
      (specialization !== undefined && typeof specialization !== "string") ||
      (experience !== undefined &&
        (typeof experience !== "number" ||
          !Number.isFinite(experience) ||
          experience < 0))
    ) {
      return res.status(400).json({
        message: "userName, email, and password are required; specialization and experience must be valid when provided",
      });
    }

    const normalizedUserName = userName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await userModel.findOne({
      $or: [{ userName: normalizedUserName }, { email: normalizedEmail }],
    });
    if (existingUser) {
      return res.status(409).json({
        message: "A user with that email or username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const doctor = await userModel.create({
      userName: normalizedUserName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "doctor",
      doctorApprovalStatus: "pending",
      specialization: specialization?.trim(),
      experience: experience ?? 0,
    });
    const token = createToken(doctor);

    res.cookie("token", token, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "Doctor application submitted",
      user: serializeUser(doctor),
      token,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "A user with that email or username already exists",
      });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid doctor data" });
    }

    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body ?? {};
    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "This account is inactive" });
    }

    const token = createToken(user);
    res.cookie("token", token, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: serializeUser(user),
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

function logoutUser(req, res) {
  res.clearCookie("token", COOKIE_OPTIONS);
  return res.status(200).json({ message: "Logout successful" });
}

export { registerUser, registerDoctor, loginUser, logoutUser };
