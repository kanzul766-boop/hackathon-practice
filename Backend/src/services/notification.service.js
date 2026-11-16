import notificationModel from "../models/notification.model.js";

async function createNotification(data) {
  try {
    await notificationModel.create(data);
    return true;
  } catch (error) {
    console.error("Failed to create appointment notification:", error);
    return false;
  }
}

export default createNotification;
