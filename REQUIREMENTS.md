# FilmCircle — Requirements Specification

> Version: 1.0 | Date: March 2026 | Status: Approved

---

## 1. Functional Requirements

### 1.1 User Management

| ID | Requirement | Priority |
|---|---|---|
| FR-U01 | Users must be able to register with username, email, and password | High |
| FR-U02 | Registered users must be able to login and receive a JWT token | High |
| FR-U03 | Passwords must be hashed using bcryptjs (salt rounds ≥ 10) | High |
| FR-U04 | Users can view and edit their public profile (bio, avatar) | Medium |
| FR-U05 | Users can see a list of movies they have reviewed | Medium |
| FR-U06 | Users can see clubs they have joined | Medium |
| FR-U07 | Logout must invalidate the session on the client side | High |

### 1.2 Movie Discovery

| ID | Requirement | Priority |
|---|---|---|
| FR-M01 | Users can search movies by title using the OMDb API | High |
| FR-M02 | Movie detail page shows: title, year, genre, director, plot, poster, IMDb rating, streaming links | High |
| FR-M03 | Movie detail page shows a review infographic (opinion distribution chart) | High |
| FR-M04 | Movie detail page shows all community reviews for that film | Medium |
| FR-M05 | System caches OMDb responses to reduce API calls | Medium |

### 1.3 Opinion-Based Review System

| ID | Requirement | Priority |
|---|---|---|
| FR-R01 | Authenticated users can submit a review for any movie | High |
| FR-R02 | Review options: **Skip**, **Considerable**, **Go For It**, **Excellent** | High |
| FR-R03 | Each user can submit only **one** review per movie | High |
| FR-R04 | Users can update (change) their existing review | Medium |
| FR-R05 | Review counts per category are shown as a doughnut/bar chart | High |
| FR-R06 | Percentage distribution of each opinion is displayed | Medium |

### 1.4 Independent Film Upload

| ID | Requirement | Priority |
|---|---|---|
| FR-I01 | Authenticated users can upload their own film with: title, description, genre, director, cast, poster URL, streaming/watch link | High |
| FR-I02 | Uploaded films appear on the platform and can be reviewed | High |
| FR-I03 | Uploaded films are marked as "Independent / Fan Film" | Medium |
| FR-I04 | Film creators can promote their film via community posts | Medium |
| FR-I05 | Only the uploader can edit or delete their film listing | Medium |

### 1.5 Community Feed

| ID | Requirement | Priority |
|---|---|---|
| FR-C01 | Authenticated users can create text posts in the community feed | High |
| FR-C02 | Posts can optionally reference a movie | Medium |
| FR-C03 | Users can like/unlike posts | Medium |
| FR-C04 | Users can comment on posts | Medium |
| FR-C05 | Users can delete their own posts | Medium |
| FR-C06 | Feed is paginated (infinite scroll or page numbers) | Medium |

### 1.6 Club System

| ID | Requirement | Priority |
|---|---|---|
| FR-CL01 | Authenticated users can create a club (name, description, genre tag) | High |
| FR-CL02 | Users can browse and join existing clubs | High |
| FR-CL03 | Each club has its own discussion feed | Medium |
| FR-CL04 | Club creators are the default club admin | Medium |
| FR-CL05 | Users can leave a club | Medium |
| FR-CL06 | Club member count is displayed on the club card | Low |

---

## 2. Non-Functional Requirements

### 2.1 Performance

| ID | Requirement |
|---|---|
| NFR-P01 | API responses must complete within 2 seconds under normal load |
| NFR-P02 | Movie search results should appear within 1.5 seconds |
| NFR-P03 | Frontend initial load (LCP) should be under 3 seconds |

### 2.2 Security

| ID | Requirement |
|---|---|
| NFR-S01 | All sensitive routes must require a valid JWT token |
| NFR-S02 | Passwords must never be stored in plaintext |
| NFR-S03 | API keys (OMDb, JWT secret) must be stored in `.env`, never in code |
| NFR-S04 | CORS must allow only the frontend origin |
| NFR-S05 | Input must be validated and sanitized server-side |

### 2.3 Usability

| ID | Requirement |
|---|---|
| NFR-UX01 | UI must be responsive across desktop, tablet, and mobile |
| NFR-UX02 | Error messages must be human-readable and actionable |
| NFR-UX03 | Loading states must be shown for async operations |
| NFR-UX04 | Empty states (no posts, no clubs) must have helpful placeholder text |

### 2.4 Reliability

| ID | Requirement |
|---|---|
| NFR-R01 | Application must handle OMDb API failures gracefully |
| NFR-R02 | Database connection errors must not crash the server (handled at startup) |
| NFR-R03 | All unhandled errors must be caught by the global error middleware |

### 2.5 Maintainability

| ID | Requirement |
|---|---|
| NFR-M01 | Backend follows MVC (Model–View–Controller) pattern |
| NFR-M02 | Frontend follows component-based architecture |
| NFR-M03 | All environment-specific config is externalized to `.env` |
| NFR-M04 | Code must have at least 60% test coverage (backend) |

---

## 3. Edge Cases

### Authentication
- **EC-A01**: Login with wrong password → `401 Unauthorized`, specific error message
- **EC-A02**: Register with already-used email → `409 Conflict`
- **EC-A03**: Access protected route with expired token → `401 Unauthorized`, prompt re-login
- **EC-A04**: Register with missing required field → `400 Bad Request` with field-specific error
- **EC-A05**: SQL/NoSQL injection attempt in login form → Sanitized and rejected

### Movie & Review
- **EC-R01**: Submit review for non-existent movieId → `404 Not Found`
- **EC-R02**: Submit second review for same movie → `409 Conflict` with hint to update
- **EC-R03**: OMDb search with empty string → Return `400 Bad Request`
- **EC-R04**: OMDb API down / key invalid → Show "Movie data unavailable" in UI, log error
- **EC-R05**: Movie with no reviews yet → Show empty chart with "Be the first to review!" message
- **EC-R06**: Movie poster URL broken → Show placeholder image

### Community & Clubs
- **EC-C01**: Like own post → Allowed (no restriction, college-level scope)
- **EC-C02**: Join an already-joined club → `409 Conflict`, "Already a member"
- **EC-C03**: Delete another user's post → `403 Forbidden`
- **EC-C04**: Create club with duplicate name → `409 Conflict`
- **EC-C05**: Post with empty content → `400 Bad Request`
- **EC-C06**: Leave a club you didn't join → `400 Bad Request`

### Upload
- **EC-I01**: Upload film without required fields (title, watch link) → `400 Bad Request`
- **EC-I02**: Edit another user's uploaded film → `403 Forbidden`
- **EC-I03**: Poster URL that is not an image URL → Accepted, frontend shows fallback image

### General
- **EC-G01**: Request to unknown route → `404 Not Found` JSON response
- **EC-G02**: Request with malformed JSON body → `400 Bad Request`
- **EC-G03**: Pagination requested beyond available data → Return empty array, no crash

---

## 4. Constraints

- Project must be **zero-cost** — only free tiers of all services used
- MongoDB Atlas free tier M0 (512 MB storage, shared)
- OMDb API free tier (1,000 requests/day)
- No content hosting — only streaming links/redirects
- Deployment: Vercel (frontend) + Render / Railway free tier (backend)

---

## 5. Out of Scope

- Admin/moderation panel
- Real-time chat/messaging
- Mobile native app
- Video streaming/hosting
- Payment or premium features
- Dark/Light theme toggle (nice-to-have, not required)
