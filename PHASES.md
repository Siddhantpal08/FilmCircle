# FilmCircle — Development Phases & Task Breakdown

> Total estimated development time: **8–10 weeks** (college project scale)

---

## Phase 0 — Project Setup & Planning (Week 1)

### Goals
- Set up development environment
- Initialize project structure
- Configure tooling

### Tasks

- [ ] **0.1** Create GitHub repository and initialize with `.gitignore`, `README.md`
- [ ] **0.2** Initialize client: `npm create vite@latest client -- --template react`
- [ ] **0.3** Initialize server: `npm init -y` in `server/` directory
- [ ] **0.4** Install core backend dependencies:
  ```bash
  npm install express mongoose dotenv cors bcryptjs jsonwebtoken express-validator axios
  npm install --save-dev jest supertest nodemon
  ```
- [ ] **0.5** Install core frontend dependencies:
  ```bash
  npm install react-router-dom axios chart.js react-chartjs-2
  npm install --save-dev vitest @testing-library/react @testing-library/user-event
  ```
- [ ] **0.6** Set up MongoDB Atlas free cluster and get connection string
- [ ] **0.7** Get free OMDb API key from [omdbapi.com](https://www.omdbapi.com/apikey.aspx)
- [ ] **0.8** Create `.env.example` and `.env` files
- [ ] **0.9** Write Mongoose connection logic in `server/config/db.js`
- [ ] **0.10** Set up Express entry point in `server/server.js`
- [ ] **0.11** Set up React Router in `client/src/App.jsx`

**Deliverable**: Working dev environment, blank app loading at localhost, DB connected.

---

## Phase 1 — Authentication Module (Week 2)

### Goals
- User registration and login
- JWT-based auth
- Protected routes on both ends

### Backend Tasks

- [ ] **1.1** Create `User` Mongoose model (`models/User.js`)
  - Fields: `username`, `email`, `password` (hashed), `bio`, `avatarUrl`, `uploadedMovies[]`, `joinedClubs[]`, `createdAt`
- [ ] **1.2** Create auth routes (`routes/auth.routes.js`)
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET  /api/auth/me` (protected)
- [ ] **1.3** Create `authController.js` with `register`, `login`, `getMe`
- [ ] **1.4** Create `authMiddleware.js` to verify JWT and attach `req.user`
- [ ] **1.5** Create `validateBody.js` using `express-validator` for input validation
- [ ] **1.6** Create `errorMiddleware.js` as global Express error handler
- [ ] **1.7** Write backend tests for auth (`tests/auth.test.js`)
  - Test register success, duplicate email, missing fields
  - Test login success, wrong password, non-existent user

### Frontend Tasks

- [ ] **1.8** Create `AuthContext.jsx` with `login`, `logout`, `user` state
- [ ] **1.9** Create `Login.jsx` page with form
- [ ] **1.10** Create `Register.jsx` page with form
- [ ] **1.11** Create `ProtectedRoute.jsx` HOC to guard private pages
- [ ] **1.12** Create `authService.js` in `services/` to wrap axios auth calls
- [ ] **1.13** Store JWT in `localStorage`, auto-logout on expiry
- [ ] **1.14** Write frontend tests for Login and Register forms

**Deliverable**: Users can register, login, and access protected content.

---

## Phase 2 — Movie Discovery Module (Week 3)

### Goals
- Search movies via OMDb API
- Movie detail page with poster and metadata

### Backend Tasks

- [ ] **2.1** Create `omdbService.js` to wrap OMDb API calls (search, by ID)
- [ ] **2.2** Create `Movie` Mongoose model (for independent uploads + caching)
  - Fields: `title`, `imdbID`, `year`, `genre`, `director`, `actors`, `plot`, `posterUrl`, `streamingLinks[]`, `uploadedBy`, `isIndependent`, `createdAt`
- [ ] **2.3** Create movie routes (`routes/movies.routes.js`)
  - `GET /api/movies/search?q=title` — proxy to OMDb
  - `GET /api/movies/:id` — get by imdbID or MongoDB ID
  - `GET /api/movies/independent` — list all uploaded films
  - `POST /api/movies/upload` — upload independent film (protected)
  - `PUT /api/movies/:id` — edit own uploaded film (protected)
  - `DELETE /api/movies/:id` — delete own uploaded film (protected)
- [ ] **2.4** Create `movieController.js`
- [ ] **2.5** Write backend tests for movie routes

### Frontend Tasks

- [ ] **2.6** Create `Home.jsx` with search bar and trending/recent movies grid
- [ ] **2.7** Create `MovieCard.jsx` component (poster, title, year, genre badge)
- [ ] **2.8** Create `MovieDetail.jsx` page — full info + streaming links
- [ ] **2.9** Create `movieService.js` for axios calls
- [ ] **2.10** Handle broken poster images with a fallback placeholder
- [ ] **2.11** Show loading skeleton while fetching movie data

**Deliverable**: Users can search for any movie and view its details.

---

## Phase 3 — Review & Infographic Module (Week 4)

### Goals
- Submit opinion-based reviews
- Visual chart showing opinion distribution

### Backend Tasks

- [ ] **3.1** Create `Review` Mongoose model
  - Fields: `movieId`, `userId`, `opinion` (enum: `skip`, `considerable`, `goForIt`, `excellent`), `createdAt`
  - Unique compound index on `(movieId, userId)` to prevent duplicate reviews
- [ ] **3.2** Create review routes (`routes/reviews.routes.js`)
  - `POST /api/reviews` — submit review (protected)
  - `PUT /api/reviews/:id` — update own review (protected)
  - `GET /api/reviews/movie/:movieId` — get all reviews + distribution stats for a movie
- [ ] **3.3** Create `reviewController.js`
- [ ] **3.4** Review distribution endpoint returns:
  ```json
  { "skip": 12, "considerable": 8, "goForIt": 25, "excellent": 40, "total": 85 }
  ```
- [ ] **3.5** Write backend tests for reviews (duplicate, update, distribution calc)

### Frontend Tasks

- [ ] **3.6** Create `SubmitReview.jsx` — 4-button opinion selector
- [ ] **3.7** Create `InfographicChart.jsx` using Chart.js doughnut/bar chart
- [ ] **3.8** Integrate infographic into `MovieDetail.jsx`
- [ ] **3.9** Show user's own current opinion if already reviewed
- [ ] **3.10** "Update Review" flow — change existing opinion

**Deliverable**: Users can review movies; charts update in real time.

---

## Phase 4 — Community Feed Module (Week 5)

### Goals
- Community posts with likes and comments
- Paginated feed

### Backend Tasks

- [ ] **4.1** Create `Post` Mongoose model
  - Fields: `content`, `author` (ref User), `movieRef` (optional, ref Movie), `likes[]`, `comments[]`, `createdAt`
- [ ] **4.2** Create community routes (`routes/community.routes.js`)
  - `GET /api/community/posts?page=1&limit=10` — paginated feed
  - `POST /api/community/posts` — create post (protected)
  - `POST /api/community/posts/:id/like` — toggle like (protected)
  - `POST /api/community/posts/:id/comment` — add comment (protected)
  - `DELETE /api/community/posts/:id` — delete own post (protected)
- [ ] **4.3** Create `communityController.js`
- [ ] **4.4** Pagination logic with `skip/limit` in Mongoose queries
- [ ] **4.5** Write backend tests for community routes

### Frontend Tasks

- [ ] **4.6** Create `Community.jsx` page with infinite scroll / "Load More"
- [ ] **4.7** Create `PostCard.jsx` — shows content, author, likes, comments toggle
- [ ] **4.8** Create `CommentBox.jsx` — inline comment form and list
- [ ] **4.9** Create `CreatePostForm.jsx` — textarea with optional movie tag
- [ ] **4.10** Optimistic UI update for likes

**Deliverable**: Users can post, like, and comment in a community feed.

---

## Phase 5 — Club System Module (Week 6)

### Goals
- Users can create clubs and join discussions

### Backend Tasks

- [ ] **5.1** Create `Club` Mongoose model
  - Fields: `name`, `description`, `genre`, `createdBy` (ref User), `members[]`, `posts[]`, `createdAt`
- [ ] **5.2** Create club routes (`routes/clubs.routes.js`)
  - `GET /api/clubs` — list all clubs
  - `POST /api/clubs` — create club (protected)
  - `GET /api/clubs/:id` — get club detail + posts
  - `POST /api/clubs/:id/join` — join club (protected)
  - `POST /api/clubs/:id/leave` — leave club (protected)
  - `POST /api/clubs/:id/posts` — post in club (protected, member only)
- [ ] **5.3** Create `clubController.js`
- [ ] **5.4** Write backend tests for clubs

### Frontend Tasks

- [ ] **5.5** Create `Clubs.jsx` — browse and search clubs grid
- [ ] **5.6** Create `ClubCard.jsx` — name, genre tag, member count, join button
- [ ] **5.7** Create `ClubDetail.jsx` — club discussion feed
- [ ] **5.8** Create `CreateClubForm.jsx` modal/page

**Deliverable**: Users can create clubs, join them, and post inside club feeds.

---

## Phase 6 — Independent Film Upload & Profile (Week 7)

### Goals
- Filmmaker upload page
- User profile page

### Frontend Tasks

- [ ] **6.1** Create `Upload.jsx` — form to submit independent film details
- [ ] **6.2** Create `Profile.jsx` — shows user info, their reviews, uploaded films, joined clubs
- [ ] **6.3** "My Films" section on profile page
- [ ] **6.4** Edit and delete buttons for own uploaded films
- [ ] **6.5** Promote film via community post button on uploaded film page

**Deliverable**: Filmmakers can upload films; all users have a profile page.

---

## Phase 7 — Testing & Edge Case Coverage (Week 8)

### Goals
- Achieve ≥60% backend test coverage
- Cover all documented edge cases

### Tasks

- [ ] **7.1** Run Jest coverage report: `npm test -- --coverage`
- [ ] **7.2** Write missing backend test cases:
  - Auth edge cases (EC-A01 through EC-A05)
  - Movie edge cases (EC-R01 through EC-R06)
  - Community edge cases (EC-C01 through EC-C06)
  - Upload edge cases (EC-I01 through EC-I03)
  - General edge cases (EC-G01 through EC-G03)
- [ ] **7.3** Run Vitest for frontend: `npm test`
- [ ] **7.4** Test all API endpoints manually using Postman / Thunder Client
- [ ] **7.5** Test UI on Chrome, Firefox, and mobile viewport (DevTools)
- [ ] **7.6** Fix any broken flows discovered during testing
- [ ] **7.7** Verify that `.env` variables are never exposed in frontend bundle

**Deliverable**: All edge cases handled, test suite passing.

---

## Phase 8 — Polish, Deployment & Documentation (Week 9–10)

### Goals
- Final UI polish
- Deploy to free hosting
- Complete documentation

### Tasks

- [ ] **8.1** Final CSS polish — animations, transitions, responsive tweaks
- [ ] **8.2** Add loading skeletons and empty state components everywhere
- [ ] **8.3** Add `<title>` and `<meta>` tags for SEO
- [ ] **8.4** Build frontend production bundle: `npm run build`
- [ ] **8.5** Deploy frontend to **Vercel** (connect GitHub repo)
- [ ] **8.6** Deploy backend to **Render** free tier or **Railway** free tier
- [ ] **8.7** Set production environment variables on hosting dashboards
- [ ] **8.8** Update `CLIENT_URL` CORS setting to the deployed Vercel URL
- [ ] **8.9** Test deployed application end-to-end
- [ ] **8.10** Write API docs in `server/API_DOCS.md`
- [ ] **8.11** Prepare college report / presentation slides

**Deliverable**: Live deployed application, all docs complete.

---

## Summary Timeline

| Phase | Focus | Duration |
|---|---|---|
| 0 | Setup & Planning | Week 1 |
| 1 | Authentication | Week 2 |
| 2 | Movie Discovery | Week 3 |
| 3 | Reviews & Infographics | Week 4 |
| 4 | Community Feed | Week 5 |
| 5 | Clubs | Week 6 |
| 6 | Upload & Profiles | Week 7 |
| 7 | Testing & Edge Cases | Week 8 |
| 8 | Polish & Deployment | Weeks 9–10 |
