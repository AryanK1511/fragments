const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../../src/app');

describe('POST routes', () => {
  describe('POST /v1/fragments', () => {
    test('Unauthenticated requests are denied', () =>
      request(app).post('/v1/fragments').expect(401));

    test('Incorrect credentials are denied', () =>
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
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
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

    test('Authenticated users can create a text fragment with a charset successfully', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.txt');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain; charset=utf-8')
        .send(fileContent);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'text/plain; charset=utf-8',
        size: 33,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
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
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'text/html',
        size: 43,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
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
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'text/markdown',
        size: 39,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
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
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'text/csv',
        size: 67,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
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
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'application/json',
        size: 66,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('Authenticated users can create a YAML fragment successfully', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/yaml')
        .send(fileContent);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'application/yaml',
        size: 29,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('Authenticated users can create a YAML fragment successfully with a file having a .yml extension', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.yml');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/yaml')
        .send(fileContent);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'application/yaml',
        size: 29,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('Authenticated users can create a JPEG fragment successfully', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.jpeg');
      const fileContent = fs.readFileSync(filePath);

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/jpeg')
        .send(fileContent);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'image/jpeg',
        size: 2630499,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('Authenticated users can create a JPEG fragment successfully and charset is not added even of it is specified', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.jpeg');
      const fileContent = fs.readFileSync(filePath);

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/jpeg; charset=utf-8')
        .send(fileContent);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'image/jpeg',
        size: 2630499,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('Authenticated users can create a JPEG fragment successfully with file having a .jpg extension', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.jpg');
      const fileContent = fs.readFileSync(filePath);

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/jpeg')
        .send(fileContent);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'image/jpeg',
        size: 2630499,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('Authenticated users can create a PNG fragment successfully', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.png');
      const fileContent = fs.readFileSync(filePath);

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/png')
        .send(fileContent);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'image/png',
        size: 1420959,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('Authenticated users can create a webp fragment successfully', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.webp');
      const fileContent = fs.readFileSync(filePath);

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/webp')
        .send(fileContent);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'image/webp',
        size: 46044,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('Authenticated users can create a avif fragment successfully', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.avif');
      const fileContent = fs.readFileSync(filePath);

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/avif')
        .send(fileContent);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'image/avif',
        size: 101454,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    test('Authenticated users can create a GIF fragment successfully', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.gif');
      const fileContent = fs.readFileSync(filePath);

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/gif')
        .send(fileContent);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');

      const fragment = res.body.fragment;
      expect(fragment).toBeDefined();

      expect(fragment).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
        ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
        type: 'image/gif',
        size: 19799,
        created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
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
          message: expect.stringContaining('Unsupported Content-Type. Invalid JSON data'),
        },
      });
    });

    test('Should throw a 415 error when the Content-Type header is set as JSON but a yaml file is passed instead', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.yml');
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
          message: expect.stringContaining('Unsupported Content-Type. Invalid JSON data'),
        },
      });
    });

    test('Should throw a 415 error when the Content-Type header is set as JSON but an image is passed instead', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.jpg');
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
          message: expect.stringContaining('Unsupported Content-Type. Invalid JSON data'),
        },
      });
    });

    test('Should throw a 415 error when the Content-Type header is set as YAML but an image is passed instead', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.jpg');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/yaml')
        .send(fileContent);

      expect(res.status).toBe(415);

      expect(res.body).toEqual({
        status: 'error',
        error: {
          code: 415,
          message: expect.stringContaining('Unsupported Content-Type. Invalid YAML data'),
        },
      });
    });

    test('Should throw a 415 error when the Content-Type header is set as a JPEG image but a text type is passed instead', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.txt');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/jpeg')
        .send(fileContent);

      expect(res.status).toBe(415);

      expect(res.body).toEqual({
        status: 'error',
        error: {
          code: 415,
          message: expect.stringContaining('Unsupported Content-Type. Invalid image data'),
        },
      });
    });

    test('Should throw a 415 error when the Content-Type header is set as a JPEG image but YAML is passed instead', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.yml');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/jpeg')
        .send(fileContent);

      expect(res.status).toBe(415);

      expect(res.body).toEqual({
        status: 'error',
        error: {
          code: 415,
          message: expect.stringContaining('Unsupported Content-Type. Invalid image data'),
        },
      });
    });

    test('Should throw a 415 error when the Content-Type header is set as a JPEG image but JSON is passed instead', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/jpeg')
        .send(fileContent);

      expect(res.status).toBe(415);

      expect(res.body).toEqual({
        status: 'error',
        error: {
          code: 415,
          message: expect.stringContaining('Unsupported Content-Type. Invalid image data'),
        },
      });
    });

    test('Should throw a 415 error when the Content-Type header is set a JPEG image but a PNG is passed instead', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.png');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/jpeg')
        .send(fileContent);

      expect(res.status).toBe(415);

      expect(res.body).toEqual({
        status: 'error',
        error: {
          code: 415,
          message:
            'Unsupported Content-Type. Invalid image data, Input buffer contains unsupported image format',
        },
      });
    });

    test('Should throw a 415 error when the Content-Type header is set a PNG image but a JPEG is passed instead', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.jpeg');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/png')
        .send(fileContent);

      expect(res.status).toBe(415);

      expect(res.body).toEqual({
        status: 'error',
        error: {
          code: 415,
          message:
            'Unsupported Content-Type. Invalid image data, Input buffer contains unsupported image format',
        },
      });
    });

    test('Should throw a 415 error if a Content-Type header that is not supported by the API is passed', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/pdf')
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
