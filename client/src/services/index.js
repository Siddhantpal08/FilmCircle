import api from './api';

/**
 * Returns a stable anonymous client ID stored in localStorage.
 * Used as a fallback when the user is not logged in, so "Most Interesting"
 * votes are still attributed to a unique device even without authentication.
 */
function getClientId() {
    let id = localStorage.getItem('filmcircle_client_id');
    if (!id) {
        id = 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('filmcircle_client_id', id);
    }
    return id;
}

export const authService = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data),
    deleteAccount: () => api.delete('/auth/account'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, email, password) => api.post('/auth/reset-password', { token, email, password }),
    /** Step 1 – send OTP (pre-creates unverified user record) */
    sendOtp: (username, email, password) => api.post('/auth/send-otp', { username, email, password }),
    /** Step 2 – verify OTP and complete account creation */
    verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
};

export const movieService = {
    search: (q) => api.get(`/movies/search?q=${encodeURIComponent(q)}`),
    suggest: (q) => api.get(`/movies/suggest?q=${encodeURIComponent(q)}`),
    getById: (id, title, poster, year) => {
        const params = new URLSearchParams();
        if (title) params.append('title', title);
        if (poster) params.append('poster', poster);
        if (year) params.append('year', year);
        const qs = params.toString();
        return api.get(`/movies/${id}${qs ? `?${qs}` : ''}`);
    },
    getIndependent: () => api.get('/movies/independent'),
    getTrending: () => api.get('/movies/trending'),
    upload: (data) => api.post('/movies/upload', data),
    update: (id, data) => api.put(`/movies/${id}`, data),
    delete: (id) => api.delete(`/movies/${id}`),
    getByCategory: (genre) => api.get(`/movies/search?q=${encodeURIComponent(genre)}`),
    /** Toggle "Most Interesting" for a film; sends clientId so unauthed votes are tracked per-device */
    toggleInteresting: (movieId, meta = {}) =>
        api.post(`/movies/interesting/${movieId}`, meta, {
            headers: { 'x-client-id': getClientId() },
        }),
    /** Community-wide leaderboard: top 10 films by interestingCount */
    getInterestingLeaderboard: () => api.get('/movies/interesting/leaderboard'),
};

// Client-side bookmark service using localStorage
const BOOKMARK_KEY = 'filmcircle_bookmarks';
export const bookmarkService = {
    getAll: () => {
        try { return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]'); } catch { return []; }
    },
    add: (movie) => {
        const all = bookmarkService.getAll();
        const id = movie.imdbID || movie._id;
        if (!all.find(m => (m.imdbID || m._id) === id)) {
            localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...all, movie]));
        }
    },
    remove: (id) => {
        const all = bookmarkService.getAll().filter(m => (m.imdbID || m._id) !== id);
        localStorage.setItem(BOOKMARK_KEY, JSON.stringify(all));
    },
    has: (id) => bookmarkService.getAll().some(m => (m.imdbID || m._id) === id),
    toggle: (movie) => {
        const id = movie.imdbID || movie._id;
        if (bookmarkService.has(id)) { bookmarkService.remove(id); return false; }
        else { bookmarkService.add(movie); return true; }
    },
};

export const reviewService = {
    submit: (data) => api.post('/reviews', data),
    update: (id, data) => api.put(`/reviews/${id}`, data),
    getForMovie: (movieId) => api.get(`/reviews/movie/${movieId}`),
    getMyReview: (movieId) => api.get(`/reviews/user/${movieId}`),
    getMyReviews: () => api.get('/reviews/user'),
};

export const communityService = {
    getPosts: (page = 1, limit = 10) => api.get(`/community/posts?page=${page}&limit=${limit}`),
    createPost: (data) => api.post('/community/posts', data),
    updatePost: (id, content) => api.put(`/community/posts/${id}`, { content }),
    toggleLike: (id) => api.post(`/community/posts/${id}/like`),
    addComment: (id, text) => api.post(`/community/posts/${id}/comment`, { text }),
    deleteComment: (postId, commentId) => api.delete(`/community/posts/${postId}/comment/${commentId}`),
    deletePost: (id) => api.delete(`/community/posts/${id}`),
    getSidebar: () => api.get('/community/sidebar'),
};


export const clubService = {
    getAll: () => api.get('/clubs'),
    getById: (id) => api.get(`/clubs/${id}`),
    create: (data) => api.post('/clubs', data),
    update: (id, data) => api.put(`/clubs/${id}`, data),
    delete: (id) => api.delete(`/clubs/${id}`),
    join: (id) => api.post(`/clubs/${id}/join`),
    leave: (id) => api.post(`/clubs/${id}/leave`),
    post: (id, content) => api.post(`/clubs/${id}/posts`, { content }),
    deletePost: (clubId, postId) => api.delete(`/clubs/${clubId}/posts/${postId}`),
};
