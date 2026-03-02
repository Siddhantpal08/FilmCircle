import axios from 'axios';

// Base API instance — all requests go through this
const api = axios.create({
    baseURL: '/api',  // Proxied to http://localhost:5000/api via vite.config.js
    headers: { 'Content-Type': 'application/json' },
});

export default api;
