import mongoose from "mongoose";
import userModel from "./users.model.js";

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    validate: {
      validator: async function (userId) {
        return Boolean(await userModel.exists({ _id: userId, role: "patient" }));
      },
      message: "Patient must reference an existing patient user",
    },
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    validate: {
      validator: async function (userId) {
        return Boolean(await userModel.exists({ _id: userId, role: "doctor" }));
      },
      message: "Doctor must reference an existing doctor user",
    },
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  appointmentTime: {
    type: String,
    required: true,
    trim: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending",
    required: true,
  },
});

appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, appointmentTime: 1 },
  { unique: true },
);

const appointmentModel = mongoose.model("appointment", appointmentSchema);
export default appointmentModel;
