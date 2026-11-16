import mongoose from "mongoose";
import doctorAvailabilityModel from "../models/doctor-availability.model.js";
import userModel from "../models/users.model.js";
import { paginationResponse, parsePagination } from "../utils/list-query.js";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function doctorResponse(doctor) {
  return {
    id: doctor._id,
    name: doctor.userName,
    specialization: doctor.specialization,
    experience: doctor.experience,
    profileImage: doctor.profileImage,
  };
}

function validateAvailability(body) {
  const { availableDays, startTime, endTime } = body ?? {};
  if (
    !Array.isArray(availableDays) ||
    availableDays.length === 0 ||
    availableDays.some((day) => !WEEKDAYS.includes(day)) ||
    new Set(availableDays).size !== availableDays.length ||
    typeof startTime !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) ||
    typeof endTime !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) ||
    endTime <= startTime
  ) {
    return false;
  }
  return true;
}

async function createAvailability(req, res) {
  if (!validateAvailability(req.body)) {
    return res.status(400).json({
      message: "Provide valid availableDays, startTime, and endTime",
    });
  }

  try {
    const availability = await doctorAvailabilityModel.create({
      doctor: req.user._id,
      availableDays: req.body.availableDays,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
    });
    return res.status(201).json({ availability });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Availability already exists" });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid availability data" });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function updateAvailability(req, res) {
  if (!validateAvailability(req.body)) {
    return res.status(400).json({
      message: "Provide valid availableDays, startTime, and endTime",
    });
  }

  try {
    const availability = await doctorAvailabilityModel.findOneAndUpdate(
      { doctor: req.user._id },
      {
        $set: {
          availableDays: req.body.availableDays,
          startTime: req.body.startTime,
          endTime: req.body.endTime,
        },
      },
      { new: true, runValidators: true },
    );
    if (!availability) {
      return res.status(404).json({ message: "Availability not found" });
    }
    return res.status(200).json({ availability });
  } catch (error) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid availability data" });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getMyAvailability(req, res) {
  try {
    const availability = await doctorAvailabilityModel
      .findOne({ doctor: req.user._id })
      .select("doctor availableDays startTime endTime");
    return res.status(200).json({ availability: availability ?? null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getDoctorAvailability(req, res) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Invalid doctor ID" });
  }

  try {
    const doctor = await userModel.findOne({
      _id: req.params.id,
      role: "doctor",
      isActive: true,
      $or: [
        { doctorApprovalStatus: "approved" },
        { doctorApprovalStatus: { $exists: false } },
      ],
    });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const availability = await doctorAvailabilityModel
      .findOne({ doctor: doctor._id })
      .select("doctor availableDays startTime endTime");
    return res.status(200).json({ availability: availability ?? null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getDoctors(req, res) {
  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ message: pagination.error });
  }
  const { name, specialization } = req.query;
  if (
    (name !== undefined && typeof name !== "string") ||
    (specialization !== undefined && typeof specialization !== "string")
  ) {
    return res.status(400).json({ message: "name and specialization must be strings" });
  }

  const filter = {
    role: "doctor",
    isActive: true,
    $or: [
      { doctorApprovalStatus: "approved" },
      { doctorApprovalStatus: { $exists: false } },
    ],
  };
  if (name?.trim()) {
    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.userName = { $regex: escapedName, $options: "i" };
  }
  if (specialization?.trim()) {
    const escapedSpecialization = specialization.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.specialization = {
      $regex: `^${escapedSpecialization}$`,
      $options: "i",
    };
  }

  try {
    const [doctors, total] = await Promise.all([
      userModel
        .find(filter)
        .select("userName specialization experience profileImage")
        .sort({ userName: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
      userModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      doctors: doctors.map(doctorResponse),
      pagination: paginationResponse(pagination.page, pagination.limit, total),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getDoctorById(req, res) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Invalid doctor ID" });
  }

  try {
    const doctor = await userModel
      .findOne({
        _id: req.params.id,
        role: "doctor",
        isActive: true,
        $or: [
          { doctorApprovalStatus: "approved" },
          { doctorApprovalStatus: { $exists: false } },
        ],
      })
      .select("userName specialization experience profileImage");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.status(200).json({ doctor: doctorResponse(doctor) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export {
  getDoctors,
  getDoctorById,
  getMyAvailability,
  createAvailability,
  updateAvailability,
  getDoctorAvailability,
};
