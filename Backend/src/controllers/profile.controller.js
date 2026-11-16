import userModel from "../models/users.model.js";
import uploadFile from "../../services/storage.service.js";

function profileResponse(user) {
  const profile = {
    id: user._id,
    name: user.userName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    profileImage: user.profileImage,
  };
  if (user.role === "doctor") {
    profile.specialization = user.specialization;
    profile.experience = user.experience;
  }
  return profile;
}

async function getProfile(req, res) {
  try {
    const user = await userModel.findById(req.user._id).select(
      "userName email role isActive specialization experience profileImage",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ profile: profileResponse(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function updateProfile(req, res) {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ message: "A profile object is required" });
  }

  const allowedFields =
    req.user.role === "doctor"
      ? ["name", "specialization", "experience"]
      : ["name"];
  const fields = Object.keys(body);
  if (
    fields.length === 0 ||
    fields.some((field) => !allowedFields.includes(field))
  ) {
    return res.status(400).json({
      message: `Only these profile fields can be updated: ${allowedFields.join(", ")}`,
    });
  }

  if (
    Object.hasOwn(body, "name") &&
    (typeof body.name !== "string" || !body.name.trim())
  ) {
    return res.status(400).json({ message: "name must be a non-empty string" });
  }
  if (
    Object.hasOwn(body, "specialization") &&
    typeof body.specialization !== "string"
  ) {
    return res.status(400).json({ message: "specialization must be a string" });
  }
  if (
    Object.hasOwn(body, "experience") &&
    (typeof body.experience !== "number" ||
      !Number.isFinite(body.experience) ||
      body.experience < 0)
  ) {
    return res.status(400).json({ message: "experience must be a non-negative number" });
  }

  try {
    const user = await userModel.findById(req.user._id).select(
      "userName email role isActive specialization experience",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (Object.hasOwn(body, "name")) {
      user.userName = body.name.trim();
    }
    if (user.role === "doctor" && Object.hasOwn(body, "specialization")) {
      user.specialization = body.specialization.trim();
    }
    if (user.role === "doctor" && Object.hasOwn(body, "experience")) {
      user.experience = body.experience;
    }

    await user.save();
    return res.status(200).json({
      message: "Profile updated successfully",
      profile: profileResponse(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "That name is already in use" });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid profile data" });
    }

    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function uploadProfileImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "profileImage file is required" });
  }

  try {
    const user = await userModel.findById(req.user._id).select(
      "userName email role isActive specialization experience profileImage",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const uploadedImage = await uploadFile(req.file.buffer, {
      mimeType: req.file.mimetype,
      userId: user._id.toString(),
    });
    user.profileImage = uploadedImage.url;
    await user.save();

    return res.status(200).json({
      message: "Profile image uploaded successfully",
      profile: profileResponse(user),
    });
  } catch (error) {
    if (
      error?.message === "Only valid JPEG, PNG, and WebP images are supported" ||
      error?.message === "Profile image must be 5 MB or smaller"
    ) {
      return res.status(400).json({ message: error.message });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid profile image data" });
    }

    console.error("Profile image upload failed:", error?.name ?? "UnknownError");
    return res.status(500).json({ message: "Profile image upload failed" });
  }
}

export { getProfile, updateProfile, uploadProfileImage };
