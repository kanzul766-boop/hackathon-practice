import express from "express";
import {
  bookAppointment,
  cancelAppointment,
  getDoctorAppointments,
  getMyAppointments,
  updateAppointmentStatus,
} from "../controllers/appointment.controller.js";
import authenticateUser from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser);

function requirePatient(req, res, next) {
  if (req.user.role !== "patient") {
    return res.status(403).json({ message: "Only patients can access this endpoint" });
  }
  return next();
}

function requireDoctor(req, res, next) {
  if (req.user.role !== "doctor") {
    return res.status(403).json({ message: "Only doctors can access this endpoint" });
  }
  return next();
}

router.post("/", requirePatient, bookAppointment);
router.get("/my", requirePatient, getMyAppointments);
router.patch("/:id/cancel", requirePatient, cancelAppointment);
router.get("/doctor", requireDoctor, getDoctorAppointments);
router.patch("/:id/status", requireDoctor, updateAppointmentStatus);

export default router;
