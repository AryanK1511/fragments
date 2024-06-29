const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../../src/app');

describe('POST routes', () => {
  describe('POST /v1/fragments', () => {
    test('Unauthenticated requests are denied', () =>
      request(app).post('/v1/fragments').expect(401));

    test('incorrect credentials are denied', () =>
      request(app)
        .post('/v1/fragments')
        .auth('invalid@email.com', 'incorrect_password')
        .expect(401));

    test('Authenticated users can create a text fragment successfully', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.txt');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(fileContent);

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

    test('Authenticated users can create an HTML fragment successfully', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.html');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/html')
        .send(fileContent);

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

    test('Authenticated users can create a markdown fragment successfully', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.md');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/markdown')
        .send(fileContent);

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

    test('Authenticated users can create a CSV fragment successfully', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.csv');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/csv')
        .send(fileContent);

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

    test('Authenticated users can create a JSON fragment successfully', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/json')
        .send(fileContent);

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

    test('Should throw a 400 error when the request body is empty', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('');

      expect(res.status).toBe(400);

      expect(res.body).toEqual({
        status: 'error',
        error: {
          code: 400,
          message: 'Fragment cannot be null',
        },
      });
    });

    test('Should throw a 400 error when the request does not have a body', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain');

      expect(res.status).toBe(400);

      expect(res.body).toEqual({
        status: 'error',
        error: {
          code: 400,
          message: 'Fragment cannot be null',
        },
      });
    });

    test('Should throw a 415 error when a Content-Type header is not provided in the request', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .send('Hello World');

      expect(res.status).toBe(415);

      expect(res.body).toEqual({
        status: 'error',
        error: {
          code: 415,
          message: 'Unsupported Content-Type',
        },
      });
    });

    test('Should throw a 415 error when the Content-Type header is set as JSON but a text file is passed instead', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.txt');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/json')
        .send(fileContent);

      expect(res.status).toBe(415);

      expect(res.body).toEqual({
        status: 'error',
        error: {
          code: 415,
          message:
            'Unsupported Content-Type. Invalid JSON data, Unexpected token \'H\', "Hello Worl"... is not valid JSON',
        },
      });
    });

    test('Should throw a 415 error if a Content-Type header that is not supported by the API is passed', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/jpeg')
        .send('This is a fragment');

      expect(res.status).toBe(415);

      expect(res.body).toEqual({
        status: 'error',
        error: {
          code: 415,
          message: 'Unsupported Content-Type',
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
});
