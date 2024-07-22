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

      // Creating a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Deleting the fragment
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

      // Creating a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/csv')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Deleting the fragment
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

      // Creating a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/html')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Deleting the fragment
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

      // Creating a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/json')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Deleting the fragment
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

      // Creating a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/markdown')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Deleting the fragment
      const deleteResponse = await request(app)
        .delete(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(deleteResponse.statusCode).toBe(200);
      expect(deleteResponse.body).toEqual({
        status: 'ok',
      });
    });

    test('An error response is displayed if an invalid fragment ID is passed', async () => {
      // Deleting the fragment
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
