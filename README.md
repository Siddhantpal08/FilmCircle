# 🎬 FilmCircle — Community-Based Movie Review & Discovery Platform

> A college final-year project built with **React + Vite**, **Node.js + Express**, and **MongoDB**.  
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
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About the Project

**FilmCircle** is a community-based movie review and discovery web application. Unlike traditional platforms that use star ratings, FilmCircle uses a unique **opinion-based review system** with four clear categories:

| Review Option | Meaning |
|---|---|
| ⏭️ **Skip** | Not worth watching |
| 🤔 **Considerable** | Watch if you have time |
| ✅ **Go For It** | Recommended |
| ⭐ **Excellent** | Must watch |

Movie metadata is fetched from the **OMDb API** (IMDB-based). Independent filmmakers can upload their own projects. The platform never hosts copyrighted content — it redirects users to official streaming services.

---

## ✨ Key Features

- 🗳️ **Opinion-based reviews** (4 categories, no star ratings)
- 📊 **Infographic visualization** of review distribution per movie
- 🔍 **Movie discovery** via OMDb/IMDB integration
- 🎥 **Independent filmmaker uploads** — submit your own films
- 💬 **Community feed** — posts, likes, and comments
- 🏛️ **Clubs** — create/join genre or theme-based discussion groups
- 🔐 **Secure auth** — JWT-based registration and login
- 🔗 **Redirect to official streaming** — legal compliance
- 📱 **Responsive UI** — mobile-friendly and modern design

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite, React Router v6, Axios, Chart.js |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **External API** | OMDb API (free tier, IMDB-backed) |
| **Testing** | Vitest + React Testing Library (frontend), Jest + Supertest (backend) |
| **Styling** | CSS Modules / Vanilla CSS |

---

## 📁 Project Structure

```
filmcircle/
├── client/                     # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         #   Navbar, Footer, Loader, etc.
│   │   │   ├── movie/          #   MovieCard, ReviewBar, InfographicChart
│   │   │   ├── community/      #   PostCard, CommentBox
│   │   │   └── club/           #   ClubCard, ClubBanner
│   │   ├── pages/              # Page-level components
│   │   │   ├── Home.jsx
│   │   │   ├── MovieDetail.jsx
│   │   │   ├── SubmitReview.jsx
│   │   │   ├── Community.jsx
│   │   │   ├── Clubs.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── hooks/              # Custom React hooks
│   │   ├── context/            # Auth context (React Context API)
│   │   ├── services/           # Axios API service wrappers
│   │   ├── utils/              # Helper functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Node.js + Express backend
│   ├── config/                 # DB connection, env config
│   ├── controllers/            # Route handler logic
│   │   ├── authController.js
│   │   ├── movieController.js
│   │   ├── reviewController.js
│   │   ├── communityController.js
│   │   └── clubController.js
│   ├── middleware/             # Auth, error handling, validation
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── validateBody.js
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Movie.js
│   │   ├── Review.js
│   │   ├── Post.js
│   │   └── Club.js
│   ├── routes/                 # Express routers
│   │   ├── auth.routes.js
│   │   ├── movies.routes.js
│   │   ├── reviews.routes.js
│   │   ├── community.routes.js
│   │   └── clubs.routes.js
│   ├── services/               # External API calls (OMDb)
│   │   └── omdbService.js
│   ├── tests/                  # Backend tests (Jest + Supertest)
│   ├── utils/                  # Shared utilities
│   ├── server.js               # Entry point
│   └── package.json
│
├── .env.example                # Template for env variables
├── .gitignore
├── REQUIREMENTS.md             # Functional & non-functional requirements
├── PHASES.md                   # Development phases & task breakdown
├── implementation_plan.md      # Detailed implementation plan
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org/))
- **MongoDB** (local installation or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) — free tier)
- **OMDb API Key** (free at [omdbapi.com](https://www.omdbapi.com/apikey.aspx))
- **Git**

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` in the `server/` directory and fill in the values:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/filmcircle

# Auth
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# OMDb API (IMDB data)
OMDB_API_KEY=your_omdb_api_key_here

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore`.

---

## ▶️ Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/your-username/filmcircle.git
cd filmcircle
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Install frontend dependencies

```bash
cd ../client
npm install
```

### 4. Start the backend server

```bash
cd ../server
npm run dev
# Runs on http://localhost:5000
```

### 5. Start the frontend dev server

```bash
cd ../client
npm run dev
# Runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Running Tests

### Backend Tests (Jest + Supertest)

```bash
cd server
npm test
```

### Frontend Tests (Vitest + React Testing Library)

```bash
cd client
npm test
```

### Run All Tests

```bash
# From project root
npm run test:all
```

---

## 📡 API Overview

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | Login and receive JWT | ❌ |
| GET | `/movies/search?q=` | Search movies via OMDb | ❌ |
| GET | `/movies/:id` | Get movie details | ❌ |
| POST | `/movies/upload` | Upload independent film | ✅ |
| POST | `/reviews` | Submit a review | ✅ |
| GET | `/reviews/movie/:movieId` | Get reviews for a movie | ❌ |
| GET | `/community/posts` | Get all community posts | ❌ |
| POST | `/community/posts` | Create a post | ✅ |
| POST | `/community/posts/:id/like` | Like a post | ✅ |
| POST | `/community/posts/:id/comment` | Comment on a post | ✅ |
| GET | `/clubs` | List all clubs | ❌ |
| POST | `/clubs` | Create a club | ✅ |
| POST | `/clubs/:id/join` | Join a club | ✅ |

Full API documentation is in [`server/API_DOCS.md`](./server/API_DOCS.md).

---

## 🧩 Modules

### 1. User Management Module
Handles registration, login, JWT auth, and profile management.

### 2. Movie Management Module
Fetches movie data from OMDb API. Supports independent film uploads with custom metadata.

### 3. Review & Infographic Module
Users submit one of 4 opinion categories per movie. Chart.js renders the opinion distribution as a doughnut/bar chart.

### 4. Community & Clubs Module
Open feed for posts/likes/comments. Club creation and membership management.

### 5. Promotion Module
Independent film creators can promote their uploaded films via community posts.

---

## 🗄️ Database Schema (Overview)

```
Users       { username, email, password (hashed), avatar, bio, uploadedMovies[], joinedClubs[] }
Movies      { title, imdbID, genre, director, plot, poster, streamingLinks[], uploadedBy, isIndependent }
Reviews     { movieId, userId, opinion: [Skip|Considerable|GoForIt|Excellent], createdAt }
Posts       { content, author, likes[], comments[], movieRef, createdAt }
Clubs       { name, description, genre, members[], posts[], createdBy }
```

---

## ⚠️ Edge Cases & Error Handling

- Duplicate review: one review per user per movie (enforced at DB + API level)
- Invalid search: empty OMDb results return a friendly "not found" message
- Unauthenticated actions: protected routes return `401 Unauthorized`
- Invalid club join: joining a club you already belong to returns `409 Conflict`
- Malformed request bodies: validated with `express-validator`
- MongoDB connection failure: server exits gracefully with a logged error
- OMDb API down: cached results shown where available, else error state in UI

See [`REQUIREMENTS.md`](./REQUIREMENTS.md) for the full edge case list.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is developed as a **college final-year project** and is intended for educational use.  
All movie data is sourced from the **OMDb API** and IMDB — no copyrighted content is hosted.

---

<div align="center">
  Made with ❤️ by the FilmCircle Team | College Final Year Project 2025–26
</div>
#   F i l m C i r c l e  
 