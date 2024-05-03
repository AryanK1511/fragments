// Configure the logger
const options = { level: process.env.LOG_LEVEL || 'info' };

// Make the logs easy to read
if (options.level === 'debug') {
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  };
}

// Create and export a Pino Logger instance:
module.exports = require('pino')(options);
