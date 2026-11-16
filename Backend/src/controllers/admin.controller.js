import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import appointmentModel from "../models/appointment.model.js";
import userModel from "../models/users.model.js";
import {
  paginationResponse,
  parseAppointmentFilters,
  parsePagination,
} from "../utils/list-query.js";

function serializeUser(user) {
  return {
    id: user._id,
    userName: user.userName,
    email: user.email,
    role: user.role,
    specialization: user.specialization,
    experience: user.experience,
    isActive: user.isActive,
  };
}

async function getUsers(req, res) {
  try {
    const users = await userModel
      .find({})
      .select("userName email role specialization experience isActive")
      .sort({ userName: 1 });

    return res.status(200).json({ users: users.map(serializeUser) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function createDoctor(req, res) {
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
      (typeof experience !== "number" || !Number.isFinite(experience) || experience < 0))
  ) {
    return res.status(400).json({
      message: "Valid userName, email, password, specialization, and experience are required",
    });
  }

  try {
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
      specialization: specialization?.trim(),
      experience: experience ?? 0,
    });

    return res.status(201).json({
      message: "Doctor created successfully",
      doctor: serializeUser(doctor),
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

async function deleteUser(req, res) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const user = await userModel.findById(req.params.id).select("_id role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ message: "Admin accounts cannot be deleted" });
    }

    await userModel.deleteOne({ _id: user._id });
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function updateUserStatus(req, res) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  if (typeof req.body?.isActive !== "boolean") {
    return res.status(400).json({ message: "isActive must be a boolean" });
  }

  try {
    const user = await userModel.findById(req.params.id).select(
      "_id userName email role specialization experience isActive",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ message: "Admin account status cannot be changed" });
    }

    user.isActive = req.body.isActive;
    await user.save();
    return res.status(200).json({
      message: "User status updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getAppointments(req, res) {
  const pagination = parsePagination(req.query);
  const parsedFilters = parseAppointmentFilters(req.query);
  if (pagination.error || parsedFilters.error) {
    return res.status(400).json({ message: pagination.error ?? parsedFilters.error });
  }

  try {
    let appointmentsQuery = appointmentModel
      .find(parsedFilters.filter)
      .populate("patient", "userName email")
      .populate("doctor", "userName email specialization experience")
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(pagination.skip);
    if (pagination.limit !== null) {
      appointmentsQuery = appointmentsQuery.limit(pagination.limit);
    }

    const [appointments, total] = await Promise.all([
      appointmentsQuery,
      appointmentModel.countDocuments(parsedFilters.filter),
    ]);

    return res.status(200).json({
      appointments,
      pagination: paginationResponse(pagination.page, pagination.limit, total),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getStats(req, res) {
  try {
    const [patients, doctors, appointments] = await Promise.all([
      userModel.countDocuments({ role: "patient" }),
      userModel.countDocuments({ role: "doctor" }),
      appointmentModel.countDocuments(),
    ]);

    return res.status(200).json({
      patients,
      doctors,
      appointments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export {
  getUsers,
  createDoctor,
  deleteUser,
  updateUserStatus,
  getAppointments,
  getStats,
};
