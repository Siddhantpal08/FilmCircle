import api from './api';

export const authService = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data),
};

export const movieService = {
    search: (q) => api.get(`/movies/search?q=${encodeURIComponent(q)}`),
    getById: (id) => api.get(`/movies/${id}`),
    getIndependent: () => api.get('/movies/independent'),
    upload: (data) => api.post('/movies/upload', data),
    update: (id, data) => api.put(`/movies/${id}`, data),
    delete: (id) => api.delete(`/movies/${id}`),
};

export const reviewService = {
    submit: (data) => api.post('/reviews', data),
    update: (id, data) => api.put(`/reviews/${id}`, data),
    getForMovie: (movieId) => api.get(`/reviews/movie/${movieId}`),
    getMyReview: (movieId) => api.get(`/reviews/user/${movieId}`),
};

export const communityService = {
    getPosts: (page = 1, limit = 10) => api.get(`/community/posts?page=${page}&limit=${limit}`),
    createPost: (data) => api.post('/community/posts', data),
    updatePost: (id, content) => api.put(`/community/posts/${id}`, { content }),
    toggleLike: (id) => api.post(`/community/posts/${id}/like`),
    addComment: (id, text) => api.post(`/community/posts/${id}/comment`, { text }),
    deletePost: (id) => api.delete(`/community/posts/${id}`),
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
