const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../../src/app');

describe('DELETE routes', () => {
  describe('DELETE /v1/fragments/:id', () => {
    test('Unauthenticated requests are denied', () =>
      request(app).delete('/v1/fragments/123').expect(401));

    test('Incorrect credentials are denied', () =>
      request(app)
        .delete('/v1/fragments/1234')
        .auth('invalid@email.com', 'incorrect_password')
        .expect(401));

    test('Authenticated users are able to delete a text fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.txt');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const deleteResponse = await request(app)
        .delete(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({
        status: 'ok',
      });
    });

    test('Authenticated users are able to delete a csv fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.csv');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/csv')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const deleteResponse = await request(app)
        .delete(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({
        status: 'ok',
      });
    });

    test('Authenticated users are able to delete an HTML fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.html');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/html')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const deleteResponse = await request(app)
        .delete(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({
        status: 'ok',
      });
    });

    test('Authenticated users are able to delete a JSON fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/json')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const deleteResponse = await request(app)
        .delete(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({
        status: 'ok',
      });
    });

    test('Authenticated users are able to delete a markdown fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.md');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/markdown')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const deleteResponse = await request(app)
        .delete(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({
        status: 'ok',
      });
    });

    test('Authenticated users are able to delete a YAML fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/yaml')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const deleteResponse = await request(app)
        .delete(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({
        status: 'ok',
      });
    });

    test('Authenticated users are able to delete a PNG fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.png');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/png')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const deleteResponse = await request(app)
        .delete(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({
        status: 'ok',
      });
    });

    test('Authenticated users are able to delete a JPEG fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.jpg');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/jpeg')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const deleteResponse = await request(app)
        .delete(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({
        status: 'ok',
      });
    });

    test('Authenticated users are able to delete a webp fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.webp');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/webp')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const deleteResponse = await request(app)
        .delete(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({
        status: 'ok',
      });
    });

    test('Authenticated users are able to delete a avif fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.avif');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/avif')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const deleteResponse = await request(app)
        .delete(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({
        status: 'ok',
      });
    });

    test('Authenticated users are able to delete a GIF fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.gif');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/gif')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const deleteResponse = await request(app)
        .delete(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({
        status: 'ok',
      });
    });

    test('An error response is displayed if an invalid fragment ID is passed', async () => {
      const deleteResponse = await request(app)
        .delete(`/v1/fragments/123`)
        .auth('user1@email.com', 'password1');

      expect(deleteResponse.statusCode).toBe(404);
      expect(deleteResponse.body).toEqual({
        status: 'error',
        error: {
          code: 404,
          message: "The requested fragment doesn't exist.",
        },
      });
    });
  });
});
