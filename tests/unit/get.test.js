const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../../src/app');
const yaml = require('js-yaml');
const sharp = require('sharp');

// ===== TESTS FOR ALL THE GET ROUTES =====

describe('GET routes', () => {
  // GET /v1/fragments
  // Gets an array of all the fragment Ids for a user if not expanded
  // Gets an array of the metadata for all the fragments created by a user if expanded

  describe('GET /v1/fragments', () => {
    test('Unauthenticated requests are denied', () =>
      request(app).get('/v1/fragments').expect(401));

    test('Incorrect credentials are denied', () =>
      request(app)
        .get('/v1/fragments')
        .auth('invalid@email.com', 'incorrect_password')
        .expect(401));

    test('Authenticated users get an array of fragment IDs', async () => {
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

      const readResponse = await request(app)
        .get('/v1/fragments')
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.body.status).toBe('ok');
      expect(Array.isArray(readResponse.body.fragments)).toBe(true);

      expect(readResponse.body.fragments).toBeInstanceOf(Array);
      readResponse.body.fragments.forEach((item) => {
        expect(item).toEqual(
          expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
        );
      });
    });

    test('Authenticated users get an array of fragment metadata objects when the expand query is passed', async () => {
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

      const readResponse = await request(app)
        .get('/v1/fragments/?expand=1')
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.body.status).toBe('ok');
      expect(Array.isArray(readResponse.body.fragments)).toBe(true);

      expect(readResponse.body.fragments).toBeInstanceOf(Array);
      readResponse.body.fragments.forEach((item) => {
        expect(item).toEqual({
          id: expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
          ),
          ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
          type: 'text/plain',
          size: expect.any(Number),
          created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        });
      });
    });

    test('An array of string fragment IDs is returned even if an invalid query is passed', async () => {
      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Fragment 1');

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get('/v1/fragments/?testing=1')
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.body.status).toBe('ok');
      expect(Array.isArray(readResponse.body.fragments)).toBe(true);

      expect(readResponse.body.fragments).toBeInstanceOf(Array);
      readResponse.body.fragments.forEach((item) => {
        expect(item).toEqual(
          expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
        );
      });
    });

    test('Should throw a 415 error the ID of a CSV fragment is passed and a .png extension is passed.', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.csv');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Creating a fragment in the database
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
  });

  // /v1/fragments/:id
  // Gets a fragment by fragment ID for the user
  // Can also specify an extension to convert a fragment if the type conversion is supported

  describe('GET /v1/fragments/:id', () => {
    test('Unauthenticated requests are denied', () =>
      request(app).get('/v1/fragments/123').expect(401));

    test('Incorrect credentials are denied', () =>
      request(app)
        .get('/v1/fragments/123')
        .auth('invalid@email.com', 'incorrect_password')
        .expect(401));

    describe('Original Fragments should be fetched successfully', () => {
      test('Text fragment data is returned if the ID of the text fragment is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(200);
        expect(readResponse.text.trim()).toBe('Hello World! This is a text file');
      });

      test('Text fragment data is returned if the ID of the text fragment is passed with a .txt extension', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.txt`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(200);
        expect(readResponse.text.trim()).toBe('Hello World! This is a text file');
      });

      test('JSON fragment data is returned if the ID of the JSON fragment is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/json')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

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

      test('JSON fragment data is returned if the ID of the JSON fragment is passed with a .json extension', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/json')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

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

      test('Markdown fragment data is returned if the ID of the markdown fragment is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.md');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/markdown')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(200);
        expect(readResponse.text.trim()).toBe('# Hello World! This is a markdown file');
      });

      test('Markdown fragment data is returned if the ID of the markdown fragment is passed with a .md extension', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.md');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/markdown')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.md`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(200);
        expect(readResponse.text.trim()).toBe('# Hello World! This is a markdown file');
      });

      test('CSV fragment data is returned if the ID of the csv fragment is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.csv');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/csv')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(200);
        expect(readResponse.text.trim()).toBe(fileContent.trim());
      });

      test('CSV fragment data is returned if the ID of the CSV fragment is passed with a .csv extension', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.csv');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/csv')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.csv`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(200);
        expect(readResponse.text.trim()).toBe(fileContent.trim());
      });

      test('HTML fragment data is returned if the ID of the html fragment is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.html');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/html')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(200);
        expect(readResponse.text.trim()).toBe(fileContent.trim());
      });

      test('HTML fragment data is returned if the ID of the html fragment is passed with a .html extension', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.html');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/html')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.html`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(200);
        expect(readResponse.text.trim()).toBe(fileContent.trim());
      });

      test('YAML fragment data is returned if the ID of the YAML fragment is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/yaml')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(200);

        const receivedContent = yaml.load(readResponse.text);
        const originalContent = yaml.load(fileContent);

        expect(receivedContent).toEqual(originalContent);
      });

      test('YAML fragment data is returned if the ID of the YAML fragment is passed with a .yaml extension', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/yaml')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.yaml`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(200);

        const receivedContent = yaml.load(readResponse.text);
        const originalContent = yaml.load(fileContent);

        expect(receivedContent).toEqual(originalContent);
      });

      test('JPEG fragment data is returned if the ID of the JPEG fragment is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.jpeg');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/jpeg')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}`)
          .auth('user1@email.com', 'password1')
          .responseType('blob');

        expect(readResponse.statusCode).toBe(200);

        const receivedFileContent = readResponse.body;

        const receivedMetadata = await sharp(receivedFileContent).metadata();
        const originalMetadata = await sharp(fileContent).metadata();

        expect(receivedMetadata).toEqual(originalMetadata);

        expect(Buffer.compare(receivedFileContent, fileContent)).toBe(0);
      });

      test('JPEG fragment data is returned if the ID of the JPEG fragment is passed with a .jpg extension', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.jpeg');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/jpeg')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.jpg`)
          .auth('user1@email.com', 'password1')
          .responseType('blob');

        expect(readResponse.statusCode).toBe(200);

        const receivedFileContent = readResponse.body;

        const receivedMetadata = await sharp(receivedFileContent).metadata();
        const originalMetadata = await sharp(fileContent).metadata();

        expect(receivedMetadata).toEqual(originalMetadata);

        expect(Buffer.compare(receivedFileContent, fileContent)).toBe(0);
      });

      test('PNG fragment data is returned if the ID of the PNG fragment is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.png');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/png')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}`)
          .auth('user1@email.com', 'password1')
          .responseType('blob');

        expect(readResponse.statusCode).toBe(200);

        const receivedFileContent = readResponse.body;

        const receivedMetadata = await sharp(receivedFileContent).metadata();
        const originalMetadata = await sharp(fileContent).metadata();

        expect(receivedMetadata).toEqual(originalMetadata);

        expect(Buffer.compare(receivedFileContent, fileContent)).toBe(0);
      });

      test('PNG fragment data is returned if the ID of the PNG fragment is passed with a .png extension', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.png');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/png')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.png`)
          .auth('user1@email.com', 'password1')
          .responseType('blob');

        expect(readResponse.statusCode).toBe(200);

        const receivedFileContent = readResponse.body;

        const receivedMetadata = await sharp(receivedFileContent).metadata();
        const originalMetadata = await sharp(fileContent).metadata();

        expect(receivedMetadata).toEqual(originalMetadata);

        expect(Buffer.compare(receivedFileContent, fileContent)).toBe(0);
      });

      test('webp fragment data is returned if the ID of the webp fragment is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.webp');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/webp')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}`)
          .auth('user1@email.com', 'password1')
          .responseType('blob');

        expect(readResponse.statusCode).toBe(200);

        const receivedFileContent = readResponse.body;

        const receivedMetadata = await sharp(receivedFileContent).metadata();
        const originalMetadata = await sharp(fileContent).metadata();

        expect(receivedMetadata).toEqual(originalMetadata);

        expect(Buffer.compare(receivedFileContent, fileContent)).toBe(0);
      });

      test('webp fragment data is returned if the ID of the webp fragment is passed with a .webp extension', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.webp');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/webp')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.webp`)
          .auth('user1@email.com', 'password1')
          .responseType('blob');

        expect(readResponse.statusCode).toBe(200);

        const receivedFileContent = readResponse.body;

        const receivedMetadata = await sharp(receivedFileContent).metadata();
        const originalMetadata = await sharp(fileContent).metadata();

        expect(receivedMetadata).toEqual(originalMetadata);

        expect(Buffer.compare(receivedFileContent, fileContent)).toBe(0);
      });

      test('GIF fragment data is returned if the ID of the GIF fragment is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.gif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/gif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}`)
          .auth('user1@email.com', 'password1')
          .responseType('blob');

        expect(readResponse.statusCode).toBe(200);

        const receivedFileContent = readResponse.body;

        const receivedMetadata = await sharp(receivedFileContent).metadata();
        const originalMetadata = await sharp(fileContent).metadata();

        expect(receivedMetadata).toEqual(originalMetadata);

        expect(Buffer.compare(receivedFileContent, fileContent)).toBe(0);
      });

      test('GIF fragment data is returned if the ID of the GIF fragment is passed with a .gif extension', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.gif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/gif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.gif`)
          .auth('user1@email.com', 'password1')
          .responseType('blob');

        expect(readResponse.statusCode).toBe(200);

        const receivedFileContent = readResponse.body;

        const receivedMetadata = await sharp(receivedFileContent).metadata();
        const originalMetadata = await sharp(fileContent).metadata();

        expect(receivedMetadata).toEqual(originalMetadata);

        expect(Buffer.compare(receivedFileContent, fileContent)).toBe(0);
      });

      test('avif fragment data is returned if the ID of the avif fragment is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.avif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/avif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}`)
          .auth('user1@email.com', 'password1')
          .responseType('blob');

        expect(readResponse.statusCode).toBe(200);

        const receivedFileContent = readResponse.body;

        const receivedMetadata = await sharp(receivedFileContent).metadata();
        const originalMetadata = await sharp(fileContent).metadata();

        expect(receivedMetadata).toEqual(originalMetadata);

        expect(Buffer.compare(receivedFileContent, fileContent)).toBe(0);
      });

      test('avif fragment data is returned if the ID of the avif fragment is passed with a .avif extension', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.avif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/avif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.avif`)
          .auth('user1@email.com', 'password1')
          .responseType('blob');

        expect(readResponse.statusCode).toBe(200);

        const receivedFileContent = readResponse.body;

        const receivedMetadata = await sharp(receivedFileContent).metadata();
        const originalMetadata = await sharp(fileContent).metadata();

        expect(receivedMetadata).toEqual(originalMetadata);

        expect(Buffer.compare(receivedFileContent, fileContent)).toBe(0);
      });
    });

    describe('Unsupported conversions should throw a 415 error', () => {
      test('Throw a 415 error the ID of a text fragment is passed and and a .md extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

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

      test('Throw a 415 error the ID of a text fragment is passed and and a .html extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

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

      test('Throw a 415 error the ID of a text fragment is passed and and a .csv extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.csv`)
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

      test('Throw a 415 error the ID of a text fragment is passed and and a .json extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

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

      test('Throw a 415 error the ID of a text fragment is passed and and a .yaml extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.yaml`)
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

      test('Throw a 415 error the ID of a text fragment is passed and and a .jpg extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.jpg`)
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

      test('Throw a 415 error the ID of a text fragment is passed and and a .png extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.png`)
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

      test('Throw a 415 error the ID of a text fragment is passed and and a .webp extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.webp`)
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

      test('Throw a 415 error the ID of a text fragment is passed and and a .avif extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.avif`)
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

      test('Throw a 415 error the ID of a text fragment is passed and and a .gif extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.gif`)
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

      test('Should throw a 415 error the ID of a markdown fragment is passed and a .csv extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.md');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/markdown')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.csv`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. text/markdown can only be converted into text/markdown,text/html,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a markdown fragment is passed and a .json extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.md');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/markdown')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.json`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. text/markdown can only be converted into text/markdown,text/html,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a markdown fragment is passed and a .yaml extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.md');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/markdown')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.yaml`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. text/markdown can only be converted into text/markdown,text/html,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a markdown fragment is passed and a .png extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.md');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/markdown')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.png`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. text/markdown can only be converted into text/markdown,text/html,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a markdown fragment is passed and a .jpg extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.md');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/markdown')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.jpg`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. text/markdown can only be converted into text/markdown,text/html,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a markdown fragment is passed and a .webp extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.md');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/markdown')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.webp`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. text/markdown can only be converted into text/markdown,text/html,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a markdown fragment is passed and a .avif extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.md');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/markdown')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.avif`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. text/markdown can only be converted into text/markdown,text/html,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a markdown fragment is passed and a .gif extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.md');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/markdown')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.gif`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. text/markdown can only be converted into text/markdown,text/html,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of an HTML fragment is passed and a .md extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.html');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/html')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.md`)
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

      test('Should throw a 415 error the ID of an HTML fragment is passed and a .csv extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.html');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/html')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.csv`)
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

      test('Should throw a 415 error the ID of an HTML fragment is passed and a .yaml extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.html');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/html')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.yaml`)
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

      test('Should throw a 415 error the ID of an HTML fragment is passed and a .json extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.html');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/html')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

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

      test('Should throw a 415 error the ID of an HTML fragment is passed and a .png extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.html');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/html')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.png`)
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

      test('Should throw a 415 error the ID of an HTML fragment is passed and a .jpg extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.html');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/html')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.jpg`)
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

      test('Should throw a 415 error the ID of an HTML fragment is passed and a .webp extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.html');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/html')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.webp`)
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

      test('Should throw a 415 error the ID of an HTML fragment is passed and a .avif extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.html');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/html')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.avif`)
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

      test('Should throw a 415 error the ID of an HTML fragment is passed and a .gif extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.html');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/html')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.gif`)
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

      test('Should throw a 415 error the ID of a JSON fragment is passed and a .md extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/json')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

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

      test('Should throw a 415 error the ID of a JSON fragment is passed and a .html extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/json')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.html`)
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

      test('Should throw a 415 error the ID of a JSON fragment is passed and a .csv extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/json')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.csv`)
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

      test('Should throw a 415 error the ID of a JSON fragment is passed and a .png extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/json')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.png`)
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

      test('Should throw a 415 error the ID of a JSON fragment is passed and a .jpg extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/json')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.jpg`)
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

      test('Should throw a 415 error the ID of a JSON fragment is passed and a .webp extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/json')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.webp`)
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

      test('Should throw a 415 error the ID of a JSON fragment is passed and a .avif extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/json')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.avif`)
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

      test('Should throw a 415 error the ID of a JSON fragment is passed and a .gif extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/json')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.gif`)
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

      test('Should throw a 415 error the ID of a YAML fragment is passed and a .md extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/yaml')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.md`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. application/yaml can only be converted into application/yaml,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a YAML fragment is passed and a .html extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/yaml')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.html`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. application/yaml can only be converted into application/yaml,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a YAML fragment is passed and a .csv extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/yaml')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.csv`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. application/yaml can only be converted into application/yaml,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a YAML fragment is passed and a .json extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/yaml')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.json`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. application/yaml can only be converted into application/yaml,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a YAML fragment is passed and a .png extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/yaml')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.png`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. application/yaml can only be converted into application/yaml,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a YAML fragment is passed and a .jpg extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/yaml')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.jpg`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. application/yaml can only be converted into application/yaml,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a YAML fragment is passed and a .webp extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/yaml')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.webp`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. application/yaml can only be converted into application/yaml,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a YAML fragment is passed and a .avif extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/yaml')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.avif`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. application/yaml can only be converted into application/yaml,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a YAML fragment is passed and a .gif extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'application/yaml')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.gif`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. application/yaml can only be converted into application/yaml,text/plain.',
          },
        });
      });

      test('Should throw a 415 error the ID of a PNG fragment is passed and a .txt extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.png');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/png')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.txt`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/png can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a PNG fragment is passed and a .md extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.png');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/png')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.md`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/png can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a PNG fragment is passed and a .html extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.png');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/png')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.html`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/png can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a PNG fragment is passed and a .csv extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.png');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/png')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.csv`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/png can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a PNG fragment is passed and a .json extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.png');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/png')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.json`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/png can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a PNG fragment is passed and a .yaml extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.png');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/png')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.yaml`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/png can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a JPEG fragment is passed and a .txt extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.jpg');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/jpeg')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.txt`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/jpeg can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a JPEG fragment is passed and a .md extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.jpg');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/jpeg')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.md`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/jpeg can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a JPEG fragment is passed and a .html extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.jpg');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/jpeg')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.html`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/jpeg can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a JPEG fragment is passed and a .csv extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.jpg');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/jpeg')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.csv`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/jpeg can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a JPEG fragment is passed and a .json extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.jpg');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/jpeg')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.json`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/jpeg can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a JPEG fragment is passed and a .yaml extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.jpg');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/jpeg')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.yaml`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/jpeg can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a webp fragment is passed and a .txt extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.webp');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/webp')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.txt`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/webp can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a webp fragment is passed and a .md extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.webp');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/webp')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.md`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/webp can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a webp fragment is passed and a .html extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.webp');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/webp')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.html`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/webp can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a webp fragment is passed and a .csv extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.webp');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/webp')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.csv`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/webp can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a webp fragment is passed and a .json extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.webp');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/webp')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.json`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/webp can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a webp fragment is passed and a .yaml extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.webp');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/webp')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.yaml`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/webp can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a GIF fragment is passed and a .txt extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.gif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/gif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.txt`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/gif can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a GIF fragment is passed and a .md extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.gif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/gif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.md`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/gif can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a GIF fragment is passed and a .html extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.gif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/gif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.html`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/gif can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a GIF fragment is passed and a .csv extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.gif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/gif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.csv`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/gif can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a GIF fragment is passed and a .json extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.gif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/gif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.json`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/gif can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a GIF fragment is passed and a .yaml extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.gif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/gif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.yaml`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/gif can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of a avif fragment is passed and a .txt extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.avif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/avif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.txt`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/avif can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of an avif fragment is passed and a .md extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.avif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/avif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.md`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/avif can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of an avif fragment is passed and a .html extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.avif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/avif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.html`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/avif can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of an avif fragment is passed and a .csv extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.avif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/avif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.csv`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/avif can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of an avif fragment is passed and a .json extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.avif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/avif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.json`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/avif can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });

      test('Should throw a 415 error the ID of an avif fragment is passed and a .yaml extension is passed', async () => {
        const filePath = path.join(__dirname, '..', 'files', 'file.avif');
        const fileContent = fs.readFileSync(filePath);

        const createResponse = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'image/avif')
          .send(fileContent);

        expect(createResponse.status).toBe(201);

        const readResponse = await request(app)
          .get(`/v1/fragments/${createResponse.body.fragment.id}.yaml`)
          .auth('user1@email.com', 'password1');

        expect(readResponse.statusCode).toBe(415);
        expect(readResponse.body).toEqual({
          status: 'error',
          error: {
            code: 415,
            message:
              'Type conversion not possible. image/avif can only be converted into image/png,image/jpeg,image/webp,image/gif,image/avif.',
          },
        });
      });
    });
  });

  describe('Supported conversions should work successfully', () => {
    test('Markdown fragment can be converted to an HTML fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.md');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/markdown')
        .send(fileContent);
      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.html`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text.trim()).toBe('<h1>Hello World! This is a markdown file</h1>');
    });

    test('Markdown fragment can be converted to a text fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.md');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/markdown')
        .send(fileContent);
      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.txt`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text.trim()).toBe('# Hello World! This is a markdown file');
    });

    test('HTML fragment can be converted to a text fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.html');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/html')
        .send(fileContent);
      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.txt`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text.trim()).toBe('<h1>Hello World! This is an HTML file</h1>');
    });

    test('CSV fragment can be converted to a text fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.csv');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/csv')
        .send(fileContent);
      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.txt`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text.trim()).toBe(
        'Student,marks1,marks2\nStudent1,32,63\nStudent2,83,62\nStudent3,29,30'
      );
    });

    test('CSV fragment can be converted to a JSON fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.csv');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/csv')
        .send(fileContent);
      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.json`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(JSON.parse(readResponse.text)).toEqual([
        { Student: 'Student1', marks1: '32', marks2: '63' },
        { Student: 'Student2', marks1: '83', marks2: '62' },
        { Student: 'Student3', marks1: '29', marks2: '30' },
      ]);
    });

    test('JSON fragment can be converted to a text fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/json')
        .send(fileContent);
      expect(createResponse.status).toBe(201);

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

    test('JSON fragment can be converted to a yaml fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/json')
        .send(fileContent);
      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.yaml`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.text).toEqual(
        yaml.dump({
          student1: 'ABC',
          student2: 'DEF',
          student3: 'GHI',
        })
      );
    });

    test('YAML fragment can be converted to a text fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/yaml')
        .send(fileContent);
      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.txt`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.statusCode).toBe(200);
      expect(readResponse.headers['content-type']).toBe('text/plain; charset=utf-8');
      expect(readResponse.text.trim()).toEqual('- sample:\n    - hello: world');
    });

    test('PNG fragment can be converted to a JPEG fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.png');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/png')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.jpg`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/jpeg');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('jpeg');
    }, 50000);

    test('PNG fragment can be converted to a webp fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.png');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/png')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.webp`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/webp');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('webp');
    }, 50000);

    test('PNG fragment can be converted to a GIF fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.png');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/png')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.gif`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/gif');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('gif');
    }, 50000);

    test('PNG fragment can be converted to a avif fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.png');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/png')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.avif`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/avif');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // sharp shows avif as heif as avif is a subset of heif
      expect(metadata.format).toBe('heif');
    }, 50000);

    test('JPEG fragment can be converted to a PNG fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.jpeg');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/jpeg')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.png`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/png');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('png');
    }, 50000);

    test('JPEG fragment can be converted to a webp fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.jpeg');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/jpeg')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.webp`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/webp');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('webp');
    }, 50000);

    test('JPEG fragment can be converted to a GIF fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.jpeg');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/jpeg')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.gif`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/gif');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('gif');
    }, 50000);

    test('JPEG fragment can be converted to a avif fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.jpeg');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/jpeg')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.avif`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/avif');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // sharp shows avif as heif as avif is a subset of heif
      expect(metadata.format).toBe('heif');
    }, 50000);

    test('webp fragment can be converted to a JPEG fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.webp');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/webp')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.jpg`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/jpeg');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('jpeg');
    }, 50000);

    test('webp fragment can be converted to a PNG fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.webp');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/webp')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.png`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/png');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('png');
    }, 50000);

    test('webp fragment can be converted to a GIF fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.webp');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/webp')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.gif`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/gif');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('gif');
    }, 50000);

    test('webp fragment can be converted to a avif fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.webp');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/webp')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.avif`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/avif');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // sharp shows avif as heif as avif is a subset of heif
      expect(metadata.format).toBe('heif');
    }, 50000);

    test('avif fragment can be converted to a JPEG fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.avif');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/avif')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.jpg`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/jpeg');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('jpeg');
    }, 50000);

    test('avif fragment can be converted to a webp fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.avif');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/avif')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.webp`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/webp');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('webp');
    }, 50000);

    test('avif fragment can be converted to a GIF fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.avif');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/avif')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.gif`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/gif');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('gif');
    }, 50000);

    test('avif fragment can be converted to a PNG fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.avif');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/avif')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.png`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/png');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // sharp shows avif as heif as avif is a subset of heif
      expect(metadata.format).toBe('png');
    }, 50000);

    test('GIF fragment can be converted to a JPEG fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.gif');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/gif')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.jpg`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/jpeg');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('jpeg');
    }, 50000);

    test('GIF fragment can be converted to a webp fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.gif');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/gif')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.webp`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/webp');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('webp');
    }, 50000);

    test('GIF fragment can be converted to a PNG fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.gif');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/gif')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.png`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/png');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      expect(metadata.format).toBe('png');
    }, 50000);

    test('GIF fragment can be converted to a avif fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.gif');
      const fileContent = fs.readFileSync(filePath);

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'image/gif')
        .send(fileContent);

      expect(createResponse.status).toBe(201);

      const readResponse = await request(app)
        .get(`/v1/fragments/${createResponse.body.fragment.id}.avif`)
        .auth('user1@email.com', 'password1');

      expect(readResponse.status).toBe(200);
      expect(readResponse.headers['content-type']).toBe('image/avif');

      const buffer = Buffer.from(readResponse.body, 'binary');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // sharp shows avif as heif as avif is a subset of heif
      expect(metadata.format).toBe('heif');
    }, 50000);

    test('JSON fragment can be converted to a text fragment', async () => {
      const filePath = path.join(__dirname, '..', 'files', 'file.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');

      const createResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/json')
        .send(fileContent);
      expect(createResponse.status).toBe(201);

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
  });

  test('An error response is displayed if an invalid fragment ID is passed', async () => {
    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Fragment 1');

    expect(createResponse.status).toBe(201);

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}123`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(404);
    expect(readResponse.body).toEqual({
      status: 'error',
      error: {
        code: 404,
        message: "The requested fragment doesn't exist.",
      },
    });
  });

  test('An error response is displayed if an invalid fragment ID is passed with a valid extension', async () => {
    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Fragment 1');

    expect(createResponse.status).toBe(201);

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}123.txt`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(404);
    expect(readResponse.body).toEqual({
      status: 'error',
      error: {
        code: 404,
        message: "The requested fragment doesn't exist.",
      },
    });
  });

  test('An error response is displayed if an invalid fragment ID is passed with an invalid extension', async () => {
    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Fragment 1');

    expect(createResponse.status).toBe(201);

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}123.html`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(404);
    expect(readResponse.body).toEqual({
      status: 'error',
      error: {
        code: 404,
        message: "The requested fragment doesn't exist.",
      },
    });
  });
});

// GET /v1/fragments/:id/info
// Gets the metadata for the fragment whose ID is specified by the user

describe('GET /v1/fragments/:id/info', () => {
  test('Unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/123/info').expect(401));

  test('Incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/123/info')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  test('Fragment metadata for a text fragment is returned if the ID of the fragment is passed.', async () => {
    const filePath = path.join(__dirname, '..', 'files', 'file.txt');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fileContent);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe('ok');

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.body).toHaveProperty('status');
    expect(readResponse.body.status).toBe('ok');
    expect(readResponse.body).toHaveProperty('fragment');
    expect(readResponse.body.fragment).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
      type: 'text/plain',
      size: expect.any(Number),
      created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
  });

  test('Fragment metadata for a csv fragment is returned if the ID of the fragment is passed.', async () => {
    const filePath = path.join(__dirname, '..', 'files', 'file.csv');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send(fileContent);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe('ok');

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.body).toHaveProperty('status');
    expect(readResponse.body.status).toBe('ok');
    expect(readResponse.body).toHaveProperty('fragment');
    expect(readResponse.body.fragment).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
      type: 'text/csv',
      size: expect.any(Number),
      created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
  });

  test('Fragment metadata for a HTML fragment is returned if the ID of the fragment is passed.', async () => {
    const filePath = path.join(__dirname, '..', 'files', 'file.html');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send(fileContent);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe('ok');

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.body).toHaveProperty('status');
    expect(readResponse.body.status).toBe('ok');
    expect(readResponse.body).toHaveProperty('fragment');
    expect(readResponse.body.fragment).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
      type: 'text/html',
      size: expect.any(Number),
      created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
  });

  test('Fragment metadata for a JSON fragment is returned if the ID of the fragment is passed.', async () => {
    const filePath = path.join(__dirname, '..', 'files', 'file.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(fileContent);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe('ok');

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.body).toHaveProperty('status');
    expect(readResponse.body.status).toBe('ok');
    expect(readResponse.body).toHaveProperty('fragment');
    expect(readResponse.body.fragment).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
      type: 'application/json',
      size: expect.any(Number),
      created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
  });

  test('Fragment metadata for a markdown fragment is returned if the ID of the fragment is passed.', async () => {
    const filePath = path.join(__dirname, '..', 'files', 'file.csv');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(fileContent);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe('ok');

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.body).toHaveProperty('status');
    expect(readResponse.body.status).toBe('ok');
    expect(readResponse.body).toHaveProperty('fragment');
    expect(readResponse.body.fragment).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
      type: 'text/markdown',
      size: expect.any(Number),
      created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
  });

  test('Fragment metadata for a YAML fragment is returned if the ID of the fragment is passed.', async () => {
    const filePath = path.join(__dirname, '..', 'files', 'file.yaml');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/yaml')
      .send(fileContent);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe('ok');

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.body).toHaveProperty('status');
    expect(readResponse.body.status).toBe('ok');
    expect(readResponse.body).toHaveProperty('fragment');
    expect(readResponse.body.fragment).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
      type: 'application/yaml',
      size: expect.any(Number),
      created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
  });

  test('Fragment metadata for a PNG fragment is returned if the ID of the fragment is passed.', async () => {
    const filePath = path.join(__dirname, '..', 'files', 'file.png');
    const fileContent = fs.readFileSync(filePath);

    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(fileContent);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe('ok');

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.body).toHaveProperty('status');
    expect(readResponse.body.status).toBe('ok');
    expect(readResponse.body).toHaveProperty('fragment');
    expect(readResponse.body.fragment).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
      type: 'image/png',
      size: expect.any(Number),
      created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
  });

  test('Fragment metadata for a JPEG fragment is returned if the ID of the fragment is passed.', async () => {
    const filePath = path.join(__dirname, '..', 'files', 'file.jpg');
    const fileContent = fs.readFileSync(filePath);

    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/jpeg')
      .send(fileContent);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe('ok');

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.body).toHaveProperty('status');
    expect(readResponse.body.status).toBe('ok');
    expect(readResponse.body).toHaveProperty('fragment');
    expect(readResponse.body.fragment).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
      type: 'image/jpeg',
      size: expect.any(Number),
      created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
  });

  test('Fragment metadata for a webp fragment is returned if the ID of the fragment is passed.', async () => {
    const filePath = path.join(__dirname, '..', 'files', 'file.webp');
    const fileContent = fs.readFileSync(filePath);

    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/webp')
      .send(fileContent);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe('ok');

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.body).toHaveProperty('status');
    expect(readResponse.body.status).toBe('ok');
    expect(readResponse.body).toHaveProperty('fragment');
    expect(readResponse.body.fragment).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
      type: 'image/webp',
      size: expect.any(Number),
      created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
  });

  test('Fragment metadata for a avif fragment is returned if the ID of the fragment is passed.', async () => {
    const filePath = path.join(__dirname, '..', 'files', 'file.avif');
    const fileContent = fs.readFileSync(filePath);

    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/avif')
      .send(fileContent);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe('ok');

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.body).toHaveProperty('status');
    expect(readResponse.body.status).toBe('ok');
    expect(readResponse.body).toHaveProperty('fragment');
    expect(readResponse.body.fragment).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
      type: 'image/avif',
      size: expect.any(Number),
      created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
  });

  test('Fragment metadata for a GIF fragment is returned if the ID of the fragment is passed.', async () => {
    const filePath = path.join(__dirname, '..', 'files', 'file.gif');
    const fileContent = fs.readFileSync(filePath);

    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/gif')
      .send(fileContent);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe('ok');

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.body).toHaveProperty('status');
    expect(readResponse.body.status).toBe('ok');
    expect(readResponse.body).toHaveProperty('fragment');
    expect(readResponse.body.fragment).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      ownerId: expect.stringMatching(/^[0-9a-f]{64}$/),
      type: 'image/gif',
      size: expect.any(Number),
      created: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      updated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
  });

  test('An error response is displayed if an invalid fragment ID is passed', async () => {
    const createResponse = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Fragment 1');

    expect(createResponse.status).toBe(201);

    const readResponse = await request(app)
      .get(`/v1/fragments/${createResponse.body.fragment.id}123/info`)
      .auth('user1@email.com', 'password1');

    expect(readResponse.statusCode).toBe(404);
    expect(readResponse.body).toEqual({
      status: 'error',
      error: {
        code: 404,
        message: "The requested fragment doesn't exist.",
      },
    });
  });
});
