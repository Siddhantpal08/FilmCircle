const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Club = require('../models/Club');

let mongoServer, tokenA, tokenB, clubId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    const resA = await request(app).post('/api/auth/register').send({ username: 'alfie', email: 'alfie@test.com', password: 'password123' });
    const resB = await request(app).post('/api/auth/register').send({ username: 'betty', email: 'betty@test.com', password: 'password123' });
    tokenA = resA.body.token;
    tokenB = resB.body.token;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Club.deleteMany({});
    // recreate a test club
    const res = await request(app).post('/api/clubs').set('Authorization', `Bearer ${tokenA}`).send({ name: 'Sci-Fi Fans', genre: 'Sci-Fi' });
    clubId = res.body._id;
});

describe('POST /api/clubs (create)', () => {
    it('should create a club and set creator as first member', async () => {
        const res = await request(app).post('/api/clubs').set('Authorization', `Bearer ${tokenA}`).send({ name: 'Thriller Tribe', genre: 'Thriller' });
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe('Thriller Tribe');
        expect(res.body.members).toHaveLength(1);
    });

    it('should return 409 for duplicate club name', async () => {
        const res = await request(app).post('/api/clubs').set('Authorization', `Bearer ${tokenA}`).send({ name: 'Sci-Fi Fans', genre: 'Sci-Fi' });
        expect(res.statusCode).toBe(409);
    });

    it('should return 400 for missing name', async () => {
        const res = await request(app).post('/api/clubs').set('Authorization', `Bearer ${tokenA}`).send({ genre: 'Drama' });
        expect(res.statusCode).toBe(400);
    });
});

describe('POST /api/clubs/:id/join', () => {
    it('should allow a new user to join', async () => {
        const res = await request(app).post(`/api/clubs/${clubId}/join`).set('Authorization', `Bearer ${tokenB}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.memberCount).toBe(2);
    });

    it('should return 409 if already a member', async () => {
        await request(app).post(`/api/clubs/${clubId}/join`).set('Authorization', `Bearer ${tokenB}`);
        const res = await request(app).post(`/api/clubs/${clubId}/join`).set('Authorization', `Bearer ${tokenB}`);
        expect(res.statusCode).toBe(409);
        expect(res.body.message).toMatch(/already a member/i);
    });
});

describe('POST /api/clubs/:id/leave', () => {
    it('should allow a member to leave', async () => {
        await request(app).post(`/api/clubs/${clubId}/join`).set('Authorization', `Bearer ${tokenB}`);
        const res = await request(app).post(`/api/clubs/${clubId}/leave`).set('Authorization', `Bearer ${tokenB}`);
        expect(res.statusCode).toBe(200);
    });

    it('should return 400 if not a member', async () => {
        const res = await request(app).post(`/api/clubs/${clubId}/leave`).set('Authorization', `Bearer ${tokenB}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/not a member/i);
    });
});

describe('POST /api/clubs/:id/posts', () => {
    it('should allow member to post in club', async () => {
        const res = await request(app).post(`/api/clubs/${clubId}/posts`).set('Authorization', `Bearer ${tokenA}`).send({ content: 'Great club!' });
        expect(res.statusCode).toBe(201);
    });

    it('should return 403 if not a member', async () => {
        const res = await request(app).post(`/api/clubs/${clubId}/posts`).set('Authorization', `Bearer ${tokenB}`).send({ content: 'Sneaky post' });
        expect(res.statusCode).toBe(403);
    });
});
