# SamajikWorld — MERN Social Video + Microblogging Platform

SamajikWorld is a MERN-stack learning project that combines YouTube-like video features with Twitter-like microblogging. This README outlines the project goals, structure, and how to get started on your Windows development machine.

---

## Table of Contents

1. Introduction
2. Features
3. Tech Stack
4. Project Structure
5. Getting Started (Windows)
6. Backend
7. Frontend
8. Database
9. Authentication & Authorization
10. Media (Upload & Streaming)
11. Realtime (Comments, Likes)
12. Deployment
13. Contributing
14. Credits

---

## 1. Introduction

SamajikWorld is a sample social platform for learning the MERN stack. It demonstrates building REST APIs, handling video uploads/streaming, user auth (JWT), micro-posts, comments, likes, and connecting a React frontend to an Express/MongoDB backend.

---

## 2. Features

- User registration, login (JWT)
- Video upload, stream, and playback
- Micro-posts (tweets) with media support
- Comments, likes, and basic follow/friend model
- CRUD endpoints for users, videos, posts, comments
- Real-time UI updates (optional WebSocket / polling)
- Deployment-friendly configuration

---

## 3. Tech Stack

- MongoDB (Mongoose)
- Express.js
- Node.js
- React.js (Vite or Create React App)
- Multer for file uploads
- JWT for auth

---

## 4. Project Structure

Recommended layout:

- /frontend — React frontend
- /backend — Express backend (APIs, auth, uploads)
- README.md — this file

---

## 5. Getting Started (Windows)

Prerequisites: Node.js (LTS) and npm, MongoDB (local or Atlas).

Open PowerShell or CMD in the repository root and run:

PowerShell / CMD:

```powershell
cd d:\SamajikWorld\backend
npm install
cd ..\frontend
npm install
```

Environment files:

- server/.env (example)

```txt
PORT=5000
MONGO_URI=<your-mongo-uri>
JWT_SECRET=<your-secret>
UPLOAD_DIR=./uploads
```

Run development servers (example scripts):

- In two terminals:

```powershell
# Terminal 1 - backend
cd d:\SamajikWorld\backend
npm run dev

# Terminal 2 - frontend
cd d:\SamajikWorld\frontend
npm run dev
```

Or use a root script (if configured) like `npm run dev` to run both with concurrently.

---

## 6. Backend

- Express REST API with routes for /auth, /users, /videos, /posts, /comments, /likes
- Use Mongoose models (User, Video, Post, Comment)
- Middleware: error handler, auth middleware (JWT), CORS, logging (morgan)

Example endpoints:

- POST /api/auth/register
- POST /api/auth/login
- GET /api/videos/:id/stream
- POST /api/videos/upload
- POST /api/posts
- GET /api/posts/feed

---

## 7. Frontend

- React app with pages: Home, Explore, VideoPlayer, Upload, Profile, Login/Register
- React Router for navigation
- Axios for API calls; store JWT in secure storage (httpOnly cookie recommended)
- Components for timeline, video card, post composer, comments panel

---

## 8. Database

- Mongoose schemas for User, Video, Post, Comment, Like
- Index commonly queried fields (userId, createdAt, tags)
- Consider using GridFS or cloud object storage for large media

---

## 9. Authentication & Authorization

- JWT-based auth for APIs
- Protected routes for upload, comment, like actions
- Role checks (optional): admin, moderator, user

---

## 10. Media (Upload & Streaming)

- Use Multer for multipart uploads (server)
- Store files in local uploads folder for dev or S3/GCS for production
- Stream video via ranged responses (support HTTP range headers)

---

## 11. Realtime (Comments, Likes)

- Optional Socket.IO integration for live comments/likes
- Alternatively use optimistic UI updates and polling

---

## 12. Deployment

- Backend: Heroku, Render, Railway, or VPS
- Frontend: Vercel or Netlify
- Use environment variables for secrets and DB connection
- Serve prebuilt frontend from the backend in production if desired

---

## 13. Contributing

- Fork, create feature branch, open PR
- Add unit tests for backend routes and frontend components
- Keep commits focused and documented

---

## 14. Credits

- MERN tutorials and docs:
  - [Chai aur Code](https://www.youtube.com/playlist?list=PLu71SKxNbfoBGh_8p_NS-ZAh6v7HhYqHW)
  - [MongoDB](https://www.mongodb.com/mern-stack)
  - [React](https://react.dev/)
  - [ExpressJS](https://expressjs.com/)
  - [NodeJS](https://nodejs.org/)
