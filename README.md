# SkillXchange

SkillXchange is a full-stack MERN application for peer-to-peer learning, mentorship, and real-time chat. It combines Google OAuth, cookie-based auth, and realtime messaging with a responsive UI.

## Highlights

- Peer connections with chat and video call support
- Google OAuth login with secure cookies
- Profile management, ratings, feedback, and reports
- Realtime updates via Socket.IO
- Mobile-first UI

## Tech Stack

- Frontend: React (Vite), React Router, Context API, Axios, React-Toastify, Socket.IO client
- Backend: Node.js, Express.js, MongoDB (Mongoose), Passport.js (Google OAuth), JWT, Socket.IO
- Infra: Docker (optional)

## Project Structure

```
Backend/
Frontend/
Dockerfile.backend
Dockerfile.frontend
```

## Requirements

- Node.js 18+ recommended
- MongoDB Atlas (or local MongoDB)
- Google OAuth credentials
- Cloudinary credentials (for image uploads)

## Environment Variables

All secrets should live in `.env` files and never be committed.

### Backend (.env)

```
PORT=8000
CLIENT_URL=http://localhost:5173
MONGODB_URI=YOUR_MONGODB_URI

GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback

JWT_SECRET=YOUR_JWT_SECRET
SESSION_SECRET=YOUR_SESSION_SECRET

EMAIL_ID=YOUR_EMAIL_ID
APP_PASSWORD=YOUR_EMAIL_APP_PASSWORD

CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET

ZEGO_APP_ID=YOUR_ZEGO_APP_ID
ZEGO_SERVER_SECRET=YOUR_ZEGO_SERVER_SECRET
```

### Frontend (.env.local)

```
VITE_API_URL=http://localhost:8000
VITE_ZEGO_APP_ID=YOUR_ZEGO_APP_ID
```

## Local Development

### 1) Install

```
cd Backend
npm install

cd ../Frontend
npm install
```

### 2) Run backend

```
cd Backend
npm start
```

Backend runs at: http://localhost:8000
Health check: http://localhost:8000/

### 3) Run frontend

```
cd Frontend
npm run dev
```

Frontend runs at: http://localhost:5173 (or 5174 if 5173 is busy)

## API Base URL

The frontend uses a global Axios base URL:

```
axios.defaults.baseURL = `${import.meta.env.VITE_API_URL}/api`;
```

This means all requests use `/api/*` on the backend.

## CORS (Local + Production)

CORS allows both local and production frontends and supports cookies:

```
const allowedOrigins = [
  "http://localhost:5173",
  "https://your-frontend.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
```

If Vite runs on port 5174, add `http://localhost:5174` to the list.

## Production Deployment

### Frontend (Vercel)

- Set `VITE_API_URL` to your backend URL (Render or other)
- Build command: `npm run build`

### Backend (Render)

- Set all backend env vars listed above
- Ensure `NODE_ENV=production`
- The backend listens on `process.env.PORT`

## Common Issues

- 404 on `/api/*`: backend route should be mounted with `/api`.
- CORS error: ensure local origin is in allowed origins.
- Cookies not persisting: set `NODE_ENV=production` in production and use HTTPS.

## Docker (Optional)

The repo includes Dockerfiles for frontend and backend. If you use Docker, set env variables via Docker runtime or compose and expose ports 8000 and 5173.

## Repository

https://github.com/mdarifanwar/SkillXchange

## License

MIT
