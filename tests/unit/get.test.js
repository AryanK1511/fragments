const request = require('supertest');
const app = require('../../src/app');

describe('GET routes', () => {
  describe('GET /v1/fragments', () => {
    test('unauthenticated requests are denied', () =>
      request(app).get('/v1/fragments').expect(401));

    test('incorrect credentials are denied', () =>
      request(app)
        .get('/v1/fragments')
        .auth('invalid@email.com', 'incorrect_password')
        .expect(401));

    test('authenticated users an array of fragment IDs', async () => {
      // Creating 2 fragments in the database
      const createResponse1 = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Fragment 1');

      expect(createResponse1.status).toBe(201);

      const createResponse2 = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Fragment 2');

      expect(createResponse2.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get('/v1/fragments')
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.body.status).toBe('ok');
      expect(Array.isArray(readResponse.body.fragments)).toBe(true);

      // Check if the result is an array of strings
      expect(readResponse.body.fragments).toBeInstanceOf(Array);
      readResponse.body.fragments.forEach((item) => {
        expect(typeof item).toBe('string');
      });
    });

    test('authenticated users an array of fragment metadata objects when the expand query is passed', async () => {
      // Creating 2 fragments in the database
      const createResponse1 = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Fragment 1');

      expect(createResponse1.status).toBe(201);

      const createResponse2 = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Fragment 2');

      expect(createResponse2.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get('/v1/fragments/?expand=1')
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.body.status).toBe('ok');
      expect(Array.isArray(readResponse.body.fragments)).toBe(true);

      // Check if the result is an array of objects
      expect(readResponse.body.fragments).toBeInstanceOf(Array);
      readResponse.body.fragments.forEach((item) => {
        expect(typeof item).toBe('object');
      });
    });

    test('An array of string fragment IDs is returned even if an invalid query is passed', async () => {
      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Fragment 1');

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get('/v1/fragments/?testing=1')
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.body.status).toBe('ok');
      expect(Array.isArray(readResponse.body.fragments)).toBe(true);

      // Check if the result is an array of strings
      expect(readResponse.body.fragments).toBeInstanceOf(Array);
      readResponse.body.fragments.forEach((item) => {
        expect(typeof item).toBe('string');
      });
    });
  });

  describe('GET /v1/fragments/:id', () => {
    test('Fragment data is returned if the ID of the fragment is passed.', async () => {
      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Fragment 1');

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text).toBe('Fragment 1');
    });

    test('Fragment data is returned if the ID of the fragment is passed along with a supported extension.', async () => {
      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Fragment 1');

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.txt`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text).toBe('Fragment 1');
    });

    test('An error response is displayed if the type conversion is not supported.', async () => {
      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Fragment 1');

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.html`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(415);
      expect(readResponse.body).toEqual({
        status: 'error',
        error: {
          code: 415,
          message:
            'Type conversion not possible. text/plain can only be converted into text/plain.',
        },
      });
    });

    test('An error response is displayed if an invalid fragment ID is passed', async () => {
      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Fragment 1');

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}123`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(500);
      expect(readResponse.body).toEqual({
        status: 'error',
        error: {
          code: 500,
          message: 'Fragment does not exist',
        },
      });
    });

    test('An error response is displayed if an invalid fragment ID is passed with a valid extension', async () => {
      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Fragment 1');

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}123.txt`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(500);
      expect(readResponse.body).toEqual({
        status: 'error',
        error: {
          code: 500,
          message: 'Fragment does not exist',
        },
      });
    });

    test('An error response is displayed if an invalid fragment ID is passed with an invalid extension', async () => {
      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Fragment 1');

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}123.html`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(500);
      expect(readResponse.body).toEqual({
        status: 'error',
        error: {
          code: 500,
          message: 'Fragment does not exist',
        },
      });
    });
  });
});
