const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../../src/app');
const yaml = require('js-yaml');

// ===== TESTS FOR ALL THE PUT ROUTES =====

describe('PUT routes', () => {
  // PUT /v1/fragments/:id
  // Allows users to update the fragment data for a fragment
  // Users are not allowed to update the metadata which includes the type as well

  describe('PUT /v1/fragments', () => {
    test('Unauthenticated requests are denied', () =>
      request(app).get('/v1/fragments').expect(401));

    test('Incorrect credentials are denied', () =>
      request(app)
        .get('/v1/fragments')
        .auth('invalid@email.com', 'incorrect_password')
        .expect(401));

    test('A text fragment can be updated', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.txt');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const updateResponse = await request(app)
        .put(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('This is the updated text fragment');

      expect(updateResponse.status).toBe(201);
      expect(updateResponse.body.status).toBe('ok');

      const fragment = updateResponse.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'text/plain',
        size: 33,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('A JSON fragment can be updated', async () => {
      const initialJson = { key: 'value' };
      const updatedJson = { key: 'This is another value' };

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/json')
        .send(initialJson);

      expect(createResponse.status).toBe(201);

      const updateResponse = await request(app)
        .put(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/json')
        .send(updatedJson);

      expect(updateResponse.status).toBe(201);
      expect(updateResponse.body.status).toBe('ok');

      const fragment = updateResponse.body.fragment;
      expect(fragment).toBeDefined();
      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'application/json',
        size: JSON.stringify(updatedJson).length,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('A YAML fragment can be updated', async () => {
      const initialYaml = yaml.dump({ key: 'value' });
      const updatedYaml = yaml.dump({ key: 'newValue' });

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/yaml')
        .send(initialYaml);

      expect(createResponse.status).toBe(201);

      const updateResponse = await request(app)
        .put(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/yaml')
        .send(updatedYaml);

      expect(updateResponse.status).toBe(201);
      expect(updateResponse.body.status).toBe('ok');

      const fragment = updateResponse.body.fragment;
      expect(fragment).toBeDefined();
      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'application/yaml',
        size: updatedYaml.length,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('An image fragment can be updated', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.png');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/png')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const newImagePath = path.join(__dirname, '..', 'files', 'file2.png');
      const newImageContent = fs.readFileSync(newImagePath);

      const updateResponse = await request(app)
        .put(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/png')
        .send(newImageContent);

      expect(updateResponse.status).toBe(201);
      expect(updateResponse.body.status).toBe('ok');

      const fragment = updateResponse.body.fragment;
      expect(fragment).toBeDefined();
      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'image/png',
        size: newImageContent.length,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('An HTML fragment can be updated', async () => {
      const initialHtml = '<p>Initial HTML content</p>';
      const updatedHtml = '<p>Updated HTML content</p>';

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/html')
        .send(initialHtml);

      expect(createResponse.status).toBe(201);

      const updateResponse = await request(app)
        .put(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/html')
        .send(updatedHtml);

      expect(updateResponse.status).toBe(201);
      expect(updateResponse.body.status).toBe('ok');

      const fragment = updateResponse.body.fragment;
      expect(fragment).toBeDefined();
      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'text/html',
        size: updatedHtml.length,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('A Markdown fragment can be updated', async () => {
      const initialMd = '# Initial Markdown content';
      const updatedMd = '# Updated Markdown content';

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/markdown')
        .send(initialMd);

      expect(createResponse.status).toBe(201);

      const updateResponse = await request(app)
        .put(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/markdown')
        .send(updatedMd);

      expect(updateResponse.status).toBe(201);
      expect(updateResponse.body.status).toBe('ok');

      const fragment = updateResponse.body.fragment;
      expect(fragment).toBeDefined();
      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'text/markdown',
        size: updatedMd.length,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('Should throw a 400 error if an attempt is made to update the type', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.txt');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const updateResponse = await request(app)
        .put(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/markdown')
        .send('# Convert text to markdown');

      expect(updateResponse.statusCode).toBe(400);
      expect(updateResponse.body).toEqual({
        status: 'error',
        error: {
          code: 400,
          message: "A fragment's type can not be changed after it is created.",
        },
      });
    });

    test('Should throw a 400 error if the updated fragment is empty', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.txt');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const updateResponse = await request(app)
        .put(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain');

      expect(updateResponse.statusCode).toBe(400);
      expect(updateResponse.body).toEqual({
        status: 'error',
        error: {
          code: 400,
          message: 'Fragment cannot be null',
        },
      });
    });

    test('Should throw a 404 error if the fragment does not exist', async () => {
      const updateResponse = await request(app)
        .put(`/v1/fragments/123`)
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Hello World');

      expect(updateResponse.statusCode).toBe(404);
      expect(updateResponse.body).toEqual({
        status: 'error',
        error: {
          code: 404,
          message: "The requested fragment doesn't exist.",
        },
      });
    });
  });
});
