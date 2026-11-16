import express from "express";
import {
  createAvailability,
  getDoctorAvailability,
  getDoctorById,
  getDoctors,
  updateAvailability,
} from "../controllers/doctor.controller.js";
import authenticateUser from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser);
router.get("/", getDoctors);
router.get("/:id/availability", (req, res, next) => {
  if (req.user.role !== "patient") {
    return res.status(403).json({ message: "Only patients can view doctor availability" });
  }
  return next();
}, getDoctorAvailability);
router.post("/availability", (req, res, next) => {
  if (req.user.role !== "doctor") {
    return res.status(403).json({ message: "Only doctors can manage their availability" });
  }
  return next();
}, createAvailability);
router.patch("/availability", (req, res, next) => {
  if (req.user.role !== "doctor") {
    return res.status(403).json({ message: "Only doctors can manage their availability" });
  }
  return next();
}, updateAvailability);
router.get("/:id", getDoctorById);

export default router;
