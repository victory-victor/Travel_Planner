# WanderMind Travel Planner

WanderMind is a full-stack group travel planner with authentication, collaborative trips, AI itinerary generation, smart packing lists, map/travel estimates, invitations, and expense tracking.

## Tech Stack

- Frontend: React, Vite, React Router, Recharts, GSAP
- Backend: Node.js, Express, MongoDB, Mongoose, JWT auth
- AI: OpenRouter-compatible chat completions API

## Project Structure

```text
Travel_Planner/
  backend/      Express API and production static hosting
  frontend/     React/Vite app source
```

The production frontend build is copied into `backend/dist`, and `backend/server.js` serves it for non-API routes.

## Environment Variables

Create `backend/.env` locally and configure these values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/wandermind
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=7d
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-4o-mini
SITE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email-user
EMAIL_PASS=your-email-password
EMAIL_FROM=WanderMind <noreply@example.com>
```

Never commit `.env` files. If a secret was ever pasted into chat, terminal output, or Git, rotate it before deployment.

## Run Locally

Install backend dependencies:

```bash
cd backend
npm install
npm run dev
```

Install frontend dependencies in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Build Frontend Into Backend

From the project root:

```bash
cd frontend
npm run build
```

Then copy `frontend/dist` into `backend/dist`. On PowerShell:

```powershell
Remove-Item -Recurse -Force ..\backend\dist -ErrorAction SilentlyContinue
Copy-Item -Recurse .\dist ..\backend\dist
```

Start the backend:

```bash
cd ../backend
npm start
```

Open `http://localhost:5000`. The Express server will serve both `/api/*` and the React UI.

## Free Deployment Guide

Recommended free setup:

- Database: MongoDB Atlas Free cluster.
- App hosting: Render Free Web Service.

### 1. Create MongoDB Atlas Free Cluster

1. Create a MongoDB Atlas account.
2. Create a Free cluster.
3. Create a database user.
4. Add a network access rule. For a quick student/demo deployment, allow `0.0.0.0/0`; for a more careful setup, restrict it to your host's outbound IPs.
5. Copy the connection string and set it as `MONGO_URI`.

### 2. Prepare Repo

Before pushing:

```bash
cd frontend
npm run build
```

Copy `frontend/dist` to `backend/dist`, then commit the code. Confirm `.env` is not tracked.

### 3. Deploy Backend on Render

1. Push the project to GitHub.
2. In Render, create a new Web Service from the GitHub repo.
3. Set Root Directory to `backend`.
4. Build Command:

```bash
npm install
```

5. Start Command:

```bash
npm start
```

6. Add environment variables from `backend/.env`, but use production values:

```env
NODE_ENV=production
MONGO_URI=your-mongodb-atlas-uri
JWT_SECRET=your-new-production-secret
JWT_EXPIRE=7d
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openai/gpt-4o-mini
SITE_URL=https://your-render-app.onrender.com
CLIENT_URL=https://your-render-app.onrender.com
EMAIL_HOST=...
EMAIL_PORT=...
EMAIL_USER=...
EMAIL_PASS=...
EMAIL_FROM=...
```

7. Deploy. Your Render URL should serve both the UI and API.

## Deployment Notes

- Render Free Web Services can spin down when idle, so the first request after inactivity may be slow.
- Do not store uploaded files or durable data on the Render filesystem. Use MongoDB Atlas or external storage.
- MongoDB Atlas Free clusters are suitable for small demos and student projects.
- Email invitations require real SMTP credentials. If SMTP ports are blocked by your host, use a transactional email API later.

## Pre-Deployment Checklist

- Rotate any exposed API keys and JWT secrets.
- Confirm `backend/.env` is not committed.
- Confirm `backend/dist/index.html` exists.
- Run `npm run build` in `frontend`.
- Run `npm start` in `backend` and open `http://localhost:5000`.
- Test signup/login, trip creation, AI itinerary, packing list persistence, map tab, invite links, and expenses.
