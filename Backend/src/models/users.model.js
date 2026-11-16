import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    default: "patient",
    enum: ["admin", "doctor", "patient"],
  },
  specialization: {
    type: String,
    trim: true,
  },
  experience: {
    type: Number,
    min: 0,
    default: 0,
  },
  profileImage: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});
const userModel = mongoose.model("user", userSchema);
export default userModel;
