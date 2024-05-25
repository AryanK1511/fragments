// Read environment variables from an .env file
require('dotenv').config();

// Log any crash cases for debugging
const logger = require('./logger');

// Log uncaught exceptions first
process.on('uncaughtException', (err, origin) => {
  logger.fatal({ err, origin }, 'uncaughtException');
  throw err;
});

// Log unhandled promise rejections first
process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'unhandledRejection');
  throw reason;
});

const unneededVariable = 'This variable is never used';

// Start our server
require('./server');
