import express from "express";
import {
  getMyNotifications,
  markNotificationAsRead,
} from "../controllers/notification.controller.js";
import authenticateUser from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser);
router.get("/", getMyNotifications);
router.patch("/:id/read", markNotificationAsRead);

export default router;
