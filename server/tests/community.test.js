const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const Post = require('../models/Post');

let mongoServer, tokenA, tokenB, postId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    const resA = await request(app).post('/api/auth/register').send({ username: 'carlos', email: 'carlos@test.com', password: 'password123' });
    const resB = await request(app).post('/api/auth/register').send({ username: 'diana', email: 'diana@test.com', password: 'password123' });
    tokenA = resA.body.token;
    tokenB = resB.body.token;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Post.deleteMany({});
    const res = await request(app).post('/api/community/posts').set('Authorization', `Bearer ${tokenA}`).send({ content: 'Hello FilmCircle!' });
    postId = res.body._id;
});

describe('GET /api/community/posts', () => {
    it('should return paginated posts', async () => {
        const res = await request(app).get('/api/community/posts?page=1&limit=5');
        expect(res.statusCode).toBe(200);
        expect(res.body.posts).toHaveLength(1);
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('pages');
    });

    it('should return empty array if page exceeds data', async () => {
        const res = await request(app).get('/api/community/posts?page=100');
        expect(res.statusCode).toBe(200);
        expect(res.body.posts).toHaveLength(0);
    });
});

describe('POST /api/community/posts', () => {
    it('should create a post', async () => {
        const res = await request(app).post('/api/community/posts').set('Authorization', `Bearer ${tokenA}`).send({ content: 'New post!' });
        expect(res.statusCode).toBe(201);
        expect(res.body.content).toBe('New post!');
    });

    it('should return 400 for empty content', async () => {
        const res = await request(app).post('/api/community/posts').set('Authorization', `Bearer ${tokenA}`).send({ content: '' });
        expect(res.statusCode).toBe(400);
    });

    it('should return 401 without auth', async () => {
        const res = await request(app).post('/api/community/posts').send({ content: 'Unauthorized' });
        expect(res.statusCode).toBe(401);
    });
});

describe('POST /api/community/posts/:id/like', () => {
    it('should toggle like on a post', async () => {
        const like = await request(app).post(`/api/community/posts/${postId}/like`).set('Authorization', `Bearer ${tokenB}`);
        expect(like.statusCode).toBe(200);
        expect(like.body.liked).toBe(true);
        expect(like.body.likesCount).toBe(1);

        const unlike = await request(app).post(`/api/community/posts/${postId}/like`).set('Authorization', `Bearer ${tokenB}`);
        expect(unlike.body.liked).toBe(false);
        expect(unlike.body.likesCount).toBe(0);
    });
});

describe('DELETE /api/community/posts/:id', () => {
    it('should delete own post', async () => {
        const res = await request(app).delete(`/api/community/posts/${postId}`).set('Authorization', `Bearer ${tokenA}`);
        expect(res.statusCode).toBe(200);
    });

    it('should return 403 when deleting another user post', async () => {
        const res = await request(app).delete(`/api/community/posts/${postId}`).set('Authorization', `Bearer ${tokenB}`);
        expect(res.statusCode).toBe(403);
    });
});
