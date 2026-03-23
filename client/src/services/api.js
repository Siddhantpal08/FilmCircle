import axios from 'axios';

// Base API instance — all requests go through this
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: { 'Content-Type': 'application/json' },
});

export default api;
