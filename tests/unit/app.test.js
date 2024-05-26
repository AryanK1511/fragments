const request = require('supertest');
const app = require('../../src/app');

describe('GET /pagedoesnotexist', () => {
  test("Should return a 404 error as the page doesn't exist", async () => {
    const res = await request(app).get('/pagedoesnotexist');
    expect(res.statusCode).toBe(404);
  });
});
