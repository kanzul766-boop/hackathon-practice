import mongoose from "mongoose";
import userModel from "./users.model.js";

const doctorAvailabilitySchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    unique: true,
    validate: {
      validator: async function (doctorId) {
        return Boolean(await userModel.exists({ _id: doctorId, role: "doctor" }));
      },
      message: "Doctor must reference an existing doctor user",
    },
  },
  availableDays: {
    type: [
      {
        type: String,
        enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      },
    ],
    required: true,
    validate: {
      validator: (days) => days.length > 0,
      message: "At least one available day is required",
    },
  },
  startTime: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):[0-5]\d$/,
  },
  endTime: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):[0-5]\d$/,
  },
});

doctorAvailabilitySchema.path("endTime").validate(function (endTime) {
  return !this.startTime || endTime > this.startTime;
}, "endTime must be later than startTime");

const doctorAvailabilityModel = mongoose.model(
  "doctorAvailability",
  doctorAvailabilitySchema,
);
export default doctorAvailabilityModel;
