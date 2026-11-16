import express from "express";
import multer from "multer";
import {
  getProfile,
  updateProfile,
  uploadProfileImage,
} from "../controllers/profile.controller.js";
import authenticateUser from "../middleware/auth.middleware.js";

const router = express.Router();
const profileImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return callback(new Error("Only JPEG, PNG, and WebP images are supported"));
    }
    return callback(null, true);
  },
});

router.use(authenticateUser);
router.get("/", getProfile);
router.patch("/", updateProfile);
router.post("/image", (req, res, next) => {
  profileImageUpload.single("profileImage")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ message: "Invalid profile image upload" });
    }
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    return next();
  });
}, uploadProfileImage);

export default router;
