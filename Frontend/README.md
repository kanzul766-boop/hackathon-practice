# Clinic Appointment Management System

The React/Vite frontend lives in `Frontend`, beside the Express backend in `Backend`. Dependencies and environment files remain separate. The application supports Patient, Doctor, and Admin dashboards with role-based access.

## Run locally

1. Configure the backend environment in `Backend` with a MongoDB URI and a `JWT_SECRET` of at least 32 characters, then start the backend on port `9000`:

   ```sh
   cd Backend
   npm install
   npm start
   ```

2. From `Frontend`, install dependencies and start Vite:

   ```sh
   cd Frontend
   npm install
   npm run dev
   ```

3. Open the URL printed by Vite. Its development proxy forwards the existing backend routes to `http://localhost:9000` by default.

Copy `Frontend/.env.example` to `Frontend/.env` for local work. `VITE_BACKEND_URL` controls the Vite development proxy; `VITE_API_BASE_URL` configures the production API origin. The production build defaults to the hosted backend URL if the latter is not set. Do not put private backend API keys in frontend environment variables.

## API integration

The backend exposes the required `/api` endpoints and retains the original prefixless paths used by the frontend:

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public; creates a Patient |
| POST | `/api/auth/login` | Public |
| GET | `/api/doctors`, `/api/doctors/:id` | Authenticated |
| POST | `/api/appointments` | Patient |
| GET | `/api/appointments/my` | Patient |
| GET | `/api/appointments/doctor` | Approved Doctor |
| PATCH | `/api/appointments/:id/status` | Approved Doctor assigned to the appointment |
| PATCH | `/api/appointments/:id/cancel` | Patient who owns a pending appointment |
| GET | `/api/admin/users`, `/api/admin/appointments`, `/api/admin/stats` | Admin |
| POST | `/api/admin/doctors` | Admin |
| DELETE | `/api/admin/users/:id` | Admin |

Additional workflow endpoints include `POST /doctor/register` for Doctor applications, `PATCH /admin/doctors/:id/approval` for Admin review, `PATCH /admin/users/:id/status` for account activation, `/doctors/availability` for approved Doctors’ working hours, `/api/profile` for profiles and profile images, and `/notifications` for notifications. These operations are authenticated and role-gated as appropriate. Weekly availability is an optional extension: when a Doctor has configured it, bookings must fit those days and hours; without a schedule, the required appointment date/time fields remain usable and duplicate bookings are still rejected. Booking also flags only clear, single-specialty conflicts from the stated visit reason; it does not diagnose or replace clinical guidance, and ambiguous reasons are not blocked.

Patient registration remains public and Patient-only. Doctor applications are public but create accounts with a pending approval status. Doctors created by an Admin also start pending and must be approved before they can sign in to the Doctor workspace. Only approved Doctors can manage their profile and availability or handle appointment requests. Admins can approve, reject, suspend, reactivate, or remove non-admin accounts; suspended accounts cannot sign in. Existing authenticated frontend routes remain supported alongside the `/api` aliases.

For cross-origin production deployment, `FRONTEND_URL` in the backend must be the exact deployed frontend origin; it defaults to `https://clinic-appointment-management-hacka-rho.vercel.app` (multiple comma-separated origins are supported). The backend allows the local Vite origin during development.

Auth tokens are held in `sessionStorage` for the current browser session and sent as Bearer tokens; the backend cookie is also accepted. Admin dashboard access requires a provisioned Admin account. For local demo data, review the opt-in conditions in `Backend/scripts/seed-dev.js`; the seed command prints the configured demo logins after it verifies the database write.
