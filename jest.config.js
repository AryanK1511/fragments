// Get the full path to our env.jest file
const path = require('path');
const envFile = path.join(__dirname, 'env.jest');
const logger = require('./src/logger');

// Read the environment variables we use for Jest from our env.jest file
require('dotenv').config({ path: envFile });

// Log a message to remind developers how to see more detail from log messages
logger.info(
  `Using LOG_LEVEL=${process.env.LOG_LEVEL} with jest. Use 'debug' in env.jest for more detail`
);

// Set our Jest options, see https://jestjs.io/docs/configuration
module.exports = {
  verbose: true,
  testTimeout: 5000,
};
