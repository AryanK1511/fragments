const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
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

// Log environment variables if debug mode is on
if (logger.debug) {
  logger.debug({ processEnvironmentVariables: process.env }, 'Process Environment Variables');
}

// Define our routes
app.use('/', require('./routes'));

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
