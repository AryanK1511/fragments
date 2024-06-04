// Configure the logger
const options = {
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
};

// Make the logs easy to read when in the development environment
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
