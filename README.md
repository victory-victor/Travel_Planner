# WanderMind Travel Planner

WanderMind is a full-stack group travel planning platform with JWT authentication, collaborative trips, AI-powered itinerary generation, smart packing lists, travel estimates, email invitations via Brevo, OTP-based password reset, expense tracking, and an analytics dashboard.

## Tech Stack

### Frontend

- **React 19** with Vite
- **React Router v7** – client-side routing with protected/public route guards
- **Framer Motion** – page transitions and UI animations
- **GSAP** + `@gsap/react` – advanced scroll and entrance animations
- **Lenis** – smooth scroll
- **Recharts** – charts on the analytics page
- **Lucide React** – icon library
- **Axios** – HTTP client
- **date-fns** + **react-datepicker** – date utilities and date picker component
- **react-hot-toast** – toast notifications

### Backend

- **Node.js** with **Express 5**
- **MongoDB** + **Mongoose** – database and ODM
- **JWT** (`jsonwebtoken`) – authentication
- **bcryptjs** – password hashing
- **Helmet** – security headers
- **express-rate-limit** – API rate limiting (100 req / 15 min)
- **Morgan** – HTTP request logging (development mode)
- **Brevo API** (`fetch`) – transactional email for invitations and OTP
- **uuid** – token generation for invite links

### AI

- **OpenRouter API** (chat completions) – itinerary generation, destination suggestions, AI chat, packing lists, budget optimization, and travel estimates
- Default model fallback: `google/gemini-2.0-flash-001` (configurable via `OPENROUTER_MODEL`)

## Project Structure

```text
Travel_Planner/
├── backend/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── gemini.js           # (deprecated, commented out)
│   ├── controllers/
│   │   ├── aiController.js     # AI endpoints
│   │   ├── authController.js   # Register, login, profile, OTP, password reset, delete account
│   │   ├── inviteController.js # Send, view, accept invitations
│   │   └── tripController.js   # CRUD trips, itinerary, packing list, members, expenses
│   ├── middleware/
│   │   ├── auth.js             # JWT protect middleware
│   │   └── errorHandler.js     # Global error handler
│   ├── models/
│   │   ├── Invitation.js       # Email invitation with token and expiry
│   │   ├── Trip.js             # Trip, itinerary, packing list, expenses, invite token
│   │   └── User.js             # User with bcrypt password hashing
│   ├── routes/
│   │   ├── ai.js               # /api/ai/*
│   │   ├── auth.js             # /api/auth/*
│   │   ├── invites.js          # /api/invites/*
│   │   └── trips.js            # /api/trips/*
│   ├── services/
│   │   ├── emailService.js     # Brevo API email (invitations + OTP)
│   │   ├── geminiService.js    # OpenRouter AI service (itinerary, chat, packing, etc.)
│   │   └── Otpservice.js       # In-memory OTP store (generate, verify, expire)
│   ├── server.js               # Express app entry point
│   └── package.json
└── frontend/
    └── src/
        ├── components/
        │   └── common/
        │       ├── CustomCursor.jsx/css
        │       ├── Loader.jsx/css
        │       └── Navbar.jsx/css
        ├── context/
        │   └── AuthContext.jsx   # Auth state, token management
        ├── pages/
        │   ├── Home.jsx/css      # Landing page
        │   ├── Login.jsx         # Login + forgot password (OTP flow)
        │   ├── Signup.jsx        # Registration
        │   ├── Dashboard.jsx/css # User's trips overview
        │   ├── CreateTrip.jsx/css# Trip creation wizard
        │   ├── TripDetails.jsx/css# Trip detail view (itinerary, packing, expenses, chat, estimates)
        │   ├── JoinTrip.jsx/css  # Accept invitation page
        │   └── Analytics.jsx/css # Trip analytics and charts
        ├── services/
        │   └── api.js            # Axios instance + API helpers
        ├── styles/
        │   └── index.css         # Global styles
        ├── App.jsx               # Routes and app shell
        └── main.jsx              # React entry point
```

## Features

- **Authentication** – Register, login, JWT-protected routes, profile editing, account deletion
- **Password Reset** – Forgot password with OTP sent via Brevo email, verify OTP, reset password
- **Group Trips** – Create trips with destination, dates, budget, preferences, and cover image
- **Email Invitations** – Invite collaborators by email; Brevo sends styled HTML invitation emails
- **General Invite Links** – Each trip has a shareable invite token that anyone can use to join
- **Pending Invite Redirect** – Users invited via link before signing up are auto-redirected to the trip after registration
- **AI Itinerary** – Generate a multi-day itinerary via OpenRouter and save it to the trip
- **AI Chat** – Context-aware travel assistant with trip details
- **Smart Packing List** – AI-generated, destination-specific packing list with backend persistence
- **Budget Optimization** – AI-suggested budget breakdown
- **Travel Estimates** – AI-generated time/cost estimates for multiple transport modes
- **Destination Suggestions** – AI-powered destination recommendations based on interests
- **Expense Tracking** – Log expenses per trip with auto-categorization into budget breakdown
- **Analytics Dashboard** – Visualize trip data with charts
- **Smooth Scroll** – Lenis smooth scrolling with custom cursor

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/wandermind
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=7d

# AI
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-4o-mini

# URLs
SITE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# Email (Brevo)
BREVO_API_KEY=your-brevo-api-key
SENDER_EMAIL=your-sender@example.com
SENDER_NAME=WanderMind
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

> **Never commit `.env` files.** If a secret was ever pasted into chat, terminal output, or Git, rotate it before deployment.

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint            | Auth | Description               |
|--------|---------------------|------|---------------------------|
| POST   | `/register`         | No   | Create account            |
| POST   | `/login`            | No   | Login and receive JWT     |
| GET    | `/me`               | Yes  | Get current user profile  |
| PUT    | `/profile`          | Yes  | Update profile            |
| POST   | `/forgot-password`  | No   | Send OTP to email         |
| POST   | `/verify-otp`       | No   | Verify OTP code           |
| POST   | `/reset-password`   | No   | Reset password after OTP  |
| DELETE | `/delete-account`   | Yes  | Delete account and data   |

### Trips (`/api/trips`) — all protected

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/`                   | Get all trips for current user     |
| POST   | `/`                   | Create a new trip                  |
| GET    | `/:id`                | Get single trip                    |
| PUT    | `/:id`                | Update trip                        |
| DELETE | `/:id`                | Delete trip                        |
| PUT    | `/:id/itinerary`      | Save AI itinerary to trip          |
| PUT    | `/:id/packing-list`   | Save packing list to trip          |
| POST   | `/:id/members`        | Add member to trip                 |
| POST   | `/:id/expenses`       | Add expense to trip                |

### AI (`/api/ai`) — all protected

| Method | Endpoint         | Description                 |
|--------|------------------|-----------------------------|
| POST   | `/itinerary`     | Generate AI itinerary       |
| POST   | `/suggestions`   | Get destination suggestions |
| POST   | `/chat`          | Chat with AI assistant      |
| POST   | `/packing-list`  | Generate packing list       |
| POST   | `/budget`        | Optimize budget             |
| POST   | `/estimates`     | Get travel estimates        |

### Invitations (`/api/invites`)

| Method | Endpoint   | Auth | Description                  |
|--------|------------|------|------------------------------|
| GET    | `/:token`  | No   | Get invite details by token  |
| POST   | `/send`    | Yes  | Send email invitation        |
| POST   | `/accept`  | Yes  | Accept invitation            |

### Health Check

| Method | Endpoint       | Description        |
|--------|----------------|--------------------|
| GET    | `/api/health`  | API health status  |

## Run Locally

Install and start backend:

```bash
cd backend
npm install
npm run dev
```

Install and start frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Free Deployment Guide

Recommended free setup:

- **Database**: MongoDB Atlas Free cluster
- **Backend hosting**: Render Free Web Service
- **Frontend hosting**: Vercel, Netlify, or Render Static Site

### 1. Create MongoDB Atlas Free Cluster

1. Create a MongoDB Atlas account.
2. Create a Free cluster.
3. Create a database user.
4. Add a network access rule. For a quick demo deployment, allow `0.0.0.0/0`; for production, restrict to your host's outbound IPs.
5. Copy the connection string and set it as `MONGO_URI`.

### 2. Set Up Brevo for Emails

1. Create a free [Brevo](https://www.brevo.com/) account.
2. Get your API key from the SMTP & API section.
3. Add and verify your sender email address.
4. Set `BREVO_API_KEY`, `SENDER_EMAIL`, and `SENDER_NAME` in your backend env.

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

6. Add environment variables using production values:

```env
NODE_ENV=production
MONGO_URI=your-mongodb-atlas-uri
JWT_SECRET=your-new-production-secret
JWT_EXPIRE=7d
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openai/gpt-4o-mini
SITE_URL=https://your-backend.onrender.com
CLIENT_URL=https://your-frontend.vercel.app
BREVO_API_KEY=your-brevo-api-key
SENDER_EMAIL=your-verified-sender@example.com
SENDER_NAME=WanderMind
```

7. Deploy. Your Render URL should serve the API at `https://your-backend.onrender.com/api`.

If you need to allow more than one frontend origin, set `CLIENT_URL` as a comma-separated list:

```env
CLIENT_URL=https://your-frontend.vercel.app,http://localhost:5173
```

### 4. Deploy Frontend

1. Push the repo to GitHub.
2. Create a frontend project on Vercel, Netlify, or Render Static Site.
3. Set the frontend root directory to `frontend`.
4. Build command:

```bash
npm run build
```

5. Output directory:

```text
dist
```

6. Add this frontend environment variable before building:

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

7. Deploy the frontend, then update the backend `CLIENT_URL` to the final frontend URL.

## Deployment Notes

- Render Free Web Services can spin down when idle, so the first request after inactivity may be slow.
- Do not store uploaded files or durable data on the Render filesystem. Use MongoDB Atlas or external storage.
- MongoDB Atlas Free clusters are suitable for small demos and student projects.
- OTP codes are stored in-memory on the backend. They will be lost on server restarts. For production, consider moving OTP storage to MongoDB or Redis.
- Email invitations and OTP emails require a valid Brevo API key and verified sender address.

## Pre-Deployment Checklist

- Rotate any exposed API keys and JWT secrets.
- Confirm `backend/.env` and `frontend/.env` are not committed.
- Run `npm run build` in `frontend`.
- Test signup, login, forgot password (OTP flow), and password reset.
- Test trip creation, email invitations, and invite link joining.
- Test AI itinerary, packing list persistence, AI chat, travel estimates, and budget optimization.
- Test expense tracking and the analytics dashboard.
- Verify Brevo email delivery (both invitation and OTP emails).
