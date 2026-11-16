import express from "express";
import {
  createAvailability,
  getMyAvailability,
  getDoctorAvailability,
  getDoctorById,
  getDoctors,
  updateAvailability,
} from "../controllers/doctor.controller.js";
import authenticateUser, { requireApprovedDoctor } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser);
router.get("/", getDoctors);
router.get("/availability", requireApprovedDoctor, getMyAvailability);
router.get("/:id/availability", (req, res, next) => {
  if (req.user.role !== "patient") {
    return res.status(403).json({ message: "Only patients can view doctor availability" });
  }
  return next();
}, getDoctorAvailability);
router.post("/availability", requireApprovedDoctor, createAvailability);
router.patch("/availability", requireApprovedDoctor, updateAvailability);
router.get("/:id", getDoctorById);

export default router;
