import express  from "express";
import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/post.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import cookieParser from "cookie-parser";
const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes)
app.use("/post", postRoutes)
app.use("/doctors", doctorRoutes)
app.use("/appointments", appointmentRoutes)
app.use("/admin", adminRoutes)
app.use("/notifications", notificationRoutes)
app.use("/api/profile", profileRoutes)

export default app;