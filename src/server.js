const stoppable = require('stoppable');
const logger = require('./logger');
const app = require('./app');
const port = parseInt(process.env.PORT || '8080', 10);

// Start the server
const server = stoppable(
  app.listen(port, () => {
    // Log a message that the server has started, and which port it's using.
    logger.info(`Server started on port ${port}`);
  })
);

// Export our server instance so other parts of our code can access it if necessary.
module.exports = server;
