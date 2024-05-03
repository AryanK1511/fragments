const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { author, version, repository } = require('../package.json');
const logger = require('./logger');
const pino = require('pino-http')({ logger }); // Use the default logger instance, which is already configured

// Create an express app instance
const app = express();

// Use pino logging middleware
app.use(pino);

// Use helmetjs security middleware
app.use(helmet());

// Use CORS middleware to make requests across origins
app.use(cors());

// Use gzip/deflate compression middleware
app.use(compression());

// ===== Health Check Route to see whether the server is running =====
app.get('/', (req, res) => {
  // Clients shouldn't cache this response (always request it fresh)
  res.setHeader('Cache-Control', 'no-cache');

  // Send a 200 'OK' response with info about project repo
  res.status(200).json({
    status: 'ok',
    author,
    githubUrl: repository.url.replace(/^git\+|\.git$/g, ''),
    version,
  });
});

// Add 404 middleware to handle any requests for resources that can't be found
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    error: {
      message: 'not found',
      code: 404,
    },
  });
});

// Add error-handling middleware to deal with anything else
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Use a generic `500` server error and message.
  const status = err.status || 500;
  const message = err.message || 'unable to process request';

  // If this is a server error, log something
  if (status > 499) {
    logger.error({ err }, `Error processing request`);
  }

  res.status(status).json({
    status: 'error',
    error: {
      message,
      code: status,
    },
  });
});

// Export `app` for access it in server.js
module.exports = app;
