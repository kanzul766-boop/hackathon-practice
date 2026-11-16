import express from "express";
import {
  bookAppointment,
  cancelAppointment,
  getDoctorAppointments,
  getMyAppointments,
  updateAppointmentStatus,
} from "../controllers/appointment.controller.js";
import authenticateUser, { requireApprovedDoctor } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser);

function requirePatient(req, res, next) {
  if (req.user.role !== "patient") {
    return res.status(403).json({ message: "Only patients can access this endpoint" });
  }
  return next();
}

router.post("/", requirePatient, bookAppointment);
router.get("/my", requirePatient, getMyAppointments);
router.patch("/:id/cancel", requirePatient, cancelAppointment);
router.get("/doctor", requireApprovedDoctor, getDoctorAppointments);
router.patch("/:id/status", requireApprovedDoctor, updateAppointmentStatus);

export default router;
