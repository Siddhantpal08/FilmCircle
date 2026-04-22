# 🎬 FilmCircle — Community-Based Movie Review & Discovery Platform

> A final-year college project built with **React + Vite**, **Node.js + Express**, and **MongoDB**.
> Zero-cost, open-source, community-driven — cinephiles & independent filmmakers welcome.

---

## 📖 Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Running Tests](#running-tests)
- [API Overview](#api-overview)
- [Modules](#modules)
- [Database Schema](#database-schema)
- [Edge Cases & Error Handling](#edge-cases--error-handling)
- [License](#license)

---

## 🎯 About the Project

**FilmCircle** is a community-based movie review and discovery web application. Unlike traditional platforms that use star ratings, FilmCircle uses a unique **opinion-based review system** with four clear, honest categories:

| Opinion | Meaning |
|---|---|
| ⏭️ **Skip** | Not worth your time |
| 🤔 **Considerable** | Watch if you have nothing better to do |
| ✅ **Go For It** | Recommended — worth watching |
| ⭐ **Excellent** | Must watch |

Movie metadata is fetched from the **OMDb API** (IMDB-backed). Independent filmmakers can upload their own projects. The platform never hosts copyrighted content — it redirects users to official streaming services.

---

## ✨ Key Features

- 🗳️ **Opinion-based reviews** — 4 clear categories, no star ratings
- 🔒 **One opinion per film** — locked after submission; no take-backs
- 📊 **Infographic opinion chart** — visual distribution of community sentiment
- 🔍 **Movie discovery** via OMDb/IMDB integration with poster display
- 🎥 **Independent film uploads** — add your own films with streaming links
- 🔗 **Watch Now links** — highlighted CTAs redirect to official streaming platforms
- 💬 **Community feed** — posts, likes, and comments
- 🏛️ **Clubs** — create/join genre or theme-based discussion groups
- 👤 **Editable profile** — update display name, avatar, and bio live
- 🗑️ **Account deletion with full data cleanup** — removes all reviews, posts, comments, and club memberships
- 🔐 **Secure auth** — JWT-based registration and login
- 📱 **Responsive UI** — mobile-friendly and modern design

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite, React Router v6, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **External API** | OMDb API (free tier, IMDB-backed) |
| **Validation** | express-validator |
| **Testing** | Jest + Supertest (backend) |
| **Styling** | Vanilla CSS |

---

## 📁 Project Structure

```
filmcircle/
├── client/                     # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Navbar, Footer, Loader, SkeletonCard
│   │   │   └── movie/          # MovieCard, InfographicChart
│   │   ├── context/            # AuthContext (React Context API)
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── MovieDetail.jsx
│   │   │   ├── Community.jsx
│   │   │   ├── Clubs.jsx
│   │   │   ├── ClubDetail.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── services/           # Axios API wrappers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Node.js + Express backend
│   ├── config/                 # DB connection (db.js)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── movieController.js
│   │   ├── reviewController.js
│   │   ├── communityController.js
│   │   └── clubController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── validateBody.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Movie.js
│   │   ├── Review.js
│   │   ├── Post.js
│   │   └── Club.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── movies.routes.js
│   │   ├── reviews.routes.js
│   │   ├── community.routes.js
│   │   └── clubs.routes.js
│   ├── tests/                  # Jest + Supertest tests
│   ├── server.js               # Entry point
│   └── package.json
│
├── .env.example                # Template for env variables
├── .gitignore
├── REQUIREMENTS.md
├── PHASES.md
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org/))
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)
- **OMDb API Key** — free at [omdbapi.com](https://www.omdbapi.com/apikey.aspx)
- **Git**

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` in the project root and fill in values:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/filmcircle

# Auth
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# OMDb API (IMDB movie data)
OMDB_API_KEY=your_omdb_api_key_here

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

> ⚠️ Never commit your `.env` file. It is in `.gitignore`.

---

## ▶️ Running Locally

```bash
# 1. Clone
git clone https://github.com/Siddhantpal08/FilmCircle.git
cd FilmCircle

# 2. Install & start backend
cd server
npm install
npm run dev          # http://localhost:5000

# 3. Install & start frontend (new terminal)
cd ../client
npm install
npm run dev          # http://localhost:5173
```

---

## 🧪 Running Tests

```bash
cd server
npm test             # Jest + Supertest — auth, reviews, clubs, community
```

---

## 📡 API Overview

Base URL: `http://localhost:5000/api`

### Auth

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | Login, receive JWT | ❌ |
| GET | `/auth/me` | Get current user | ✅ |
| PUT | `/auth/profile` | Update username / avatar / bio | ✅ |
| DELETE | `/auth/account` | Delete account + all user data | ✅ |

### Movies

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/movies/search?q=` | Search via OMDb | ❌ |
| GET | `/movies/independent` | List indie films | ❌ |
| GET | `/movies/:id` | Movie detail (OMDb or DB) | ❌ |
| POST | `/movies/upload` | Upload indie film | ✅ |
| PUT | `/movies/:id` | Update indie film | ✅ (owner) |
| DELETE | `/movies/:id` | Delete indie film | ✅ (owner) |

### Reviews

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/reviews` | Submit opinion | ✅ |
| GET | `/reviews/movie/:movieId` | Distribution for a film | ❌ |
| GET | `/reviews/user/:movieId` | Current user's review | ✅ |

> Note: Reviews are **locked after submission** — no editing from the client.

### Community

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/community/posts` | Paginated feed | ❌ |
| POST | `/community/posts` | Create post | ✅ |
| PUT | `/community/posts/:id` | Edit post (within 5 min) | ✅ (owner) |
| DELETE | `/community/posts/:id` | Delete post | ✅ (owner) |
| POST | `/community/posts/:id/like` | Toggle like | ✅ |
| POST | `/community/posts/:id/comment` | Comment | ✅ |

### Clubs

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/clubs` | List all clubs | ❌ |
| POST | `/clubs` | Create club | ✅ |
| GET | `/clubs/:id` | Club detail | ❌ |
| PUT | `/clubs/:id` | Update club | ✅ (owner) |
| DELETE | `/clubs/:id` | Delete club | ✅ (owner) |
| POST | `/clubs/:id/join` | Join club | ✅ |
| POST | `/clubs/:id/leave` | Leave club | ✅ |
| POST | `/clubs/:id/posts` | Post in club | ✅ |
| DELETE | `/clubs/:id/posts/:postId` | Remove club post | ✅ (owner) |

---

## 🧩 Modules

### 1. User Management
Registration, login, JWT auth, editable profile (username, avatar URL, bio), and full cascaded account deletion.

### 2. Movie Management
OMDb/IMDB integration for mainstream films. Independent filmmaker upload system with streaming link management.

### 3. Review & Opinion Module
Users submit one of 4 opinions per film. Locked after submission. Opinion distribution rendered as an infographic chart.

### 4. Community & Clubs
Open feed for posts, likes, and nested comments. Club creation, join/leave, and per-club post boards.

### 5. Independent Film Promotion
Indie creators can upload films, set streaming links, and promote via community posts. Watch Now links are highlighted on film detail pages.

---

## 🗄️ Database Schema

```
User    { username, email, password (hashed), avatarUrl, bio, uploadedMovies[], joinedClubs[] }
Movie   { title, imdbID, genre, director, actors, plot, posterUrl,
          streamingLinks[{platform, url}], uploadedBy (ref User), isIndependent }
Review  { movieId (string), userId (ref User), opinion (skip|considerable|goForIt|excellent),
          comment, createdAt }
Post    { content, author (ref User), movieRef, likes[], comments[{author, text}] }
Club    { name, description, genre, createdBy, members[], posts[{author, content}] }
```

---

## ⚠️ Edge Cases & Error Handling

| Scenario | Behaviour |
|---|---|
| Duplicate review | `409` returned; client shows read-only opinion card |
| Review update attempt | Not available from client — opinions are permanent |
| User account deleted | All reviews, movies, posts, comments, and club memberships are cascade-deleted |
| Post/comment by deleted user | Cleaned up at account deletion; no null/unknown entries remain |
| OMDb API key missing | `503` returned; frontend shows a setup instruction message |
| Empty search query | `400` returned |
| Unauthenticated write | `401 Unauthorized` |
| Duplicate club join | `409 Conflict` |
| Invalid request body | `400` via `express-validator` |
| MongoDB connection failure | Server exits with logged error |

---

## 📄 License

Developed as a **college final-year project** for educational use.
All movie data is sourced from the **OMDb API** — no copyrighted content is hosted.

---

<div align="center">
  Made with ❤️ by Siddhant Pal | FilmCircle — College Final Year Project 2025–26
</div>