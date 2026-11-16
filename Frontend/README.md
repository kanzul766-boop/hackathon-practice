# Clair Frontend

The React/Vite frontend lives in `Frontend`, beside the Express backend in `Backend`. Dependencies and environment files remain separate.

## Run locally

1. Start the backend from `Backend` on port `9000` using its existing start command.
2. From `Frontend`, install dependencies and start Vite:

   ```sh
   npm install
   npm run dev
   ```

3. Open the URL printed by Vite. Its development proxy forwards the existing backend routes to `http://localhost:9000` by default.

Copy `Frontend/.env.example` to `Frontend/.env` and set `VITE_BACKEND_URL` if the backend uses another URL. Vite reads this value when it starts. Do not put private backend API keys in frontend environment variables.

## API integration

The app uses the existing `/auth`, `/api/profile`, `/doctors`, `/appointments`, `/admin`, and `/notifications` endpoints. Auth tokens are held in `sessionStorage` for the current browser session and sent as Bearer tokens; the backend cookie is also accepted.

Admin dashboard access requires an already provisioned admin account. Public registration creates patient accounts only.
