import mongoose from "mongoose";
import notificationModel from "../models/notification.model.js";

async function getMyNotifications(req, res) {
  try {
    const notifications = await notificationModel
      .find({ recipient: req.user._id })
      .populate("relatedAppointment")
      .sort({ createdAt: -1 });

    return res.status(200).json({ notifications });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function markNotificationAsRead(req, res) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Invalid notification ID" });
  }

  try {
    const notification = await notificationModel.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { isRead: true } },
      { new: true, runValidators: true },
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export { getMyNotifications, markNotificationAsRead };
