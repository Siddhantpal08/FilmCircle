const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
});

// ── Register ──────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
    const validUser = { username: 'testuser', email: 'test@test.com', password: 'password123' };

    it('should register a new user and return a token', async () => {
        const res = await request(app).post('/api/auth/register').send(validUser);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe(validUser.email);
    });

    it('should return 400 if username is too short', async () => {
        const res = await request(app).post('/api/auth/register').send({ ...validUser, username: 'ab' });
        expect(res.statusCode).toBe(400);
        expect(res.body.errors[0].field).toBe('username');
    });

    it('should return 400 if email is invalid', async () => {
        const res = await request(app).post('/api/auth/register').send({ ...validUser, email: 'notanemail' });
        expect(res.statusCode).toBe(400);
    });

    it('should return 400 if password is too short', async () => {
        const res = await request(app).post('/api/auth/register').send({ ...validUser, password: '123' });
        expect(res.statusCode).toBe(400);
    });

    it('should return 409 if email is already registered', async () => {
        await request(app).post('/api/auth/register').send(validUser);
        const res = await request(app).post('/api/auth/register').send({ ...validUser, username: 'other' });
        expect(res.statusCode).toBe(409);
        expect(res.body.message).toMatch(/email/i);
    });

    it('should return 409 if username is already taken', async () => {
        await request(app).post('/api/auth/register').send(validUser);
        const res = await request(app).post('/api/auth/register').send({ ...validUser, email: 'other@test.com' });
        expect(res.statusCode).toBe(409);
        expect(res.body.message).toMatch(/username/i);
    });
});

// ── Login ─────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
    const creds = { email: 'login@test.com', password: 'password123' };

    beforeEach(async () => {
        await User.create({ username: 'loginuser', email: creds.email, password: creds.password });
    });

    it('should login and return a token', async () => {
        const res = await request(app).post('/api/auth/login').send(creds);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for wrong password', async () => {
        const res = await request(app).post('/api/auth/login').send({ ...creds, password: 'wrongpass' });
        expect(res.statusCode).toBe(401);
    });

    it('should return 401 for non-existent email', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'nobody@fake.com', password: 'pass123' });
        expect(res.statusCode).toBe(401);
    });

    it('should return 400 for missing email field', async () => {
        const res = await request(app).post('/api/auth/login').send({ password: 'pass123' });
        expect(res.statusCode).toBe(400);
    });
});

// ── Protected Route ───────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.statusCode).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
        const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalidtoken');
        expect(res.statusCode).toBe(401);
    });

    it('should return user data with valid token', async () => {
        const regRes = await request(app).post('/api/auth/register').send({
            username: 'meuser', email: 'me@test.com', password: 'password123'
        });
        const token = regRes.body.token;
        const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe('me@test.com');
        expect(res.body).not.toHaveProperty('password');
    });
});
