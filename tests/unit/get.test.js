const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../../src/app');

describe('GET routes', () => {
  describe('GET /v1/fragments', () => {
    test('Unauthenticated requests are denied', () =>
      request(app).get('/v1/fragments').expect(401));

    test('Incorrect credentials are denied', () =>
      request(app)
        .get('/v1/fragments')
        .auth('invalid@email.com', 'incorrect_password')
        .expect(401));

    test('Authenticated users get an array of fragment IDs', async () => {
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

    test('Authenticated users get an array of fragment metadata objects when the expand query is passed', async () => {
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
    test('Unauthenticated requests are denied', () =>
      request(app).get('/v1/fragments/123').expect(401));

    test('Incorrect credentials are denied', () =>
      request(app)
        .get('/v1/fragments/123')
        .auth('invalid@email.com', 'incorrect_password')
        .expect(401));

    test('Text fragment data is returned if the ID of the text fragment is passed.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.txt');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text.trim()).toBe('Hello World! This is a text file');
    });

    test('Text fragment data is returned if the ID of the text fragment is passed and a .txt extension is passed as well.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.txt');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.txt`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text.trim()).toBe('Hello World! This is a text file');
    });

    test('Should throw a 415 error the ID of a text fragment is passed and a .md extension is passed.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.txt');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.md`)
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

    test('JSON fragment data is returned if the ID of the JSON fragment is passed.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/json')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);

      expect(JSON.parse(readResponse.text)).toEqual({
        student1: 'ABC',
        student2: 'DEF',
        student3: 'GHI',
      });
    });

    test('JSON fragment data is returned if the ID of the JSON fragment is passed and a .json extension is passed as well.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/json')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.json`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(JSON.parse(readResponse.text)).toEqual({
        student1: 'ABC',
        student2: 'DEF',
        student3: 'GHI',
      });
    });

    test('Should throw a 415 error the ID of a json fragment is passed and a .md extension is passed.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/json')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.md`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(415);
      expect(readResponse.body).toEqual({
        status: 'error',
        error: {
          code: 415,
          message:
            'Type conversion not possible. application/json can only be converted into application/json,application/yaml,text/plain.',
        },
      });
    });

    test('Markdown fragment data is returned if the ID of the markdown fragment is passed.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.md');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/markdown')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text.trim()).toBe('# Hello World! This is a markdown file');
    });

    test('Markdown fragment data is returned if the ID of the markdown fragment is passed and a .md extension is passed as well.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.md');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/markdown')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.md`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text.trim()).toBe('# Hello World! This is a markdown file');
    });

    test('Should throw a 415 error the ID of a markdown fragment is passed and a .json extension is passed.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.json`)
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

    test('CSV fragment data is returned if the ID of the csv fragment is passed.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.csv');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/csv')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text.trim()).toBe(fileContent.trim());
    });

    test('CSV fragment data is returned if the ID of the CSV fragment is passed and a .csv extension is passed as well.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.csv');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/csv')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.csv`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text.trim()).toBe(fileContent.trim());
    });

    test('Should throw a 415 error the ID of a CSV fragment is passed and a .png extension is passed.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.csv');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/csv')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.png`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(415);
      expect(readResponse.body).toEqual({
        status: 'error',
        error: {
          code: 415,
          message:
            'Type conversion not possible. text/csv can only be converted into text/csv,text/plain,application/json.',
        },
      });
    });

    test('HTML fragment data is returned if the ID of the html fragment is passed.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.html');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/html')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text.trim()).toBe(fileContent.trim());
    });

    test('HTML fragment data is returned if the ID of the html fragment is passed and a .html extension is passed as well.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.html');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/html')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.html`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text.trim()).toBe(fileContent.trim());
    });

    test('Should throw a 415 error the ID of an HTML fragment is passed and a .json extension is passed.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.html');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/html')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.json`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(415);
      expect(readResponse.body).toEqual({
        status: 'error',
        error: {
          code: 415,
          message:
            'Type conversion not possible. text/html can only be converted into text/html,text/plain.',
        },
      });
    });

    test('Markdown fragment can be converted to an HTML fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.md');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/markdown')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.html`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text.trim()).toBe('<h1>Hello World! This is a markdown file</h1>');
    });

    test('JSON fragment can be converted to a text fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/json')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.txt`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(JSON.parse(readResponse.text)).toEqual({
        student1: 'ABC',
        student2: 'DEF',
        student3: 'GHI',
      });
    });

    test('JSON fragment can not be converted to a yaml fragment yet as this conversion is currently not supported by the API.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/json')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.yaml`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(500);
      expect(readResponse.body).toEqual({
        status: 'error',
        error: {
          code: 500,
          message:
            'Type conversion from application/json to application/yaml is currently not supported by the API.',
        },
      });
    });

    test('CSV fragment can not be converted to a JSON fragment yet as this conversion is currently not supported by the API.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.csv');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/csv')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      // Reading the data from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.json`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(500);
      expect(readResponse.body).toEqual({
        status: 'error',
        error: {
          code: 500,
          message:
            'Type conversion from text/csv to application/json is currently not supported by the API.',
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

  describe('GET /v1/fragments/:id/info', () => {
    test('Unauthenticated requests are denied', () =>
      request(app).get('/v1/fragments/123/info').expect(401));

    test('Incorrect credentials are denied', () =>
      request(app)
        .get('/v1/fragments/123/info')
        .auth('invalid@email.com', 'incorrect_password')
        .expect(401));

    test('Fragment metadata is returned if the ID of the fragment is passed.', async () => {
      // Creatin a fragment in the database
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Fragment 1');

      expect(createResponse.status).toBe(201);

      // Reading the metadata from the database
      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}/info`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.body).toHaveProperty('status');
      expect(readResponse.body.status).toBe('ok');
      expect(readResponse.body).toHaveProperty('fragment');
      expect(readResponse.body.fragment).toHaveProperty('id');
      expect(readResponse.body.fragment).toHaveProperty('ownerId');
      expect(readResponse.body.fragment).toHaveProperty('created');
      expect(readResponse.body.fragment).toHaveProperty('updated');
      expect(readResponse.body.fragment).toHaveProperty('type');
      expect(readResponse.body.fragment).toHaveProperty('size');
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
        .get(`/v1/fragments/${createResponse.body.fragment.id}123/info`)
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
