import express  from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import doctorRegistrationRoutes from "./routes/doctor-registration.routes.js";
import postRoutes from "./routes/post.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import cookieParser from "cookie-parser";
const app = express();
const allowedOrigins = [
  "https://clinic-appointment-management-hacka-rho.vercel.app",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:5173");
}

app.use(cors({
  origin: (origin, callback) => {
    callback(null, origin && allowedOrigins.includes(origin) ? origin : false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/doctor", doctorRegistrationRoutes);
app.use("/post", postRoutes);
app.use("/doctors", doctorRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/admin", adminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/notifications", notificationRoutes);
app.use("/api/profile", profileRoutes);

export default app;