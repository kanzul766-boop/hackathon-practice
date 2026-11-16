import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import appointmentModel from "../src/models/appointment.model.js";
import doctorAvailabilityModel from "../src/models/doctor-availability.model.js";
import userModel from "../src/models/users.model.js";

if (process.env.NODE_ENV !== "development" || process.env.RUN_DEV_SEED !== "true") {
  throw new Error(
    "Refusing to seed demo data. Set NODE_ENV=development and RUN_DEV_SEED=true to opt in.",
  );
}

const DEMO_USERS = [
  {
    userName: "clinicDemoAdmin",
    email: "demo.admin@clinic.local",
    password: "DevAdmin!2026",
    role: "admin",
  },
  {
    userName: "demoDrAvery",
    email: "demo.avery@clinic.local",
    password: "DevDoctor!2026",
    role: "doctor",
    specialization: "Cardiology",
    experience: 12,
  },
  {
    userName: "demoDrMorgan",
    email: "demo.morgan@clinic.local",
    password: "DevDoctor!2026",
    role: "doctor",
    specialization: "Dermatology",
    experience: 8,
  },
  {
    userName: "demoDrPatel",
    email: "demo.patel@clinic.local",
    password: "DevDoctor!2026",
    role: "doctor",
    specialization: "Pediatrics",
    experience: 10,
  },
  {
    userName: "demoPatientJamie",
    email: "demo.jamie@clinic.local",
    password: "DevPatient!2026",
    role: "patient",
  },
  {
    userName: "demoPatientTaylor",
    email: "demo.taylor@clinic.local",
    password: "DevPatient!2026",
    role: "patient",
  },
  {
    userName: "demoPatientRiley",
    email: "demo.riley@clinic.local",
    password: "DevPatient!2026",
    role: "patient",
  },
];

const DEMO_APPOINTMENTS = [
  {
    doctorEmail: "demo.avery@clinic.local",
    patientEmail: "demo.jamie@clinic.local",
    dateOffset: 2,
    time: "09:30",
    reason: "Annual heart health check",
    status: "pending",
  },
  {
    doctorEmail: "demo.morgan@clinic.local",
    patientEmail: "demo.taylor@clinic.local",
    dateOffset: 3,
    time: "11:00",
    reason: "Skin consultation",
    status: "approved",
  },
  {
    doctorEmail: "demo.patel@clinic.local",
    patientEmail: "demo.riley@clinic.local",
    dateOffset: 4,
    time: "14:00",
    reason: "Child wellness visit",
    status: "rejected",
  },
];

async function seedUser(userData) {
  const { password, ...userFields } = userData;
  const existingUser = await userModel.findOne({ email: userFields.email });
  if (
    existingUser &&
    (existingUser.userName !== userFields.userName ||
      existingUser.role !== userFields.role)
  ) {
    throw new Error(`Demo account identity conflict for ${userFields.email}`);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  if (existingUser) {
    Object.assign(existingUser, userFields, {
      password: hashedPassword,
      isActive: true,
    });
    await existingUser.save();
    return existingUser;
  }

  return userModel.create({
    ...userFields,
    password: hashedPassword,
    isActive: true,
  });
}

function dateAtOffset(offset) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

async function seedAppointments(usersByEmail) {
  for (const demoAppointment of DEMO_APPOINTMENTS) {
    const doctor = usersByEmail.get(demoAppointment.doctorEmail);
    const patient = usersByEmail.get(demoAppointment.patientEmail);
    const existing = await appointmentModel.findOne({
      doctor: doctor._id,
      patient: patient._id,
      reason: demoAppointment.reason,
    });
    if (existing) {
      continue;
    }

    let appointmentDate;
    for (let offset = demoAppointment.dateOffset; offset < demoAppointment.dateOffset + 60; offset += 1) {
      const candidateDate = dateAtOffset(offset);
      const dayName = candidateDate.toLocaleDateString("en-US", { weekday: "long" });
      if (!["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(dayName)) {
        continue;
      }

      const conflictingAppointment = await appointmentModel.exists({
        doctor: doctor._id,
        appointmentDate: candidateDate,
        appointmentTime: demoAppointment.time,
      });
      if (!conflictingAppointment) {
        appointmentDate = candidateDate;
        break;
      }
    }
    if (!appointmentDate) {
      throw new Error(`Could not find an available sample slot for ${doctor.userName}`);
    }

    await appointmentModel.create({
      doctor: doctor._id,
      patient: patient._id,
      appointmentDate,
      appointmentTime: demoAppointment.time,
      reason: demoAppointment.reason,
      status: demoAppointment.status,
    });
  }
}

async function seedDevelopmentData() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const usersByEmail = new Map();
  for (const userData of DEMO_USERS) {
    const user = await seedUser(userData);
    usersByEmail.set(user.email, user);
  }

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  for (const doctorEmail of [
    "demo.avery@clinic.local",
    "demo.morgan@clinic.local",
    "demo.patel@clinic.local",
  ]) {
    const doctor = usersByEmail.get(doctorEmail);
    await doctorAvailabilityModel.findOneAndUpdate(
      { doctor: doctor._id },
      {
        $set: {
          availableDays: weekdays,
          startTime: "09:00",
          endTime: "17:00",
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
  }

  await seedAppointments(usersByEmail);
  console.log("Development demo data is ready.");
  console.log("Admin: demo.admin@clinic.local / DevAdmin!2026");
  console.log("Doctor: demo.avery@clinic.local / DevDoctor!2026");
  console.log("Patient: demo.jamie@clinic.local / DevPatient!2026");
}

seedDevelopmentData()
  .catch((error) => {
    console.error("Development seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
