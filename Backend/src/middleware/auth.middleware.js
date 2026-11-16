import jwt from "jsonwebtoken";
import userModel from "../models/users.model.js";

async function authenticateUser(req, res, next) {
  const authorization = req.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : undefined;
  const token = req.cookies?.token ?? bearerToken;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET is not configured");
    return res.status(500).json({ message: "Authentication is unavailable" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (typeof decoded === "string" || typeof decoded.id !== "string") {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    const user = await userModel
      .findById(decoded.id)
      .select("_id isActive role doctorApprovalStatus");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Authentication required" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireApprovedDoctor(req, res, next) {
  if (req.user?.role !== "doctor") {
    return res.status(403).json({ message: "Only doctors can access this endpoint" });
  }
  if ((req.user.doctorApprovalStatus ?? "approved") !== "approved") {
    return res.status(403).json({
      message: "Doctor account is awaiting approval",
      doctorApprovalStatus: req.user.doctorApprovalStatus,
    });
  }
  return next();
}

export default authenticateUser;
export { requireApprovedDoctor };
