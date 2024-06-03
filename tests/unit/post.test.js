const request = require('supertest');
const app = require('../../src/app');

describe('POST /v1/fragments', () => {
  test('unauthenticated requests are denied', () => request(app).post('/v1/fragments').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).post('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  test('authenticated users can create a fragment successfully', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');

    expect(res.status).toBe(201);

    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('fragment');
    expect(res.body.fragment).toHaveProperty('id');
    expect(res.body.fragment).toHaveProperty('ownerId');
    expect(res.body.fragment).toHaveProperty('created');
    expect(res.body.fragment).toHaveProperty('updated');
    expect(res.body.fragment).toHaveProperty('type');
    expect(res.body.fragment).toHaveProperty('size');
  });

  test('Should get a 400 status code from the server if a Content-Type that is not supported by the API is passed', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send('This is a fragment');

    expect(res.status).toBe(400);

    expect(res.body).toEqual({
      status: 'error',
      error: {
        code: 400,
        message: 'Content-Type used in the request is not supported by API',
      },
    });
  });

  test('Should get a 500 status code from the server if an invalid Content-Type is passed', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'numbers')
      .send('This is a fragment');

    expect(res.status).toBe(500);

    expect(res.body).toEqual({
      status: 'error',
      error: {
        code: 500,
        message: 'invalid media type',
      },
    });
  });
});
