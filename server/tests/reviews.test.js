const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Review = require('../models/Review');

let mongoServer;
let token;
let userId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    // Register and login to get a token
    const res = await request(app).post('/api/auth/register').send({
        username: 'reviewer', email: 'reviewer@test.com', password: 'password123'
    });
    token = res.body.token;
    userId = res.body.user.id;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Review.deleteMany({});
});

const movieId = 'tt1375666'; // Inception's imdbID

describe('POST /api/reviews', () => {
    it('should submit a review successfully', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${token}`)
            .send({ movieId, opinion: 'excellent' });
        expect(res.statusCode).toBe(201);
        expect(res.body.opinion).toBe('excellent');
    });

    it('should return 409 on duplicate review for same movie', async () => {
        await request(app).post('/api/reviews').set('Authorization', `Bearer ${token}`).send({ movieId, opinion: 'skip' });
        const res = await request(app).post('/api/reviews').set('Authorization', `Bearer ${token}`).send({ movieId, opinion: 'excellent' });
        expect(res.statusCode).toBe(409);
        expect(res.body.reviewId).toBeDefined();
    });

    it('should return 400 for invalid opinion value', async () => {
        const res = await request(app).post('/api/reviews').set('Authorization', `Bearer ${token}`).send({ movieId, opinion: 'stars5' });
        expect(res.statusCode).toBe(400);
    });

    it('should return 400 when movieId is missing', async () => {
        const res = await request(app).post('/api/reviews').set('Authorization', `Bearer ${token}`).send({ opinion: 'goForIt' });
        expect(res.statusCode).toBe(400);
    });

    it('should return 401 without auth token', async () => {
        const res = await request(app).post('/api/reviews').send({ movieId, opinion: 'considerable' });
        expect(res.statusCode).toBe(401);
    });
});

describe('PUT /api/reviews/:id', () => {
    it('should update own review', async () => {
        const cr = await request(app).post('/api/reviews').set('Authorization', `Bearer ${token}`).send({ movieId, opinion: 'skip' });
        const reviewId = cr.body._id;
        const res = await request(app).put(`/api/reviews/${reviewId}`).set('Authorization', `Bearer ${token}`).send({ opinion: 'excellent' });
        expect(res.statusCode).toBe(200);
        expect(res.body.opinion).toBe('excellent');
    });
});

describe('GET /api/reviews/movie/:movieId', () => {
    it('should return distribution with counts and percentages', async () => {
        await request(app).post('/api/reviews').set('Authorization', `Bearer ${token}`).send({ movieId, opinion: 'excellent' });
        const res = await request(app).get(`/api/reviews/movie/${movieId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('distribution');
        expect(res.body).toHaveProperty('percentages');
        expect(res.body.distribution.excellent).toBe(1);
        expect(res.body.total).toBe(1);
        expect(res.body.percentages.excellent).toBe(100);
    });

    it('should return empty distribution for movie with no reviews', async () => {
        const res = await request(app).get('/api/reviews/movie/tt9999999');
        expect(res.statusCode).toBe(200);
        expect(res.body.total).toBe(0);
        expect(res.body.distribution.skip).toBe(0);
    });
});
