import express from "express";
import {
  createAdmin,
  createDoctor,
  deleteUser,
  getAppointments,
  getStats,
  getUsers,
  updateDoctorApprovalStatus,
  updateUserStatus,
} from "../controllers/admin.controller.js";
import authenticateUser from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser, (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can access this endpoint" });
  }
  return next();
});

router.get("/users", getUsers);
router.post("/doctors", createDoctor);
router.post("/admins", createAdmin);
router.patch("/doctors/:id/approval", updateDoctorApprovalStatus);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/status", updateUserStatus);
router.get("/appointments", getAppointments);
router.get("/stats", getStats);

export default router;
