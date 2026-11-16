import mongoose from "mongoose";
import appointmentModel from "../models/appointment.model.js";
import doctorAvailabilityModel from "../models/doctor-availability.model.js";
import userModel from "../models/users.model.js";
import createNotification from "../services/notification.service.js";
import {
  paginationResponse,
  parseAppointmentFilters,
  parsePagination,
} from "../utils/list-query.js";

function parseAppointmentDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

async function bookAppointment(req, res) {
  const { doctorId, date, time, reason } = req.body ?? {};
  if (
    typeof doctorId !== "string" ||
    !mongoose.isObjectIdOrHexString(doctorId) ||
    typeof time !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
    typeof reason !== "string" ||
    !reason.trim()
  ) {
    return res.status(400).json({
      message: "Valid doctorId, time (HH:mm), and reason are required",
    });
  }

  const appointmentDate = parseAppointmentDate(date);
  if (!appointmentDate) {
    return res.status(400).json({ message: "date must be a valid YYYY-MM-DD date" });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (appointmentDate < today) {
    return res.status(400).json({ message: "Appointment date cannot be in the past" });
  }

  try {
    const doctor = await userModel.findOne({
      _id: doctorId,
      role: "doctor",
      isActive: true,
    });
    if (!doctor) {
      return res.status(404).json({ message: "Active doctor not found" });
    }

    const availability = await doctorAvailabilityModel.findOne({ doctor: doctor._id });
    if (!availability) {
      return res.status(409).json({
        message: "The doctor has not configured availability",
      });
    }
    const weekday = WEEKDAYS[appointmentDate.getDay()];
    if (
      !availability.availableDays.includes(weekday) ||
      time < availability.startTime ||
      time >= availability.endTime
    ) {
      return res.status(400).json({
        message: "Selected date and time are outside the doctor's availability",
      });
    }

    const existingAppointment = await appointmentModel.exists({
      doctor: doctorId,
      appointmentDate,
      appointmentTime: time,
    });
    if (existingAppointment) {
      return res.status(409).json({
        message: "This doctor already has an appointment at that date and time",
      });
    }

    const appointment = await appointmentModel.create({
      patient: req.user._id,
      doctor: doctorId,
      appointmentDate,
      appointmentTime: time,
      reason: reason.trim(),
    });

    const notificationCreated = await createNotification({
      recipient: doctorId,
      message: `New appointment request for ${date} at ${time}.`,
      type: "appointment_booked",
      relatedAppointment: appointment._id,
    });
    const response = {
      message: "Appointment booked successfully",
      appointment,
    };
    if (!notificationCreated) {
      response.notificationWarning = "Appointment was booked, but its notification could not be created.";
    }

    return res.status(201).json(response);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "This doctor already has an appointment at that date and time",
      });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid appointment data" });
    }

    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

async function getMyAppointments(req, res) {
  const pagination = parsePagination(req.query);
  const parsedFilters = parseAppointmentFilters(req.query);
  if (pagination.error || parsedFilters.error) {
    return res.status(400).json({ message: pagination.error ?? parsedFilters.error });
  }
  const filter = { patient: req.user._id, ...parsedFilters.filter };

  try {
    let appointmentsQuery = appointmentModel
      .find(filter)
      .populate("doctor", "userName specialization experience")
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(pagination.skip);
    if (pagination.limit !== null) {
      appointmentsQuery = appointmentsQuery.limit(pagination.limit);
    }

    const [appointments, total] = await Promise.all([
      appointmentsQuery,
      appointmentModel.countDocuments(filter),
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

async function getDoctorAppointments(req, res) {
  const pagination = parsePagination(req.query);
  const parsedFilters = parseAppointmentFilters(req.query);
  if (pagination.error || parsedFilters.error) {
    return res.status(400).json({ message: pagination.error ?? parsedFilters.error });
  }
  const filter = { doctor: req.user._id, ...parsedFilters.filter };

  try {
    let appointmentsQuery = appointmentModel
      .find(filter)
      .populate("patient", "userName email")
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(pagination.skip);
    if (pagination.limit !== null) {
      appointmentsQuery = appointmentsQuery.limit(pagination.limit);
    }

    const [appointments, total] = await Promise.all([
      appointmentsQuery,
      appointmentModel.countDocuments(filter),
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

async function updateAppointmentStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body ?? {};

  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: "Invalid appointment ID" });
  }
  if (status !== "approved" && status !== "rejected") {
    return res.status(400).json({
      message: "status must be approved or rejected",
    });
  }

  try {
    const appointment = await appointmentModel
      .findOneAndUpdate(
        { _id: id, doctor: req.user._id, status: "pending" },
        { $set: { status } },
        { new: true, runValidators: true },
      )
      .populate("patient", "userName email");

    if (appointment) {
      const notificationCreated = await createNotification({
        recipient: appointment.patient._id,
        message: `Your appointment was ${status}.`,
        type: status === "approved" ? "appointment_approved" : "appointment_rejected",
        relatedAppointment: appointment._id,
      });
      const response = {
        message: "Appointment status updated",
        appointment,
      };
      if (!notificationCreated) {
        response.notificationWarning = "Appointment status was updated, but its notification could not be created.";
      }

      return res.status(200).json(response);
    }

    const assignedAppointment = await appointmentModel.exists({
      _id: id,
      doctor: req.user._id,
    });
    if (!assignedAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(409).json({
      message: "Only pending appointments can be approved or rejected",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function cancelAppointment(req, res) {
  const { id } = req.params;
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: "Invalid appointment ID" });
  }

  try {
    const appointment = await appointmentModel.findOneAndUpdate(
      { _id: id, patient: req.user._id, status: "pending" },
      { $set: { status: "cancelled" } },
      { new: true, runValidators: true },
    );

    if (appointment) {
      const notificationCreated = await createNotification({
        recipient: appointment.doctor,
        message: "A patient cancelled an appointment.",
        type: "appointment_cancelled",
        relatedAppointment: appointment._id,
      });
      const response = {
        message: "Appointment cancelled successfully",
        appointment,
      };
      if (!notificationCreated) {
        response.notificationWarning = "Appointment was cancelled, but its notification could not be created.";
      }

      return res.status(200).json(response);
    }

    const existingAppointment = await appointmentModel.findById(id).select("patient status");
    if (!existingAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (!existingAppointment.patient.equals(req.user._id)) {
      return res.status(403).json({
        message: "You are not authorized to cancel this appointment",
      });
    }

    return res.status(409).json({
      message: "Only pending appointments can be cancelled",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
};
