import axios from 'axios';

// Base API instance — all requests go through this
const rawBase = import.meta.env.VITE_API_URL || '/api';
const baseURL = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/$/, '')}/api`;

const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

export default api;
