import express from "express";
import {
  createDoctor,
  deleteUser,
  getAppointments,
  getStats,
  getUsers,
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
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/status", updateUserStatus);
router.get("/appointments", getAppointments);
router.get("/stats", getStats);

export default router;
